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
  ], { evidenceDir: dir });
  assert.deepEqual(r.documents.map(x => x.id), ['a']);
  assert.deepEqual(r.results.map(x => [x.id, x.status]), [
    ['a', 'READ'], ['binary', 'UNSUPPORTED'], ['escape', 'UNSAFE_PATH'],
    ['link', 'UNSAFE_PATH'], ['pdf', 'UNSUPPORTED'],
  ]);
  assert.equal(r.usage.filesRead, 1);
  assert.equal(r.usage.totalBytes, Buffer.byteLength(text));
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
  const report = analyzeNote(note, { sourcesDir: dir });
  assert.equal(report.claims[0].citeEvidence.independentOrigins, 2);
  assert.equal(report.claims[0].decision, 'abstain_suspected_shared_origin');
  assert.ok(report.claims[0].findings.some(x => x.code === 'SHARED_PASSAGE_TEXT_OVERLAP'));
  assert.equal(report.cite.textCopyReview.mode, 'local_saved_text_opt_in');
  assert.equal(report.cite.textCopyReview.results.filter(x => x.status === 'READ').length, 2);
});

test('text extraction is not run unless local source verification is explicitly requested', () => {
  const note = '# T\n## Claims\n- Claim [^a]\n## References\n[^a]: A {kind=primary, saved=first.txt}';
  const report = analyzeNote(note);
  assert.equal(report.cite.textCopyReview.mode, 'not_requested');
  assert.deepEqual(report.cite.textCopyReview.results, []);
});

test('invalid UTF-8 and unsupported formats are never silently decoded', () => {
  const r = extractTextEvidence([{ id: 'pdf', file: 'bad.pdf' }, { id: 'bin', file: 'binary.txt' }], { evidenceDir: dir });
  assert.deepEqual(r.results.map(x => x.status), ['UNSUPPORTED', 'UNSUPPORTED']);
});

test('cleanup', () => { rmSync(dir, { recursive: true, force: true }); });
