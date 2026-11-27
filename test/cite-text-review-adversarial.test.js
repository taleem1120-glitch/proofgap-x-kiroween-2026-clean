import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { analyzeNote, renderCiteHtml, serializeCiteReport } from '../apps/proofgap-cite/src/index.js';

const common = Array.from({ length: 72 }, (_, i) => `shared-origin-token-${String(i).padStart(3, '0')}`).join(' ');
const note = (a, b) => `# Synthetic adversarial note
## Claims
- A test claim [^a] [^b]
## References
[^a]: Independent climate dataset A {kind=primary, url=https://alpha.example/report, saved=a.txt}
[^b]: Independent transport archive B {kind=primary, url=https://bravo.example/archive, saved=b.txt}
`;
const withFiles = (a, b, options = {}) => {
  const dir = mkdtempSync(join(tmpdir(), 'proofgap-cite-adversarial-'));
  try {
    writeFileSync(join(dir, 'a.txt'), a);
    writeFileSync(join(dir, 'b.txt'), b);
    return analyzeNote(note(), { sourcesDir: dir, reviewTextCopies: true, noteName: 'adversarial.md', ...options });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
};

test('re-encoded shared passage abstains without merging separately declared origins', () => {
  const left = `Alpha dataset record. ${common} End of alpha record.`;
  const right = `Bravo archive record. ${common.toUpperCase().replaceAll(' ', '\u00a0')} End of bravo archive.`;
  const report = withFiles(left, right);
  const claim = report.claims[0];
  assert.equal(claim.citeEvidence.independentOrigins, 2, 'text similarity must not merge source roots');
  assert.equal(claim.decision, 'abstain_suspected_shared_origin');
  const overlap = claim.findings.find((f) => f.code === 'SHARED_PASSAGE_TEXT_OVERLAP' && f.basis === 'heuristic');
  assert.ok(overlap);
  assert.match(overlap.message, /normalized token offsets/u);
  assert.match(overlap.message, /passage coverage:/u);
  assert.match(overlap.message, /\d+\.\d+% of \[\^a\]/u);
  assert.match(overlap.message, /\d+\.\d+% of \[\^b\]/u);
  assert.equal(claim.sharedPassageReview.mode, 'local_saved_text_opt_in');
  assert.equal(claim.sharedPassageReview.status, 'review_required');
  assert.equal(claim.sharedPassageReview.pairsCompared, 1);
  assert.equal(claim.sharedPassageReview.cues.length, 1);
  assert.equal(claim.sharedPassageReview.cues[0].tokens, 291);
  assert.ok(claim.sharedPassageReview.cues[0].coverage.a > 0 && claim.sharedPassageReview.cues[0].coverage.b > 0);
  assert.ok(claim.sharedPassageReview.cues[0].offsets.a.endExclusive > claim.sharedPassageReview.cues[0].offsets.a.start);
  assert.match(claim.sharedPassageReview.caveat, /does not prove copying/u);
  const html = renderCiteHtml([serializeCiteReport(report)]);
  assert.match(html, /Removing any one primary-rooted origin leaves/u);
  assert.match(html, /passage coverage:/u);
  assert.match(html, /review cue only/u);
  assert.equal(report.cite.textCopyReview.results.every((r) => r.status === 'READ'), true);
});

test('short shared boilerplate does not trigger the 60-token shared-passage cue', () => {
  const template = Array.from({ length: 38 }, (_, i) => `standarddisclosuretoken${i}`).join(' ');
  const left = `Alpha unique observations ${template} Alpha conclusions and measurements.`;
  const right = `Bravo unrelated measurements ${template} Bravo separate conclusions and samples.`;
  const report = withFiles(left, right);
  assert.equal(report.claims[0].decision, 'independently_corroborated');
  assert.ok(!report.claims[0].findings.some((f) => f.code === 'SHARED_PASSAGE_TEXT_OVERLAP'));
  assert.equal(report.claims[0].sharedPassageReview.status, 'no_long_passage_detected');
});

test('paraphrased or translated copies remain an explicit detection limitation', () => {
  const left = 'The investigation confirmed that the northern facility stopped operating after the water supply was interrupted.';
  const right = 'Officials verified the plant ceased production following a disruption to its municipal water service.';
  const report = withFiles(left, right);
  assert.equal(report.claims[0].decision, 'independently_corroborated');
  assert.ok(!report.claims[0].findings.some((f) => f.code === 'SHARED_PASSAGE_TEXT_OVERLAP'));
});

test('missing saved text produces an incomplete-scan warning rather than a clean negative', () => {
  const dir = mkdtempSync(join(tmpdir(), 'proofgap-cite-missing-'));
  try {
    writeFileSync(join(dir, 'a.txt'), 'Alpha source document with some text.');
    const report = analyzeNote(note(), { sourcesDir: dir, reviewTextCopies: true, noteName: 'missing.md' });
    assert.equal(report.claims[0].decision, 'abstain_suspected_shared_origin');
    assert.ok(report.claims[0].findings.some((f) => f.code === 'SHARED_PASSAGE_SCAN_INCOMPLETE'));
    assert.equal(report.claims[0].sharedPassageReview.status, 'incomplete');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('long re-encoded saved copies trigger a review cue without merging declared origins', () => {
  const body = Array.from({ length: 24 }, (_, i) =>
    `The archived investigation record number ${i} documents the same independently reviewable observation and supporting measurements from the original report.`
  ).join(' ');
  const left = `Original publication. ${body} End of source A.`;
  const reencoded = body.replace('same independently reviewable observation', 'same independently documented observation');
  const right = `Reformatted repost. ${reencoded.toUpperCase().replaceAll(' ', '\u00a0')} End of source B.`;
  const report = withFiles(left, right);
  const claim = report.claims[0];
  assert.equal(claim.citeEvidence.independentOrigins, 2, 'saved-text similarity must not merge source roots');
  assert.equal(claim.decision, 'abstain_suspected_shared_origin');
  assert.ok(claim.findings.some((f) => f.code === 'NEAR_DUPLICATE_SAVED_TEXT_DIFFERENT_LINEAGE' && f.basis === 'heuristic'));
});

test('unrelated long saved documents do not trigger the saved-text near-duplicate cue', () => {
  const left = Array.from({ length: 30 }, (_, i) => `Alpha archival measurements and independent climate observations number ${i}.`).join(' ');
  const right = Array.from({ length: 30 }, (_, i) => `Bravo transport ledger and separate engineering inspections number ${i}.`).join(' ');
  const report = withFiles(left, right);
  assert.equal(report.claims[0].decision, 'independently_corroborated');
  assert.ok(!report.claims[0].findings.some((f) => f.code === 'NEAR_DUPLICATE_SAVED_TEXT_DIFFERENT_LINEAGE'));
});
