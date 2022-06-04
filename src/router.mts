import { HttpError } from "./errors.mjs";
import { status } from "./helpers.mjs";
import { isHttpMethod, Method, METHODS } from "./method.mjs";
import { Status } from "./status.mjs";
import { fromEntries } from "./util.mjs";

type Handler = (
  request: Request,
  params: URLSearchParams
) => Response | Promise<Response>;

interface Route {
  readonly handler: Handler;
  readonly method: Method;
  readonly pathname: string;
  readonly pattern: URLPattern;
}

interface CORSConfig {}

interface RouterConfig {
  cors?: boolean | CORSConfig;
}

/**
 * Initialize an object holding each method as an empty list of routes.
 */
function createRoutes(): Record<Method, Route[]> {
  return fromEntries(METHODS.map((method) => [method, []]));
}

/**
 * Create a new router.
 *
 * @example
 * ```ts
 * import { createRouter } from 'resty';
 *
 * const router = createRouter();
 *
 * router.get('/hello', (request) => new Response('world'));
 *
 * export default { fetch: router };
 *
 * // or
 *
 * addEventListener('fetch', (event) => {
 *  event.respondWith(router(event.request));
 * });
 * ```
 */
export function createRouter(config?: RouterConfig) {
  const routes = createRoutes();

  function createMethod(method: Method) {
    return function (pathname: string, handler: Handler): void {
      const pattern = new URLPattern({ pathname });
      routes[method].push({ pattern, handler, method, pathname });
    };
  }

  // Create a shortcut for each HTTP method.
  const methods = fromEntries(
    METHODS.map((method) => [
      method.toLowerCase() as Lowercase<typeof method>,
      createMethod(method),
    ])
  );

  // Handles a request by matching the request against the registered routes.
  async function handler(request: Request): Promise<Response> {
    const { method } = request;
    const url = new URL(request.url);

    // If the method is not supported, return a 405.
    if (!isHttpMethod(method)) {
      return status(Status.MethodNotAllowed);
    }

    // Try to find a route that matches the request.
    for (const { pattern, handler } of routes[method]) {
      const match = pattern.exec({ pathname: url.pathname });

      if (!match) continue;

      Object.entries(match.pathname.groups).forEach(([key, value]) =>
        url.searchParams.set(key, value)
      );

      try {
        // Execute the handler with the matched parameters.
        return await handler(request, url.searchParams);
      } catch (err) {
        // Throwing responses is allowed.
        if (err instanceof Response) {
          return err;
        }

        // If the error is a HttpError, send it as a response.
        if (err instanceof HttpError) {
          return status(err.status);
        }

        // Log the generic error.
        if (err instanceof Error) {
          console.error(err.stack || err.message);
        }

        // Generic error, send a 500.
        return status(Status.InternalServerError);
      }
    }

    // If no route was found, send a 404.
    return status(Status.NotFound);
  }

  return Object.assign(handler, methods);
}
