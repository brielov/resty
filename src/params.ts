import { NextApiRequest } from "next";
import { URLSearchParams } from "url";

export class Params extends URLSearchParams {
  public static from(query: NextApiRequest["query"]): Params {
    const params = new this();

    for (const [key, value] of Object.entries(query)) {
      if (Array.isArray(value)) {
        value.forEach((v) => params.append(key, v));
      } else {
        params.append(key, value);
      }
    }

    return params;
  }
}
