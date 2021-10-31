import * as T from "typed";
import { Request as IncomingMessage } from "mock-http";

import { HttpError } from "../error";
import { HttpStatus } from "../status";
import { Request } from "../request";
import { build } from "./test-util";

describe("Request", () => {
  describe("#from()", () => {
    it("should create a new Request", () => {
      const req = Request.from(
        new IncomingMessage({
          method: "POST",
          url: "/foo",
          headers: { "content-type": "application/json" },
        }),
      );

      expect(req.method).toBe("POST");
      expect(req.path).toBe("/foo");
      expect(req.headers).toEqual({
        "content-type": "application/json",
      });
    });
  });

  describe(".maxBodySize", () => {
    it("should have a default value of 10MB", () => {
      const req = build();
      expect(req.maxBodySize).toBe(1024 * 1024 * 2);
    });

    it("should allow setting numeric size", () => {
      const req = build();
      req.maxBodySize = 1;
      expect(req.maxBodySize).toBe(1);
    });

    it("should allow setting string size", () => {
      const req = build();
      req.maxBodySize = "10kb";
      expect(req.maxBodySize).toBe(1024 * 10);
    });
  });

  describe(".query()", () => {
    it("should throw a 400 bad request error", () => {
      const req = build();
      const type = T.object({ foo: T.string });
      expect(() => req.query(type)).toThrow(HttpError);
    });

    it("should return decoded query object", () => {
      const req = build({ url: "/?foo=bar" });
      const type = T.object({ foo: T.string });
      expect(req.query(type)).toEqual({ foo: "bar" });
    });
  });

  describe(".buffer()", () => {
    it("should throw when reading body from a GET/HEAD request", () => {
      const buf = Buffer.from('{"foo":"bar"}');
      const req = build({ method: "GET", buffer: buf });
      expect(req.buffer()).rejects.toThrow(
        "Cannot read body from GET/HEAD request",
      );
    });

    it("should throw when body exceeds maxBodySize", async () => {
      const buf = Buffer.from('{"foo":"bar"}');
      const req = build({ method: "POST", buffer: buf });
      req.maxBodySize = 0;
      let status = HttpStatus.OK;
      try {
        await req.buffer();
      } catch (err) {
        if (err instanceof HttpError) {
          status = err.status;
        }
      }
      expect(status).toEqual(HttpStatus.REQUEST_TOO_LONG);
    });

    it("should read request body as buffer", () => {
      const buf = Buffer.from('{"foo":"bar"}');
      const req = build({ method: "POST", buffer: buf });
      expect(req.buffer()).resolves.toEqual(buf);
    });

    it("should cache the parsed body to allow multiple reads", async () => {
      const buf = Buffer.from('{"foo":"bar"}');
      const req = build({ method: "POST", buffer: buf });
      await req.buffer();
      expect(req.buffer()).resolves.toEqual(buf);
    });
  });

  describe(".arrayBuffer()", () => {
    it("should read request body as arrayBuffer", async () => {
      const request = build({
        method: "POST",
        buffer: Buffer.from("hello world"),
      });

      const a = await request.arrayBuffer();
      const { buffer, byteOffset, byteLength } = Buffer.from("hello world");
      const b = buffer.slice(byteOffset, byteOffset + byteLength);

      const view1 = new DataView(a);
      const view2 = new DataView(b);

      for (let i = 0; i < a.byteLength; i++) {
        expect(view2.getUint8(i)).toEqual(view1.getUint8(i));
      }
    });
  });

  describe(".text()", () => {
    it("should read request body as text", () => {
      const req = build({
        method: "POST",
        buffer: Buffer.from("hello world"),
      });

      return expect(req.text()).resolves.toEqual("hello world");
    });
  });

  describe(".json()", () => {
    const type = T.object({ foo: T.string });

    it("should throw a 400 bad request error when bad json", () => {
      expect.assertions(1);

      const req = build({
        method: "POST",
        buffer: Buffer.from('{"foo":"bar"'),
      });

      return expect(req.json(type)).rejects.toHaveProperty("errors", [
        "Unexpected end of JSON input",
      ]);
    });

    it("should throw 400 bad request error when validation fails", () => {
      const req = build({ method: "POST" });
      expect(req.json(type)).rejects.toThrow(HttpError);
    });

    it("should read request body as json", () => {
      const req = build({
        method: "POST",
        buffer: Buffer.from('{"foo":"bar"}'),
      });
      expect(req.json(type)).resolves.toEqual({ foo: "bar" });
    });
  });
});
