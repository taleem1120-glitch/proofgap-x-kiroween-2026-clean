import { createHash } from 'node:crypto';
import { canonicalize } from './canonical.js';
import { packOrigins, describeSources, explainCluster, resolveRoots } from './independence.js';
import { buildGraph } from './graph.js';
import { planClaim } from './planner.js';
import { classify } from './classify.js';
import { analyzeGaps, buildAssumptions } from './gaps.js';
import { integrityNotRequested } from './integrity.js';
import { findNearDuplicatePairs } from './text-similarity.js';

export const ANALYSIS_VERSION = '0.4.0';
export const POLICY = Object.freeze({
  minIndependentOrigins: 2,
  scoring: 'noisy-OR over per-independent-origin strength. Origin strength = max strength of non-derived evidence whose roots contain that root set; derived-only evidence takes the minimum of all derived-only evidence sharing any root, capped by the strongest non-derived evidence sharing any root (D7, D8, D11). If only derived evidence exists, the MINIMUM of its strengths is used so extra copies cannot raise it (D8)',
  independence: 'declared provenance only, evaluated PER CLAIM and stance (D9). Count = maximum number of supporting items whose declared root sets (roots of all sources citing the same artifact, incl. originGroup) are pairwise disjoint (D10, replaces 0.2.0 union-find). Sources holding the same artifact share all of one another\u2019s roots plus an `artifact:` root, inherited by their derivatives (D11). Adding evidence never lowers the count; copies never raise it. Independence is never verified; absence of a declared link means UNKNOWN',
  abstention: 'decision = abstain_possible_undeclared_dependence when the hard classification is SUPPORTED but a heuristic cue (same source name, identical description, or a shared artifact across different declared lineages) touches two of its independent support origins. The hard classification `status` is unchanged and reported separately',
  duplicates: 'identical sha256, or same source + normalized description, are one artifact; their links are merged, not discarded (0.2.0 fixes D1-D2)',
  integrity: 'when local verification is requested, MISMATCH evidence is excluded from scoring. Every safely readable non-empty file is hashed by the tool, also without a declared hash (0.4.0); evidence whose OBSERVED bytes are identical is one artifact. The byte identity is verified; that the holders share an origin is the same policy inference as for declared hashes',
});

export { resolveRoots as resolveOrigins };

const byId = (a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const norm = (s) => s.trim().toLowerCase().replace(/\s+/g, ' ');
/** Noisy-OR combination of strengths; deterministic, order independent. */
const combine = (xs) => Math.round((1 - xs.reduce((p, x) => p * (1 - x), 1)) * 1e4) / 1e4;

/**
 * @param c validated case
 * @param opts.integrity result of verifyEvidenceFiles(); defaults to "not requested"
 */
/**
 * Wording that depends on the application domain. Defaults are the ProofGap X (evidence) texts; changing
 * them never changes classification, scores or structure (tested). Applications pass `opts.profile`.
 */
export const DEFAULT_PROFILE = Object.freeze({
  id: 'proofgap-x',
  disclaimer: 'Prototype analysis of declared evidence provenance. It does not establish forensic authenticity, intent, or guilt, and has not been independently validated.',
  claimCaveat: 'This is a statistical-style confidence heuristic over declared provenance, not a finding of authenticity or guilt.',
});

export function analyzeCase(c, opts = {}) {
  const profile = { ...DEFAULT_PROFILE, ...(opts.profile ?? {}) };
  const integrity = opts.integrity ?? integrityNotRequested(c.evidence);
  const integrityByEvidence = new Map(integrity.results.map((r) => [r.evidenceId, r]));
  const verificationRan = integrity.mode !== 'not_requested';
  const notes = [];

  // --- 1. artifact classes: identical sha256 or same source+description are ONE artifact; links are merged
  const excludedByIntegrity = [];
  const classByKey = new Map();
  for (const e of [...c.evidence].sort(byId)) {
    if (verificationRan && integrityByEvidence.get(e.id)?.status === 'MISMATCH') { excludedByIntegrity.push(e.id); continue; }
    // Identity of an artifact: bytes the tool hashed itself (verified) > declared sha256 > same source + description.
    const ir = verificationRan ? integrityByEvidence.get(e.id) : null;
    const seen = ir?.observedSha256 && !ir.observedEmpty ? ir.observedSha256 : null;
    const key = seen ? `sha256:${seen}` : e.sha256 ? `sha256:${e.sha256}` : `src:${e.sourceId}|${norm(e.description)}`;
    let k = classByKey.get(key);
    if (!k) { k = { canonical: e.id, basis: key.startsWith('sha256:') ? 'sha256' : 'source+description', members: [], sources: new Set(), links: new Map() }; classByKey.set(key, k); }
    k.members.push(e.id); k.sources.add(e.sourceId);
    for (const l of e.links) {
      const lk = `${l.claimId}\u0000${l.stance}`;
      const cur = k.links.get(lk) ?? { claimId: l.claimId, stance: l.stance, strength: 0, evidenceIds: new Set() };
      cur.strength = Math.max(cur.strength, l.strength); cur.evidenceIds.add(e.id);
      k.links.set(lk, cur);
    }
  }
  const classes = [...classByKey.values()].sort((a, b) => cmp(a.canonical, b.canonical));
  const duplicates = [];
  for (const k of classes) for (const m of k.members.slice(1)) duplicates.push({ evidenceId: m, duplicateOf: k.canonical, basis: k.basis });
  const mergedArtifacts = classes.filter((k) => k.sources.size > 1).map((k) => ({ canonical: k.canonical, members: [...k.members], basis: k.basis, sources: [...k.sources].sort() }));

  // --- 2. declared roots of every source (global); grouping into independent origins is done PER CLAIM below
  // Sources holding a byte-identical / same artifact share an origin (D11): give each an artifact root, inherited by derivatives.
  // Holders of the same artifact share ALL of each other's roots (fixpoint; bounded because root sets only grow).
  const extraRoots = new Map();
  for (const a of mergedArtifacts) for (const sid of a.sources) extraRoots.set(sid, new Set([...(extraRoots.get(sid) ?? []), `artifact:${a.canonical}`]));
  let roots = resolveRoots(c.sources, extraRoots);
  for (let iter = 0; iter <= c.sources.length + 1 && mergedArtifacts.length; iter++) {
    let changed = false;
    for (const a of mergedArtifacts) {
      const union = new Set(a.sources.flatMap((sid) => roots.get(sid)));
      for (const sid of a.sources) { const cur = extraRoots.get(sid); const n = cur.size; for (const r of union) cur.add(r); if (cur.size !== n) changed = true; }
    }
    if (!changed) break;
    roots = resolveRoots(c.sources, extraRoots);
  }
  const info = describeSources(c.sources);
  const derivedSources = c.sources.filter((s) => s.derivedFrom?.length || s.originGroup)
    .map((s) => ({ sourceId: s.id, originGroups: roots.get(s.id) })).sort((a, b) => cmp(a.sourceId, b.sourceId));

  // --- 3. heuristic warnings about possible UNDECLARED dependence (never change scores; may trigger abstention)
  const footprint = (ids) => new Set(ids.flatMap((i) => roots.get(i)));
  const disjoint = (x, y) => ![...x].some((r) => y.has(r));
  const warnings = [];
  const nameGroups = new Map();
  for (const s of c.sources) { const n = norm(s.name); nameGroups.set(n, [...(nameGroups.get(n) ?? []), s.id]); }
  for (const [n, ids] of [...nameGroups].sort(([a], [b]) => cmp(a, b))) {
    let independentPair = false;
    for (let i = 0; i < ids.length && !independentPair; i++) for (let j = i + 1; j < ids.length; j++) if (disjoint(footprint([ids[i]]), footprint([ids[j]]))) { independentPair = true; break; }
    if (ids.length > 1 && independentPair) warnings.push({ code: 'SAME_NAME_DIFFERENT_ORIGINS', basis: 'heuristic', sourceIds: [...ids].sort(), message: `Sources ${[...ids].sort().map((i) => `"${i}"`).join(', ')} share the name "${n}" but are declared independent; check for an undeclared common origin.` });
  }
  const evById = new Map(c.evidence.map((e) => [e.id, e]));
  // Bounded near-duplicate text cues are advisory only: they never merge artifacts or alter scores.
  // Compare only distinct artifact classes with disjoint declared roots; short text is ignored.
  const evidenceById = new Map(c.evidence.map((e) => [e.id, e]));
  const nearText = findNearDuplicatePairs(classes.map((k) => ({
    id: k.canonical, text: evidenceById.get(k.canonical).description,
  })));
  for (const pair of nearText.pairs) {
    const left = classes.find((k) => k.canonical === pair.left);
    const right = classes.find((k) => k.canonical === pair.right);
    if (!left || !right) continue;
    const leftRoots = footprint([...left.sources]), rightRoots = footprint([...right.sources]);
    if (!disjoint(leftRoots, rightRoots)) continue;
    warnings.push({
      code: 'NEAR_DUPLICATE_TEXT_ACROSS_ORIGINS', basis: 'heuristic',
      evidenceIds: [pair.left, pair.right].sort(),
      sourceIds: [...new Set([...left.sources, ...right.sources])].sort(),
      similarity: pair.similarity,
      message: `Evidence "${pair.left}" and "${pair.right}" have highly similar normalized text (shingle similarity ${pair.similarity}); this is a review cue only, not proof of copying or shared origin.`,
    });
  }
  if (nearText.truncated) notes.push('Near-duplicate text review was bounded; some candidate pairs may not have been compared.');

  const descGroups = new Map();
  for (const k of classes) { const d = norm(evById.get(k.canonical).description); descGroups.set(d, [...(descGroups.get(d) ?? []), k]); }
  for (const [, ks] of [...descGroups].sort(([a], [b]) => cmp(a, b))) {
    let independentPair = false;
    for (let i = 0; i < ks.length && !independentPair; i++) for (let j = i + 1; j < ks.length; j++) if (disjoint(footprint([...ks[i].sources]), footprint([...ks[j].sources]))) { independentPair = true; break; }
    if (ks.length > 1 && independentPair) warnings.push({ code: 'IDENTICAL_DESCRIPTION_ACROSS_ORIGINS', basis: 'heuristic', evidenceIds: ks.map((k) => k.canonical).sort(), message: `Evidence ${ks.map((k) => `"${k.canonical}"`).join(', ')} have identical descriptions but are declared independent; check whether they are the same material.` });
  }
  // Suspected: a shared artifact links holders whose DECLARED lineages differ. The upstream of each holder may or may not be
  // the source of the shared bytes, so the upstreams are neither merged (D10) nor trusted as independent: flag as suspected.
  const declaredRoots = resolveRoots(c.sources);
  for (const a of mergedArtifacts) {
    const lineages = [...new Set(a.sources.map((sid) => declaredRoots.get(sid).join('+')))].sort();
    if (lineages.length > 1) warnings.push({ code: 'SHARED_ARTIFACT_ACROSS_LINEAGES', basis: 'heuristic', sourceIds: [...a.sources], evidenceIds: [...a.members].sort(),
      rootSets: lineages.map((l) => l.split('+')),
      message: `Evidence ${[...a.members].sort().map((x) => `"${x}"`).join(', ')} is the same artifact held by sources with different declared lineages (${a.sources.map((x) => `"${x}"`).join(', ')}); their upstream origins may share an undeclared source.` });
  }
  warnings.sort((a, b) => cmp(a.code + (a.sourceIds ?? a.evidenceIds).join(), b.code + (b.sourceIds ?? b.evidenceIds).join()));
  if (warnings.length > 100) { notes.push(`${warnings.length - 100} additional warning(s) omitted.`); warnings.length = 100; }

  // --- 4. per-claim links, indexed once
  const claimLinks = new Map(c.claims.map((cl) => [cl.id, []]));
  for (const k of classes) for (const l of k.links.values()) claimLinks.get(l.claimId).push({ k, l });
  const summarize = (m) => [...m.entries()].sort(([a], [b]) => cmp(a, b)).map(([origin, v]) => {
    const strength = v.strength, raw = v.raw;
    return { origin, strength, ...(raw > strength ? { strengthCappedFromDerived: raw } : {}),
      evidenceIds: [...v.evidenceIds].sort(), sourceIds: [...v.sourceIds].sort() };
  });

  const claims = [...c.claims].sort(byId).map((claim) => {
    const items = claimLinks.get(claim.id);
    const sideMaps = { supports: new Map(), contradicts: new Map() };
    let approximate = false;
    for (const side of ['supports', 'contradicts']) {
      const sideItems = items.filter(({ l }) => (l.stance === 'supports') === (side === 'supports'));
      const keyed = sideItems.map(({ k, l }, i) => ({ key: i, k, l, roots: [...k.sources].flatMap((sid) => roots.get(sid)) }));
      // per exact root set: strength of non-derived items (max), else derived-only items (min) — D7/D8
      const labelStats = new Map();
      const labelOfItem = (it) => [...new Set(it.roots)].sort().join('+');
      for (const it of keyed) {
        const st = labelStats.get(labelOfItem(it)) ?? { orig: -1, dmin: Infinity, dmax: -1 };
        const derivedOnly = [...it.k.sources].every((sid) => info.get(sid).directParents.length > 0);
        if (derivedOnly) { st.dmin = Math.min(st.dmin, it.l.strength); st.dmax = Math.max(st.dmax, it.l.strength); } else st.orig = Math.max(st.orig, it.l.strength);
        labelStats.set(labelOfItem(it), st);
      }
      // A derived-only root set cannot carry more strength than non-derived evidence it shares a root with (D7 generalised, D11)
      const nonDerived = keyed.filter((it) => ![...it.k.sources].every((sid) => info.get(sid).directParents.length > 0));
      // non-derived evidence whose roots CONTAIN a root set lends its strength to it (an item is never weaker than its own roots)
      for (const [label, st] of labelStats) {
        const set = label.split('+');
        for (const it of nonDerived) if (set.every((r) => it.roots.includes(r))) st.orig = Math.max(st.orig, it.l.strength);
      }
      const capOf = new Map();
      for (const [label, st] of labelStats) {
        if (st.orig >= 0) continue;
        const set = new Set(label.split('+'));
        const ups = nonDerived.filter((it) => it.roots.some((r) => set.has(r))).map((it) => it.l.strength);
        if (ups.length) capOf.set(label, Math.max(...ups));
      }
      // Derived-only root sets: minimum over ALL derived-only items sharing any root (D8 generalised): derived evidence can only drag strength down.
      const derivedItems = keyed.filter((it) => [...it.k.sources].every((sid) => info.get(sid).directParents.length > 0));
      for (const [label, st] of labelStats) {
        if (st.orig >= 0) continue;
        const set = new Set(label.split('+'));
        for (const it of derivedItems) if (it.roots.some((r) => set.has(r))) st.dmin = Math.min(st.dmin, it.l.strength);
      }
      const strengthOf = (label) => { const st = labelStats.get(label); return st.orig >= 0 ? st.orig : Math.min(st.dmin, capOf.get(label) ?? 1); };
      const pack = packOrigins(keyed, strengthOf);
      approximate ||= pack.approximate;
      const m = sideMaps[side];
      for (const it of keyed) {
        const label = pack.assign.get(it.key);
        const cur = m.get(label) ?? { strength: strengthOf(label), raw: -1, evidenceIds: new Set(), sourceIds: new Set() };
        cur.raw = Math.max(cur.raw, it.l.strength); // reported only, never scored
        for (const id of it.l.evidenceIds) cur.evidenceIds.add(id);
        for (const sid of it.k.sources) cur.sourceIds.add(sid);
        m.set(label, cur);
      }
    }
    const sup = summarize(sideMaps.supports), con = summarize(sideMaps.contradicts);
    const supportScore = combine(sup.map((x) => x.strength));
    const contradictScore = combine(con.map((x) => x.strength));
    const th = POLICY.minIndependentOrigins;

    const status = classify(sup.length, con.length, th);
    const why = [];
    if (status === 'no_evidence') why.push('No effective evidence is linked to this claim.');
    else if (status === 'conflicting') why.push(`${sup.length} independent origin(s) support and ${con.length} contradict this claim; review the conflict manually.`);
    else if (status === 'contradicted') why.push(`Only contradicting evidence from ${con.length} independent origin(s) is linked.`);
    else if (status === 'insufficient_support') why.push(`Support comes from ${sup.length} independent origin(s); at least ${th} are needed. Derived copies and duplicates do not add independence.`);
    else why.push(`Supported by ${sup.length} independent origins (combined score ${supportScore}).`);
    why.push(profile.claimCaveat);

    const supportItems = [...new Set(sup.flatMap((x) => x.evidenceIds))].sort();
    const contradictItems = [...new Set(con.flatMap((x) => x.evidenceIds))].sort();
    const excludedMismatch = excludedByIntegrity.filter((id) => c.evidence.find((e) => e.id === id).links.some((l) => l.claimId === claim.id)).sort();

    const clusterOf = (m) => [...m.entries()].sort(([a], [b]) => cmp(a, b)).map(([label, v]) => {
      const ev = [...v.evidenceIds].sort();
      const sids = [...v.sourceIds].sort();
      const merged = mergedArtifacts.filter((a) => a.sources.some((s) => sids.includes(s)));
      return { origin: label, countsAs: '1 independent origin', evidenceIds: ev, sourceIds: sids,
        reasons: explainCluster({ label, sourceIds: sids, evidenceIds: ev, mergedArtifacts: merged, info }) };
    });
    // Abstention: a heuristic cue links two of the supposedly independent SUPPORT origins.
    const originOfSource = new Map(sup.flatMap((o) => o.sourceIds.map((sid) => [sid, o.origin])));
    const originOfEvidence = new Map(sup.flatMap((o) => o.evidenceIds.map((eid) => [eid, o.origin])));
    const touches = (o, set) => o.origin.split('+').some((r) => set.includes(r));
    const cues = warnings.filter((w) => {
      if (w.rootSets) return w.rootSets.some((A, i) => w.rootSets.some((B, j) => i !== j && sup.some((o1) => touches(o1, A) && sup.some((o2) => o2 !== o1 && touches(o2, B)))));
      return new Set((w.sourceIds ?? []).map((x) => originOfSource.get(x)).concat((w.evidenceIds ?? []).map((x) => originOfEvidence.get(x))).filter(Boolean)).size >= 2;
    });
    const decision = status === 'supported_by_independent_origins' && cues.length ? 'abstain_possible_undeclared_dependence' : status;
    if (decision !== status) why.push(`ABSTAINING from "supported": heuristic cue(s) ${cues.map((w) => w.code).join(', ')} suggest that some of these origins may share an undeclared source. Hard classification remains "${status}"; resolve the cue before relying on it.`);
    const gaps = analyzeGaps({ claimId: claim.id, status, support: sup, contradict: con, supportItems, contradictItems, integrityByEvidence, integrityMode: integrity.mode, excludedMismatch, threshold: th });

    return {
      claimId: claim.id, statement: claim.statement, status, decision, abstentionCues: cues.map((w) => w.code), supportScore, contradictScore,
      independentSupportOrigins: sup, independentContradictOrigins: con, explanation: why,
      corroboration: {
        supportingEvidenceItems: supportItems.length, independentSupportOrigins: sup.length,
        apparentExcess: Math.max(0, supportItems.length - sup.length),
        falseCorroboration: supportItems.length >= 2 && supportItems.length > sup.length,
        independenceBasis: 'declared_provenance_not_independently_verified',
        approximate,
        clusters: { supports: clusterOf(sideMaps.supports), contradicts: clusterOf(sideMaps.contradicts) },
      },
      findings: gaps.findings, requirements: gaps.requirements,
      assumptions: buildAssumptions({ hasEvidence: sup.length + con.length > 0, supportItems, integrityByEvidence, threshold: th }),
      plan: planClaim({ status, support: sup, contradict: con, threshold: th, cues, supportItems, integrityByEvidence, excludedMismatch, combine }),
    };
  });

  const counts = {}, decisions = {};
  for (const cl of claims) { counts[cl.status] = (counts[cl.status] ?? 0) + 1; decisions[cl.decision] = (decisions[cl.decision] ?? 0) + 1; }
  if (duplicates.length) notes.push(`${duplicates.length} duplicate evidence item(s) were merged into their canonical artifact; their links are kept but count once.`);
  if (excludedByIntegrity.length) notes.push(`${excludedByIntegrity.length} evidence item(s) failed SHA-256 verification and were excluded from scoring.`);

  return {
    tool: 'proofgap-x', analysisVersion: ANALYSIS_VERSION, schemaVersion: '1.0',
    caseId: c.caseId, title: c.title,
    inputSha256: createHash('sha256').update(canonicalize(c)).digest('hex'),
    disclaimer: profile.disclaimer,
    ...(opts.profile ? { application: profile.id } : {}),
    policy: POLICY,
    trust: {
      declaredOnly: ['derivedFrom', 'originGroup', 'strength', 'stance', 'sha256 values whose integrity status is not VERIFIED'],
      independentlyVerified: { sha256Matches: integrity.counts.VERIFIED ?? 0, provenance: 0, independence: 0 },
      note: 'Only SHA-256 byte equality against local files can be verified by this tool. Provenance and independence are never verified.',
    },
    summary: { claims: claims.length, evidence: c.evidence.length, effectiveEvidence: classes.length, statusCounts: Object.fromEntries(Object.entries(counts).sort()), decisionCounts: Object.fromEntries(Object.entries(decisions).sort()) },
    integrity, duplicates, artifacts: mergedArtifacts, excludedByIntegrity, derivedSources, claims, warnings, notes,
    graph: buildGraph({ c, classes, roots, integrityByEvidence, warnings, claims }),
  };
}
