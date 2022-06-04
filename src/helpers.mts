import { Status, getReasonPhrase } from "./status.mjs";

/**
 * Sends a response with the given status code and reason phrase.
 */
export function status(status: Status): Response {
  return new Response(getReasonPhrase(status), { status });
}

/**
 * Sends a json response with the given status code.
 */
export function json(data: unknown, status: Status = Status.Ok): Response {
  const body = JSON.stringify(data);
  const headers = new Headers([
    ["Content-Type", "application/json; charset=utf-8"],
    ["Content-Length", body.length.toString()],
  ]);
  return new Response(body, { status, headers });
}

/**
 * Sends a html response with the given status code.
 */
export function html(data: string, status: Status = Status.Ok): Response {
  const headers = new Headers([
    ["Content-Type", "text/html; charset=utf-8"],
    ["Content-Length", data.length.toString()],
  ]);
  return new Response(data, { status, headers });
}

/**
 * Sends a plain text response with the given status code.
 */
export function text(data: string, status: Status = Status.Ok): Response {
  const headers = new Headers([
    ["Content-Type", "text/plain; charset=utf-8"],
    ["Content-Length", data.length.toString()],
  ]);
  return new Response(data, { status, headers });
}
