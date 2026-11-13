import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseCaseText, validateCase, analyzeCase, serializeReport, analyzeText, CaseValidationError, DEFAULT_LIMITS } from '../src/index.js';
import { base, ev } from './helpers.js';

const status = (c, id = 'c1') => analyzeCase(validateCase(c)).claims.find((x) => x.claimId === id);
const issues = (fn) => { try { fn(); } catch (e) { assert.ok(e instanceof CaseValidationError); return e.issues; } assert.fail('expected validation error'); };

test('single source gives insufficient support', () => {
  const c = base(); c.evidence = [ev('e1', 's1')];
  assert.equal(status(c).status, 'insufficient_support');
});

test('two independent sources are supported', () => {
  const c = base(); c.evidence = [ev('e1', 's1', 'supports', 0.5), ev('e2', 's2', 'supports', 0.5)];
  const r = status(c);
  assert.equal(r.status, 'supported_by_independent_origins');
  assert.equal(r.supportScore, 0.75);
});

test('duplicate evidence by hash is excluded and flagged', () => {
  const h = 'a'.repeat(64);
  const c = base(); c.evidence = [ev('e1', 's1', 'supports', 0.5, { sha256: h }), ev('e2', 's2', 'supports', 0.5, { sha256: h })];
  const rep = analyzeCase(validateCase(c));
  assert.deepEqual(rep.duplicates, [{ evidenceId: 'e2', duplicateOf: 'e1', basis: 'sha256' }]);
  assert.equal(rep.claims[0].status, 'insufficient_support');
  assert.equal(rep.summary.effectiveEvidence, 1);
});

test('duplicate by source+description is flagged', () => {
  const c = base(); c.evidence = [ev('e1', 's1'), { ...ev('e2', 's1'), description: ' D-E1 ' }];
  assert.equal(analyzeCase(validateCase(c)).duplicates.length, 1);
});

test('derived source does not add independence', () => {
  const c = base(); c.sources.push({ id: 's3', name: 'copy', derivedFrom: ['s1'] });
  c.evidence = [ev('e1', 's1'), ev('e2', 's3')];
  const r = status(c);
  assert.equal(r.status, 'insufficient_support');
  assert.equal(r.independentSupportOrigins.length, 1);
});

test('transitive derivation and shared originGroup collapse origins', () => {
  const c = base();
  c.sources = [{ id: 's1', name: 'a' }, { id: 's2', name: 'b', derivedFrom: ['s1'] }, { id: 's3', name: 'c', derivedFrom: ['s2'] },
    { id: 's4', name: 'd', originGroup: 'g' }, { id: 's5', name: 'e', originGroup: 'g' }];
  c.evidence = [ev('e1', 's1'), ev('e2', 's3'), ev('e3', 's4'), ev('e4', 's5')];
  assert.equal(status(c).independentSupportOrigins.length, 2);
});

test('conflicting claims are flagged', () => {
  const c = base(); c.evidence = [ev('e1', 's1', 'supports'), ev('e2', 's2', 'contradicts')];
  assert.equal(status(c).status, 'conflicting');
});

test('contradicted-only and no-evidence statuses', () => {
  const c = base(); c.evidence = [ev('e1', 's1', 'contradicts')];
  assert.equal(status(c).status, 'contradicted');
  assert.equal(status(base()).status, 'no_evidence');
});

test('explanations avoid guilt / authenticity verdicts', () => {
  const c = base(); c.evidence = [ev('e1', 's1'), ev('e2', 's2')];
  const text = serializeReport(analyzeCase(validateCase(c)));
  assert.match(text, /not a finding of authenticity or guilt/);
  assert.doesNotMatch(text, /"(guilty|authentic|forensically verified)"/i);
});

test('malformed inputs are rejected', () => {
  assert.throws(() => parseCaseText('{not json'), CaseValidationError);
  assert.throws(() => parseCaseText('[]'), CaseValidationError);
  assert.throws(() => parseCaseText(42), CaseValidationError);
  const c = base(); c.schemaVersion = '2'; c.evidence = [{ id: 'e1', sourceId: 'nope', description: 'x', links: [{ claimId: 'zz', stance: 'maybe', strength: 3 }] }];
  const msgs = issues(() => validateCase(c)).map((i) => i.path);
  for (const p of ['$.schemaVersion', '$.evidence[0].sourceId', '$.evidence[0].links[0].claimId', '$.evidence[0].links[0].stance', '$.evidence[0].links[0].strength']) assert.ok(msgs.includes(p), p);
});

test('duplicate ids, bad ids, control chars, NaN-like strength rejected', () => {
  const c = base(); c.sources.push({ id: 's1', name: 'dup' }); c.claims[0].statement = 'a\u0000b';
  c.evidence = [ev('bad id!', 's1', 'supports', 0.5)];
  const p = issues(() => validateCase(c)).map((i) => i.path);
  assert.ok(p.includes('$.sources[2].id') && p.includes('$.claims[0].statement') && p.includes('$.evidence[0].id'));
});

test('forbidden keys (prototype pollution) rejected', () => {
  const t = JSON.stringify(base()).replace('"title"', '"__proto__":{"x":1},"title"');
  assert.ok(issues(() => parseCaseText(t)).some((i) => i.message === 'forbidden key'));
  assert.equal({}.x, undefined);
});

test('derivation cycles rejected', () => {
  const c = base(); c.sources = [{ id: 's1', name: 'a', derivedFrom: ['s2'] }, { id: 's2', name: 'b', derivedFrom: ['s1'] }];
  assert.ok(issues(() => validateCase(c)).some((i) => /cycle/.test(i.message)));
});

test('limit: input bytes', () => {
  assert.ok(issues(() => parseCaseText(' '.repeat(DEFAULT_LIMITS.maxBytes + 1))).some((i) => /exceeds/.test(i.message)));
});

test('limit: item counts, string length, derivation depth', () => {
  const lim = { ...DEFAULT_LIMITS, maxEvidence: 2, maxStringLength: 10, maxDerivationDepth: 2 };
  const c = base(); c.evidence = [ev('e1', 's1'), ev('e2', 's1'), ev('e3', 's1')];
  assert.ok(issues(() => validateCase(c, lim)).some((i) => i.path === '$.evidence'));
  const c2 = base(); c2.title = 'x'.repeat(11);
  assert.ok(issues(() => validateCase(c2, lim)).some((i) => i.path === '$.title'));
  const c3 = base(); c3.sources = [1, 2, 3, 4].map((n) => ({ id: `d${n}`, name: 'n', ...(n > 1 ? { derivedFrom: [`d${n - 1}`] } : {}) }));
  assert.ok(issues(() => validateCase(c3, lim)).some((i) => /depth/.test(i.message)));
});

test('limit: issue list is capped', () => {
  const c = base(); c.evidence = Array.from({ length: 300 }, () => ({}));
  assert.ok(issues(() => validateCase(c)).length <= DEFAULT_LIMITS.maxIssues);
});

test('report is deterministic and byte-identical across key order', () => {
  const text = readFileSync(new URL('../examples/sample-case.json', import.meta.url), 'utf8');
  const a = analyzeText(text), b = analyzeText(text);
  assert.equal(a, b);
  const shuffled = JSON.stringify(Object.fromEntries(Object.entries(JSON.parse(text)).reverse()));
  assert.equal(analyzeText(shuffled), a);
  assert.match(a, /"inputSha256": "[a-f0-9]{64}"/);
});

test('sample case yields expected statuses', () => {
  const rep = JSON.parse(analyzeText(readFileSync(new URL('../examples/sample-case.json', import.meta.url), 'utf8')));
  const m = Object.fromEntries(rep.claims.map((c) => [c.claimId, c.status]));
  assert.deepEqual(m, { c1: 'supported_by_independent_origins', c2: 'conflicting', c3: 'no_evidence' });
  assert.equal(rep.duplicates.length, 1);
  // cam-a, its derived copy and the duplicate frame collapse to ONE origin; log-x is the second.
  assert.equal(rep.claims[0].independentSupportOrigins.length, 2);
});

test('output encoding escapes markup characters', () => {
  const c = base(); c.claims[0].statement = '<script>alert(1)&</script>\u2028';
  const out = serializeReport(analyzeCase(validateCase(c)));
  assert.doesNotMatch(out, /[<>&\u2028]/);
  assert.equal(JSON.parse(out).claims[0].statement, c.claims[0].statement);
});
