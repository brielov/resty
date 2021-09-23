import { StatusCodes, getReasonPhrase } from "http-status-codes";

export class HttpError extends Error {
  public readonly status: StatusCodes;
  public readonly errors: ReadonlyArray<unknown>;

  constructor(status: StatusCodes, errors: unknown[] = []) {
    super(getReasonPhrase(status));
    this.status = status;
    this.errors = errors;
  }
}
