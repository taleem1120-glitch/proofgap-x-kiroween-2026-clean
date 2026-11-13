// Counterfactual planner: predictions are EXECUTED against the real engine (hypothetical evidence added with fresh ids).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyzeCase, validateCase, classify } from '../src/index.js';
import { genCase, clone } from './gen.js';

const SEEDS = Array.from({ length: 120 }, (_, i) => 9000 + i);
const run = (c) => analyzeCase(validateCase(clone(c)));
const outcome = (step, prefix) => step.outcomes.find((o) => o.outcome.startsWith(prefix));
const addFresh = (c, claimId, stances) => {
  const d = clone(c);
  stances.forEach((stance, i) => {
    d.sources.push({ id: `hyp-src-${i}`, name: `hypothetical ${i}` });
    d.evidence.push({ id: `hyp-ev-${i}`, sourceId: `hyp-src-${i}`, description: `hypothetical item ${i}`, links: [{ claimId, stance, strength: 0.5 }] });
  });
  return d;
};

test('classify() is the engine rule: engine status equals classify(origin counts) on generated cases', () => {
  for (const seed of SEEDS) for (const c of run(genCase(seed)).claims) {
    assert.equal(c.status, classify(c.independentSupportOrigins.length, c.independentContradictOrigins.length, 2), `seed ${seed}`);
  }
});

test('ADD_INDEPENDENT_ORIGINS: executing "all k support" and "one contradicts" in the engine yields exactly the predicted status', () => {
  let checked = 0;
  for (const seed of SEEDS) {
    const c = genCase(seed), rep = run(c);
    for (const cl of rep.claims) {
      const step = cl.plan.steps.find((s) => s.id === 'ADD_INDEPENDENT_ORIGINS');
      if (!step || cl.status === 'contradicted') continue;
      const k = step.minimalCount;
      const all = run(addFresh(c, cl.claimId, Array(k).fill('supports'))).claims.find((x) => x.claimId === cl.claimId);
      assert.equal(all.status, outcome(step, 'all').resultingStatus, `seed ${seed} ${cl.claimId}`);
      assert.equal(all.independentSupportOrigins.length, outcome(step, 'all').supportOrigins);
      const one = run(addFresh(c, cl.claimId, [...Array(k - 1).fill('supports'), 'contradicts'])).claims.find((x) => x.claimId === cl.claimId);
      assert.equal(one.status, outcome(step, 'at least one contradicts').resultingStatus, `seed ${seed} ${cl.claimId}`);
      // minimality: k-1 supporting items are NOT enough
      if (k > 1) assert.notEqual(run(addFresh(c, cl.claimId, Array(k - 1).fill('supports'))).claims.find((x) => x.claimId === cl.claimId).status, 'supported_by_independent_origins');
      checked++;
    }
  }
  assert.ok(checked > 50, `only ${checked} plans executed`);
});

test('REASSESS_CONTRADICTIONS: removing every contradicting link in the engine yields the predicted status', () => {
  let checked = 0;
  for (const seed of SEEDS) {
    const c = genCase(seed), rep = run(c);
    for (const cl of rep.claims) {
      const step = cl.plan.steps.find((s) => s.id === 'REASSESS_CONTRADICTIONS');
      if (!step) continue;
      const d = clone(c);
      for (const e of d.evidence) e.links = e.links.filter((l) => !(l.claimId === cl.claimId && l.stance === 'contradicts'));
      const after = run(d).claims.find((x) => x.claimId === cl.claimId);
      assert.equal(after.status, outcome(step, 'all').resultingStatus, `seed ${seed} ${cl.claimId}`);
      checked++;
    }
  }
  assert.ok(checked > 20);
});

test('ROBUSTNESS: dropping the evidence of `fragility` support origins (strongest first) makes a supported claim lose "supported"', () => {
  let checked = 0;
  for (const seed of SEEDS) {
    const c = genCase(seed), rep = run(c);
    for (const cl of rep.claims.filter((x) => x.status === 'supported_by_independent_origins')) {
      const step = cl.plan.steps.find((s) => s.id === 'ROBUSTNESS');
      const drop = new Set(cl.independentSupportOrigins.slice(0, step.minimalCount).flatMap((o) => o.evidenceIds));
      const d = clone(c);
      for (const e of d.evidence) if (drop.has(e.id)) e.links = e.links.filter((l) => !(l.claimId === cl.claimId && l.stance === 'supports'));
      const after = run(d).claims.find((x) => x.claimId === cl.claimId);
      assert.notEqual(after.status, 'supported_by_independent_origins', `seed ${seed} ${cl.claimId}`);
      checked++;
    }
  }
  assert.ok(checked > 10);
});

test('planner never fabricates: all scenarios hypothetical, quoted ids exist, smallestChange is the minimal decision-changing step', () => {
  for (const seed of SEEDS) {
    const c = validateCase(genCase(seed)), rep = analyzeCase(c);
    const known = new Set([...c.sources.map((s) => s.id), ...c.evidence.map((e) => e.id), ...rep.claims.flatMap((cl) => [...cl.independentSupportOrigins, ...cl.independentContradictOrigins].map((o) => o.origin))]);
    for (const cl of rep.claims) {
      for (const st of cl.plan.steps) {
        assert.ok(st.outcomes.every((o) => o.hypothetical === true));
        for (const m of st.requirement.matchAll(/"([^"]+)"/g)) assert.ok(known.has(m[1]), `seed ${seed}: unknown "${m[1]}"`);
        assert.doesNotMatch(st.requirement, /\b(exists|was found|is available|proves?)\b/i);
      }
      const changing = cl.plan.steps.filter((st) => st.outcomes.some((o) => o.resultingStatus !== cl.status));
      if (changing.length) assert.equal(cl.plan.smallestChange.minimalCount, Math.min(...changing.map((s) => s.minimalCount)));
      else assert.equal(cl.plan.smallestChange, null);
    }
  }
});
