// Metamorphic tests: transformations that must NOT change (or may only lower) corroboration.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyzeCase, analyzeText, validateCase, serializeReport } from '../src/index.js';
import { genCase, clone, shuffleCase, relabel, view, stripHash } from './gen.js';
import { rng } from './prng.js';

const SEEDS = Array.from({ length: 150 }, (_, i) => 5000 + i);
const run = (c) => analyzeCase(validateCase(clone(c)));
const at = (seed, fn) => { try { fn(); } catch (e) { e.message = `seed ${seed}: ${e.message}`; throw e; } };

test('M1: reordering every array in the case yields an identical report (except the input-order-sensitive hash)', () => {
  for (const seed of SEEDS) at(seed, () => {
    const c = genCase(seed);
    assert.deepEqual(stripHash(run(shuffleCase(c, seed + 1))), stripHash(run(c)));
  });
});

test('M2: JSON formatting (pretty, minified, key order) yields byte-identical reports', () => {
  for (const seed of SEEDS.slice(0, 50)) at(seed, () => {
    const c = genCase(seed);
    const a = analyzeText(JSON.stringify(c)), b = analyzeText(JSON.stringify(c, null, 4) + '\n');
    const rev = JSON.stringify(Object.fromEntries(Object.entries(c).reverse()), null, '\t');
    assert.equal(a, b); assert.equal(a, analyzeText(rev));
  });
});

test('M3: relabeling ids (bijection that scrambles sort order) preserves statuses, scores and origin counts', () => {
  for (const seed of SEEDS) at(seed, () => {
    const c = genCase(seed), rl = relabel(c, seed + 7);
    const orig = view(run(c)), re = view(run(rl.case));
    const map = new Map(orig.map((v) => [rl.claim(v.claimId), v]));
    for (const v of re) { const o = map.get(v.claimId); assert.deepEqual({ ...v, claimId: 0 }, { ...o, claimId: 0 }); }
  });
});

test('M4: duplicating an evidence item (new id; same hash, or same source+description with different case/whitespace) never changes any claim result', () => {
  for (const seed of SEEDS) at(seed, () => {
    const c = genCase(seed), r = rng(seed + 11), d = clone(c);
    const src = r.pick(c.evidence);
    const dup = clone(src); dup.id = 'dup-1';
    if (!dup.sha256) dup.description = `  ${dup.description.toUpperCase()}\t `;
    d.evidence.push(dup);
    assert.deepEqual(view(run(d)), view(run(c)));
    const rep = run(d);
    assert.ok(rep.duplicates.some((x) => x.evidenceId === 'dup-1' || x.duplicateOf === 'dup-1'), 'duplicate not reported');
  });
});

test('M5: adding a derived copy of an existing source, with maximal strength, cannot raise any score; it adds an origin only if its group had no support before', () => {
  for (const seed of SEEDS) at(seed, () => {
    const c = genCase(seed), r = rng(seed + 13), d = clone(c);
    const parent = r.pick(c.sources);
    d.sources.push({ id: 'copy-x', name: 'copy', derivedFrom: [parent.id] });
    for (const cl of c.claims) d.evidence.push({ id: `copy-e-${cl.id}`, sourceId: 'copy-x', description: `copy for ${cl.id}`, links: [{ claimId: cl.id, stance: 'supports', strength: 1 }] });
    const before = run(c), after = run(d);
    for (let i = 0; i < before.claims.length; i++) {
      const b = before.claims[i], a = after.claims[i];
      const L = a.independentSupportOrigins.find((o) => o.sourceIds.includes('copy-x')).origin;
      const had = b.independentSupportOrigins.find((o) => o.origin === L);
      if (had) {
        assert.equal(a.independentSupportOrigins.length, b.independentSupportOrigins.length, `${b.claimId}: copy created an origin`);
        assert.ok(a.supportScore <= b.supportScore + 1e-9, `${b.claimId}: copy raised score ${b.supportScore} -> ${a.supportScore}`);
      } else {
        assert.equal(a.independentSupportOrigins.length, b.independentSupportOrigins.length + 1);
      }
    }
  });
});

test('M6: monotonicity — adding a contradicting item never changes supportScore; raising a strength never lowers it', () => {
  for (const seed of SEEDS) at(seed, () => {
    const c = genCase(seed), r = rng(seed + 17);
    const d = clone(c);
    d.evidence.push({ id: 'neg-1', sourceId: r.pick(c.sources).id, description: `contra ${seed}`, links: [{ claimId: r.pick(c.claims).id, stance: 'contradicts', strength: 1 }] });
    const b = run(c), a = run(d);
    for (let i = 0; i < b.claims.length; i++) assert.equal(a.claims[i].supportScore, b.claims[i].supportScore);
    const up = clone(c); const e = r.pick(up.evidence); for (const l of e.links) l.strength = 1;
    const u = run(up);
    for (let i = 0; i < b.claims.length; i++) assert.ok(u.claims[i].supportScore + 1e-9 >= b.claims[i].supportScore);
  });
});

test('M7: unrelated claims/evidence cannot change another claim\'s result', () => {
  for (const seed of SEEDS.slice(0, 80)) at(seed, () => {
    const c = genCase(seed), d = clone(c);
    d.claims.push({ id: 'zz-extra', statement: 'unrelated' });
    d.sources.push({ id: 'zz-src', name: 'unrelated source' });
    d.evidence.push({ id: 'zz-ev', sourceId: 'zz-src', description: 'unrelated', links: [{ claimId: 'zz-extra', stance: 'supports', strength: 1 }] });
    const before = view(run(c)), after = view(run(d)).filter((v) => v.claimId !== 'zz-extra');
    assert.deepEqual(after, before);
  });
});

test('M8: inserting extra hops into a derivation chain does not change origin counts or scores', () => {
  const base = (hops) => {
    const sources = [{ id: 'root', name: 'root' }, { id: 'other', name: 'other' }];
    let prev = 'root';
    for (let i = 0; i < hops; i++) { sources.push({ id: `h${i}`, name: `hop${i}`, derivedFrom: [prev] }); prev = `h${i}`; }
    return { schemaVersion: '1.0', caseId: 'M8', title: 't', sources, claims: [{ id: 'c1', statement: 's' }], evidence: [
      { id: 'e1', sourceId: prev, description: 'tail', links: [{ claimId: 'c1', stance: 'supports', strength: 0.6 }] },
      { id: 'e2', sourceId: 'root', description: 'root', links: [{ claimId: 'c1', stance: 'supports', strength: 0.6 }] },
    ] };
  };
  const ref = view(run(base(1)));
  for (const hops of [2, 5, 20, 45]) assert.deepEqual(view(run(base(hops))), ref);
  assert.equal(ref[0].supOrigins, 1);
});

test('M9: report serialization of the same case is stable across 20 repeated runs', () => {
  const c = genCase(99);
  const first = serializeReport(run(c));
  for (let i = 0; i < 20; i++) assert.equal(serializeReport(run(c)), first);
});
