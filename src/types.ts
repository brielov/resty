import type { Request } from "./request";
import type { Response } from "./response";

export type RequestHandler<T = unknown> = (
  request: Request,
) => Response<T> | PromiseLike<Response<T>>;

export interface Route<T = unknown> {
  readonly method: string;
  readonly path: string;
  readonly handler: RequestHandler<T>;
}
