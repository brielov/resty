import type { IncomingMessage } from "http";
import type { NextApiRequest, NextApiResponse, PageConfig } from "next";
import { URLSearchParams } from "url";

import {
  HttpStatus,
  Request,
  RequestHandler,
  Response,
  resolve,
} from "../core";

interface Route {
  handler: RequestHandler;
  matches<T extends IncomingMessage>(req: T): boolean;
}

export const handle =
  (...routes: Route[]) =>
  async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
    const route = routes.find((route) => route.matches(req));
    if (!route) return res.status(HttpStatus.NOT_FOUND).end();
    let response: Response;

    try {
      const request = Request.from(req);
      request.url.search = queryToSearch(req.query);
      response = await resolve(request, route.handler);
    } catch (err) {
      response = Response.fromError(err);
    }

    response.pipe(res);
  };

export const pageConfig = (config?: PageConfig): PageConfig => ({
  ...config,
  api: {
    bodyParser: false,
    ...config?.api,
  },
});

const withMethod =
  (method: string) =>
  (handler: RequestHandler): Route => ({
    handler,
    matches: (req) => req.method === method,
  });

export const connect = withMethod("CONNECT");
export const del = withMethod("DELETE");
export const get = withMethod("GET");
export const head = withMethod("HEAD");
export const options = withMethod("OPTIONS");
export const patch = withMethod("PATCH");
export const post = withMethod("POST");
export const put = withMethod("PUT");

const queryToSearch = (query: NextApiRequest["query"]): string => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (Array.isArray(value)) {
      value.forEach((v) => params.append(key, v));
    } else {
      params.append(key, value);
    }
  }
  return params.toString();
};
