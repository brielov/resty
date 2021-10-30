import { MockRequestOptions, Request as IncomingMessage } from "mock-http";

import { Request } from "../request";

export function build(options?: MockRequestOptions): Request {
  const req = new IncomingMessage(options);
  return Request.from(req);
}
