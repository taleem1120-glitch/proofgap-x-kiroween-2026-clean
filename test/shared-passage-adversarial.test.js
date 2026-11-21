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

test('a single changed token breaks a passage below the minimum run threshold', () => {
  const changed = passage.replace('token35', 'replacement35');
  const result = detectSharedPassage(passage, changed);
  assert.equal(result.review, false);
  assert.equal(result.incomplete, false);
  assert.equal(result.basis, 'no_long_shared_passage');
});

test('invalid candidate and comparison bounds are rejected before processing', () => {
  assert.throws(() => detectSharedPassage(passage, passage, { maxCandidates: 6 }), RangeError);
  assert.throws(() => detectSharedPassage(passage, passage, { minRunTokens: 29 }), RangeError);
  assert.throws(() => detectSharedPassage(passage, passage, { maxComparisons: 999 }), RangeError);
});
