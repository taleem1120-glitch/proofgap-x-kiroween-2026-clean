import test from 'node:test';
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

  const built = spawnSync(process.execPath, [builder, bundle], { cwd: root, encoding: 'utf8' });
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
