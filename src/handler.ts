import type { IncomingMessage, RequestListener, ServerResponse } from "http";

import { HttpStatus } from "./status";
import { Node } from "./tree";
import { Request } from "./request";
import { Response } from "./response";
import type { Route } from "./types";

export const createHandler = (
  ...routes: ReadonlyArray<Route>
): RequestListener => {
  const trees: Record<string, Node> = {};

  routes.forEach(({ method, path, handler }) => {
    if (!trees[method]) {
      trees[method] = new Node();
    }
    trees[method].add(path, handler);
  });

  return async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    const request = Request.from(req);
    const { method, path } = request;

    let response = Response.empty(HttpStatus.NOT_FOUND) as Response<any>;

    if (trees[method]) {
      const { handler, params } = trees[method].find(path);

      if (handler) {
        params.forEach(({ key, value }) => {
          // @ts-ignore
          request.parsedUrlQuery[key] = value;
        });

        try {
          response = await handler(request);
        } catch (err) {
          response = Response.fromError(err);
        }
      }
    }

    response.pipe(res);
  };
};
