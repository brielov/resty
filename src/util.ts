/**
 * Check if a value is a plain object.
 * @link https://github.com/ianstormtaylor/superstruct/blob/main/src/utils.ts
 */
export function isPlainObject(x: unknown): x is { [key: string]: any } {
  if (Object.prototype.toString.call(x) !== "[object Object]") {
    return false;
  }

  const prototype = Object.getPrototypeOf(x);
  return prototype === null || prototype === Object.prototype;
}
