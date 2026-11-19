/**
 * Cite-local bounded shared-passage cue.
 * Rolling dual hashes keep candidate indexing linear; candidate windows are
 * always token-verified before a passage is reported. This never infers origin.
 */
const normalize = (value) => {
  if (typeof value !== 'string' || value.length > 200_000) return null;
  const tokens = value.normalize('NFKC').toLocaleLowerCase('und').match(/[\\p{L}\\p{M}\\p{N}]+/gu) ?? [];
  return tokens.length >= 30 ? tokens : null;
};

const hashWindows = (tokens, ids, width) => {
  const a = new Uint32Array(tokens.length);
  for (let i = 0; i < tokens.length; i++) {
    let id = ids.get(tokens[i]);
    if (id === undefined) { id = ids.size + 1; ids.set(tokens[i], id); }
    a[i] = id;
  }
  const base1 = 65599, base2 = 131071;
  let pow1 = 1, pow2 = 1, h1 = 0, h2 = 0;
  for (let i = 1; i < width; i++) { pow1 = Math.imul(pow1, base1) >>> 0; pow2 = Math.imul(pow2, base2) >>> 0; }
  const keys = new Array(tokens.length - width + 1);
  for (let i = 0; i < width; i++) {
    h1 = (Math.imul(h1, base1) + a[i]) >>> 0;
    h2 = (Math.imul(h2, base2) + a[i]) >>> 0;
  }
  keys[0] = `${h1}:${h2}`;
  for (let i = 1; i < keys.length; i++) {
    h1 = (Math.imul((h1 - Math.imul(a[i - 1], pow1)) >>> 0, base1) + a[i + width - 1]) >>> 0;
    h2 = (Math.imul((h2 - Math.imul(a[i - 1], pow2)) >>> 0, base2) + a[i + width - 1]) >>> 0;
    keys[i] = `${h1}:${h2}`;
  }
  return { ids: a, keys };
};

export function detectSharedPassage(a, b, { minRunTokens = 60, maxCandidates = 2, maxComparisons = 1000 } = {}) {
  if (!Number.isInteger(minRunTokens) || minRunTokens < 30 || minRunTokens > 500 ||
      !Number.isInteger(maxCandidates) || maxCandidates < 1 || maxCandidates > 5 ||
      !Number.isInteger(maxComparisons) || maxComparisons < 1000 || maxComparisons > 1_000_000) {
    throw new RangeError('invalid passage detection bounds');
  }
  const A = normalize(a), B = normalize(b);
  if (!A || !B) return { review: false, incomplete: false, longestRunTokens: 0, basis: 'unsupported_or_short', candidates: [] };
  const width = Math.min(minRunTokens, 60), ids = new Map();
  const left = hashWindows(A, ids, width), right = hashWindows(B, ids, width);
  const index = new Map();
  let indexTruncated = false;
  for (let i = 0; i < left.keys.length; i++) {
    const key = left.keys[i], positions = index.get(key);
    if (positions) { if (positions.length < 4) positions.push(i); else indexTruncated = true; }
    else index.set(key, [i]);
  }
  let longest = 0, work = 0, truncated = false;
  const candidates = [];
  let coveredUntil = 0;
  outer: for (let j = 0; j < right.keys.length; j++) {
    if (j < coveredUntil) continue;
    const positions = index.get(right.keys[j]);
    if (!positions) continue;
    for (const i of positions) {
      // Hashes only shortlist candidates. Verify the entire window to rule out collisions.
      let equal = true;
      for (let k = 0; k < width; k++) {
        if (++work > maxComparisons) { truncated = true; break outer; }
        if (left.ids[i + k] !== right.ids[j + k]) { equal = false; break; }
      }
      if (!equal) continue;
      let startA = i, startB = j, endA = i + width, endB = j + width;
      while (startA > 0 && startB > 0) {
        if (++work > maxComparisons) { truncated = true; break outer; }
        if (left.ids[startA - 1] !== right.ids[startB - 1]) break;
        startA--; startB--;
      }
      while (endA < left.ids.length && endB < right.ids.length) {
        if (++work > maxComparisons) { truncated = true; break outer; }
        if (left.ids[endA] !== right.ids[endB]) break;
        endA++; endB++;
      }
      const n = endA - startA;
      longest = Math.max(longest, n);
      coveredUntil = Math.max(coveredUntil, endB - width + 1);
      if (n >= minRunTokens && candidates.length < maxCandidates &&
          !candidates.some(x => x.startA === startA && x.startB === startB)) {
        candidates.push({ startA, startB, tokens: n });
      }
    }
  }
  const incomplete = truncated || indexTruncated;
  return {
    review: longest >= minRunTokens || incomplete,
    incomplete,
    longestRunTokens: longest,
    basis: truncated ? 'comparison_budget_exceeded_manual_review' :
      indexTruncated ? 'candidate_index_truncated_manual_review' :
      longest >= minRunTokens ? 'shared_passage_unverified_review_only' : 'no_long_shared_passage',
    candidates,
  };
}
