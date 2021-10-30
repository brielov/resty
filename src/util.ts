import type { Err } from "typed";

import { HttpError } from "./error";
import { HttpStatus } from "./status";

/**
 * Utility function to use with fold to throw a bad request error.
 */
export const foldBadRequest = (errors: Err[]): never => {
  throw new HttpError(HttpStatus.BAD_REQUEST, errors);
};

/**
 * Utility function which returns its first argument
 */
export const identity = <T>(x: T): T => x;
