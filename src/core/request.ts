import { IncomingHttpHeaders, IncomingMessage } from "http";
import { NextApiRequest } from "next";
import { ParsedUrlQuery, parse } from "querystring";
import { Writable } from "stream";

type Incoming = IncomingMessage | NextApiRequest;

export class Request<T extends Incoming = IncomingMessage> {
  private cache = new WeakMap<T, Buffer>();

  private constructor(
    private readonly req: T,
    public readonly method: string,
    public readonly path: string,
    public readonly headers: Readonly<IncomingHttpHeaders>,
    public readonly query: Readonly<ParsedUrlQuery>,
  ) {}

  public static from<T extends Incoming>(req: T): Request<T> {
    const method = String(req.method);
    const [path = "/", query = ""] = String(req.url).split("?");
    return "query" in req
      ? new Request(req, method, path, req.headers, req.query)
      : new Request(req, method, path, req.headers, parse(query));
  }

  /**
   * Read Request's body as Buffer
   * @returns Promise<Buffer>
   */
  public async buffer(): Promise<Buffer> {
    if (this.method === "GET" || this.method === "HEAD") {
      throw new Error("Request with GET/HEAD method cannot have body");
    }
    if (this.cache.has(this.req)) {
      return this.cache.get(this.req) as Buffer;
    }
    const chunks: Buffer[] = [];
    for await (const chunk of this.req) chunks.push(chunk);
    const buf = Buffer.concat(chunks);
    this.cache.set(this.req, buf);
    return buf;
  }

  /**
   * Read Request's body as ArrayBuffer
   * @returns Promise<unknown>
   */
  public async arrayBuffer(): Promise<ArrayBuffer> {
    const { buffer, byteOffset, byteLength } = await this.buffer();
    return buffer.slice(byteOffset, byteOffset + byteLength);
  }

  /**
   * Read Request's body as string
   * @returns Promise<string>
   */
  public async text(): Promise<string> {
    const buf = await this.buffer();
    return buf.toString("utf-8");
  }

  /**
   * Read Request's body as JSON
   * @param reviver (key: string, value: unknown) => unknown
   * @returns Promise<unknown>
   */
  public async json(
    reviver?: (key: string, value: unknown) => unknown,
  ): Promise<unknown> {
    const str = await this.text();
    return JSON.parse(str, reviver);
  }

  /**
   * Pipe Request to a Writable stream
   * @param destination Writable
   * @returns Writable
   */
  public pipe(destination: Writable): Writable {
    return this.req.pipe(destination);
  }
}
