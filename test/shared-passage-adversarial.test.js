import test from 'node:test';
import assert from 'node:assert/strict';
import { detectSharedPassage } from '../apps/proofgap-cite/src/shared-passage.js';

const passage = Array.from({ length: 72 }, (_, i) => `distinctive${i} evidence${i} phrase${i} token${i}`).join(' ');

test('punctuation and spacing normalization preserve a shared token passage', () => {
  const decorated = passage.replaceAll(' ', ' — ');
  const result = detectSharedPassage(passage, `independent opening. ${decorated} independent closing.`);
  assert.equal(result.review, true);
  assert.equal(result.incomplete, false);
  assert.ok(result.longestRunTokens >= 72);
});

test('NFKC compatibility normalization catches full-width Latin token variants', () => {
  const fullWidth = passage.replace('token0', 'ｔｏｋｅｎ０');
  const result = detectSharedPassage(passage, fullWidth);
  assert.equal(result.review, true);
  assert.ok(result.longestRunTokens >= 72);
});

test('reordered blocks still report only the contiguous shared block', () => {
  const blockA = Array.from({ length: 35 }, (_, i) => `alpha block item${i}`).join(' ');
  const blockB = Array.from({ length: 72 }, (_, i) => `beta block item${i}`).join(' ');
  const a = `${blockA} ${blockB}`;
  const b = `${blockB} ${blockA}`;
  const result = detectSharedPassage(a, b);
  assert.equal(result.review, true);
  assert.ok(result.longestRunTokens >= 72);
  assert.equal(result.incomplete, false);
});

test('a single changed token breaks an exactly-minimum passage below threshold', () => {
  const minimumPassage = Array.from({ length: 60 }, (_, i) => `minToken${i}`).join(' ');
  const changed = minimumPassage.replace('minToken30', 'changedToken30');
  const result = detectSharedPassage(minimumPassage, changed, { maxComparisons: 100_000 });
  assert.equal(result.review, false);
  assert.equal(result.incomplete, false);
  assert.equal(result.basis, 'no_long_shared_passage');
  assert.ok(result.longestRunTokens < 60);
});

test('invalid candidate and comparison bounds are rejected before processing', () => {
  assert.throws(() => detectSharedPassage(passage, passage, { maxCandidates: 6 }), RangeError);
  assert.throws(() => detectSharedPassage(passage, passage, { minRunTokens: 29 }), RangeError);
  assert.throws(() => detectSharedPassage(passage, passage, { maxComparisons: 999 }), RangeError);
});

test('tokenization overflow fails closed and requests manual review', () => {
  const huge = Array.from({ length: 20001 }, (_, i) => `token${i}`).join(' ');
  const result = detectSharedPassage(huge, passage);
  assert.equal(result.review, true);
  assert.equal(result.incomplete, true);
  assert.equal(result.basis, 'token_limit_exceeded_manual_review');
  assert.deepEqual(result.candidates, []);
});
