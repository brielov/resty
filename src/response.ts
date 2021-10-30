import { Readable } from "stream";
import { ServerResponse } from "http";

import { HttpError } from "./error";
import { HttpStatus, getReasonPhrase } from "./status";

type ResponseHeaders = ReadonlyArray<[string, string | number]>;

interface ResponseInit {
  status?: HttpStatus;
  headers?: ResponseHeaders;
}

export class Response<T = unknown> {
  private constructor(
    public readonly body: T,
    public readonly status = HttpStatus.OK,
    public readonly headers: ResponseHeaders = [],
  ) {}

  public static json<T>(serializable: T, init?: ResponseInit): Response<T> {
    return new Response(serializable, init?.status, init?.headers);
  }

  public static buffer(buf: Buffer, init?: ResponseInit): Response<Buffer> {
    return new Response(buf, init?.status, init?.headers);
  }

  public static stream(
    readable: Readable,
    init?: ResponseInit,
  ): Response<Readable> {
    return new Response(readable, init?.status, init?.headers);
  }

  public static text(str: string, init?: ResponseInit): Response<string> {
    return new Response(str, init?.status, init?.headers);
  }

  public static empty(
    status?: HttpStatus,
    headers?: ResponseHeaders,
  ): Response<null> {
    return new Response(null, status, headers);
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

    return Response.json({ status, message, errors }, { status });
  }

  public pipe<T extends ServerResponse>(res: T): void {
    res.statusCode = this.status;

    for (const [key, value] of this.headers) {
      res.setHeader(key.toLowerCase(), String(value));
    }

    const { body } = this;

    if (body === null) {
      res.end();
      return;
    }

    if (body instanceof Readable) {
      if (!res.hasHeader("content-type")) {
        res.setHeader("content-type", "application/octet-stream");
      }
      body.pipe(res);
      return;
    }

    let str: string;

    if (Buffer.isBuffer(body)) {
      if (!res.hasHeader("content-type")) {
        res.setHeader("content-type", "application/octet-stream");
      }
      res.setHeader("content-length", String(body.length));
      res.end(body);
      return;
    }

    if (typeof body === "object" || typeof body === "number") {
      str = JSON.stringify(body);

      if (!res.hasHeader("content-type")) {
        res.setHeader("content-type", "application/json; charset=utf-8");
      }
    } else if (typeof body === "string") {
      str = body;
    } else {
      str = "";
    }

    if (!res.hasHeader("content-type")) {
      res.setHeader("content-type", "text/plain");
    }

    res.setHeader("content-length", String(Buffer.byteLength(str)));
    res.end(str);
  }
}
