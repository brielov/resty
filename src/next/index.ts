import type { IncomingMessage } from "http";
import type { NextApiRequest, NextApiResponse, PageConfig } from "next";

import {
  HttpStatus,
  Request,
  RequestHandler,
  Response,
  resolve,
} from "../core";

interface Route<T = unknown> {
  handler: RequestHandler<T>;
  matches<T extends IncomingMessage>(req: T): boolean;
}

export type InferRoute<T> = T extends Route<infer U> ? U : unknown;

export const handle =
  (...routes: Route[]) =>
  async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
    const route = routes.find((route) => route.matches(req));
    if (!route) return res.status(HttpStatus.NOT_FOUND).end();
    let response: Response;

    try {
      const request = Request.from(req);
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
  <T>(handler: RequestHandler<T>): Route<T> => ({
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
