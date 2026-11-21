import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findNearDuplicatePairs } from '../apps/proofgap-cite/src/text-similarity.js';

const base = ('The independent review records the same sequence of events and observations, ' +
  'including the original publication details and the evidence references for this report. ').repeat(4);

test('near-duplicate cue tolerates encoding and formatting changes without asserting identity', () => {
  const changed = base.replaceAll(' ', '\u00a0').replaceAll(',', ' —').replace('observations', 'observation');
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

test('supplementary-plane letters are compared as complete Unicode code points', () => {
  const base = ('𐐀vidence provenance records independent investigative observations and source lineage. ').repeat(4);
  const changed = base.replace('observations', 'observation');
  const out = findNearDuplicatePairs([{ id: 'astral-a', text: base }, { id: 'astral-b', text: changed }]);
  assert.equal(out.pairs.length, 1);
  assert.ok(out.pairs[0].similarity >= 0.88);
});

test('Arabic combining marks are retained during normalization', () => {
  const withFatha = ('مُرَاجَعَةُ الأَدِلَّةِ وَتَوْثِيقُ المَصْدَرِ وَسَلَامَةُ السِّجِلِّ. ').repeat(5);
  const withDamma = withFatha.replaceAll('َ', 'ُ');
  const out = findNearDuplicatePairs(
    [{ id: 'arabic-a', text: withFatha }, { id: 'arabic-b', text: withDamma }],
    { minSimilarity: 0.01, shingleWidth: 2 },
  );
  assert.equal(out.pairs.length, 1);
  assert.ok(out.pairs[0].similarity < 1);
});

test('preparation limits fail closed before partial scan', () => {
  const baseText = ('bounded resource preparation evidence references and observations ').repeat(30);
  assert.deepEqual(findNearDuplicatePairs([{ id: 'a', text: baseText }, { id: 'b', text: baseText }], { maxTotalCharacters: 100 }), { pairs: [], comparisons: 0, truncated: true });
  assert.deepEqual(findNearDuplicatePairs([{ id: 'a', text: baseText }, { id: 'b', text: baseText }], { maxPreparedShingles: 10 }), { pairs: [], comparisons: 0, truncated: true });
  assert.equal(findNearDuplicatePairs(Array.from({ length: 201 }, (_, i) => ({ id: String(i), text: baseText }))).truncated, true);
});


test('length pruning is correct regardless of input order', () => {
  const shorter = base + ' extra distinctive';
  const longer = 'prefix additions '.repeat(8) + base + ' suffix additions '.repeat(8);
  const forward = findNearDuplicatePairs([{ id: 'short', text: shorter }, { id: 'long', text: longer }]);
  const reverse = findNearDuplicatePairs([{ id: 'long', text: longer }, { id: 'short', text: shorter }]);
  assert.equal(forward.pairs.length, 1);
  assert.equal(reverse.pairs.length, 1);
  assert.equal(forward.pairs[0].similarity, reverse.pairs[0].similarity);
});