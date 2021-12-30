import type { TypeAggregateErr } from "typed";

import { HttpError } from "./error";
import { HttpStatus } from "./status";

/**
 * Utility function to use with fold to throw a bad request error.
 */
export const throwBadRequest = (err: TypeAggregateErr): never => {
  throw new HttpError(
    HttpStatus.BAD_REQUEST,
    err.errors.map((err) => ({
      path: err.path,
      message: err.message,
    })),
  );
};

/**
 * Utility function which returns its first argument
 */
export const identity = <T>(x: T): T => x;
