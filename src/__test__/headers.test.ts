import { Headers, ReadonlyHeaders } from "../core";

describe("Headers", () => {
  describe(".keys()", () => {
    it("returns a sorted list of unique keys", () => {
      const headers = new Headers([
        ["c", "3"],
        ["a", "5"],
        ["b", "2"],
        ["b", "4"],
        ["a", "1"],
      ]);

      expect([...headers.keys()]).toEqual(["a", "b", "c"]);
    });
  });

  describe(".has()", () => {
    it("returns true when key is uppercase", () => {
      const headers = new Headers([["content-type", "text/plain"]]);
      expect(headers.has("Content-Type")).toBe(true);
    });

    it("returns true when key is lowercase", () => {
      const headers = new Headers([["content-type", "text/plain"]]);
      expect(headers.has("content-type")).toBe(true);
    });
  });

  describe(".get()", () => {
    it("returns an empty string when key doen't exists", () => {
      const headers = new Headers();
      expect(headers.get("nonexistent")).toEqual("");
    });

    it("returns the correct header even if uppercase", () => {
      const headers = new Headers([["content-type", "text/plain"]]);
      expect(headers.get("Content-Type")).toEqual("text/plain");
    });

    it("returns a comma separated list of headers when duplicated keys found", () => {
      const headers = new Headers([
        ["content-type", "text/plain"],
        ["content-type", "application/json"],
      ]);

      expect(headers.get("Content-Type")).toEqual(
        "text/plain, application/json",
      );
    });
  });

  describe(".delete()", () => {
    it("should remove header", () => {
      const headers = new Headers([["content-type", "text/plain"]]);
      headers.delete("content-type");
      expect(headers.has("Content-Type")).toBe(false);
    });

    it("should remove all duplicated headers", () => {
      const headers = new Headers([
        ["content-type", "text/plain"],
        ["content-type", "application/json"],
      ]);
      headers.delete("content-type");
      expect(headers.has("Content-Type")).toBe(false);
    });
  });

  describe(".forEach", () => {
    it("iterates over every header", () => {
      const headers = new Headers([
        ["c", "4"],
        ["b", "2"],
        ["a", "1"],
        ["b", "3"],
      ]);

      const result: [string, string][] = [];
      headers.forEach((value, key) => result.push([key, value]));
      expect(result).toEqual([
        ["a", "1"],
        ["b", "2, 3"],
        ["c", "4"],
      ]);
    });

    it("sets the thisArg", () => {
      expect.assertions(1);
      const headers = new Headers([["a", "1"]]);
      const thisArg = {};
      headers.forEach(function () {
        // @ts-ignore
        expect(this).toEqual(thisArg);
      }, thisArg);
    });
  });
});

describe("ReadonlyHeaders", () => {
  it("throws when using `set`", () => {
    const headers = new ReadonlyHeaders();
    expect(() => headers.set()).toThrow(TypeError);
  });

  it("throws when using `append`", () => {
    const headers = new ReadonlyHeaders();
    expect(() => headers.append()).toThrow(TypeError);
  });

  it("throws when using `delete`", () => {
    const headers = new ReadonlyHeaders();
    expect(() => headers.delete()).toThrow(TypeError);
  });
});
