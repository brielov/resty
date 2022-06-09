export const METHODS = [
  "CONNECT",
  "DELETE",
  "GET",
  "HEAD",
  "OPTIONS",
  "PATCH",
  "POST",
  "PUT",
  "TRACE",
] as const;

export type Method = typeof METHODS[number];

/**
 * A TypeScript guard for HTTP allowed methods.
 */
export function isHttpMethod(input: unknown): input is Method {
  return METHODS.includes(input as Method);
}
