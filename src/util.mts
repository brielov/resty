/**
 * Like `Object.fromEntries` but with better TypeScript inference.
 */
export function fromEntries<K extends string | number, V>(
  entries: Array<[K, V]>
): { [key in K]: V } {
  return Object.fromEntries(entries) as { [key in K]: V };
}
