import test from 'node:test';
import assert from 'node:assert/strict';
import { detectSharedPassage } from '../apps/proofgap-cite/src/shared-passage.js';

const passage = Array.from({ length: 72 }, (_, i) => `distinctive source phrase token${i}`).join(' ');

test('rolling-hash candidates are verified and locate a long contiguous shared passage', () => {
  const result = detectSharedPassage(passage, `independent preface  ${passage} independent ending`);
  assert.equal(result.review, true);
  assert.equal(result.incomplete, false);
  assert.equal(result.basis, 'shared_passage_unverified_review_only');
  assert.ok(result.longestRunTokens >= 72);
  assert.equal(result.candidates[0].startA, 0);
  assert.equal(result.candidates[0].startB, 2);
});

test('Arabic combining marks remain part of token identity', () => {
  const arabic = Array.from({ length: 65 }, (_, i) => `مُستندٌ رقميٌّ دليلٌ رقم${i}`).join(' ');
  const result = detectSharedPassage(arabic, `مقدمة مستقلة ${arabic} خاتمة مستقلة`);
  assert.equal(result.review, true);
  assert.equal(result.incomplete, false);
  assert.ok(result.longestRunTokens >= 65);
});

test('short common boilerplate does not become a long-passage finding', () => {
  const boilerplate = 'according to the report the committee said';
  const a = `${boilerplate} ${Array.from({ length: 65 }, (_, i) => `unique alpha${i}`).join(' ')}`;
  const b = `${boilerplate} ${Array.from({ length: 65 }, (_, i) => `unique beta${i}`).join(' ')}`;
  const result = detectSharedPassage(a, b);
  assert.equal(result.review, false);
  assert.equal(result.incomplete, false);
  assert.equal(result.basis, 'no_long_shared_passage');
});

test('comparison work budget counts verified window tokens and fails closed', () => {
  const repeated = Array.from({ length: 20 }, () => passage).join(' ');
  const result = detectSharedPassage(repeated, repeated, { maxComparisons: 1000 });
  assert.equal(result.review, true);
  assert.equal(result.incomplete, true);
  assert.equal(result.basis, 'comparison_budget_exceeded_manual_review');
});

test('invalid bounds are rejected', () => {
  assert.throws(() => detectSharedPassage(passage, passage, { maxComparisons: 999 }), RangeError);
});
