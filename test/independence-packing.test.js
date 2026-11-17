import { test } from 'node:test';
import assert from 'node:assert/strict';
import { packOrigins, EXACT_LIMIT } from '../src/independence.js';

function bruteMaximum(items) {
  const unique = [...new Map(items.map((x) => [[...new Set(x.roots)].sort().join('+'), [...new Set(x.roots)]] )).values()];
  let best = 0;
  for (let mask = 0; mask < (1 << unique.length); mask++) {
    let count = 0, used = new Set(), valid = true;
    for (let i = 0; i < unique.length && valid; i++) if (mask & (1 << i)) {
      for (const root of unique[i]) if (used.has(root)) { valid = false; break; }
      if (valid) { count++; for (const root of unique[i]) used.add(root); }
    }
    if (valid && count > best) best = count;
  }
  return best;
}

test('optimized exact packing matches exhaustive reference across deterministic overlap families', () => {
  let seed = 0x51f15e;
  const rnd = (n) => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed % n; };
  for (let sample = 0; sample < 160; sample++) {
    const items = [];
    const count = 3 + rnd(8);
    for (let i = 0; i < count; i++) {
      const roots = [];
      for (let r = 0; r < 6; r++) if (rnd(4) === 0) roots.push('r' + r);
      if (!roots.length) roots.push('r' + rnd(6));
      items.push({ key: 'e' + i, roots });
    }
    const actual = packOrigins(items);
    assert.equal(actual.approximate, false);
    assert.equal(actual.origins.length, bruteMaximum(items), 'sample ' + sample);
  }
});

test('exact packing handles a maximum-size connected 22-cycle with the known optimum', () => {
  assert.equal(EXACT_LIMIT, 22);
  const items = Array.from({ length: EXACT_LIMIT }, (_, i) => ({
    key: 'cycle-' + i,
    roots: ['r' + i, 'r' + ((i + 1) % EXACT_LIMIT)],
  }));
  const result = packOrigins(items);
  assert.equal(result.approximate, false);
  assert.equal(result.origins.length, 11);
});

test('components beyond the exact limit remain explicitly approximate', () => {
  const items = Array.from({ length: EXACT_LIMIT + 1 }, (_, i) => ({
    key: 'path-' + i,
    roots: ['r' + i, 'r' + (i + 1)],
  }));
  const result = packOrigins(items);
  assert.equal(result.approximate, true);
  assert.ok(result.origins.length <= EXACT_LIMIT + 1);
});
