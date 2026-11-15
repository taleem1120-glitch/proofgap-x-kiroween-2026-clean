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
    .match(/[\\p{L}\\p{N}]+/gu) ?? [];
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
  const out = [];
  for (let i = 0; i < documents.length; i++) {
    const a = documents[i];
    if (typeof a?.id !== 'string' || typeof a?.text !== 'string') throw new TypeError('each document needs string id and text');
    for (let j = i + 1; j < documents.length; j++) {
      const b = documents[j];
      if (typeof b?.id !== 'string' || typeof b?.text !== 'string') throw new TypeError('each document needs string id and text');
      const cue = compareTextCopies(a.text, b.text, policy);
      if (cue.suspected) out.push({ refs: [a.id, b.id].sort(), jaccard: cue.jaccard, containment: cue.containment, basis: 'heuristic_unverified' });
    }
  }
  return out.sort((x, y) => x.refs.join(':').localeCompare(y.refs.join(':')));
}
