import test from 'node:test';
import assert from 'node:assert/strict';
import { detectSharedPassage } from '../src/text-copy-cues.js';

const seed = Array.from({ length: 60 }, (_, i) => `unique passage token${i} evidence`).join(' ');

test('a verified long contiguous match is a human-review cue, not an origin verdict', () => {
  const result = detectSharedPassage(seed, `opening context ${seed} closing context`);
  assert.equal(result.review, true);
  assert.equal(result.incomplete, false);
  assert.equal(result.basis, 'shared_passage_unverified_review_only');
  assert.ok(result.longestRunTokens >= 60);
  assert.equal('sameOrigin' in result, false);
});

test('truncated repetitive-seed index forces review and discloses incomplete coverage', () => {
  const repeated = Array.from({ length: 6 }, () => seed).join(' ');
  const unrelated = Array.from({ length: 60 }, (_, i) => `unrelated review token${i} distinct`).join(' ');
  const result = detectSharedPassage(repeated, unrelated);
  assert.equal(result.review, true);
  assert.equal(result.incomplete, true);
  assert.equal(result.basis, 'candidate_index_truncated_manual_review');
});

test('comparison budget exhaustion forces review and discloses incomplete coverage', () => {
  const long = Array.from({ length: 20 }, () => seed).join(' ');
  const result = detectSharedPassage(long, long, { maxComparisons: 1000 });
  assert.equal(result.review, true);
  assert.equal(result.incomplete, true);
  assert.equal(result.basis, 'comparison_budget_exceeded_manual_review');
});

test('short or unsupported text abstains without implying independent origins', () => {
  const result = detectSharedPassage('short note', 'short note');
  assert.equal(result.review, false);
  assert.equal(result.incomplete, false);
  assert.equal(result.basis, 'unsupported_or_short');
});

test('invalid bounds are rejected', () => {
  assert.throws(() => detectSharedPassage(seed, seed, { minRunTokens: 10 }), RangeError);
});
