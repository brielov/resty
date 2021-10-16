import { Request } from "./request";
import { Response } from "./response";

export type RequestHandler<T = unknown> = (
  request: Request,
) => Response<T> | PromiseLike<Response<T>>;

export async function resolve<T = unknown>(
  request: Request,
  handler: RequestHandler<T>,
): Promise<Response> {
  let response: Response;

  try {
    response = await handler(request);
  } catch (err) {
    response = Response.fromError(err);
  }

  return response;
}
