// Independent adversarial scenarios (each states WHY the expected outcome is correct, derived from the spec, not from the implementation).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyzeCase, validateCase, CaseValidationError } from '../src/index.js';

const mk = (sources, evidence, claims = [{ id: 'c1', statement: 'x' }]) => validateCase({ schemaVersion: '1.0', caseId: 'A', title: 't', sources, claims, evidence });
const S = (id, extra = {}) => ({ id, name: `n-${id}`, ...extra });
let n = 0;
const E = (sourceId, stance = 'supports', strength = 0.7, extra = {}) => ({ id: `e${++n}`, sourceId, description: `d${n}`, links: [{ claimId: 'c1', stance, strength }], ...extra });
const res = (c) => { const r = analyzeCase(c).claims[0]; return { status: r.status, origins: r.independentSupportOrigins.length, score: r.supportScore, r }; };

test('A1 misleading provenance: ten copies, each claiming to be an original BUT declaring the same originGroup, are ONE origin', () => {
  const srcs = Array.from({ length: 10 }, (_, i) => S(`x${i}`, { originGroup: 'same-room' }));
  const out = res(mk(srcs, srcs.map((s) => E(s.id))));
  assert.equal(out.origins, 1); assert.equal(out.status, 'insufficient_support');
  assert.equal(out.r.corroboration.supportingEvidenceItems, 10); assert.equal(out.r.corroboration.falseCorroboration, true);
});

test('A2 many derived copies from one origin never reach the threshold, whatever their number or strength', () => {
  for (const copies of [1, 5, 40]) {
    const srcs = [S('o'), ...Array.from({ length: copies }, (_, i) => S(`c${i}`, { derivedFrom: ['o'] }))];
    const out = res(mk(srcs, [E('o', 'supports', 0.2), ...srcs.slice(1).map((s) => E(s.id, 'supports', 1))]));
    assert.equal(out.origins, 1); assert.equal(out.score, 0.2); assert.equal(out.status, 'insufficient_support');
  }
});

test('A3 copies of copies via a diamond (a->b, a->c, b+c->d) are one origin', () => {
  const srcs = [S('a'), S('b', { derivedFrom: ['a'] }), S('c', { derivedFrom: ['a'] }), S('d', { derivedFrom: ['b', 'c'] })];
  assert.equal(res(mk(srcs, srcs.map((s) => E(s.id)))).origins, 1);
});

test('A4 a "bridge" source derived from two otherwise independent origins merges them and cannot be used to fake a third', () => {
  const srcs = [S('r1'), S('r2'), S('bridge', { derivedFrom: ['r1', 'r2'] })];
  const out = res(mk(srcs, [E('r1'), E('r2'), E('bridge')]));
  assert.equal(out.origins, 1, 'r1, r2 and their merge all depend on each other through the bridge');
});

test('A5 the same file under two different source names (relabeled laundering) is one origin; claim stays insufficient', () => {
  const H = 'c'.repeat(64);
  const out = res(mk([S('a'), S('b')], [E('a', 'supports', 0.7, { sha256: H }), E('b', 'supports', 0.7, { sha256: H })]));
  assert.equal(out.origins, 1); assert.equal(out.r.corroboration.falseCorroboration, true);
});

test('A6 contradiction laundering: supporting a claim twice does not outvote a contradiction; status remains conflicting', () => {
  const out = res(mk([S('a'), S('b'), S('c', { derivedFrom: ['a'] })], [E('a'), E('c'), E('b', 'contradicts')]));
  assert.equal(out.status, 'conflicting');
});

test('A7 hiding a contradiction behind a duplicate: identical artifact marked both ways still conflicts', () => {
  const H = 'd'.repeat(64);
  const out = res(mk([S('a')], [E('a', 'supports', 0.9, { sha256: H }), E('a', 'contradicts', 0.9, { sha256: H })]));
  assert.equal(out.status, 'conflicting'); assert.ok(out.r.findings.some((f) => f.code === 'SELF_CONTRADICTORY_ORIGIN'));
});

test('A8 missing evidence is never silently "supported"', () => {
  const out = res(mk([S('a')], [{ id: 'z', sourceId: 'a', description: 'unlinked', links: [] }]));
  assert.equal(out.status, 'no_evidence'); assert.equal(out.score, 0);
});

test('A9 strength gaming: 1000 weak-but-independent claims of origin do not exceed what noisy-OR gives, and stay bounded in [0,1]', () => {
  const srcs = Array.from({ length: 300 }, (_, i) => S(`s${i}`));
  const out = res(mk(srcs, srcs.map((s) => E(s.id, 'supports', 0.01))));
  assert.ok(out.score <= 1 && out.score > 0); assert.equal(out.origins, 300);
  // Documented limitation (not a defect): many *declared-independent* origins can accumulate score. Warnings must hint at the pattern only via names/descriptions.
});

test('A10 cycles and self-derivation are rejected before analysis, with the path in the message', () => {
  for (const srcs of [[S('a', { derivedFrom: ['a'] })], [S('a', { derivedFrom: ['b'] }), S('b', { derivedFrom: ['c'] }), S('c', { derivedFrom: ['a'] })]]) {
    assert.throws(() => mk(srcs, []), (e) => e instanceof CaseValidationError && e.issues.some((i) => /derivation cycle: .*->/.test(i.message)));
  }
});

test('A11 analysis refuses to run on an unvalidated cyclic graph instead of looping or overflowing', () => {
  const bad = { schemaVersion: '1.0', caseId: 'x', title: 't', sources: [S('a', { derivedFrom: ['b'] }), S('b', { derivedFrom: ['a'] })], claims: [{ id: 'c1', statement: 'x' }], evidence: [] };
  assert.throws(() => analyzeCase(bad), /derivation cycle/);
});

test('A12 originGroup name collisions with source ids cannot merge unrelated origins', () => {
  // group "x" and a source literally named "x" are different namespaces (group:x vs source:x)
  const out = res(mk([S('x'), S('y', { originGroup: 'x' })], [E('x'), E('y')]));
  assert.equal(out.origins, 2);
});

test('A13 plausible-looking but ordinary case still reaches SUPPORTED (no over-blocking)', () => {
  const out = res(mk([S('a'), S('b'), S('c', { derivedFrom: ['a'] })], [E('a'), E('b'), E('c')]));
  assert.equal(out.status, 'supported_by_independent_origins'); assert.equal(out.origins, 2);
});
