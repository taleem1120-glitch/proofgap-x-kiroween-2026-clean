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
  // The 72-item beta block is 216 tokens; the separate alpha block is 105.
  // The detector must report the longest contiguous run, not combine both blocks.
  assert.equal(result.longestRunTokens, 216);
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

test('repetitive windows fail closed when the candidate index is truncated', () => {
  const repeated = Array.from({ length: 120 }, () => 'repeat').join(' ');
  const result = detectSharedPassage(repeated, repeated, { maxComparisons: 100_000 });
  assert.equal(result.review, true);
  assert.equal(result.incomplete, true);
  assert.equal(result.basis, 'candidate_index_truncated_manual_review');
});

test('comparison-budget exhaustion is reported as incomplete manual review', () => {
  const repeated = Array.from({ length: 1200 }, () => 'repeat').join(' ');
  const result = detectSharedPassage(repeated, repeated);
  assert.equal(result.review, true);
  assert.equal(result.incomplete, true);
  assert.equal(result.basis, 'comparison_budget_exceeded_manual_review');
});

test('invalid candidate and comparison bounds are rejected before processing', () => {
  assert.throws(() => detectSharedPassage(passage, passage, { maxCandidates: 6 }), RangeError);
  assert.throws(() => detectSharedPassage(passage, passage, { minRunTokens: 29 }), RangeError);
  assert.throws(() => detectSharedPassage(passage, passage, { maxComparisons: 999 }), RangeError);
});

test('overflow on either side takes precedence over short unsupported counterpart', () => {
  const huge = Array.from({ length: 20001 }, (_, i) => `x${i}`).join(' ');
  assert.ok(huge.length < 200_000);
  const result = detectSharedPassage(huge, 'short');
  assert.equal(result.review, true);
  assert.equal(result.incomplete, true);
  assert.equal(result.basis, 'token_limit_exceeded_manual_review');
  assert.deepEqual(result.candidates, []);
});

test('tokenization overflow fails closed and requests manual review', () => {
  // Keep input below the character cap so this exercises the token cap specifically.
  const huge = Array.from({ length: 20001 }, (_, i) => `x${i}`).join(' ');
  assert.ok(huge.length < 200_000);
  const result = detectSharedPassage(huge, passage);
  assert.equal(result.review, true);
  assert.equal(result.incomplete, true);
  assert.equal(result.basis, 'token_limit_exceeded_manual_review');
  assert.deepEqual(result.candidates, []);
});
