import bytes from "bytes";
import type { IncomingHttpHeaders, IncomingMessage } from "http";
import { ParsedUrlQuery, parse } from "querystring";
import { Type } from "typed";
import { Writable } from "stream";

import { HttpError } from "./error";
import { HttpStatus } from "./status";
import { identity, throwBadRequest } from "./util";

const DEFAULT_BODY_SIZE = 1024 * 1024 * 2;

export class Request {
  #buffer?: Buffer;
  #maxBodySize = DEFAULT_BODY_SIZE;

  private constructor(
    private readonly req: IncomingMessage,
    public readonly method: string,
    public readonly path: string,
    public readonly headers: Readonly<IncomingHttpHeaders>,
    private readonly parsedUrlQuery: Readonly<ParsedUrlQuery>,
  ) {}

  public static from(req: IncomingMessage): Request {
    const method = String(req.method);
    const [path = "/", query = ""] = String(req.url).split("?");
    return new Request(req, method, path, req.headers, parse(query));
  }

  get maxBodySize(): number {
    return this.#maxBodySize;
  }

  set maxBodySize(size: number | string) {
    this.#maxBodySize = bytes.parse(size) ?? DEFAULT_BODY_SIZE;
  }

  /**
   * Read and validate incoming query (it inclues route params)
   */
  public query<T>(type: Type<T>): T {
    return type(this.parsedUrlQuery).match({
      Ok: identity,
      Err: throwBadRequest,
    });
  }

  /**
   * Read Request's body as Buffer
   */
  public async buffer(): Promise<Buffer> {
    if (this.method === "GET" || this.method === "HEAD") {
      throw new Error("Cannot read body from GET/HEAD request");
    }
    if (this.#buffer) {
      return this.#buffer;
    }
    const chunks: Buffer[] = [];
    let bytesRead = 0;
    for await (const chunk of this.req) {
      bytesRead += chunk.length;
      if (bytesRead > this.maxBodySize) {
        throw new HttpError(HttpStatus.REQUEST_TOO_LONG, [
          `Body size cannot be larger than ${bytes.format(this.#maxBodySize)}`,
        ]);
      }
      chunks.push(chunk);
    }
    this.#buffer = Buffer.concat(chunks);
    return this.#buffer;
  }

  /**
   * Read Request's body as ArrayBuffer
   */
  public async arrayBuffer(): Promise<ArrayBuffer> {
    const { buffer, byteOffset, byteLength } = await this.buffer();
    return buffer.slice(byteOffset, byteOffset + byteLength);
  }

  /**
   * Read Request's body as string
   */
  public async text(): Promise<string> {
    const buf = await this.buffer();
    return buf.toString("utf-8");
  }

  /**
   * Read and validates Request's body as JSON
   */
  public async json<T>(type: Type<T>): Promise<T> {
    const str = await this.text();
    try {
      const json = JSON.parse(str);
      return type(json).match({ Ok: identity, Err: throwBadRequest });
    } catch (err) {
      if (err instanceof SyntaxError) {
        throw new HttpError(HttpStatus.BAD_REQUEST, [err.message]);
      }
      throw err;
    }
  }

  /**
   * Pipe the original `IncomingMessage` to the given `Writable` stream
   */
  public pipe(writable: Writable): Writable {
    return this.req.pipe(writable);
  }
}
