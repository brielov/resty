import bytes from "bytes";
import type { IncomingHttpHeaders, IncomingMessage } from "http";
import { ParsedUrlQuery, parse } from "querystring";
import { Typed, fold } from "typed";
import { Writable } from "stream";

import { HttpError } from "./error";
import { HttpStatus } from "./status";
import { foldBadRequest, identity } from "./util";

const DEFAULT_BODY_SIZE = 1024 * 1024 * 10;

export class Request {
  private cache = new WeakMap<IncomingMessage, Buffer>();
  private _maxBodySize = DEFAULT_BODY_SIZE;

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
    return this._maxBodySize;
  }

  set maxBodySize(size: number | string) {
    this._maxBodySize = bytes.parse(size) ?? DEFAULT_BODY_SIZE;
  }

  /**
   * Read and validate incoming query (it inclues route params)
   */
  public query<T>(type: Typed<T>): T {
    return fold(type(this.parsedUrlQuery), foldBadRequest, identity);
  }

  /**
   * Read Request's body as Buffer
   */
  public async buffer(): Promise<Buffer> {
    if (this.method === "GET" || this.method === "HEAD") {
      throw new Error("Cannot read body from GET/HEAD request");
    }
    if (this.cache.has(this.req)) {
      return this.cache.get(this.req) as Buffer;
    }
    const chunks: Buffer[] = [];
    let bytesRead = 0;
    for await (const chunk of this.req) {
      bytesRead += chunk.length;
      if (bytesRead > this.maxBodySize) {
        throw new HttpError(HttpStatus.REQUEST_TOO_LONG);
      }
      chunks.push(chunk);
    }
    const buf = Buffer.concat(chunks);
    this.cache.set(this.req, buf);
    return buf;
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
  public async json<T>(type: Typed<T>): Promise<T> {
    const str = await this.text();
    try {
      const json = JSON.parse(str);
      return fold(type(json), foldBadRequest, identity);
    } catch (err) {
      if (err instanceof HttpError) {
        throw err;
      }
      throw new HttpError(HttpStatus.BAD_REQUEST, ["Malformed JSON"]);
    }
  }

  public pipe(writable: Writable): Writable {
    return this.req.pipe(writable);
  }
}
