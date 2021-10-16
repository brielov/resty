import { MockRequestOptions, Request as IncomingMessage } from "mock-http";

import { Request } from "../core";

export function build(options?: MockRequestOptions): Request<IncomingMessage> {
  const req = new IncomingMessage(options);
  return Request.from(req);
}
