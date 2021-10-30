import * as T from "typed";
import {
  Request as IncomingMessage,
  Response as ServerResponse,
} from "mock-http";

import * as R from "../route";
import { Response } from "../response";
import { createHandler } from "../handler";

describe(".createHandler()", () => {
  let res: ServerResponse;

  beforeEach(() => {
    res = new ServerResponse();
  });

  it("should respond with 404 when no match was found", () => {
    const handler = createHandler(R.get("/", () => Response.empty()));
    const req = new IncomingMessage({ method: "GET", url: "/foo" });
    handler(req, res);
    expect(res.statusCode).toBe(404);
  });

  it("should handle request", (done) => {
    const handler = createHandler(R.get("/users", () => Response.json([])));
    const req = new IncomingMessage({ url: "/users" });

    res.on("close", () => {
      expect(res.statusCode).toBe(200);
      expect(res.getHeaders()).toEqual(
        expect.objectContaining({
          "content-type": "application/json; charset=utf-8",
          "content-length": "2",
        }),
      );
      expect(res._internal.buffer).toEqual(Buffer.from("[]"));
      done();
    });

    handler(req, res);
  });

  it("should append dynamic params to query", (done) => {
    const handler = createHandler(
      R.get("/users/:id", (request) => {
        try {
          request.query(T.object({ id: T.string }));
          done();
        } catch (err) {
          done(err);
        }
        return Response.empty();
      }),
    );
    const req = new IncomingMessage({ method: "GET", url: "/users/123" });
    handler(req, res);
  });

  it("should handle errors", () => {
    const handler = createHandler(
      R.get("/users/:id", () => {
        throw new Error("custom");
      }),
    );
    const req = new IncomingMessage({ method: "GET", url: "/users/123" });
    handler(req, res);
    expect(res.statusCode).toBe(500);
  });
});
