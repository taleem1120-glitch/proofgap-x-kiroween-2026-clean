import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, symlinkSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { extractTextEvidence } from '../apps/proofgap-cite/src/text-evidence.js';
import { analyzeNote } from '../apps/proofgap-cite/src/index.js';

let dir;
test('bounded UTF-8 extraction reads only supported regular files beneath evidence root', () => {
  dir = mkdtempSync(join(tmpdir(), 'pgx-text-'));
  const text = Array.from({ length: 70 }, (_, i) => `distinctive evidence passage token${i}`).join(' ');
  writeFileSync(join(dir, 'a.txt'), text);
  writeFileSync(join(dir, 'bad.pdf'), text);
  writeFileSync(join(dir, 'binary.txt'), Buffer.from([0xff, 0xfe, 0xfd]));
  symlinkSync(join(dir, 'a.txt'), join(dir, 'link.txt'));
  const r = extractTextEvidence([
    { id: 'a', file: 'a.txt' }, { id: 'pdf', file: 'bad.pdf' },
    { id: 'binary', file: 'binary.txt' }, { id: 'link', file: 'link.txt' },
    { id: 'escape', file: '../outside.txt' },
    { id: 'windows_escape', file: 'folder\\\\..\\\\outside.txt' },
  ], { evidenceDir: dir });
  assert.deepEqual(r.documents.map(x => x.id), ['a']);
  assert.deepEqual(r.results.map(x => [x.id, x.status]), [
    ['a', 'READ'], ['binary', 'UNSUPPORTED'], ['escape', 'UNSAFE_PATH'],
    ['link', 'UNSAFE_PATH'], ['pdf', 'UNSUPPORTED'], ['windows_escape', 'UNSAFE_PATH'],
  ]);
  assert.equal(r.usage.filesRead, 2); // both regular files were physically read; one failed UTF-8 decoding
  assert.equal(r.usage.totalBytes, Buffer.byteLength(text) + 3); // includes the physically read invalid UTF-8 bytes
});

test('shared saved passage creates a human-review finding and Cite abstains, without merging origins', () => {
  const a = Array.from({ length: 70 }, (_, i) => `distinctive evidence passage token${i}`).join(' ');
  const b = `independent opening words ${a} independent closing words`;
  writeFileSync(join(dir, 'first.txt'), a);
  writeFileSync(join(dir, 'second.txt'), b);
  const note = [
    '# Passage test', '## Claims', '- Claim supported by both [^a] [^b]',
    '## References',
    '[^a]: First report {kind=primary, saved=first.txt}',
    '[^b]: Second report {kind=primary, saved=second.txt}',
  ].join('\n');
  const report = analyzeNote(note, { sourcesDir: dir, reviewTextCopies: true });
  assert.equal(report.claims[0].citeEvidence.independentOrigins, 2);
  assert.equal(report.claims[0].decision, 'abstain_suspected_shared_origin');
  assert.ok(report.claims[0].findings.some(x => x.code === 'SHARED_PASSAGE_TEXT_OVERLAP'));
  assert.equal(report.cite.textCopyReview.mode, 'local_saved_text_opt_in');
  assert.equal(report.cite.textCopyReview.results.filter(x => x.status === 'READ').length, 2);
});

test('per-pair shared-passage comparison exhaustion is surfaced and abstains', () => {
  const passage = Array.from({ length: 1400 }, (_, i) => `long shared evidence token${i}`).join(' ');
  writeFileSync(join(dir, 'long-a.txt'), passage);
  writeFileSync(join(dir, 'long-b.txt'), `opening ${passage} closing`);
  const note = ['# Comparison budget', '## Claims', '- Claim supported by [^a] [^b]', '## References',
    '[^a]: First {kind=primary, saved=long-a.txt}',
    '[^b]: Second {kind=primary, saved=long-b.txt}'].join('\n');
  const report = analyzeNote(note, { sourcesDir: dir, reviewTextCopies: true });
  assert.equal(report.claims[0].decision, 'abstain_suspected_shared_origin');
  assert.ok(report.claims[0].findings.some(x => x.code === 'SHARED_PASSAGE_SCAN_INCOMPLETE' && /comparison_budget_exceeded_manual_review/.test(x.message)));
});
test('shared-passage pair budget is explicit and fails closed for larger citation sets', () => {
  const passage = Array.from({ length: 65 }, (_, i) => `distinctive shared passage token${i}`).join(' ');
  const refs = Array.from({ length: 12 }, (_, i) => {
    const id = `r${i}`, file = `budget-${i}.txt`;
    writeFileSync(join(dir, file), `unique document ${i} prefix ${passage} unique document ${i} suffix`);
    return `[^${id}]: Report ${i} {kind=primary, saved=${file}}`;
  });
  const note = ['# Pair budget', '## Claims', `- Claim supported by ${Array.from({ length: 12 }, (_, i) => `[^r${i}]`).join(' ')}`, '## References', ...refs].join('\n');
  const report = analyzeNote(note, { sourcesDir: dir, reviewTextCopies: true });
  assert.equal(report.claims[0].decision, 'abstain_suspected_shared_origin');
  assert.ok(report.claims[0].findings.some(x => x.code === 'SHARED_PASSAGE_SCAN_INCOMPLETE' && /pair budget/.test(x.message)));
});
test('text extraction is not run unless local source verification is explicitly requested', () => {
  const note = '# T\n## Claims\n- Claim [^a]\n## References\n[^a]: A {kind=primary, saved=first.txt}';
  const report = analyzeNote(note, { reviewTextCopies: true });
  assert.equal(report.cite.textCopyReview.mode, 'not_requested');
  assert.deepEqual(report.cite.textCopyReview.results, []);
});

test('malformed evidence entries and unknown extraction limits fail safely', () => {
  const r = extractTextEvidence([null, { id: 7, file: 'a.txt' }, { id: 'ok', file: 'a.txt' }], { evidenceDir: dir });
  assert.deepEqual(r.results.map(x => [x.id, x.status]), [[null, 'UNSUPPORTED'], [null, 'UNSUPPORTED'], ['ok', 'READ']]);
  assert.throws(() => extractTextEvidence([], { evidenceDir: dir, limits: { maxFiles: 1, surprise: 2 } }), RangeError);
});

test('invalid UTF-8 and unsupported formats are never silently decoded', () => {
  const r = extractTextEvidence([{ id: 'pdf', file: 'bad.pdf' }, { id: 'bin', file: 'binary.txt' }], { evidenceDir: dir });
  assert.deepEqual(r.results.map(x => x.status), ['UNSUPPORTED', 'UNSUPPORTED']);
});

test('failed saved-text extraction forces review-only abstention rather than silently clearing overlap risk', () => {
  const note = ['# Missing text review', '## Claims', '- Claim supported by [^a] [^b] [^missing]', '## References',
    '[^a]: First {kind=primary, saved=first.txt}',
    '[^b]: Second {kind=primary, saved=second.txt}',
    '[^missing]: Third {kind=primary, saved=missing.txt}'].join('\\n');
  const report = analyzeNote(note, { sourcesDir: dir, reviewTextCopies: true });
  assert.equal(report.claims[0].decision, 'abstain_suspected_shared_origin');
  assert.ok(report.claims[0].findings.some(x => x.code === 'SHARED_PASSAGE_SCAN_INCOMPLETE' && /missing/.test(x.message)));
});
\ntest('cleanup', () => { rmSync(dir, { recursive: true, force: true }); });
