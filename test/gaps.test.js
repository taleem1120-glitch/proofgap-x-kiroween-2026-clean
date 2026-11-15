import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyzeCase, validateCase, renderText } from '../src/index.js';
import { REQUIREMENT_PRIORITY } from '../src/gaps.js';
import { genCase, clone } from './gen.js';

const H = (n) => String(n).repeat(64);
const mk = (sources, evidence, claims = [{ id: 'c1', statement: 'x' }]) => validateCase({ schemaVersion: '1.0', caseId: 'G', title: 't', sources, claims, evidence });
const S = (id, extra = {}) => ({ id, name: `name-${id}`, ...extra });
const E = (id, sourceId, links, extra = {}) => ({ id, sourceId, description: `desc-${id}`, links, ...extra });
const L = (stance = 'supports', strength = 0.6, claimId = 'c1') => ({ claimId, stance, strength });
const codes = (rep, claimId = 'c1') => rep.claims.find((c) => c.claimId === claimId).findings.map((f) => f.code);
const reqCodes = (rep, claimId = 'c1') => rep.claims.find((c) => c.claimId === claimId).requirements.map((r) => r.code);

test('no evidence: NO_LINKED_EVIDENCE finding and an acquisition recommendation', () => {
  const rep = analyzeCase(mk([S('a')], []));
  assert.deepEqual(codes(rep), ['NO_LINKED_EVIDENCE']); assert.deepEqual(reqCodes(rep), ['NO_LINKED_EVIDENCE']);
  assert.deepEqual(rep.claims[0].assumptions, []); // nothing is assumed when there is nothing
});

test('single origin: BELOW_INDEPENDENCE_THRESHOLD; copies add FALSE_CORROBORATION with the exact numbers', () => {
  const rep = analyzeCase(mk([S('a'), S('b', { derivedFrom: ['a'] }), S('c', { derivedFrom: ['b'] })],
    [E('e1', 'a', [L()]), E('e2', 'b', [L()]), E('e3', 'c', [L()])]));
  const c = rep.claims[0];
  assert.equal(c.status, 'insufficient_support');
  assert.ok(codes(rep).includes('FALSE_CORROBORATION') && codes(rep).includes('BELOW_INDEPENDENCE_THRESHOLD'));
  assert.equal(c.findings.find((f) => f.code === 'FALSE_CORROBORATION').message.slice(0, 40), '3 supporting evidence items collapse to ');
  assert.deepEqual([c.corroboration.supportingEvidenceItems, c.corroboration.independentSupportOrigins, c.corroboration.apparentExcess, c.corroboration.falseCorroboration], [3, 1, 2, true]);
  const reasons = c.corroboration.clusters.supports[0].reasons.join('\n');
  assert.match(reasons, /"c" is declared as derived from "b" \(transitively from "a", "b"\)/);
  assert.match(reasons, /3 evidence item\(s\) in this group count as 1 independent origin/);
});

test('genuine corroboration has no false-corroboration finding, but still flags unverified provenance', () => {
  const rep = analyzeCase(mk([S('a'), S('b')], [E('e1', 'a', [L()]), E('e2', 'b', [L()])]));
  const c = rep.claims[0];
  assert.equal(c.status, 'supported_by_independent_origins'); assert.equal(c.corroboration.falseCorroboration, false);
  assert.deepEqual(codes(rep).sort(), ['NO_DECLARED_HASH', 'PROVENANCE_UNVERIFIED']);
  assert.ok(!codes(rep).includes('FALSE_CORROBORATION'));
  assert.ok(codes(rep).includes('PROVENANCE_UNVERIFIED'));
  assert.match(c.assumptions.join(' '), /not been independently verified/);
});

test('conflict across origins and self-contradicting origin are both reported', () => {
  const rep = analyzeCase(mk([S('a'), S('b')], [E('e1', 'a', [L('supports')]), E('e2', 'b', [L('contradicts')]), E('e3', 'a', [L('contradicts', 0.3)])]));
  assert.equal(rep.claims[0].status, 'conflicting');
  assert.ok(codes(rep).includes('CONFLICT_UNRESOLVED') && codes(rep).includes('SELF_CONTRADICTORY_ORIGIN'));
});

test('contradicted-only claim is explained', () => {
  const rep = analyzeCase(mk([S('a')], [E('e1', 'a', [L('contradicts')])]));
  assert.equal(rep.claims[0].status, 'contradicted'); assert.ok(codes(rep).includes('ONLY_CONTRADICTING_EVIDENCE'));
});

test('every recommendation is heuristic, ranked 1..n by the documented priority, and states what it would NOT prove', () => {
  for (let seed = 7000; seed < 7100; seed++) {
    const rep = analyzeCase(validateCase(genCase(seed)));
    for (const c of rep.claims) {
      c.findings.forEach((f) => { assert.equal(f.basis, 'logical'); assert.ok(f.message.length > 10); });
      c.requirements.forEach((r, i) => {
        assert.equal(r.basis, 'heuristic'); assert.equal(r.rank, i + 1);
        assert.ok(r.action && r.wouldShow && r.wouldNotShow, `seed ${seed}`);
        assert.ok(r.wouldNotShow.length > 15);
        if (i) assert.ok(REQUIREMENT_PRIORITY[c.requirements[i - 1].code] <= REQUIREMENT_PRIORITY[r.code]);
      });
    }
  }
});

test('recommendations never fabricate: every quoted identifier exists in the case, and no recommendation claims a result', () => {
  for (let seed = 7100; seed < 7200; seed++) {
    const c = validateCase(genCase(seed)); const rep = analyzeCase(c);
    const known = new Set([...c.sources.map((s) => s.id), ...c.claims.map((x) => x.id), ...c.evidence.map((e) => e.id),
      ...rep.claims.flatMap((cl) => [...cl.independentSupportOrigins, ...cl.independentContradictOrigins].map((o) => o.origin))]);
    const roots = new Set([...known].flatMap((k) => k.split('+')));
    for (const cl of rep.claims) for (const r of cl.requirements) {
      for (const m of r.action.matchAll(/"([^"]+)"/g)) assert.ok(known.has(m[1]) || roots.has(m[1]), `seed ${seed}: unknown id ${m[1]} in "${r.action}"`);
      assert.doesNotMatch(r.action + r.wouldShow, /\b(proves?|confirms?|establishes|guilty|authentic)\b/i, r.action);
    }
  }
});

test('findings reference only evidence ids that exist; reports never claim verification when none ran', () => {
  const c = validateCase(genCase(7300)); const rep = analyzeCase(c);
  const ids = new Set(c.evidence.map((e) => e.id));
  for (const cl of rep.claims) for (const f of cl.findings) for (const id of f.evidence) assert.ok(ids.has(id));
  assert.equal(rep.integrity.mode, 'not_requested');
  assert.ok(rep.integrity.results.every((r) => r.verified === false));
  assert.doesNotMatch(JSON.stringify(rep), /"status":"VERIFIED"/);
});

test('independence is never presented as verified', () => {
  for (const cl of analyzeCase(validateCase(genCase(7301))).claims) assert.equal(cl.corroboration.independenceBasis, 'declared_provenance_not_independently_verified');
});

test('heuristic warnings flag possible undeclared dependence but never change scores', () => {
  const c = mk([S('a', { name: 'Camera 1' }), S('b', { name: ' camera   1 ' })], [{ ...E('e1', 'a', [L()]), description: 'Door open' }, { ...E('e2', 'b', [L()]), description: 'door OPEN' }]);
  const rep = analyzeCase(c);
  const codesW = rep.warnings.map((w) => w.code).sort();
  assert.deepEqual(codesW, ['IDENTICAL_DESCRIPTION_ACROSS_ORIGINS', 'SAME_NAME_DIFFERENT_ORIGINS']);
  assert.ok(rep.warnings.every((w) => w.basis === 'heuristic'));
  assert.equal(rep.claims[0].status, 'supported_by_independent_origins'); // scoring untouched by heuristics
});

test('text rendering: contains verdict labels, caveats, and no raw control characters', () => {
  const c = validateCase(genCase(7302)); c.title = 'ok';
  const txt = renderText(analyzeCase(c));
  assert.match(txt, /does not establish forensic authenticity, intent, or guilt/);
  assert.match(txt, /NOT REQUESTED \(declared hashes are UNVERIFIED\)/);
  assert.doesNotMatch(txt, /[\u0000-\u0008\u000b-\u001f\u007f\u202a-\u202e]/);
  const evil = clone(c); evil.claims[0].statement = 'a\tb'; // tab allowed by validation; rendered text must still be sane
  assert.doesNotMatch(renderText(analyzeCase(validateCase(evil))), /\u001b/);
});

test('text rendering sanitises hostile characters even if validation were bypassed', () => {
  const c = validateCase(genCase(7303)); const rep = analyzeCase(c);
  rep.claims[0].statement = 'x\u001b[31mRED\u202e';
  const txt = renderText(rep);
  assert.doesNotMatch(txt, /\u001b|\u202e/);
});

test('trust block separates declared facts from verified facts and never reports verified provenance/independence', () => {
  const rep = analyzeCase(validateCase(genCase(7400)));
  assert.deepEqual(rep.trust.independentlyVerified, { sha256Matches: 0, provenance: 0, independence: 0 });
  assert.ok(rep.trust.declaredOnly.includes('derivedFrom'));
});
