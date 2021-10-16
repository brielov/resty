import { build } from "./test-util";

describe("Request", () => {
  describe(".from()", () => {
    it("parses params correctly", () => {
      const request = build({ url: "/?foo=bar" });
      expect(request.query.foo).toEqual("bar");
    });

    it("parses headers correctly", () => {
      const request = build({ headers: { Authorization: "Bearer token" } });
      expect(request.headers.authorization).toEqual("Bearer token");
    });
  });

  describe(".buffer()", () => {
    it("throws error if method is either GET or HEAD", () => {
      const buf = Buffer.from("foo bar");
      const request = build({ buffer: buf, method: "GET" });
      return expect(request.buffer()).rejects.toThrow(
        "Request with GET/HEAD method cannot have body",
      );
    });

    it("consumes the request body as a Buffer", () => {
      const buf = Buffer.from("foo bar");
      const request = build({ buffer: buf, method: "POST" });
      return expect(request.buffer()).resolves.toEqual(buf);
    });
  });

  describe(".arrayBuffer()", () => {
    it("parses the body as array buffer", async () => {
      const request = build({
        buffer: Buffer.from("hello world"),
        method: "POST",
      });
      const a = await request.arrayBuffer();
      const { buffer, byteOffset, byteLength } = Buffer.from("hello world");
      const b = buffer.slice(byteOffset, byteOffset + byteLength);
      const view1 = new DataView(a);
      const view2 = new DataView(b);
      for (let i = 0; i < a.byteLength; i++)
        expect(view2.getUint8(i)).toEqual(view1.getUint8(i));
    });
  });

  describe(".text()", () => {
    it("parses the body as string", () => {
      const request = build({ buffer: Buffer.from("foobar"), method: "POST" });
      return expect(request.text()).resolves.toEqual("foobar");
    });
  });

  describe(".json()", () => {
    it("parses the body as json", () => {
      const request = build({
        buffer: Buffer.from(JSON.stringify({ foo: "bar" })),
        method: "POST",
        headers: { "content-type": "application/json" },
      });

      return expect(request.json()).resolves.toEqual({ foo: "bar" });
    });
  });
});
