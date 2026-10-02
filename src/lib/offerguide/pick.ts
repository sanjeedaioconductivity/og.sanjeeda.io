/** Picks only the keys present (not undefined) in body, restricted to an allowed field list. */
export function pickDefined(
  body: Record<string, unknown>,
  keys: readonly string[]
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of keys) {
    if (body[key] !== undefined) out[key] = body[key];
  }
  return out;
}
