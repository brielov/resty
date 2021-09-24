import {
  Request as IncomingMessage,
  Response as ServerResponse,
} from "mock-http";

import { Response } from "../core";
import { del, get, handle, patch, post } from "../next";

const handler = handle(
  post(() => Response.text("POST")),
  get(() => Response.text("GET")),
  patch(() => Response.text("PATCH")),
  del(() => Response.text("DELETE")),
);

describe.each(["GET", "POST", "PATCH", "DELETE"])(
  `when method is %s`,
  (method) => {
    it("chooses the correct request handler", (done) => {
      const req = new IncomingMessage({ method });
      // @ts-ignore
      req.query = {};
      const res = new ServerResponse();

      res.on("finish", () => {
        expect(res._internal.buffer).toEqual(Buffer.from(method));
        done();
      });

      handler(req as any, res as any);
    });
  },
);
