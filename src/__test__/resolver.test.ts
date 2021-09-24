import { HttpStatus, Response, resolve } from "../core";
import { build } from "./test-util";

describe(".resolve()", () => {
  it("handles unexpected errors", async () => {
    const request = build();
    const response = await resolve(request, () => {
      throw new Error("foo bar");
    });
    expect(response.status).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(response.body).toEqual(
      JSON.stringify({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: "foo bar",
        errors: [],
      }),
    );
  });

  it("handles successful responses", async () => {
    const request = build();
    const response = await resolve(request, async () =>
      Response.text("foo bar", HttpStatus.CREATED),
    );
    expect(response.status).toEqual(HttpStatus.CREATED);
    expect(response.body).toEqual("foo bar");
    expect(response.headers.get("content-type")).toEqual("text/plain");
  });
});
