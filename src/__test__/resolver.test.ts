import { StatusCodes } from "http-status-codes";

import { Response } from "../response";
import { build } from "./test-util";
import { resolve } from "../resolver";

describe(".resolve()", () => {
  it("handles unexpected errors", async () => {
    const request = build();
    const response = await resolve(request, () => {
      throw new Error("foo bar");
    });
    expect(response.status).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
    expect(response.body).toEqual(
      JSON.stringify({
        status: StatusCodes.INTERNAL_SERVER_ERROR,
        message: "foo bar",
        errors: [],
      }),
    );
  });

  it("handles successful responses", async () => {
    const request = build();
    const response = await resolve(request, async () =>
      Response.text("foo bar", StatusCodes.CREATED),
    );
    expect(response.status).toEqual(StatusCodes.CREATED);
    expect(response.body).toEqual("foo bar");
    expect(response.headers.get("content-type")).toEqual("text/plain");
  });
});
