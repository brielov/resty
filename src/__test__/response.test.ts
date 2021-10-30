import { Readable } from "stream";
import { Response as ServerResponse } from "mock-http";

import { HttpError } from "../error";
import { HttpStatus } from "../status";
import { Response } from "../response";

describe("Response", () => {
  describe("#empty()", () => {
    it("should have a null body", () => {
      const response = Response.empty();
      expect(response.body).toBeNull();
    });

    it("should have 200 status by default", () => {
      const response = Response.empty();
      expect(response.status).toBe(200);
    });

    it("should accept a status code", () => {
      const response = Response.empty(HttpStatus.NO_CONTENT);
      expect(response.status).toBe(HttpStatus.NO_CONTENT);
    });

    it("should accept headers", () => {
      const response = Response.empty(HttpStatus.OK, [
        ["content-type", "application/json"],
      ]);
      expect(response.headers).toEqual([["content-type", "application/json"]]);
    });
  });

  describe("#buffer()", () => {
    it("should have a buffer body", () => {
      const response = Response.buffer(Buffer.from("hello world"));
      expect(response.body).toEqual(Buffer.from("hello world"));
    });

    it("should have 200 status by default", () => {
      const response = Response.buffer(Buffer.from("hello world"));
      expect(response.status).toBe(HttpStatus.OK);
    });

    it("should accept status and headers", () => {
      const response = Response.buffer(Buffer.from("hello world"), {
        status: HttpStatus.NO_CONTENT,
        headers: [["content-type", "application/json"]],
      });
      expect(response.status).toBe(HttpStatus.NO_CONTENT);
      expect(response.headers).toEqual([["content-type", "application/json"]]);
    });
  });

  describe("#json()", () => {
    it("should have a json body", () => {
      const response = Response.json({ hello: "world" });
      expect(response.body).toEqual({ hello: "world" });
    });

    it("should have 200 status by default", () => {
      const response = Response.json({ hello: "world" });
      expect(response.status).toBe(HttpStatus.OK);
    });

    it("should accept status and headers", () => {
      const response = Response.json(
        { hello: "world" },
        {
          status: HttpStatus.NO_CONTENT,
          headers: [["content-type", "application/json"]],
        },
      );
      expect(response.status).toBe(HttpStatus.NO_CONTENT);
      expect(response.headers).toEqual([["content-type", "application/json"]]);
    });
  });

  describe("#text()", () => {
    it("should have a text body", () => {
      const response = Response.text("hello world");
      expect(response.body).toEqual("hello world");
    });

    it("should have 200 status by default", () => {
      const response = Response.text("hello world");
      expect(response.status).toBe(HttpStatus.OK);
    });

    it("should accept status and headers", () => {
      const response = Response.text("hello world", {
        status: HttpStatus.NO_CONTENT,
        headers: [["content-type", "application/json"]],
      });
      expect(response.status).toBe(HttpStatus.NO_CONTENT);
      expect(response.headers).toEqual([["content-type", "application/json"]]);
    });
  });

  describe("#stream", () => {
    it("should have a readable body", () => {
      const readale = new Readable();
      const response = Response.stream(readale);
      expect(response.body).toBe(readale);
    });

    it("should have 200 status by default", () => {
      const readale = new Readable();
      const response = Response.stream(readale);
      expect(response.status).toBe(HttpStatus.OK);
    });

    it("should accept status and headers", () => {
      const readale = new Readable();
      const response = Response.stream(readale, {
        status: HttpStatus.NO_CONTENT,
        headers: [["content-type", "application/json"]],
      });
      expect(response.status).toBe(HttpStatus.NO_CONTENT);
      expect(response.headers).toEqual([["content-type", "application/json"]]);
    });
  });

  describe("#fromError", () => {
    it("should handle generic error", () => {
      const response = Response.fromError(new Error("test"));
      expect(response.body).toEqual({
        message: "test",
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        errors: [],
      });
    });

    it("should have a default message", () => {
      const response = Response.fromError({});
      expect(response.body).toEqual({
        message: "Internal Server Error",
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        errors: [],
      });
    });

    it("should handle http error", () => {
      const response = Response.fromError(
        new HttpError(HttpStatus.NOT_FOUND, ["Custom error"]),
      );
      expect(response.body).toEqual({
        message: "Not Found",
        status: HttpStatus.NOT_FOUND,
        errors: ["Custom error"],
      });
    });
  });

  describe(".pipe()", () => {
    it("should set statusCode", () => {
      const response = Response.empty(HttpStatus.NOT_FOUND);
      const res = new ServerResponse();
      response.pipe(res);
      expect(res.statusCode).toBe(HttpStatus.NOT_FOUND);
    });

    it("should set headers", () => {
      const response = Response.empty(HttpStatus.NOT_FOUND, [
        ["content-type", "application/json"],
      ]);
      const res = new ServerResponse();
      response.pipe(res);
      expect(res.getHeaders()).toEqual(
        expect.objectContaining({
          "content-type": "application/json",
        }),
      );
    });

    it("should handle readable stream", (done) => {
      const readable = new Readable({
        read() {
          this.push("hello");
          this.push(null);
        },
      });
      const response = Response.stream(readable);
      const res = new ServerResponse();
      response.pipe(res);
      res.on("close", () => {
        expect(res._internal.buffer).toEqual(Buffer.from("hello"));
        done();
      });
    });

    it("should handle buffer", () => {
      const response = Response.buffer(Buffer.from("hello"));
      const res = new ServerResponse();
      response.pipe(res);
      expect(res._internal.buffer).toEqual(Buffer.from("hello"));
    });

    it("should handle json object", () => {
      const response = Response.json({ hello: "world" });
      const res = new ServerResponse();
      response.pipe(res);
      expect(res._internal.buffer).toEqual(Buffer.from('{"hello":"world"}'));
    });

    it("should handle string", () => {
      const response = Response.text("hello");
      const res = new ServerResponse();
      response.pipe(res);
      expect(res._internal.buffer).toEqual(Buffer.from("hello"));
    });

    it("should default to empty string", () => {
      const response = Response.json(true);
      const res = new ServerResponse();
      response.pipe(res);
      expect(res._internal.buffer).toEqual(Buffer.from(""));
    });
  });
});
