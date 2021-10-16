import { Readable, Stream } from "stream";
import { Response as ServerResponse } from "mock-http";
import { StatusCodes, getReasonPhrase } from "http-status-codes";

import { HttpError, Response } from "../core";

describe("Response", () => {
  describe(".fromError()", () => {
    it("handles HttpError", () => {
      const status = StatusCodes.BAD_REQUEST;
      const err = new HttpError(status, ["email can't be empty"]);
      const response = Response.fromError(err);
      expect(response.status).toEqual(status);
      expect(response.body).toEqual({
        status,
        message: getReasonPhrase(status),
        errors: ["email can't be empty"],
      });
    });

    it("handles generic error", () => {
      const err = new Error("foo bar");
      const response = Response.fromError(err);
      const status = StatusCodes.INTERNAL_SERVER_ERROR;
      expect(response.status).toEqual(status);
      expect(response.body).toEqual({
        status,
        message: "foo bar",
        errors: [],
      });
    });

    it("has fallbacks to status reason", () => {
      const response = Response.fromError({});
      const status = StatusCodes.INTERNAL_SERVER_ERROR;
      expect(response.status).toEqual(status);
      expect(response.body).toEqual({
        status,
        message: getReasonPhrase(status),
        errors: [],
      });
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
