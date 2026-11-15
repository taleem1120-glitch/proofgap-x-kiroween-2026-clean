// Metamorphic tests: transformations that must NOT change (or may only lower) corroboration.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyzeCase, analyzeText, validateCase, serializeReport } from '../src/index.js';
import { genCase, clone, shuffleCase, relabel, view, stripHash } from './gen.js';
import { rng } from './prng.js';

const SEEDS = Array.from({ length: 150 }, (_, i) => 5000 + i);
// Phase 5: the properties below were additionally stress-run once on seeds 20000-22999 (not committed as a test; see acceptance.md).
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

// Independent root oracle (does not use src/): declared roots of a source.
const rootsOracle = (sources) => {
  const by = new Map(sources.map((x) => [x.id, x])), memo = new Map();
  const go = (id) => { if (memo.has(id)) return memo.get(id); const x = by.get(id); const out = new Set(); if (x.originGroup) out.add(`g:${x.originGroup}`); const ps = x.derivedFrom ?? []; if (!ps.length && !x.originGroup) out.add(`s:${id}`); for (const p of ps) for (const r of go(p)) out.add(r); memo.set(id, out); return out; };
  return go;
};

// Changed in Phase 5: the Phase 3 version asserted union-find semantics ("a copy adds an origin iff its group had no
// support"), which defect D10 showed to be wrong. These are the precise invariants of the 0.3.0 definition.
test('M5: a derived copy (strength 1.0) never lowers origins, adds at most one, and adds none / raises no score when an existing supporter\'s roots are covered by it', () => {
  for (const seed of SEEDS) at(seed, () => {
    const c = genCase(seed), r = rng(seed + 13), d = clone(c);
    const parent = r.pick(c.sources);
    d.sources.push({ id: 'copy-x', name: 'copy', derivedFrom: [parent.id] });
    for (const cl of c.claims) d.evidence.push({ id: `copy-e-${cl.id}`, sourceId: 'copy-x', description: `copy for ${cl.id}`, links: [{ claimId: cl.id, stance: 'supports', strength: 1 }] });
    const before = run(c), after = run(d);
    const roots = rootsOracle(d.sources), copyRoots = roots('copy-x');
    for (let i = 0; i < before.claims.length; i++) {
      const b = before.claims[i], a = after.claims[i];
      const nb = b.independentSupportOrigins.length, na = a.independentSupportOrigins.length;
      assert.ok(na >= nb, `${b.claimId}: adding a copy LOWERED origins ${nb} -> ${na}`);
      assert.ok(na <= nb + 1, `${b.claimId}: one copy added more than one origin`);
      const supporters = c.evidence.filter((e) => e.links.some((l) => l.claimId === b.claimId && l.stance === 'supports'));
      if (supporters.some((e) => [...roots(e.sourceId)].every((x) => copyRoots.has(x)))) {
        // The oracle ignores shared-artifact entanglement. Where it applies, a covered copy may expose a new declared channel
        // (see D12); the engine must then NOT report a clean "supported" decision.
        if (na !== nb || a.supportScore > b.supportScore + 1e-9) {
          assert.ok(a.status !== 'supported_by_independent_origins' || a.decision === 'abstain_possible_undeclared_dependence',
            `${b.claimId}: copy of an existing supporter raised corroboration to a clean SUPPORTED (${nb}->${na}, ${b.supportScore}->${a.supportScore})`);
          assert.ok(after.warnings.some((w) => w.code === 'SHARED_ARTIFACT_ACROSS_LINEAGES'), `${b.claimId}: increase without artifact entanglement`);
        }
      }
    }
  });
});

test('M10: monotonicity — adding ANY supporting item (random source, random strength) never lowers a claim\'s independent support origins', () => {
  for (const seed of SEEDS) at(seed, () => {
    const c = genCase(seed), r = rng(seed + 29), d = clone(c);
    const cl = r.pick(c.claims);
    d.evidence.push({ id: 'mono-1', sourceId: r.pick(c.sources).id, description: `mono ${seed}`, links: [{ claimId: cl.id, stance: 'supports', strength: (1 + r.int(10)) / 10 }] });
    const b = run(c).claims.find((x) => x.claimId === cl.id), a = run(d).claims.find((x) => x.claimId === cl.id);
    assert.ok(a.independentSupportOrigins.length >= b.independentSupportOrigins.length);
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
