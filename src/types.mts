import { Method } from "./method.mjs";

export type Handler = (
  request: Request,
  params: URLSearchParams
) => Response | Promise<Response>;

export interface Route {
  readonly handler: Handler;
  readonly method: Method;
  readonly pathname: string;
  readonly pattern: URLPattern;
}
