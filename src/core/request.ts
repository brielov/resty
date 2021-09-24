import { Blob } from "buffer";
import { IncomingMessage } from "http";
import { PassThrough, Readable } from "stream";
import { StatusCodes } from "http-status-codes";
import { URL, URLSearchParams } from "url";

import {
  HeadersInit,
  ReadonlyHeaders,
  fromIncomingHttpHeaders,
} from "./headers";
import { HttpError } from "./error";

interface RequestInit {
  method: string;
  headers: HeadersInit;
  body: Readable;
}

export class Request {
  public readonly method: string;
  public readonly headers: ReadonlyHeaders;
  public readonly url: URL;

  #bodyUsed = false;
  #body: Readable;

  private constructor(input: string, init: RequestInit) {
    this.url = new URL(input);
    this.headers = new ReadonlyHeaders(init.headers);
    this.method = init.method?.toUpperCase() ?? "GET";
    this.#body = init.body;
  }

  public static from<T extends IncomingMessage>(req: T): Request {
    const url = `http://${req.headers.origin}${req.url}`;
    const headers = fromIncomingHttpHeaders(req.headers);
    const method = String(req.method);
    return new Request(url, {
      body: req,
      headers,
      method,
    });
  }

  get body(): Readable {
    const stream = new PassThrough();
    this.#body.pipe(stream);
    return stream;
  }

  get bodyUsed(): boolean {
    return this.#bodyUsed;
  }

  public async arrayBuffer(): Promise<ArrayBuffer> {
    const { buffer, byteOffset, byteLength } = await this.buffer();
    return buffer.slice(byteOffset, byteOffset + byteLength);
  }

  public async blob(): Promise<Blob> {
    const type = this.headers.get("content-type") ?? "";
    const buf = await this.buffer();
    return new Blob([buf], { type });
  }

  public async buffer(): Promise<Buffer> {
    if (this.method === "GET" || this.method === "HEAD") {
      throw new Error("Request with GET/HEAD method cannot have body");
    }

    if (this.#bodyUsed) {
      throw new Error("Body already used");
    }

    this.#bodyUsed = true;

    const chunks: Buffer[] = [];
    for await (const chunk of this.#body) chunks.push(chunk);
    return Buffer.concat(chunks);
  }

  public async formData(): Promise<URLSearchParams> {
    if (
      !this.headers
        .get("content-type")
        .includes("application/x-www-form-urlencoded")
    ) {
      throw new HttpError(StatusCodes.UNSUPPORTED_MEDIA_TYPE, [
        "only `x-www-form-urlencoded` content type is supported",
      ]);
    }
    const text = await this.text();
    return new URLSearchParams(text);
  }

  public async json(): Promise<unknown> {
    if (!this.headers.get("content-type").includes("application/json")) {
      throw new HttpError(StatusCodes.UNSUPPORTED_MEDIA_TYPE, [
        "content-type header must be of type `application/json`",
      ]);
    }

    const text = await this.text();

    try {
      return JSON.parse(text);
    } catch (err) {
      throw new HttpError(StatusCodes.BAD_REQUEST, ["malformed JSON body"]);
    }
  }

  public async text(): Promise<string> {
    const buf = await this.buffer();
    return buf.toString("utf-8");
  }
}
