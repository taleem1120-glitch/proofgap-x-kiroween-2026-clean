/**
 * Cite-local bounded shared-passage cue.
 * This intentionally lives inside the application boundary; it does not infer origin.
 */
const normalize = (value) => {
  if (typeof value !== 'string' || value.length > 200_000) return null;
  const tokens = value.normalize('NFKC').toLocaleLowerCase('und').match(/[\p{L}\p{M}\p{N}]+/gu) ?? [];
  return tokens.length >= 30 ? tokens : null;
};

export function detectSharedPassage(a, b, { minRunTokens = 60, maxCandidates = 2, maxComparisons = 1000 } = {}) {
  if (!Number.isInteger(minRunTokens) || minRunTokens < 30 || minRunTokens > 500 ||
      !Number.isInteger(maxCandidates) || maxCandidates < 1 || maxCandidates > 5 ||
      !Number.isInteger(maxComparisons) || maxComparisons < 1000 || maxComparisons > 1_000_000) {
    throw new RangeError('invalid passage detection bounds');
  }
  const A = normalize(a), B = normalize(b);
  if (!A || !B) return { review: false, incomplete: false, longestRunTokens: 0, basis: 'unsupported_or_short', candidates: [] };
  const width = Math.min(minRunTokens, 60), index = new Map();
  let indexTruncated = false;
  for (let i = 0; i + width <= A.length; i++) {
    const key = A.slice(i, i + width).join(' ');
    const positions = index.get(key);
    if (positions) { if (positions.length < 4) positions.push(i); else indexTruncated = true; }
    else index.set(key, [i]);
  }
  let longest = 0, work = 0, truncated = false;
  const candidates = [];
  for (let j = 0; j + width <= B.length; j++) {
    const positions = index.get(B.slice(j, j + width).join(' '));
    if (!positions) continue;
    for (const i of positions) {
      let left = 0, right = width;
      while (i-left-1 >= 0 && j-left-1 >= 0 && A[i-left-1] === B[j-left-1]) {
        if (++work > maxComparisons) { truncated = true; break; } left++;
      }
      if (truncated) break;
      while (i+right < A.length && j+right < B.length && A[i+right] === B[j+right]) {
        if (++work > maxComparisons) { truncated = true; break; } right++;
      }
      if (truncated) break;
      const n = left + right; longest = Math.max(longest, n);
      if (n >= minRunTokens && candidates.length < maxCandidates &&
          !candidates.some(x => x.startA === i-left && x.startB === j-left)) {
        candidates.push({ startA: i-left, startB: j-left, tokens: n });
      }
    }
    if (truncated) break;
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
