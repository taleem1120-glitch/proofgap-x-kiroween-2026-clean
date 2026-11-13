// Regression tests for defects CONFIRMED in the Phase 1/2 engine (see .kiro/specs/phase1/tasks.md, "Phase 3 confirmed defects").
// Each test was written and observed FAILING against the Phase 2 code before the fix.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyzeCase, validateCase } from '../src/index.js';

const H = 'a'.repeat(64);
const mk = (sources, claims, evidence) => validateCase({ schemaVersion: '1.0', caseId: 'R', title: 'Regression', sources, claims, evidence });
const claim = (rep, id) => rep.claims.find((c) => c.claimId === id);
const L = (claimId, stance = 'supports', strength = 0.6) => ({ claimId, stance, strength });
const S = (id, extra = {}) => ({ id, name: id, ...extra });

test('D1: a duplicate artifact cited for a DIFFERENT claim must not lose that link', () => {
  // e1 and e2 are the same file (same sha). e1 supports c1, e2 supports c2. Dropping e2 wholesale erases support for c2.
  const c = mk([S('a'), S('b')], [{ id: 'c1', statement: 'x' }, { id: 'c2', statement: 'y' }], [
    { id: 'e1', sourceId: 'a', description: 'd1', sha256: H, links: [L('c1')] },
    { id: 'e2', sourceId: 'a', description: 'd2', sha256: H, links: [L('c2')] },
  ]);
  const rep = analyzeCase(c);
  assert.notEqual(claim(rep, 'c2').status, 'no_evidence', 'c2 evidence was silently discarded');
  assert.equal(claim(rep, 'c2').independentSupportOrigins.length, 1);
});

test('D2: a duplicate artifact carrying CONTRADICTING stance for the same claim must surface as a conflict, not vanish', () => {
  const c = mk([S('a'), S('b')], [{ id: 'c1', statement: 'x' }], [
    { id: 'e1', sourceId: 'a', description: 'd1', sha256: H, links: [L('c1', 'supports')] },
    { id: 'e2', sourceId: 'b', description: 'd2', sha256: H, links: [L('c1', 'contradicts')] },
  ]);
  assert.equal(claim(analyzeCase(c), 'c1').status, 'conflicting');
});

test('D3: outcome must not depend on which duplicate has the lexicographically smaller id (relabeling invariance)', () => {
  // Same artifact reported by two sources a/b; another item from a. Swapping ids must not manufacture a 2nd origin.
  const build = (id1, id2) => mk([S('a'), S('b')], [{ id: 'c1', statement: 'x' }], [
    { id: id1, sourceId: 'a', description: 'dd1', sha256: H, links: [L('c1')] },
    { id: id2, sourceId: 'b', description: 'dd2', sha256: H, links: [L('c1')] },
    { id: 'e9', sourceId: 'a', description: 'other', links: [L('c1')] },
  ]);
  const r1 = claim(analyzeCase(build('e1', 'e2')), 'c1'), r2 = claim(analyzeCase(build('e2', 'e1')), 'c1');
  assert.equal(r1.status, r2.status);
  assert.equal(r1.independentSupportOrigins.length, r2.independentSupportOrigins.length);
  assert.equal(r1.supportScore, r2.supportScore);
  // the shared artifact ties a and b together, so there is only ONE independent origin here
  assert.equal(r1.independentSupportOrigins.length, 1);
});

test('D4: originGroup must not hide a declared derivation', () => {
  const c = mk([S('orig'), S('copy', { originGroup: 'g', derivedFrom: ['orig'] })], [{ id: 'c1', statement: 'x' }], [
    { id: 'e1', sourceId: 'orig', description: 'a', links: [L('c1')] },
    { id: 'e2', sourceId: 'copy', description: 'b', links: [L('c1')] },
  ]);
  const r = claim(analyzeCase(c), 'c1');
  assert.equal(r.independentSupportOrigins.length, 1, 'declared derived copy counted as independent');
  assert.equal(r.status, 'insufficient_support');
});

test('D5: a source derived from two roots is not independent of either of its parents', () => {
  const c = mk([S('r1'), S('r2'), S('merged', { derivedFrom: ['r1', 'r2'] })], [{ id: 'c1', statement: 'x' }], [
    { id: 'e1', sourceId: 'r1', description: 'a', links: [L('c1')] },
    { id: 'e2', sourceId: 'merged', description: 'b', links: [L('c1')] },
  ]);
  const r = claim(analyzeCase(c), 'c1');
  assert.equal(r.independentSupportOrigins.length, 1, 'merge of r1+r2 counted independent of r1');
  assert.equal(r.status, 'insufficient_support');
});

test('D6: overlapping partial derivations chain into one component (r1+r2 vs r2+r3 vs r3)', () => {
  const c = mk([S('r1'), S('r2'), S('r3'), S('m12', { derivedFrom: ['r1', 'r2'] }), S('m23', { derivedFrom: ['r2', 'r3'] })],
    [{ id: 'c1', statement: 'x' }], [
      { id: 'e1', sourceId: 'm12', description: 'a', links: [L('c1')] },
      { id: 'e2', sourceId: 'm23', description: 'b', links: [L('c1')] },
    ]);
  assert.equal(claim(analyzeCase(c), 'c1').independentSupportOrigins.length, 1);
});

test('D7: a derived copy must not raise the strength of its upstream origin (score inflation by self-assigned strength)', () => {
  const build = (copyStrength) => mk([S('orig'), S('copy', { derivedFrom: ['orig'] }), S('other')], [{ id: 'c1', statement: 'x' }], [
    { id: 'e1', sourceId: 'orig', description: 'a', links: [L('c1', 'supports', 0.3)] },
    { id: 'e2', sourceId: 'copy', description: 'b', links: [L('c1', 'supports', copyStrength)] },
    { id: 'e3', sourceId: 'other', description: 'c', links: [L('c1', 'supports', 0.3)] },
  ]);
  const weak = claim(analyzeCase(build(0.3)), 'c1'), inflated = claim(analyzeCase(build(1.0)), 'c1');
  assert.equal(inflated.supportScore, weak.supportScore, 'derived copy inflated the score');
  assert.equal(inflated.independentSupportOrigins.find((o) => o.sourceIds.includes('copy')).strengthCappedFromDerived, 1);
});

test('D7b: when only derived evidence exists (original not in case) its own strength is used and reported as uncapped', () => {
  const c = mk([S('orig'), S('copy', { derivedFrom: ['orig'] })], [{ id: 'c1', statement: 'x' }], [
    { id: 'e2', sourceId: 'copy', description: 'b', links: [L('c1', 'supports', 0.9)] },
  ]);
  const r = claim(analyzeCase(c), 'c1');
  assert.equal(r.supportScore, 0.9);
  assert.equal(r.independentSupportOrigins[0].strengthCappedFromDerived, undefined);
});

test('D8: adding more derived copies (any strength) to a derived-only cluster must not raise its score', () => {
  // upstream "orig" is NOT in the evidence; two copies from it are. A third copy rated 1.0 must not lift the cluster.
  const build = (extra) => mk([S('orig'), S('c1s', { derivedFrom: ['orig'] }), S('c2s', { derivedFrom: ['orig'] }), S('c3s', { derivedFrom: ['orig'] })], [{ id: 'c1', statement: 'x' }], [
    { id: 'e1', sourceId: 'c1s', description: 'a', links: [L('c1', 'supports', 0.4)] },
    { id: 'e2', sourceId: 'c2s', description: 'b', links: [L('c1', 'supports', 0.5)] },
    ...(extra ? [{ id: 'e3', sourceId: 'c3s', description: 'c', links: [L('c1', 'supports', 1.0)] }] : []),
  ]);
  const before = claim(analyzeCase(build(false)), 'c1'), after = claim(analyzeCase(build(true)), 'c1');
  assert.equal(after.independentSupportOrigins.length, 1);
  assert.ok(after.supportScore <= before.supportScore, `score rose ${before.supportScore} -> ${after.supportScore}`);
  assert.equal(before.independentSupportOrigins[0].strength, 0.4, 'derived-only cluster uses the minimum (conservative)');
});
