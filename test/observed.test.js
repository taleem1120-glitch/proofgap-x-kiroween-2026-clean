// Phase 6: verified byte identity from locally hashed files (no declared hash needed).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync, symlinkSync, linkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { analyzeCase, validateCase, verifyEvidenceFiles, serializeReport } from '../src/index.js';
import { analyzeCase as analyzeV030 } from '../bench/legacy/v0.3.0/src/analyze.js';
import { genCase, clone, shuffleCase } from './gen.js';

const sha = (x) => createHash('sha256').update(x).digest('hex');
let dir;
before(() => {
  dir = mkdtempSync(join(tmpdir(), 'pgx-obs-'));
  const w = (n, c) => writeFileSync(join(dir, n), c);
  w('orig.txt', 'ATTACHMENT BYTES'); w('copy.txt', 'ATTACHMENT BYTES'); w('reenc.txt', 'ATTACHMENT BYTES\n');
  w('other.txt', 'UNRELATED RECORD'); w('empty1.txt', ''); w('empty2.txt', '');
  symlinkSync(join(dir, 'orig.txt'), join(dir, 'link.txt'));
  linkSync(join(dir, 'orig.txt'), join(dir, 'hard.txt'));
});
after(() => rmSync(dir, { recursive: true, force: true }));

const L = (strength = 0.7, stance = 'supports') => [{ claimId: 'c1', stance, strength }];
const mk = (evidence, sources = [{ id: 'a', name: 'Mail server' }, { id: 'b', name: 'Chat export' }, { id: 'c', name: 'Phone backup' }]) =>
  validateCase({ schemaVersion: '1.0', caseId: 'OBS', title: 't', sources, claims: [{ id: 'c1', statement: 's' }], evidence });
const E = (id, sourceId, file, extra = {}) => ({ id, sourceId, description: `item ${id}`, ...(file ? { file } : {}), links: L(), ...extra });
const run = (c, engine = analyzeCase) => engine(c, { integrity: verifyEvidenceFiles(c.evidence, { evidenceDir: dir }) });
const claim = (r) => r.claims[0];

test('D13 regression: byte-identical files under different sources, NO declared hashes -> one origin (0.3.0 counted two)', () => {
  const c = mk([E('e1', 'a', 'orig.txt'), E('e2', 'b', 'copy.txt')]);
  const now = claim(run(c)), was = claim(run(c, analyzeV030));
  assert.equal(was.independentSupportOrigins.length, 2, 'precondition: 0.3.0 reported false corroboration');
  assert.equal(was.status, 'supported_by_independent_origins');
  assert.equal(now.independentSupportOrigins.length, 1);
  assert.equal(now.status, 'insufficient_support');
  assert.equal(now.corroboration.falseCorroboration, true);
});

test('an observed hash never turns into VERIFIED status: nothing was declared, so nothing was verified', () => {
  const c = mk([E('e1', 'a', 'orig.txt'), E('e2', 'b', 'copy.txt')]);
  const r = run(c);
  for (const x of r.integrity.results) {
    assert.equal(x.status, 'NOT_CHECKED'); assert.equal(x.verified, false); assert.equal(x.reason, 'no_declared_hash');
    assert.equal(x.observedSha256, sha('ATTACHMENT BYTES'));
  }
  assert.equal(r.integrity.counts.VERIFIED, 0);
  assert.equal(r.trust.independentlyVerified.sha256Matches, 0);
  const edge = r.graph.edges.find((e) => e.relation === 'same_bytes');
  assert.deepEqual([edge.basis, edge.discoveredBy], ['verified', 'local_hashing']);
});

test('no evidence directory -> no hashing, no change: identical claim results to 0.3.0 on 120 generated cases', () => {
  for (let seed = 12000; seed < 12120; seed++) {
    const c = validateCase(genCase(seed));
    const strip = (r) => r.claims.map((x) => ({ s: x.status, d: x.decision, sup: x.independentSupportOrigins, con: x.independentContradictOrigins, sc: x.supportScore }));
    assert.deepEqual(strip(analyzeCase(clone(c))), strip(analyzeV030(clone(c))), `seed ${seed}`);
  }
});

test('re-encoded copy (one byte differs) is NOT linked: the tool reports no relationship it cannot verify', () => {
  const r = run(mk([E('e1', 'a', 'orig.txt'), E('e2', 'b', 'reenc.txt')]));
  assert.equal(claim(r).independentSupportOrigins.length, 2);
  assert.equal(r.graph.edges.filter((e) => e.relation === 'same_bytes').length, 0);
  assert.ok(r.graph.edges.some((e) => e.basis === 'unknown'), 'independence stays UNKNOWN, not verified');
});

test('empty files are hashed but never used to link artifacts', () => {
  const r = run(mk([E('e1', 'a', 'empty1.txt'), E('e2', 'b', 'empty2.txt')]));
  assert.ok(r.integrity.results.every((x) => x.observedEmpty === true));
  assert.equal(claim(r).independentSupportOrigins.length, 2);
  assert.equal(r.graph.basisCounts.verified, 0);
});

test('a symlink cannot create (or hide) a link: UNSAFE_PATH, no observed hash, relationship stays unknown', () => {
  const r = run(mk([E('e1', 'a', 'orig.txt'), E('e2', 'b', 'link.txt')]));
  const x = r.integrity.results.find((y) => y.evidenceId === 'e2');
  assert.deepEqual([x.status, x.observedSha256], ['UNSAFE_PATH', undefined]);
  assert.equal(claim(r).independentSupportOrigins.length, 2);
  assert.equal(r.graph.basisCounts.verified, 0);
});

test('a hard link IS the same file and is linked (documented behaviour)', () => {
  assert.equal(claim(run(mk([E('e1', 'a', 'orig.txt'), E('e2', 'b', 'hard.txt')]))).independentSupportOrigins.length, 1);
});

test('missing files and limit-skipped files produce no observed hash and no link', () => {
  const states = (r) => Object.fromEntries(r.integrity.results.map((x) => [x.evidenceId, [x.status, x.reason, Boolean(x.observedSha256)]]));
  const missing = run(mk([E('e1', 'a', 'orig.txt'), E('e2', 'b', 'absent.txt')]));
  assert.deepEqual(states(missing), { e1: ['NOT_CHECKED', 'no_declared_hash', true], e2: ['MISSING', 'file_not_found', false] });
  assert.equal(claim(missing).independentSupportOrigins.length, 2);
  // once the file-count limit is hit, the filesystem is not touched again (not even an existence check)
  const c = mk([E('e1', 'a', 'orig.txt'), E('e2', 'b', 'absent.txt'), E('e3', 'c', 'copy.txt')]);
  const r = analyzeCase(c, { integrity: verifyEvidenceFiles(c.evidence, { evidenceDir: dir, limits: { maxFiles: 1, maxFileBytes: 1e6, maxTotalBytes: 1e7, maxMillis: 1e4, maxPathLength: 255, maxPathDepth: 8 } }) });
  assert.deepEqual(states(r), { e1: ['NOT_CHECKED', 'no_declared_hash', true], e2: ['NOT_CHECKED', 'file_count_limit', false], e3: ['NOT_CHECKED', 'file_count_limit', false] });
  assert.equal(claim(r).independentSupportOrigins.length, 3, 'copy.txt was never read, so no link may be inferred');
});

test('manipulation: declaring a fake distinct hash for a byte-identical copy cannot split it into a second origin', () => {
  const c = mk([E('e1', 'a', 'orig.txt', { sha256: sha('ATTACHMENT BYTES') }), E('e2', 'b', 'copy.txt', { sha256: 'f'.repeat(64) })]);
  const r = run(c);
  assert.equal(r.integrity.results.find((x) => x.evidenceId === 'e2').status, 'MISMATCH');
  assert.deepEqual(r.excludedByIntegrity, ['e2']);
  assert.equal(claim(r).independentSupportOrigins.length, 1);
});

test('manipulation: declaring the SAME hash for different bytes cannot merge genuine origins (both checked, one mismatches)', () => {
  const c = mk([E('e1', 'a', 'orig.txt', { sha256: sha('ATTACHMENT BYTES') }), E('e2', 'b', 'other.txt', { sha256: sha('ATTACHMENT BYTES') }), E('e3', 'c', 'other.txt')]);
  const r = run(c);
  assert.equal(r.integrity.results.find((x) => x.evidenceId === 'e2').status, 'MISMATCH');
  // e3 (no declared hash, other.txt bytes) stays an independent origin from e1
  assert.equal(claim(r).independentSupportOrigins.length, 2);
});

test('observed byte link across different declared lineages still raises the SHARED_ARTIFACT warning; graph never marks lineage as verified', () => {
  const c = mk([E('e1', 'a', 'orig.txt'), E('e2', 'b', 'copy.txt'), E('e3', 'c', 'other.txt')]);
  const r = run(c);
  assert.ok(r.warnings.some((w) => w.code === 'SHARED_ARTIFACT_ACROSS_LINEAGES'));
  for (const e of r.graph.edges.filter((x) => x.basis === 'verified')) assert.equal(e.relation, 'same_bytes', 'only byte identity can be verified');
});

test('determinism with files: shuffled case yields an identical report (except input hash)', () => {
  const c = mk([E('e1', 'a', 'orig.txt'), E('e2', 'b', 'copy.txt'), E('e3', 'c', 'other.txt'), E('e4', 'a', 'reenc.txt')]);
  const a = JSON.parse(serializeReport(run(c))), b = JSON.parse(serializeReport(run(validateCase(shuffleCase(c, 3)))));
  delete a.inputSha256; delete b.inputSha256;
  assert.deepEqual(b, a);
});
