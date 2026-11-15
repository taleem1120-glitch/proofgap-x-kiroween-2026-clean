import test from 'node:test';
import assert from 'node:assert/strict';
import { compareTextCopies, findSuspectedTextCopies, normalizeCopyText } from '../src/text-copy-cues.js';

const base = Array.from({length: 55}, (_, i) => `investigation report token${i} corroboration reference`).join(' ');
test('near-copy cue catches identical and re-encoded punctuation/spacing only as heuristic', () => {
  const copy = base.replaceAll(' ', '  ').replaceAll('report', 'REPORT') + '   editor note';
  const result = compareTextCopies(base, copy);
  assert.equal(result.suspected, true);
  assert.equal(result.reason, 'high_textual_overlap_review_origin');
  assert.ok(result.jaccard < 1);
  assert.equal(findSuspectedTextCopies([{id:'left',text:base},{id:'right',text:copy}])[0].basis, 'heuristic_unverified');
});
test('independent texts and short templates are not judged copies', () => {
  const unrelated = Array.from({length:55},(_,i)=>`different dataset${i} climate station`).join(' ');
  assert.equal(compareTextCopies(base, unrelated).suspected, false);
  assert.equal(compareTextCopies('five words only', 'five words only').reason, 'insufficient_or_unsupported_text');
});
test('no claim of detection for different bytes without enough textual overlap', () => {
  const changed = base.split(' ').reverse().join(' ');
  assert.equal(compareTextCopies(base, changed).suspected, false);
});
test('unicode NFKC and Arabic tokenization work', () => {
  const arabic = Array.from({length:40},(_,i)=>`المصدر التحقيقي رقم${i} وثيقة أصلية`).join(' ');
  assert.ok(normalizeCopyText(arabic).length >= 30);
  assert.equal(compareTextCopies(arabic, arabic).suspected,true);
});
test('reject large collections and oversized input rather than score misleading matches', () => {
  assert.throws(()=>findSuspectedTextCopies(Array.from({length:51},(_,i)=>({id:String(i),text:base}))),RangeError);
  assert.equal(compareTextCopies('x'.repeat(200001),base).reason,'insufficient_or_unsupported_text');
});
