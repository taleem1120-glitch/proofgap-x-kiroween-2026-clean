import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { analyzeText } from '../src/index.js';

const url = (p) => new URL(p, import.meta.url);
const text = readFileSync(url('../examples/demo/case.json'), 'utf8');
const evDir = new URL('../examples/demo/evidence', import.meta.url).pathname;
const get = (r, id) => r.claims.find((c) => c.claimId === id);

test('demo without verification: 4 items look like corroboration but are ONE declared origin', () => {
  const r = JSON.parse(analyzeText(text));
  const c1 = get(r, 'c1');
  assert.equal(c1.corroboration.supportingEvidenceItems, 4);
  assert.equal(c1.corroboration.independentSupportOrigins, 1);
  assert.equal(c1.corroboration.falseCorroboration, true);
  assert.equal(c1.status, 'conflicting'); // audit trail contradicts
  assert.equal(get(r, 'c2').status, 'supported_by_independent_origins');
  assert.equal(r.integrity.mode, 'not_requested');
  assert.ok(r.integrity.results.every((x) => !x.verified));
});

test('demo with verification: exact integrity states, MISMATCH excluded from scoring', () => {
  const r = JSON.parse(analyzeText(text, undefined, { evidenceDir: evDir }));
  const st = Object.fromEntries(r.integrity.results.map((x) => [x.evidenceId, x.status]));
  assert.deepEqual(st, { e1: 'VERIFIED', e2: 'MISMATCH', e3: 'VERIFIED', e4: 'MISSING', e5: 'VERIFIED', e6: 'VERIFIED', e7: 'VERIFIED', e8: 'NOT_CHECKED' });
  assert.deepEqual(r.excludedByIntegrity, ['e2']);
  assert.equal(get(r, 'c1').corroboration.supportingEvidenceItems, 3);
  assert.equal(get(r, 'c1').corroboration.independentSupportOrigins, 1);
  assert.ok(!JSON.stringify(r).includes(evDir));
});

test('demo output is byte-reproducible', () => {
  assert.equal(analyzeText(text, undefined, { evidenceDir: evDir }), analyzeText(text, undefined, { evidenceDir: evDir }));
});
