import { Method } from "./method.mjs";
import { Status } from "./status.mjs";
import { Handler } from "./types.mjs";

export interface CorsOptions {
  allowHeaders?: string[];
  allowMethods?: Method[];
  credentials?: boolean;
  exposeHeaders?: string[];
  keepHeadersOnError?: boolean;
  maxAge?: number;
  origin?: string | ((origin: string) => boolean);
  privateNetworkAccess?: boolean;
  secureContext?: boolean;
  status?: Status;
}

const defaultOptions: CorsOptions = {
  origin: "*",
  allowMethods: [
    "GET",
    "HEAD",
    "POST",
    "PUT",
    "DELETE",
    "CONNECT",
    "OPTIONS",
    "TRACE",
  ],
  secureContext: false,
  status: Status.NoContent,
};

export type CorsHandler = (
  request: Request,
  params: URLSearchParams,
  next: Handler
) => Response | Promise<Response>;

export function createCors(options = defaultOptions): CorsHandler {
  const allowMethods = options.allowMethods?.join(",");

  return async function cors(
    request: Request,
    params: URLSearchParams,
    next: Handler
  ): Promise<Response> {
    const headers = new Headers();

    // Always set the Vary header to avoid caching problems.
    headers.set("Vary", "Origin");

    let requestOrigin = request.headers.get("origin");

    // Not a CORS request, so just pass it through.
    if (!requestOrigin || !isOriginAllowed(requestOrigin, options.origin)) {
      console.log("Not a CORS request");
      return next(request, params);
    }

    // Preflight request.
    if (request.method === "OPTIONS") {
      if (!request.headers.get("access-control-request-method")) {
        return next(request, params);
      }

      headers.set("access-control-allow-origin", requestOrigin);

      if (options.credentials) {
        headers.set("access-control-allow-credentials", "true");
      }

      if (options.maxAge) {
        headers.set("access-control-max-age", options.maxAge.toString());
      }

      if (
        options.privateNetworkAccess &&
        request.headers.get("access-control-request-private-network")
      ) {
        headers.set("access-control-allow-private-network", "true");
      }

      if (allowMethods) {
        headers.set("access-control-allow-methods", allowMethods);
      }

      if (options.secureContext) {
        headers.set("cross-origin-opener-policy", "same-origin");
        headers.set("cross-origin-embedder-policy", "require-corp");
      }

      let allowHeaders = options.allowHeaders?.join(",") || null;
      if (!allowHeaders) {
        allowHeaders = request.headers.get("access-control-request-headers");
      }
      if (allowHeaders) {
        headers.set("access-control-allow-headers", allowHeaders);
      }

      return new Response(null, { headers, status: options.status });
    }

    // Normal request.
    headers.set("access-control-allow-origin", requestOrigin);

    if (options.credentials) {
      headers.set("access-control-allow-credentials", "true");
    }

    if (options.exposeHeaders) {
      headers.set(
        "access-control-expose-headers",
        options.exposeHeaders.join(",")
      );
    }

    if (options.secureContext) {
      headers.set("cross-origin-opener-policy", "same-origin");
      headers.set("cross-origin-embedder-policy", "require-corp");
    }

    const response = await next(request, params);
    mergeHeaders(response.headers, headers);

    return response;
  };
}

function isOriginAllowed(
  requestOrigin: string,
  origin: CorsOptions["origin"]
): boolean {
  if (typeof origin === "function") {
    return origin(requestOrigin);
  }

  if (typeof origin === "string") {
    return origin === "*" || requestOrigin === origin;
  }

  return false;
}

function mergeHeaders(...headers: HeadersInit[]): Headers {
  const merged = new Headers();

  for (let header of headers) {
    if (!(header instanceof Headers)) {
      header = new Headers(header);
    }

    for (const [key, value] of header.entries()) {
      merged.set(key, value);
    }
  }

  return merged;
}
