import { HttpStatus, getReasonPhrase } from "./status";

export class HttpError extends Error {
  public readonly status: HttpStatus;
  public readonly errors: ReadonlyArray<unknown>;

  constructor(status: HttpStatus, errors: unknown[] = []) {
    super(getReasonPhrase(status));
    this.status = status;
    this.errors = errors;
  }
}
