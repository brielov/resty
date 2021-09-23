import { IncomingHttpHeaders } from "http";

import { isPlainObject } from "./util";

export type HeadersInit =
  | Array<[string, string]>
  | Record<string, string>
  | ReadonlyHeaders
  | Headers;

export class Headers {
  #entries: Array<[string, string]> = [];

  constructor(init?: HeadersInit) {
    if (init instanceof Headers) {
      this.#entries = [...init.entries()];
    } else if (Array.isArray(init)) {
      for (const [key, value] of init) {
        this.#entries.push([key.toLowerCase(), value]);
      }
    } else if (isPlainObject(init)) {
      for (const [key, value] of Object.entries(init)) {
        this.#entries.push([key.toLowerCase(), value]);
      }
    }
  }

  public has(name: string): boolean {
    return new Set(this.#entries.map(([key]) => key)).has(name.toLowerCase());
  }

  public get(name: string): string {
    const values: string[] = [];
    const lower = name.toLowerCase();
    for (const [key, value] of this.#entries) {
      if (key === lower) values.push(value);
    }
    return values.join(", ");
  }

  public append(name: string, value: string): void {
    this.#entries.push([name.toLowerCase(), value]);
  }

  public delete(name: string): void {
    this.#entries = this.#entries.filter(([key]) => key !== name.toLowerCase());
  }

  public set(name: string, value: string): void {
    this.delete(name);
    this.append(name, value);
  }

  public forEach(
    callbackfn: (value: string, key: string, parent: Headers) => void,
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    thisArg?: any,
  ): void {
    for (const [key, value] of this.entries()) {
      callbackfn.call(thisArg, value, key, this);
    }
  }

  public *keys(): IterableIterator<string> {
    const uniq = Array.from(new Set(this.#entries.map(([key]) => key))).sort();
    for (const name of uniq) yield name;
  }

  public *values(): IterableIterator<string> {
    for (const name of this.keys()) yield this.get(name);
  }

  public *entries(): IterableIterator<[string, string]> {
    for (const name of this.keys()) yield [name, this.get(name)];
  }

  [Symbol.iterator](): IterableIterator<[string, string]> {
    return this.entries();
  }
}

export class ReadonlyHeaders extends Headers {
  override set(): void {
    throw new TypeError(
      "Failed to execute 'set' on 'Headers': Headers are immutable",
    );
  }

  override append(): void {
    throw new TypeError(
      "Failed to execute 'append' on 'Headers': Headers are immutable",
    );
  }

  override delete(): void {
    throw new TypeError(
      "Failed to execute 'delete' on 'Headers': Headers are immutable",
    );
  }
}

export function fromIncomingHTTPHeaders<T extends IncomingHttpHeaders>(
  headers: T,
): ReadonlyHeaders {
  const entries: Array<[string, string]> = [];

  for (const [key, value] of Object.entries(headers)) {
    if (!value) continue;
    if (Array.isArray(value)) {
      value.forEach((h) => entries.push([key, h]));
    } else {
      entries.push([key, value]);
    }
  }

  return new ReadonlyHeaders(entries);
}
