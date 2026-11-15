export function confusion(pairs) { // pairs: [{truth:boolean, pred:boolean}]
  const m = { tp: 0, fp: 0, tn: 0, fn: 0 };
  for (const { truth, pred } of pairs) m[truth ? (pred ? 'tp' : 'fn') : (pred ? 'fp' : 'tn')]++;
  return m;
}
/** Wilson score interval for a binomial proportion (z=1.96 -> ~95%). Returns [lo, hi] or null if n=0. */
export function wilson(k, n, z = 1.96) {
  if (n === 0) return null;
  const p = k / n, d = 1 + z * z / n;
  const centre = (p + z * z / (2 * n)) / d, half = (z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n))) / d;
  return [Math.max(0, centre - half), Math.min(1, centre + half)];
}
const ratio = (k, n) => ({ value: n === 0 ? null : k / n, k, n, ci95: wilson(k, n) });
export function summarize(m) {
  return {
    ...m,
    precision: ratio(m.tp, m.tp + m.fp),
    recall: ratio(m.tp, m.tp + m.fn),
    falsePositiveRate: ratio(m.fp, m.fp + m.tn), // = rate of FALSE CORROBORATION among truly uncorroborated claims
    accuracy: ratio(m.tp + m.tn, m.tp + m.fp + m.tn + m.fn),
  };
}
export const percentile = (xs, p) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.ceil(p * s.length) - 1)] : null; };
