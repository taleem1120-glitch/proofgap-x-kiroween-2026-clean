import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { analyzeNote } from '../apps/proofgap-cite/src/index.js';

test('opt-in saved-text review abstains on long re-encoded shared passages without merging origins', () => {
  const dir = mkdtempSync(join(tmpdir(), 'proofgap-cite-text-review-'));
  try {
    const shared = Array.from({ length: 85 }, (_, i) => `distinctiveword${i}`).join(' ');
    writeFileSync(join(dir, 'a.txt'), `${shared} endingalpha`);
    writeFileSync(join(dir, 'b.txt'), `${shared} endingbeta`);
    const note = [
      '# Adversarial text review',
      '## Claims',
      '- Claim supported by two declared primary references [^a] [^b]',
      '## References',
      '[^a]: Independent outlet A {kind=primary, url=https://a.example/report, saved=a.txt}',
      '[^b]: Independent outlet B {kind=primary, url=https://b.example/report, saved=b.txt}',
      '',
    ].join('\n');

    const defaultReport = analyzeNote(note, { sourcesDir: dir, noteName: 'adversarial.md' });
    assert.equal(defaultReport.claims[0].decision, 'independently_corroborated');

    const reviewed = analyzeNote(note, {
      sourcesDir: dir,
      noteName: 'adversarial.md',
      reviewTextCopies: true,
    });
    assert.equal(reviewed.claims[0].decision, 'abstain_suspected_shared_origin');
    assert.ok(reviewed.claims[0].findings.some((f) => f.code === 'SHARED_PASSAGE_TEXT_OVERLAP'));
    assert.equal(reviewed.claims[0].citeEvidence.independentOrigins, 2,
      'text similarity is a review cue; it must not merge or rewrite declared lineage');
    assert.equal(reviewed.cite.textCopyReview.mode, 'local_saved_text_opt_in');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
