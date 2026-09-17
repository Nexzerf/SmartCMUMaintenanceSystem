type Jsonify<T> = T extends Date
  ? string
  : T extends (infer U)[]
    ? Jsonify<U>[]
    : T extends object
      ? { [K in keyof T]: Jsonify<T[K]> }
      : T;

/** Convert server rows (with Date objects) into plain JSON for client components. */
export function serialize<T>(value: T): Jsonify<T> {
  return JSON.parse(JSON.stringify(value));
}
