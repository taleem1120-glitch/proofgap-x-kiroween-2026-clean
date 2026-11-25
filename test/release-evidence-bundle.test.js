import test from 'node:test';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const builder = join(root, 'scripts', 'release-evidence-bundle.mjs');

test('release evidence bundle binds source archive and manifest with verifiable checksums', (t) => {
  const parent = mkdtempSync(join(tmpdir(), 'proofgap-release-evidence-'));
  const bundle = join(parent, 'bundle');
  t.after(() => rmSync(parent, { recursive: true, force: true }));

  const sha = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).stdout.trim();
  const evidence = [
    { name: 'CI', result: 'success', validatedCommit: sha, url: 'https://github.com/example/ci', runId: 101 },
    { name: 'Cross-browser compatibility and security audit', result: 'success', validatedCommit: sha, url: 'https://github.com/example/security', runId: 102 },
    { name: 'Regenerate ProofGap Cite showcase', result: 'success', validatedCommit: sha, url: 'https://github.com/example/showcase', runId: 103 }
  ];
  const built = spawnSync(process.execPath, [builder, bundle], {
    cwd: root, encoding: 'utf8',
    env: { ...process.env, PROOFGAP_AUTOMATED_EVIDENCE_JSON: JSON.stringify(evidence) }
  });
  assert.equal(built.status, 0, built.stderr || built.stdout);
  const manifest = JSON.parse(readFileSync(join(bundle, 'manifest.json'), 'utf8'));
  assert.equal(manifest.schema, 'proofgap-release-evidence/v1');
  assert.match(manifest.source.commit, /^[a-f0-9]{40}$/);
  assert.match(manifest.sourceArchiveSha256, /^[a-f0-9]{64}$/);
  assert.equal(manifest.independentAssurance.productionApproval, 'NO_GO');

  const verified = spawnSync(process.execPath, [builder, '--verify', bundle], { cwd: root, encoding: 'utf8' });
  assert.equal(verified.status, 0, verified.stderr || verified.stdout);
  assert.match(verified.stdout, /VERIFIED commit/);

  writeFileSync(join(bundle, 'source.tar'), Buffer.from('tampered'));
  const rejected = spawnSync(process.execPath, [builder, '--verify', bundle], { cwd: root, encoding: 'utf8' });
  assert.notEqual(rejected.status, 0);
  assert.match(rejected.stderr, /checksum mismatch/);
});

test('release bundle records only successful automated evidence for the exact source SHA', (t) => {
  const parent = mkdtempSync(join(tmpdir(), 'proofgap-release-evidence-bound-'));
  const bundle = join(parent, 'bundle');
  t.after(() => rmSync(parent, { recursive: true, force: true }));
  const sha = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).stdout.trim();
  const evidence = [
    { name: 'CI', result: 'success', validatedCommit: sha, url: 'https://github.com/example/ci', runId: 201 },
    { name: 'Cross-browser compatibility and security audit', result: 'success', validatedCommit: sha, url: 'https://github.com/example/security', runId: 202 },
    { name: 'Regenerate ProofGap Cite showcase', result: 'success', validatedCommit: sha, url: 'https://github.com/example/showcase', runId: 203 }
  ];
  const built = spawnSync(process.execPath, [builder, bundle], {
    cwd: root, encoding: 'utf8',
    env: { ...process.env, GITHUB_REF_NAME: 'release/test-candidate', PROOFGAP_AUTOMATED_EVIDENCE_JSON: JSON.stringify(evidence) }
  });
  assert.equal(built.status, 0, built.stderr || built.stdout);
  const manifest = JSON.parse(readFileSync(join(bundle, 'manifest.json'), 'utf8'));
  assert.equal(manifest.source.branch, 'release/test-candidate');
  assert.equal(manifest.automatedEvidence.length, 3);
  assert.ok(manifest.automatedEvidence.every((item) => item.validatedCommit === manifest.source.commit && item.result === 'success'));
  const verified = spawnSync(process.execPath, [builder, '--verify', bundle], { cwd: root, encoding: 'utf8' });
  assert.equal(verified.status, 0, verified.stderr || verified.stdout);
});

test('release bundle rejects automated evidence attributed to another commit', (t) => {
  const parent = mkdtempSync(join(tmpdir(), 'proofgap-release-evidence-wrong-sha-'));
  const bundle = join(parent, 'bundle');
  t.after(() => rmSync(parent, { recursive: true, force: true }));
  const evidence = [
    { name: 'CI', result: 'success', validatedCommit: 'dff236fb0c92207ba648357331ae4a8ce06d721b', url: 'https://github.com/example/ci', runId: 301 },
    { name: 'Cross-browser compatibility and security audit', result: 'success', validatedCommit: 'dff236fb0c92207ba648357331ae4a8ce06d721b', url: 'https://github.com/example/security', runId: 302 },
    { name: 'Regenerate ProofGap Cite showcase', result: 'success', validatedCommit: 'dff236fb0c92207ba648357331ae4a8ce06d721b', url: 'https://github.com/example/showcase', runId: 303 }
  ];
  const built = spawnSync(process.execPath, [builder, bundle], {
    cwd: root, encoding: 'utf8',
    env: { ...process.env, PROOFGAP_AUTOMATED_EVIDENCE_JSON: JSON.stringify(evidence) }
  });
  assert.notEqual(built.status, 0);
  assert.match(built.stderr, /exact source commit/);
});

test('standalone verifier rejects altered evidence even when checksums are recomputed', (t) => {
  const parent = mkdtempSync(join(tmpdir(), 'proofgap-release-evidence-altered-manifest-'));
  const bundle = join(parent, 'bundle');
  t.after(() => rmSync(parent, { recursive: true, force: true }));
  const sha = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).stdout.trim();
  const evidence = [
    { name: 'CI', result: 'success', validatedCommit: sha, url: 'https://github.com/example/ci', runId: 401 },
    { name: 'Cross-browser compatibility and security audit', result: 'success', validatedCommit: sha, url: 'https://github.com/example/security', runId: 402 },
    { name: 'Regenerate ProofGap Cite showcase', result: 'success', validatedCommit: sha, url: 'https://github.com/example/showcase', runId: 403 }
  ];
  const built = spawnSync(process.execPath, [builder, bundle], {
    cwd: root, encoding: 'utf8',
    env: { ...process.env, PROOFGAP_AUTOMATED_EVIDENCE_JSON: JSON.stringify(evidence) }
  });
  assert.equal(built.status, 0, built.stderr || built.stdout);
  const manifestPath = join(bundle, 'manifest.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  manifest.automatedEvidence = [];
  const manifestBytes = Buffer.from(JSON.stringify(manifest, null, 2) + '\n');
  writeFileSync(manifestPath, manifestBytes);
  const sourceHash = createHash('sha256').update(readFileSync(join(bundle, 'source.tar'))).digest('hex');
  const manifestHash = createHash('sha256').update(manifestBytes).digest('hex');
  writeFileSync(join(bundle, 'SHA256SUMS'), manifestHash + '  manifest.json\n' + sourceHash + '  source.tar\n');
  const rejected = spawnSync(process.execPath, [builder, '--verify', bundle], { cwd: root, encoding: 'utf8' });
  assert.notEqual(rejected.status, 0);
  assert.match(rejected.stderr, /missing required automated evidence/);
});
