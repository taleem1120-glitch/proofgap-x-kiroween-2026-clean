import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const at = (...p) => join(root, ...p);

// Structural submission safeguards, NOT certification of Kiro use,
// eligibility, independent security review, or intellectual property.
test('Kiroween evidence files are present', () => {
  for (const path of [
    '.kiro/KIRO_USAGE.md',
    '.kiro/steering/proofgap-x.md',
    '.kiro/specs/proofgap-x/requirements.md',
    '.kiro/specs/proofgap-x/design.md',
    '.kiro/specs/proofgap-x/tasks.md',
    '.kiro/specs/proofgap-x/acceptance.md',
  ]) assert.ok(existsSync(at(path)), `Missing project evidence: ${path}`);
  const record = readFileSync(at('.kiro/KIRO_USAGE.md'), 'utf8');
  assert.match(record, /Kiro Web/);
  assert.match(record, /What was not done/);
});

test('Apache-2.0 license and NOTICE are packaged consistently', () => {
  const pkg = JSON.parse(readFileSync(at('package.json'), 'utf8'));
  assert.equal(pkg.license, 'Apache-2.0');
  assert.match(readFileSync(at('LICENSE'), 'utf8'), /Apache License/);
  assert.match(readFileSync(at('NOTICE'), 'utf8'), /ProofGap X/);
  assert.ok(pkg.files.includes('NOTICE'), 'NOTICE must be included in package');
});

test('proprietary sister-project names do not appear in runtime code', () => {
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, entry.name);
      if (entry.isDirectory()) walk(p);
      else if (entry.isFile() && /\.(?:js|mjs|html)$/.test(entry.name)) {
        assert.doesNotMatch(readFileSync(p, 'utf8'), /ATHARNEX|EvidenceForge[ -]?X/i, `${p}: proprietary-project reference`);
      }
    }
  };
  walk(at('src'));
  walk(at('apps'));
});
