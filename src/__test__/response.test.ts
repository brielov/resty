import { Readable, Stream } from "stream";
import { Response as ServerResponse } from "mock-http";
import { StatusCodes, getReasonPhrase } from "http-status-codes";

import { HttpError } from "../error";
import { Response } from "../response";

describe("Response", () => {
  describe(".json()", () => {
    const data = { name: "john doe", age: 30 };

    it("stringifies the data", () => {
      const response = Response.json(data);
      expect(response.body).toEqual(JSON.stringify(data));
    });

    it("sets the correct headers", () => {
      const response = Response.json(data);
      expect([...response.headers.entries()]).toEqual([
        ["content-length", String(Buffer.byteLength(JSON.stringify(data)))],
        ["content-type", "application/json; charset=utf-8"],
      ]);
    });

    it("accepts a status code", () => {
      const response = Response.json(data, StatusCodes.CREATED);
      expect(response.status).toEqual(StatusCodes.CREATED);
    });

    it("accepts an object with status and headers", () => {
      const response = Response.json(data, {
        status: StatusCodes.BAD_REQUEST,
        headers: { "x-token": "abc" },
      });

      expect(response.status).toEqual(StatusCodes.BAD_REQUEST);
      expect(response.headers.get("x-token")).toEqual("abc");
    });
  });

  describe(".text()", () => {
    const data = "foo bar baz qux";

    it("sets the body to be the input string", () => {
      const response = Response.text(data);
      expect(response.body).toEqual(data);
    });

    it("sets the correct headers", () => {
      const response = Response.text(data);
      expect([...response.headers.entries()]).toEqual([
        ["content-length", String(Buffer.byteLength(data))],
        ["content-type", "text/plain"],
      ]);
    });

    it("accepts a status code", () => {
      const response = Response.text(data, StatusCodes.CREATED);
      expect(response.status).toEqual(StatusCodes.CREATED);
    });

    it("accepts an object with status and headers", () => {
      const response = Response.text(data, {
        status: StatusCodes.BAD_REQUEST,
        headers: { "x-token": "abc" },
      });

      expect(response.status).toEqual(StatusCodes.BAD_REQUEST);
      expect(response.headers.get("x-token")).toEqual("abc");
    });
  });

  describe(".empty()", () => {
    it("sets the body to be the input string", () => {
      const response = Response.empty();
      expect(response.body).toEqual(null);
    });

    it("sets the correct headers", () => {
      const response = Response.empty();
      expect(response.headers.get("content-length")).toEqual("0");
    });

    it("accepts a status code", () => {
      const response = Response.empty(StatusCodes.CREATED);
      expect(response.status).toEqual(StatusCodes.CREATED);
    });

    it("accepts headers", () => {
      const response = Response.empty(StatusCodes.BAD_REQUEST, {
        "x-token": "abc",
      });

      expect(response.status).toEqual(StatusCodes.BAD_REQUEST);
      expect(response.headers.get("x-token")).toEqual("abc");
    });
  });

  describe(".buffer()", () => {
    const data = Buffer.from("foo bar baz qux");

    it("sets the body to be the input string", () => {
      const response = Response.buffer(data);
      expect(response.body).toBeInstanceOf(Buffer);
      expect(response.body).toEqual(data);
    });

    it("sets the correct headers", () => {
      const response = Response.buffer(data);
      expect([...response.headers.entries()]).toEqual([
        ["content-length", String(data.length)],
        ["content-type", "application/octet-stream"],
      ]);
    });

    it("accepts a status code", () => {
      const response = Response.buffer(data, StatusCodes.CREATED);
      expect(response.status).toEqual(StatusCodes.CREATED);
    });

    it("accepts an object with status and headers", () => {
      const response = Response.buffer(data, {
        status: StatusCodes.BAD_REQUEST,
        headers: { "x-token": "abc" },
      });

      expect(response.status).toEqual(StatusCodes.BAD_REQUEST);
      expect(response.headers.get("x-token")).toEqual("abc");
    });
  });

  describe(".stream()", () => {
    const data = Readable.from(Buffer.from("foo bar baz qux"));

    it("sets the body to be the input string", () => {
      const response = Response.stream(data);
      expect(response.body).toBeInstanceOf(Stream);
      expect(response.body).toEqual(data);
    });

    it("sets the correct headers", () => {
      const response = Response.stream(data);
      expect([...response.headers.entries()]).toEqual([
        ["content-type", "application/octet-stream"],
      ]);
    });

    it("accepts a status code", () => {
      const response = Response.stream(data, StatusCodes.CREATED);
      expect(response.status).toEqual(StatusCodes.CREATED);
    });

    it("accepts an object with status and headers", () => {
      const response = Response.stream(data, {
        status: StatusCodes.BAD_REQUEST,
        headers: { "x-token": "abc" },
      });

      expect(response.status).toEqual(StatusCodes.BAD_REQUEST);
      expect(response.headers.get("x-token")).toEqual("abc");
    });
  });

  describe(".fromError()", () => {
    it("handles HttpError", () => {
      const status = StatusCodes.BAD_REQUEST;
      const err = new HttpError(status, ["email can't be empty"]);
      const response = Response.fromError(err);
      expect(response.status).toEqual(status);
      expect(response.body).toEqual(
        JSON.stringify({
          status,
          message: getReasonPhrase(status),
          errors: ["email can't be empty"],
        }),
      );
    });

    it("handles generic error", () => {
      const err = new Error("foo bar");
      const response = Response.fromError(err);
      const status = StatusCodes.INTERNAL_SERVER_ERROR;
      expect(response.status).toEqual(status);
      expect(response.body).toEqual(
        JSON.stringify({
          status,
          message: "foo bar",
          errors: [],
        }),
      );
    });

    it("has fallbacks to status reason", () => {
      const response = Response.fromError({});
      const status = StatusCodes.INTERNAL_SERVER_ERROR;
      expect(response.status).toEqual(status);
      expect(response.body).toEqual(
        JSON.stringify({
          status,
          message: getReasonPhrase(status),
          errors: [],
        }),
      );
    });
  });

  describe(".pipe()", () => {
    it("sets the correct status code", (done) => {
      const res = new ServerResponse();
      const response = Response.empty(StatusCodes.BAD_REQUEST);
      res.on("finish", () => {
        expect(res.statusCode).toEqual(StatusCodes.BAD_REQUEST);
        done();
      });
      response.pipe(res);
    });

    it("sets the correct headers", (done) => {
      const data = { foo: "bar" };
      const res = new ServerResponse();
      const response = Response.json(data);
      res.on("finish", () => {
        expect(res.getHeaders()).toEqual(
          expect.objectContaining({
            "content-type": "application/json; charset=utf-8",
            "content-length": String(Buffer.byteLength(JSON.stringify(data))),
          }),
        );
        done();
      });
      response.pipe(res);
    });

    it("handles strings", (done) => {
      const data = "foo bar";
      const res = new ServerResponse();
      const response = Response.text(data);
      res.on("finish", () => {
        expect(res._internal.buffer).toEqual(Buffer.from(data));
        done();
      });
      response.pipe(res);
    });

    it("handles null body", (done) => {
      const res = new ServerResponse();
      const response = Response.empty();
      res.on("finish", () => {
        expect(res._internal.buffer.length).toEqual(0);
        done();
      });
      response.pipe(res);
    });

    it("handles buffers", (done) => {
      const data = Buffer.from("foo bar");
      const res = new ServerResponse();
      const response = Response.buffer(data);
      res.on("finish", () => {
        expect(res._internal.buffer).toEqual(data);
        done();
      });
      response.pipe(res);
    });

    it("handles streams", (done) => {
      const buf = Buffer.from("foo bar");
      const data = Readable.from(buf);
      const res = new ServerResponse();
      const response = Response.stream(data);
      res.on("finish", () => {
        expect(res._internal.buffer).toEqual(buf);
        done();
      });
      response.pipe(res);
    });
  });
});
