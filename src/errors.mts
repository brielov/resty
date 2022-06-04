import { Status, getReasonPhrase } from "./status.mjs";

export class HttpError extends Error {
  public constructor(public readonly status: Status, message?: string) {
    super(message || getReasonPhrase(status));
  }
}

export class BadRequestError extends HttpError {
  public constructor(message?: string) {
    super(Status.BadRequest, message);
  }
}

export class UnauthorizedError extends HttpError {
  public constructor(message?: string) {
    super(Status.Unauthorized, message);
  }
}

export class ForbiddenError extends HttpError {
  public constructor(message?: string) {
    super(Status.Forbidden, message);
  }
}

export class NotFoundError extends HttpError {
  public constructor(message?: string) {
    super(Status.NotFound, message);
  }
}
