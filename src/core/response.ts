import { Readable } from "stream";
import { ServerResponse } from "http";

import { Headers, HeadersInit } from "./headers";
import { HttpError } from "./error";
import { HttpStatus, getReasonPhrase } from "./status";

type InitRecord = { status?: HttpStatus; headers?: HeadersInit };
type ResponseInit = HttpStatus | InitRecord;

export class Response {
  readonly body: unknown;
  readonly headers: Headers;
  readonly status: HttpStatus;

  private constructor(body: unknown, headers: Headers, status: HttpStatus) {
    this.body = body;
    this.headers = headers;
    this.status = status;
  }

  public static fromError(err: unknown): Response {
    let status: HttpStatus;
    let errors: unknown[] = [];
    let message = "";

    if (err instanceof HttpError) {
      status = err.status;
      message = err.message;
      errors = err.errors.slice();
    } else if (err instanceof Error) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = err.message;
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = getReasonPhrase(status);
    }

    return Response.json({ status, message, errors }, status);
  }

  public static json(data: unknown, init?: ResponseInit): Response {
    const { headers, status } = getInit(init);
    const body = JSON.stringify(data);
    headers.set("content-length", String(Buffer.byteLength(body)));
    if (!headers.has("content-type")) {
      headers.set("content-type", "application/json; charset=utf-8");
    }
    return new Response(body, headers, status);
  }

  public static text(data: string, init?: ResponseInit): Response {
    const { headers, status } = getInit(init);
    headers.set("content-length", String(Buffer.byteLength(data)));
    if (!headers.has("content-type")) {
      headers.set("content-type", "text/plain");
    }
    return new Response(data, headers, status);
  }

  public static empty(
    status: HttpStatus = HttpStatus.OK,
    headers?: HeadersInit,
  ): Response {
    const _headers = new Headers(headers);
    _headers.set("content-length", "0");
    return new Response(null, _headers, status);
  }

  public static buffer(buf: Buffer, init?: ResponseInit): Response {
    const { headers, status } = getInit(init);
    headers.set("content-length", String(buf.length));
    if (!headers.has("content-type")) {
      headers.set("content-type", "application/octet-stream");
    }
    return new Response(buf, headers, status);
  }

  public static stream(readable: Readable, init?: ResponseInit): Response {
    const { headers, status } = getInit(init);
    if (!headers.has("content-type")) {
      headers.set("content-type", "application/octet-stream");
    }
    return new Response(readable, headers, status);
  }

  public pipe<T extends ServerResponse>(res: T): void {
    const { body, headers, status } = this;
    res.statusCode = status;
    headers.forEach((value, key) => res.setHeader(key, value));
    if (!body) return res.end();
    if (body instanceof Readable) {
      body.pipe(res);
      return;
    }
    res.end(body);
  }
}

function getInit(init?: ResponseInit): {
  status: HttpStatus;
  headers: Headers;
} {
  if (!init) return { status: HttpStatus.OK, headers: new Headers() };
  if (typeof init === "number") return { status: init, headers: new Headers() };
  return {
    status: init.status ?? HttpStatus.OK,
    headers: new Headers(init.headers),
  };
}
