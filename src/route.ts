import type { RequestHandler, Route } from "./types";

const bind =
  (method: string) =>
  <T>(path: string, handler: RequestHandler<T>): Route<T> => ({
    method,
    path,
    handler,
  });

export const connect = bind("CONNECT");
export const del = bind("DELETE");
export const get = bind("GET");
export const head = bind("HEAD");
export const options = bind("OPTIONS");
export const patch = bind("PATCH");
export const post = bind("POST");
export const put = bind("PUT");
