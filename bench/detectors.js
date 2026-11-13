// Detectors answer one question per claim: "is this claim corroborated by >= 2 independent origins?"
// They see ONLY the case JSON (never the hidden truth).
import { analyzeCase } from '../src/index.js';
import { analyzeCase as analyzeCaseV010 } from './legacy/analyze-0.1.0.js';
import { analyzeCase as analyzeCaseV020 } from './legacy/v0.2.0/src/analyze.js';

const supportsOf = (c, claimId) => c.evidence.filter((e) => e.links.some((l) => l.claimId === claimId && l.stance === 'supports'));
const distinct = (xs) => new Set(xs).size;

export const DETECTORS = {
  // B0: how many pieces of evidence?
  B0_item_count: (c, id) => supportsOf(c, id).length >= 2,
  // B1: how many distinct source ids?
  B1_distinct_sources: (c, id) => distinct(supportsOf(c, id).map((e) => e.sourceId)) >= 2,
  // B2: drop exact-hash duplicates (first id wins, as in ProofGap 0.1.0), then count distinct sources.
  B2_dedupe_hash_then_sources: (c, id) => {
    const seen = new Set(), kept = [];
    for (const e of [...supportsOf(c, id)].sort((a, b) => (a.id < b.id ? -1 : 1))) { if (e.sha256 && seen.has(e.sha256)) continue; if (e.sha256) seen.add(e.sha256); kept.push(e); }
    return distinct(kept.map((e) => e.sourceId)) >= 2;
  },
  // B3: additionally ignore any source that declares derivedFrom or originGroup (simple "originals only" filter).
  B3_originals_only: (c, id) => {
    const bad = new Set(c.sources.filter((s) => s.derivedFrom?.length || s.originGroup).map((s) => s.id));
    const seen = new Set(), kept = [];
    for (const e of [...supportsOf(c, id)].sort((a, b) => (a.id < b.id ? -1 : 1))) { if (bad.has(e.sourceId)) continue; if (e.sha256 && seen.has(e.sha256)) continue; if (e.sha256) seen.add(e.sha256); kept.push(e); }
    return distinct(kept.map((e) => e.sourceId)) >= 2;
  },
  // ProofGap X 0.1.0 (Phase 1/2 engine, extracted verbatim from git history) — before the Phase 3 defect fixes.
  P_proofgap_0_1_0: (c, id) => analyzeCaseV010(c).claims.find((x) => x.claimId === id).independentSupportOrigins.length >= 2,
  // ProofGap X 0.2.0 (Phase 3 engine, extracted verbatim from git 391206b into bench/legacy/v0.2.0).
  P_proofgap_0_2_0: (c, id) => analyzeCaseV020(c).claims.find((x) => x.claimId === id).independentSupportOrigins.length >= 2,
  // ProofGap X current, HARD classification (status) only.
  P_proofgap_current: (c, id, rep) => rep.claims.find((x) => x.claimId === id).independentSupportOrigins.length >= 2,
  // ProofGap X current DECISION: positive only if decision is supported; abstention counts as "not asserted".
  P_proofgap_current_decision: (c, id, rep) => rep.claims.find((x) => x.claimId === id).decision === 'supported_by_independent_origins',
};

export const analyzeForBench = (c) => analyzeCase(c);
