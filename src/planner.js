/**
 * Counterfactual Evidence Planner.
 *
 * For each claim: the SMALLEST number of additional evidence outcomes that could change the
 * decision under the fixed policy, and what the decision would become under each hypothetical
 * outcome. Outcomes are computed by re-running the SAME rule the engine uses (classify.js),
 * so they are logical consequences of the policy — not predictions about the world.
 *
 * Nothing here asserts that any hypothetical item exists or could be obtained. Every scenario
 * is marked `hypothetical: true`. No strength values are invented: scores are only reported
 * when they follow from existing data (e.g. after removing an origin).
 */
import { classify } from './classify.js';

const scen = (outcome, supportOrigins, contradictOrigins, threshold, note) => ({
  hypothetical: true, outcome, resultingStatus: classify(supportOrigins, contradictOrigins, threshold), supportOrigins, contradictOrigins, ...(note ? { note } : {}),
});

export function planClaim({ status, support, contradict, threshold: th, cues, supportItems, integrityByEvidence, excludedMismatch }) {
  const S = support.length, C = contradict.length;
  const steps = [];

  if (status === 'no_evidence' || status === 'insufficient_support') {
    const k = th - S;
    steps.push({
      id: 'ADD_INDEPENDENT_ORIGINS', kind: 'acquire', minimalCount: k,
      requirement: `${k} additional item(s), each from an origin that is not derived from, grouped with, or byte-identical to any existing origin of this claim${S ? ` (${support.map((o) => `"${o.origin}"`).join(', ')})` : ''}.`,
      outcomes: [
        scen(`all ${k} support the claim`, S + k, C, th),
        scen('at least one contradicts the claim', S + k - 1, C + 1, th),
        scen('none can be found', S, C, th, 'absence of further evidence is not evidence against the claim'),
      ],
    });
  }
  if (status === 'contradicted') {
    steps.push({
      id: 'ADD_INDEPENDENT_ORIGINS', kind: 'acquire', minimalCount: 1,
      requirement: 'At least 1 supporting item from an origin independent of the contradicting origin(s); reaching SUPPORTED additionally requires every contradiction to be withdrawn (see below).',
      outcomes: [scen('1 independent item supports the claim', 1, C, th), scen('none can be found', 0, C, th)],
    });
  }
  if (status === 'conflicting' || status === 'contradicted') {
    steps.push({
      id: 'REASSESS_CONTRADICTIONS', kind: 'reassess', minimalCount: C,
      requirement: `Re-examine the ${C} contradicting origin(s) (${contradict.map((o) => `"${o.origin}"`).join(', ')}): collection method, time and applicability to the claim as worded.`,
      outcomes: [
        scen(`all ${C} are shown not to apply to the claim`, S, 0, th, 'under the policy a single remaining contradiction keeps the claim conflicting'),
        scen('at least one still applies', S, C, th),
      ],
    });
  }
  if (status === 'supported_by_independent_origins') {
    const fragility = S - th + 1;
    steps.push({
      id: 'ROBUSTNESS', kind: 'stress_test', minimalCount: fragility,
      requirement: `Support survives unless ${fragility} of its ${S} independent origins are shown to share an undeclared source with another, or fail integrity checks.`,
      outcomes: [scen(`${fragility} origin(s) collapse into others`, S - fragility, C, th), scen('a single independent contradiction is found', S, C + 1, th)],
    });
  }
  if (cues.length) {
    const involved = new Set();
    steps.push({
      id: 'RESOLVE_DEPENDENCE_CUES', kind: 'verify_provenance', minimalCount: cues.length,
      requirement: `Resolve ${cues.length} heuristic cue(s) (${cues.map((w) => w.code).join(', ')}) by checking whether the flagged sources/evidence share an origin.`,
      outcomes: [
        scen('cue(s) shown to be coincidence (declared independence holds)', S, C, th),
        scen('flagged items shown to share one origin', Math.max(S - cues.length, 1), C, th, 'conservative: assumes each cue merges two origins into one'),
      ],
    });
    void involved;
  }
  // integrity: if unverified hashed supporting items turned out to MISMATCH, which origins would remain?
  const unverified = supportItems.filter((id) => { const r = integrityByEvidence.get(id); return r?.declaredSha256 && r.status !== 'VERIFIED' && r.status !== 'MISMATCH'; });
  if (unverified.length && S > 0) {
    const surviving = support.filter((o) => o.evidenceIds.some((id) => !unverified.includes(id))).length;
    steps.push({
      id: 'VERIFY_DECLARED_HASHES', kind: 'verify_integrity', minimalCount: unverified.length,
      requirement: `Verify ${unverified.length} declared SHA-256 value(s) against local files: ${unverified.map((x) => `"${x}"`).join(', ')}.`,
      outcomes: [scen('all VERIFIED', S, C, th, 'byte equality only; does not establish authenticity'), scen('all MISMATCH (excluded from scoring)', surviving, C, th)],
    });
  }
  if (excludedMismatch.length) {
    steps.push({ id: 'EXPLAIN_MISMATCH', kind: 'verify_integrity', minimalCount: excludedMismatch.length,
      requirement: `Explain the hash mismatch of ${excludedMismatch.map((x) => `"${x}"`).join(', ')} (already excluded from scoring).`,
      outcomes: [scen('mismatch remains unexplained', S, C, th)] });
  }

  // smallest single step that can change the current decision
  const changing = steps.filter((st) => st.outcomes.some((o) => o.resultingStatus !== status));
  const smallest = changing.sort((a, b) => a.minimalCount - b.minimalCount || (a.id < b.id ? -1 : 1))[0] ?? null;
  return {
    basis: 'outcomes are logical consequences of the fixed policy; which evidence to seek is a heuristic suggestion; no hypothetical item is asserted to exist',
    smallestChange: smallest ? { stepId: smallest.id, minimalCount: smallest.minimalCount } : null,
    steps,
  };
}
