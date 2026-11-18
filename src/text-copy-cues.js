/**
 * Optional text-copy resemblance signal. NOT a provenance verifier.
 * A high match means "review this pair", never "these files share an origin".
 * Text is supplied by a caller; this module does not open files or use network APIs.
 * Does not support images, PDF decoding, OCR or arbitrary binary content.
 */
export const RESEMBLANCE_POLICY = Object.freeze({
  minTokens: 30,
  maxChars: 200_000,
  shingleSize: 5,
  minJaccard: 0.88,
  minContainment: 0.94,
});

export function normalizeCopyText(value, policy = RESEMBLANCE_POLICY) {
  if (typeof value !== 'string' || value.length > policy.maxChars) return null;
  // Avoid inferring a match from short headlines or common legal boilerplate.
  const tokens = value.normalize('NFKC').toLocaleLowerCase('und')
    .match(/[\p{L}\p{M}\p{N}]+/gu) ?? [];
  if (tokens.length < policy.minTokens) return null;
  return tokens;
}

function shingles(tokens, width) {
  const result = new Set();
  for (let i = 0; i + width <= tokens.length; i++) {
    result.add(tokens.slice(i, i + width).join(' '));
  }
  return result;
}

/** { suspected, jaccard, containment, reason } is an advisory-only cue. */
export function compareTextCopies(a, b, policy = RESEMBLANCE_POLICY) {
  const ta = normalizeCopyText(a, policy), tb = normalizeCopyText(b, policy);
  if (!ta || !tb) return { suspected: false, jaccard: null, containment: null, reason: 'insufficient_or_unsupported_text' };
  const A = shingles(ta, policy.shingleSize), B = shingles(tb, policy.shingleSize);
  let overlap = 0;
  for (const shingle of A) if (B.has(shingle)) overlap++;
  const jaccard = overlap / (A.size + B.size - overlap);
  const containment = overlap / Math.min(A.size, B.size);
  // Both conditions limit false positives from a short shared disclaimer in unrelated articles.
  const suspected = jaccard >= policy.minJaccard && containment >= policy.minContainment;
  return { suspected, jaccard, containment, reason: suspected ? 'high_textual_overlap_review_origin' : 'not_enough_overlap' };
}

/**
 * Pairwise cue generation with explicit bounds. Does not consume or return raw text.
 * Refuses huge collections rather than creating a quadratic resource bomb.
 */
export function findSuspectedTextCopies(documents, policy = RESEMBLANCE_POLICY) {
  if (!Array.isArray(documents) || documents.length > 50) throw new RangeError('at most 50 text documents');
  // Advisory-only input cap limits total work, including rejected/unsupported documents.
  const ids = new Set();
  let totalChars = 0;
  const prepared = documents.map((doc) => {
    if (typeof doc?.id !== 'string' || !doc.id || typeof doc.text !== 'string')
      throw new TypeError('each document needs a nonempty string id and text');
    if (ids.has(doc.id)) throw new TypeError('document ids must be unique');
    ids.add(doc.id);
    totalChars += doc.text.length;
    if (totalChars > 2_000_000) throw new RangeError('total text exceeds 2000000 characters');
    const tokens = normalizeCopyText(doc.text, policy);
    return { id: doc.id, grams: tokens ? shingles(tokens, policy.shingleSize) : null };
  });
  const out = [];
  for (let i = 0; i < prepared.length; i++) {
    for (let j = i + 1; j < prepared.length; j++) {
      const a = prepared[i], b = prepared[j];
      if (!a.grams || !b.grams) continue;
      let overlap = 0;
      for (const gram of a.grams) if (b.grams.has(gram)) overlap++;
      const union = a.grams.size + b.grams.size - overlap;
      const jaccard = union ? overlap / union : 0;
      const containment = Math.min(a.grams.size, b.grams.size)
        ? overlap / Math.min(a.grams.size, b.grams.size) : 0;
      if (jaccard >= policy.minJaccard && containment >= policy.minContainment)
        out.push({ refs: [a.id, b.id].sort(), jaccard, containment, basis: 'heuristic_unverified' });
    }
  }
  return out.sort((x, y) => x.refs.join(':').localeCompare(y.refs.join(':')));
}

/**
 * Experimental partial-reuse discovery, separate from exact/near-copy scoring.
 * A contiguous 60-token passage in both documents triggers HUMAN REVIEW only.
 * This intentionally DOES NOT infer common origin: standard text, legal boilerplate,
 * public quotations or syndicated disclaimers can cause false alarms.
 * Complexity is linear in the number of tokens in each supported pair.
 */
export function detectSharedPassage(a, b, { minRunTokens = 60, maxCandidates = 2, maxComparisons = 100_000 } = {}) {
  if (!Number.isInteger(minRunTokens) || minRunTokens < 30 || minRunTokens > 500 ||
      !Number.isInteger(maxCandidates) || maxCandidates < 1 || maxCandidates > 5 ||
      !Number.isInteger(maxComparisons) || maxComparisons < 1000 || maxComparisons > 1_000_000)
    throw new RangeError('invalid passage detection bounds');
  const A = normalizeCopyText(a), B = normalizeCopyText(b);
  if (!A || !B) return { review: false, longestRunTokens: 0, basis: 'unsupported_or_short', candidates: [] };
  const width = Math.min(minRunTokens, 60);
  const aIndex = new Map();
  // Token-position index; bounded by the same 200k-character per-text input guard.
  for (let i = 0; i + width <= A.length; i++) {
    const key = A.slice(i, i + width).join(' ');
    const positions = aIndex.get(key);
    if (positions) { if (positions.length < 4) positions.push(i); }
    else aIndex.set(key, [i]);
  }
  let longest = 0;
  let work = 0;
  let truncated = false;
  const candidates = [];
  for (let j = 0; j + width <= B.length; j++) {
    const key = B.slice(j, j + width).join(' ');
    const positions = aIndex.get(key);
    if (!positions) continue;
    for (const i of positions) {
      let left = 0, right = width;
      while (i - left - 1 >= 0 && j - left - 1 >= 0 && A[i-left-1] === B[j-left-1]) {
        if (++work > maxComparisons) { truncated = true; break; }
        left++;
      }
      if (truncated) break;
      while (i + right < A.length && j + right < B.length && A[i+right] === B[j+right]) {
        if (++work > maxComparisons) { truncated = true; break; }
        right++;
      }
      if (truncated) break;
      const n = left + right;
      if (n > longest) longest = n;
      if (n >= minRunTokens && candidates.length < maxCandidates &&
          !candidates.some(x=>x.startA===i-left && x.startB===j-left))
        candidates.push({startA:i-left,startB:j-left,tokens:n});
    }
    if (truncated) break;
  }
  return {
    review: longest >= minRunTokens || truncated,
    incomplete: truncated,
    longestRunTokens: longest,
    basis: truncated ? 'comparison_budget_exceeded_manual_review' : (longest >= minRunTokens ? 'shared_passage_unverified_review_only' : 'no_long_shared_passage'),
    candidates
  };
}
