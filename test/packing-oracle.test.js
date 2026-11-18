// Independent oracle tests for the maximum pairwise-disjoint root-set packing.
// The oracle deliberately uses a separate exhaustive implementation for small inputs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { packOrigins, EXACT_LIMIT } from '../src/independence.js';

function oracleMax(items) {
  const sets = [...new Map(items.map((item) => [
    [...new Set(item.roots)].sort().join('+'),
    [...new Set(item.roots)],
  ])).values()];
  let best = 0;
  const visit = (index, used, count) => {
    if (count + sets.length - index <= best) return;
    if (index === sets.length) { best = Math.max(best, count); return; }
    visit(index + 1, used, count);
    const next = sets[index];
    if (next.every((root) => !used.has(root))) {
      const merged = new Set([...used, ...next]);
      visit(index + 1, merged, count + 1);
    }
  };
  visit(0, new Set(), 0);
  return best;
}

function seeded(seed) {
  let x = seed >>> 0;
  return () => {
    x = (Math.imul(x, 1664525) + 1013904223) >>> 0;
    return x / 0x100000000;
  };
}

function assertPairwiseDisjoint(labels) {
  const sets = labels.map((label) => new Set(label.split('+')));
  for (let i = 0; i < sets.length; i++) {
    for (let j = i + 1; j < sets.length; j++) {
      for (const root of sets[i]) assert.equal(sets[j].has(root), false, 'selected origins overlap');
    }
  }
}

test('packing matches an independent exhaustive oracle across deterministic small cases', () => {
  for (let seed = 1; seed <= 160; seed++) {
    const random = seeded(seed);
    const count = 2 + Math.floor(random() * 10);
    const items = [];
    for (let i = 0; i < count; i++) {
      const roots = [];
      for (let r = 0; r < 7; r++) if (random() < 0.27) roots.push('root-' + r);
      if (roots.length === 0) roots.push('root-' + Math.floor(random() * 7));
      items.push({ key: 'item-' + i, roots });
    }
    const result = packOrigins(items);
    assert.equal(result.approximate, false, 'small oracle case must be exact; seed=' + seed);
    assert.equal(result.origins.length, oracleMax(items), 'oracle mismatch; seed=' + seed);
    assertPairwiseDisjoint(result.origins);
  }
});

test('packing reports the documented approximation boundary and never selects overlapping origins', () => {
  const items = Array.from({ length: EXACT_LIMIT + 1 }, (_, i) => ({
    key: 'chain-' + i,
    roots: ['r-' + i, 'r-' + (i + 1)],
  }));
  const result = packOrigins(items);
  assert.equal(result.approximate, true);
  assert.ok(result.origins.length > 0);
  assertPairwiseDisjoint(result.origins);
});

test('packing rejects malformed root sets and invalid weight callback values', () => {
  assert.throws(() => packOrigins([{ key: 'x', roots: [] }]), /nonempty roots array/);
  assert.throws(() => packOrigins([{ key: 'x', roots: ['bad+root'] }]), /without \+/);
  assert.throws(() => packOrigins([{ key: 'x', roots: ['r'] }], () => NaN), /finite strength/);
});
