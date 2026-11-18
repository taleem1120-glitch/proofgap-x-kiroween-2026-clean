import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findNearDuplicatePairs } from '../apps/proofgap-cite/src/text-similarity.js';

const base = ('The independent review records the same sequence of events and observations, ' +
  'including the original publication details and the evidence references for this report. ').repeat(4);

test('near-duplicate cue tolerates encoding and formatting changes without asserting identity', () => {
  const changed = base.replaceAll(' ', '\\u00a0').replaceAll(',', ' —').replace('observations', 'observation');
  const out = findNearDuplicatePairs([{ id: 'a', text: base }, { id: 'b', text: changed }]);
  assert.equal(out.pairs.length, 1);
  assert.ok(out.pairs[0].similarity >= 0.88);
});

test('short, unrelated and exact text do not produce near-duplicate pairs', () => {
  const out = findNearDuplicatePairs([
    { id: 'short', text: 'same short note' },
    { id: 'a', text: base },
    { id: 'b', text: base },
    { id: 'other', text: 'A completely unrelated description '.repeat(12) },
  ]);
  assert.equal(out.pairs.length, 0);
});

test('comparison and result budgets are enforced deterministically', () => {
  const items = Array.from({ length: 20 }, (_, i) => ({ id: String(i), text: base + ' variant ' + i }));
  const a = findNearDuplicatePairs(items, { maxComparisons: 3 });
  const b = findNearDuplicatePairs(items, { maxComparisons: 3 });
  assert.deepEqual(a, b);
  assert.equal(a.comparisons, 3);
  assert.equal(a.truncated, true);
});

test('invalid options and malformed items fail closed', () => {
  assert.throws(() => findNearDuplicatePairs(null), /array/);
  assert.throws(() => findNearDuplicatePairs([{ id: 1, text: 'x' }]), /string/);
  assert.throws(() => findNearDuplicatePairs([], { minSimilarity: 2 }), /options/);
});
