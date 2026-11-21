import test from 'node:test';
import assert from 'node:assert/strict';
import { detectSharedPassage } from '../apps/proofgap-cite/src/shared-passage.js';

const block = Array.from({ length: 60 }, (_, i) => `repeatToken${i}`).join(' ');

test('repeated candidate index truncation is conservative and never silently negative', () => {
  const repeated = Array.from({ length: 5 }, () => block).join(' unrelated separator ');
  const result = detectSharedPassage(repeated, repeated);
  assert.equal(result.review, true);
  assert.equal(result.incomplete, true);
  assert.equal(result.basis, 'candidate_index_truncated_manual_review');
});

test('short inputs are reported as unsupported rather than a negative finding', () => {
  const short = Array.from({ length: 20 }, (_, i) => `shortToken${i}`).join(' ');
  const result = detectSharedPassage(short, short);
  assert.equal(result.review, false);
  assert.equal(result.incomplete, false);
  assert.equal(result.basis, 'unsupported_or_short');
  assert.deepEqual(result.candidates, []);
});
