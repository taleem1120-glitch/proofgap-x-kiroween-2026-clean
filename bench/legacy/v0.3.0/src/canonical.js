/** Deterministic JSON: sorted keys, no whitespace. */
export function canonicalize(v) {
  if (Array.isArray(v)) return `[${v.map(canonicalize).join(',')}]`;
  if (v && typeof v === 'object') {
    return `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${canonicalize(v[k])}`).join(',')}}`;
  }
  return JSON.stringify(v);
}
