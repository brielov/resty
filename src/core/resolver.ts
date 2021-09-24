import { Request } from "./request";
import { Response } from "./response";

export type RequestHandler = (
  request: Request,
) => Response | PromiseLike<Response>;

export async function resolve(
  request: Request,
  handler: RequestHandler,
): Promise<Response> {
  let response: Response;

  try {
    response = await handler(request);
  } catch (err) {
    response = Response.fromError(err);
  }

  return response;
}
