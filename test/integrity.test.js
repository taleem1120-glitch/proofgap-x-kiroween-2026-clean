import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, mkdirSync, symlinkSync, rmSync, linkSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { verifyEvidenceFiles, integrityNotRequested, checkRelativePath, analyzeCase, validateCase, INTEGRITY_STATES, IntegrityConfigError, DEFAULT_INTEGRITY_LIMITS, validateSchema } from '../src/index.js';
import { base } from './helpers.js';

const sha = (s) => createHash('sha256').update(s).digest('hex');
let root, outside;
before(() => {
  root = mkdtempSync(join(tmpdir(), 'pgx-ev-')); outside = mkdtempSync(join(tmpdir(), 'pgx-out-'));
  writeFileSync(join(root, 'good.txt'), 'hello'); writeFileSync(join(root, 'changed.txt'), 'tampered');
  mkdirSync(join(root, 'sub')); writeFileSync(join(root, 'sub', 'n.txt'), 'nested');
  writeFileSync(join(outside, 'secret.txt'), 'SECRET-OUTSIDE');
  symlinkSync(join(outside, 'secret.txt'), join(root, 'link-file.txt'));
  symlinkSync(outside, join(root, 'link-dir'));
  symlinkSync(join(root, 'good.txt'), join(root, 'link-inside.txt'));
  symlinkSync(join(root, 'nope-target'), join(root, 'dangling.txt'));
  mkdirSync(join(root, 'adir'));
});
after(() => { rmSync(root, { recursive: true, force: true }); rmSync(outside, { recursive: true, force: true }); });

const ev = (id, file, hash, extra = {}) => ({ id, sourceId: 's1', description: `d-${id}`, ...(file !== undefined ? { file } : {}), ...(hash ? { sha256: hash } : {}), links: [], ...extra });
const verify = (evidence, limits) => verifyEvidenceFiles(evidence, { evidenceDir: root, limits: limits && { ...DEFAULT_INTEGRITY_LIMITS, ...limits } });
const st = (res, id) => res.results.find((r) => r.evidenceId === id);

test('exactly five distinct states exist', () => assert.deepEqual([...INTEGRITY_STATES], ['VERIFIED', 'MISMATCH', 'MISSING', 'UNSAFE_PATH', 'NOT_CHECKED']));

test('VERIFIED / MISMATCH / MISSING / NOT_CHECKED are produced correctly', () => {
  const r = verify([ev('a', 'good.txt', sha('hello')), ev('b', 'changed.txt', sha('original')), ev('c', 'absent.txt', sha('x')), ev('d', 'sub/n.txt', sha('nested')),
    ev('e', 'good.txt'), ev('f', undefined, sha('x'))]);
  assert.equal(st(r, 'a').status, 'VERIFIED'); assert.equal(st(r, 'a').verified, true);
  assert.equal(st(r, 'b').status, 'MISMATCH'); assert.equal(st(r, 'b').verified, false); assert.equal(st(r, 'b').computedSha256, sha('tampered'));
  assert.equal(st(r, 'c').status, 'MISSING');
  assert.equal(st(r, 'd').status, 'VERIFIED');
  assert.deepEqual([st(r, 'e').status, st(r, 'e').reason], ['NOT_CHECKED', 'no_declared_hash']);
  assert.deepEqual([st(r, 'f').status, st(r, 'f').reason], ['NOT_CHECKED', 'no_file_declared']);
  assert.deepEqual(r.counts, { VERIFIED: 2, MISMATCH: 1, MISSING: 1, UNSAFE_PATH: 0, NOT_CHECKED: 2 });
});

test('unverified hashes are never presented as verified when verification was not requested', () => {
  const r = integrityNotRequested([ev('a', 'good.txt', sha('hello')), ev('b')]);
  assert.equal(r.mode, 'not_requested');
  for (const x of r.results) { assert.equal(x.status, 'NOT_CHECKED'); assert.equal(x.verified, false); }
  assert.equal(st(r, 'a').reason, 'verification_not_requested');
});

test('UNSAFE_PATH: traversal, absolute, backslash, dot segments, odd characters, depth, length', () => {
  const bad = ['../secret.txt', 'sub/../../x', '/etc/passwd', '\\windows\\x', 'a\\b', './good.txt', 'sub//n.txt', 'sub/', 'good.txt/', '..', '.', 'a b.txt', 'é.txt', 'x:y', '%2e%2e/x', 'a/b/c/d/e/f/g/h/i.txt', 'a'.repeat(256)];
  const r = verify(bad.map((p, i) => ev(`u${i}`, p, sha('x'))));
  r.results.forEach((x, i) => assert.equal(x.status, 'UNSAFE_PATH', `${JSON.stringify(bad[i])} -> ${x.status}`));
  assert.equal(checkRelativePath('sub/n.txt'), null);
  assert.equal(checkRelativePath(5), 'empty_or_non_string_path');
});

test('UNSAFE_PATH: symlinks to outside, to inside, to directories, dangling, and symlinked intermediate dirs', () => {
  const r = verify([ev('l1', 'link-file.txt', sha('SECRET-OUTSIDE')), ev('l2', 'link-inside.txt', sha('hello')), ev('l3', 'link-dir/secret.txt', sha('SECRET-OUTSIDE')), ev('l4', 'dangling.txt', sha('x')), ev('l5', 'link-dir', sha('x'))]);
  for (const id of ['l1', 'l2', 'l3', 'l4', 'l5']) assert.equal(st(r, id).status, 'UNSAFE_PATH', id);
  assert.equal(st(r, 'l1').reason, 'symlink'); assert.equal(st(r, 'l3').reason, 'symlink');
  // the outside file's bytes must never be hashed/echoed
  // declaredSha256 is the case author's own value and is echoed; what must never appear is a hash COMPUTED from the outside file
  assert.ok(r.results.every((x) => x.computedSha256 === undefined), 'outside/symlinked file must not be hashed');
  assert.ok(!JSON.stringify(r).includes('SECRET-OUTSIDE'));
  assert.equal(r.usage.filesRead, 0, 'no file should have been opened for these unsafe paths');
});

test('UNSAFE_PATH: directories and non-regular files are not read', () => {
  const r = verify([ev('d1', 'adir', sha('x')), ev('d2', 'sub', sha('x')), ev('d3', 'good.txt/child', sha('x'))]);
  assert.equal(st(r, 'd1').reason, 'not_a_regular_file'); assert.equal(st(r, 'd2').status, 'UNSAFE_PATH'); assert.equal(st(r, 'd3').reason, 'not_a_directory');
  const fifo = join(root, 'pipe');
  if (spawnSync('mkfifo', [fifo]).status === 0) {
    const t0 = Date.now(); const x = verify([ev('p', 'pipe', sha('x'))]);
    assert.equal(st(x, 'p').status, 'UNSAFE_PATH'); assert.ok(Date.now() - t0 < 2000, 'FIFO must not hang');
  } else assert.fail('mkfifo unavailable: FIFO case NOT TESTED');
});

test('limits: file count, per-file size, total bytes produce NOT_CHECKED with a reason (never VERIFIED)', () => {
  const many = ['good.txt', 'changed.txt', 'sub/n.txt'].map((f, i) => ev(`m${i}`, f, sha('zzz')));
  let r = verify(many, { maxFiles: 2 });
  assert.deepEqual(r.results.map((x) => x.reason ?? x.status), ['sha256_differs', 'sha256_differs', 'file_count_limit']);
  assert.equal(st(r, 'm2').status, 'NOT_CHECKED');
  r = verify([ev('s', 'good.txt', sha('hello'))], { maxFileBytes: 4 }); assert.deepEqual([st(r, 's').status, st(r, 's').reason], ['NOT_CHECKED', 'file_size_limit']);
  r = verify([ev('t1', 'good.txt', sha('hello')), ev('t2', 'changed.txt', sha('tampered'))], { maxTotalBytes: 10 });
  assert.equal(st(r, 't1').status, 'VERIFIED'); assert.deepEqual([st(r, 't2').status, st(r, 't2').reason], ['NOT_CHECKED', 'total_bytes_limit']);
  let tick = 0; r = verifyEvidenceFiles([ev('x1', 'good.txt', sha('hello')), ev('x2', 'changed.txt', sha('tampered'))], { evidenceDir: root, limits: { ...DEFAULT_INTEGRITY_LIMITS, maxMillis: 5 }, now: () => (tick += 10) });
  assert.ok(r.results.every((x) => x.status === 'NOT_CHECKED' && x.reason === 'time_limit'));
});

test('a file cited by several evidence items is read once (count/bytes limits not double-spent)', () => {
  const r = verify([ev('a', 'good.txt', sha('hello')), ev('b', 'good.txt', sha('hello')), ev('c', 'good.txt', sha('other'))], { maxFiles: 1 });
  assert.deepEqual(r.results.map((x) => x.status), ['VERIFIED', 'VERIFIED', 'MISMATCH']); assert.equal(r.usage.filesRead, 1);
});

test('a large file within limits is hashed in chunks correctly; one over the limit is not read to completion', () => {
  const big = Buffer.alloc(5 * 1024 * 1024 + 123, 7); writeFileSync(join(root, 'big.bin'), big);
  assert.equal(st(verify([ev('b', 'big.bin', sha(big))]), 'b').status, 'VERIFIED');
  assert.equal(st(verify([ev('b', 'big.bin', sha(big))], { maxFileBytes: 1024 }), 'b').reason, 'file_size_limit');
});

test('bad configuration fails loudly; reports never contain the absolute evidence directory', () => {
  for (const d of [undefined, '', join(root, 'nope'), join(root, 'good.txt')]) assert.throws(() => verifyEvidenceFiles([], { evidenceDir: d }), IntegrityConfigError);
  const r = verify([ev('a', 'good.txt', sha('hello')), ev('b', 'link-file.txt', sha('x')), ev('c', 'absent', sha('x'))]);
  assert.ok(!JSON.stringify(r).includes(root) && !JSON.stringify(r).includes(outside));
});

test('hard links are a documented limitation: a hard link inside the directory IS a regular file and is hashed (NOT prevented)', () => {
  linkSync(join(outside, 'secret.txt'), join(root, 'hard.txt'));
  assert.equal(st(verify([ev('h', 'hard.txt', sha('SECRET-OUTSIDE'))]), 'h').status, 'VERIFIED');
});

test('integration: MISMATCH excludes evidence from scoring; other states do not change scoring; results deterministic', () => {
  const c = base(); c.sources = [{ id: 's1', name: 'a' }, { id: 's2', name: 'b' }];
  c.evidence = [
    { id: 'e1', sourceId: 's1', description: 'one', file: 'good.txt', sha256: sha('hello'), links: [{ claimId: 'c1', stance: 'supports', strength: 0.6 }] },
    { id: 'e2', sourceId: 's2', description: 'two', file: 'changed.txt', sha256: sha('original'), links: [{ claimId: 'c1', stance: 'supports', strength: 0.6 }] },
  ];
  validateCase(c);
  const plain = analyzeCase(c);
  assert.equal(plain.claims[0].status, 'supported_by_independent_origins');
  assert.ok(plain.claims[0].findings.some((f) => f.code === 'INTEGRITY_UNVERIFIED'));
  const integ = verifyEvidenceFiles(c.evidence, { evidenceDir: root });
  const rep = analyzeCase(c, { integrity: integ });
  assert.deepEqual(rep.excludedByIntegrity, ['e2']);
  assert.equal(rep.claims[0].status, 'insufficient_support');
  assert.ok(rep.claims[0].findings.some((f) => f.code === 'INTEGRITY_MISMATCH'));
  assert.deepEqual(analyzeCase(c, { integrity: verifyEvidenceFiles(c.evidence, { evidenceDir: root }) }), rep);
  // MISSING keeps evidence in scoring but never as verified
  const c2 = JSON.parse(JSON.stringify(c)); c2.evidence[1].file = 'absent.txt';
  const rep2 = analyzeCase(c2, { integrity: verifyEvidenceFiles(c2.evidence, { evidenceDir: root }) });
  assert.equal(rep2.claims[0].status, 'supported_by_independent_origins');
  assert.ok(rep2.claims[0].findings.some((f) => f.code === 'INTEGRITY_UNAVAILABLE'));
  assert.match(rep2.claims[0].assumptions.join(' '), /1 of 2 supporting evidence item\(s\) have a declared SHA-256 VERIFIED/);
});

test('schema: `file` is optional text; control chars rejected; unsafe-but-printable paths are accepted by schema so integrity can report UNSAFE_PATH', () => {
  const c = base(); c.evidence = [{ id: 'e1', sourceId: 's1', description: 'd', file: '../../etc/passwd', links: [] }];
  assert.deepEqual(validateSchema(c), []);
  c.evidence[0].file = 'a\u0000b'; assert.ok(validateSchema(c).some((i) => i.path === '$.evidence[0].file'));
  c.evidence[0].file = 'x'.repeat(256); assert.ok(validateSchema(c).some((i) => i.path === '$.evidence[0].file'));
});

const CLI = fileURLToPath(new URL('../src/cli.js', import.meta.url));
const cli = (...a) => spawnSync(process.execPath, [CLI, ...a], { encoding: 'utf8', timeout: 20000 });

test('CLI: --evidence-dir verification, --format text, bad dir exits 1, usage errors exit 2', () => {
  const caseFile = join(outside, 'case.json');
  const c = base(); c.evidence = [{ id: 'e1', sourceId: 's1', description: 'one', file: 'good.txt', sha256: sha('hello'), links: [{ claimId: 'c1', stance: 'supports', strength: 0.5 }] }];
  writeFileSync(caseFile, JSON.stringify(c));
  let r = cli(caseFile, '--evidence-dir', root); assert.equal(r.status, 0); assert.equal(JSON.parse(r.stdout).integrity.counts.VERIFIED, 1);
  r = cli(caseFile, '--evidence-dir', root, '--format', 'text'); assert.equal(r.status, 0); assert.match(r.stdout, /e1: VERIFIED/);
  r = cli(caseFile, '--format', 'text'); assert.match(r.stdout, /NOT REQUESTED \(declared hashes are UNVERIFIED\)/);
  r = cli(caseFile, '--evidence-dir', join(root, 'nope')); assert.equal(r.status, 1); assert.doesNotMatch(r.stderr, /\n\s+at /);
  for (const a of [[caseFile, '--format', 'xml'], [caseFile, '--evidence-dir'], [caseFile, '--evidence-dir', 'a', '--evidence-dir', 'b'], [caseFile, '--bogus', 'x']]) assert.equal(cli(...a).status, 2, JSON.stringify(a));
  assert.equal(readFileSync(caseFile, 'utf8'), JSON.stringify(c));
});
