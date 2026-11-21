/**
 * Bounded, conservative near-duplicate text cue.
 *
 * This is a REVIEW SIGNAL only. It never merges artifacts, source roots, or scores.
 * NFKC + case/punctuation/whitespace folding + Unicode code-point shingles tolerates
 * small formatting/encoding changes, but cannot establish copying, authorship, or lineage.
 * Combining marks are retained: in scripts such as Arabic they can be semantically significant.
 */
const fold = (value) => Array.from(
  String(value).normalize('NFKC').toLowerCase()
    .replace(/[^\p{L}\p{N}\p{M}]+/gu, ''),
);

function shingles(value, width) {
  const out = new Set();
  if (value.length < width) return out;
  for (let i = 0; i <= value.length - width; i++) {
    out.add(value.slice(i, i + width).join(''));
  }
  return out;
}

function jaccard(a, b) {
  let intersection = 0;
  const [small, large] = a.size <= b.size ? [a, b] : [b, a];
  for (const x of small) if (large.has(x)) intersection++;
  const union = a.size + b.size - intersection;
  return union ? intersection / union : 0;
}

/**
 * Find bounded near-duplicate pairs in deterministic order.
 * Items: [{ id, text }]. Returns { pairs, comparisons, truncated }.
 * Preparation limits are independent of pair-comparison limits.
 */
export function findNearDuplicatePairs(items, {
  minLength = 120, minSimilarity = 0.88, shingleWidth = 5,
  maxComparisons = 25000, maxResults = 100,
  maxItems = 200, maxTextLength = 4000,
  maxTotalCharacters = 200000, maxPreparedShingles = 200000,
} = {}) {
  if (!Array.isArray(items)) throw new TypeError('items must be an array');
  if (!Number.isInteger(minLength) || minLength < 1 ||
      !Number.isFinite(minSimilarity) || minSimilarity <= 0 || minSimilarity > 1 ||
      !Number.isInteger(shingleWidth) || shingleWidth < 2 ||
      !Number.isInteger(maxComparisons) || maxComparisons < 1 ||
      !Number.isInteger(maxResults) || maxResults < 1 ||
      !Number.isInteger(maxItems) || maxItems < 1 ||
      !Number.isInteger(maxTextLength) || maxTextLength < 1 ||
      !Number.isInteger(maxTotalCharacters) || maxTotalCharacters < 1 ||
      !Number.isInteger(maxPreparedShingles) || maxPreparedShingles < 1) {
    throw new TypeError('invalid near-duplicate options');
  }

  let truncated = items.length > maxItems;
  let totalCharacters = 0;
  let preparedShingles = 0;
  let preparedShingleUpperBound = 0;
  const prepared = [];
  const boundedItems = items.slice(0, maxItems);

  for (const item of boundedItems) {
    if (!item || typeof item.id !== 'string' || typeof item.text !== 'string') {
      throw new TypeError('each item needs string id and text');
    }
    if (item.id.length > 256) throw new TypeError('item id exceeds limit');
    const raw = item.text.length > maxTextLength ? item.text.slice(0, maxTextLength) : item.text;
    if (raw.length !== item.text.length) truncated = true;
    totalCharacters += raw.length;
    if (totalCharacters > maxTotalCharacters) {
      return { pairs: [], comparisons: 0, truncated: true };
    }
    const text = fold(raw);
    let grams = null;
    if (text.length >= minLength) {
      // Preflight the worst-case shingle count before allocating the Set.
      const shingleUpperBound = text.length - shingleWidth + 1;
      if (preparedShingleUpperBound + shingleUpperBound > maxPreparedShingles) {
        // Discard partial preparation so no partial scan can look complete.
        return { pairs: [], comparisons: 0, truncated: true };
      }
      preparedShingleUpperBound += shingleUpperBound;
      grams = shingles(text, shingleWidth);
      preparedShingles += grams.size;
    }
    prepared.push({ id: item.id, text, grams });
  }

  const candidates = prepared.filter((x) => x.grams && x.grams.size > 0)
    .sort((a, b) => a.text.length - b.text.length || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  const pairs = [];
  let comparisons = 0;
  outer: for (let i = 0; i < candidates.length; i++) {
    const a = candidates[i];
    for (let j = i + 1; j < candidates.length; j++) {
      const b = candidates[j];
      if (b.text.length > a.text.length / minSimilarity) break;
      if (a.id === b.id || a.text.join('') === b.text.join('')) continue;
      if (comparisons >= maxComparisons) { truncated = true; break outer; }
      comparisons++;
      const ratio = a.text.length / b.text.length;
      if (ratio < minSimilarity) continue;
      const similarity = jaccard(a.grams, b.grams);
      if (similarity >= minSimilarity) {
        pairs.push({ left: a.id, right: b.id, similarity: Math.round(similarity * 10000) / 10000 });
        if (pairs.length >= maxResults) { truncated = true; break outer; }
      }
    }
  }
  return { pairs, comparisons, truncated };
}
