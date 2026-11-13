import { createHash } from 'node:crypto';
import { canonicalize } from './canonical.js';
import { buildIndependence, describeSources, explainCluster, resolveRoots } from './independence.js';
import { analyzeGaps, buildAssumptions } from './gaps.js';
import { integrityNotRequested } from './integrity.js';

export const ANALYSIS_VERSION = '0.2.0';
export const POLICY = Object.freeze({
  minIndependentOrigins: 2,
  scoring: 'noisy-OR over per-independent-origin strength. Origin strength = max strength of non-derived evidence; derived copies cannot raise it (0.2.0 fixes D7). If only derived evidence exists, the MINIMUM of its strengths is used so extra copies cannot raise it (D8)',
  independence: 'declared provenance only; sources sharing any root origin, originGroup, or identical artifact form one group (0.2.0 fixes defects D3-D6)',
  duplicates: 'identical sha256, or same source + normalized description, are one artifact; their links are merged, not discarded (0.2.0 fixes D1-D2)',
  integrity: 'when local verification is requested, MISMATCH evidence is excluded from scoring; all other states leave scoring unchanged but are reported',
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
export function analyzeCase(c, opts = {}) {
  const integrity = opts.integrity ?? integrityNotRequested(c.evidence);
  const integrityByEvidence = new Map(integrity.results.map((r) => [r.evidenceId, r]));
  const verificationRan = integrity.mode !== 'not_requested';
  const notes = [];

  // --- 1. artifact classes: identical sha256 or same source+description are ONE artifact; links are merged
  const excludedByIntegrity = [];
  const classByKey = new Map();
  for (const e of [...c.evidence].sort(byId)) {
    if (verificationRan && integrityByEvidence.get(e.id)?.status === 'MISMATCH') { excludedByIntegrity.push(e.id); continue; }
    const key = e.sha256 ? `sha256:${e.sha256}` : `src:${e.sourceId}|${norm(e.description)}`;
    let k = classByKey.get(key);
    if (!k) { k = { canonical: e.id, basis: e.sha256 ? 'sha256' : 'source+description', members: [], sources: new Set(), links: new Map() }; classByKey.set(key, k); }
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

  // --- 2. independence groups from declared provenance (+ shared artifacts)
  const ind = buildIndependence(c.sources, mergedArtifacts.map((a) => a.sources));
  const info = describeSources(c.sources);
  const groupOf = (k) => ind.groupOfSource.get([...k.sources].sort()[0]);

  const derivedSources = c.sources.filter((s) => s.derivedFrom?.length || s.originGroup)
    .map((s) => ({ sourceId: s.id, originGroups: ind.rootsBySource.get(s.id) })).sort((a, b) => cmp(a.sourceId, b.sourceId));

  // --- 3. per-claim contributions (indexed once)
  const contrib = new Map(c.claims.map((cl) => [cl.id, { supports: new Map(), contradicts: new Map() }]));
  for (const k of classes) for (const l of k.links.values()) {
    const m = contrib.get(l.claimId)[l.stance === 'supports' ? 'supports' : 'contradicts'];
    const label = groupOf(k);
    const cur = m.get(label) ?? { strengthOriginal: -1, derivedMin: Infinity, derivedMax: -1, evidenceIds: new Set(), sourceIds: new Set(), classes: new Set() };
    // A derived-only artifact (every citing source declares parents) cannot add strength beyond its upstream.
    const derivedOnly = [...k.sources].every((sid) => info.get(sid).directParents.length > 0);
    if (derivedOnly) { cur.derivedMin = Math.min(cur.derivedMin, l.strength); cur.derivedMax = Math.max(cur.derivedMax, l.strength); }
    else cur.strengthOriginal = Math.max(cur.strengthOriginal, l.strength);
    for (const id of l.evidenceIds) cur.evidenceIds.add(id);
    for (const s of k.sources) cur.sourceIds.add(s);
    cur.classes.add(k);
    m.set(label, cur);
  }
  const summarize = (m) => [...m.entries()].sort(([a], [b]) => cmp(a, b)).map(([origin, v]) => {
    const strength = v.strengthOriginal >= 0 ? v.strengthOriginal : v.derivedMin;
    const raw = Math.max(v.strengthOriginal, v.derivedMax);
    return { origin, strength, ...(raw > strength ? { strengthCappedFromDerived: raw } : {}),
      evidenceIds: [...v.evidenceIds].sort(), sourceIds: [...v.sourceIds].sort() };
  });

  const claims = [...c.claims].sort(byId).map((claim) => {
    const sideMaps = contrib.get(claim.id);
    const sup = summarize(sideMaps.supports), con = summarize(sideMaps.contradicts);
    const supportScore = combine(sup.map((x) => x.strength));
    const contradictScore = combine(con.map((x) => x.strength));
    const th = POLICY.minIndependentOrigins;

    let status; const why = [];
    if (sup.length === 0 && con.length === 0) {
      status = 'no_evidence'; why.push('No effective evidence is linked to this claim.');
    } else if (sup.length > 0 && con.length > 0) {
      status = 'conflicting';
      why.push(`${sup.length} independent origin(s) support and ${con.length} contradict this claim; review the conflict manually.`);
    } else if (con.length > 0) {
      status = 'contradicted';
      why.push(`Only contradicting evidence from ${con.length} independent origin(s) is linked.`);
    } else if (sup.length < th) {
      status = 'insufficient_support';
      why.push(`Support comes from ${sup.length} independent origin(s); at least ${th} are needed. Derived copies and duplicates do not add independence.`);
    } else {
      status = 'supported_by_independent_origins';
      why.push(`Supported by ${sup.length} independent origins (combined score ${supportScore}).`);
    }
    why.push('This is a statistical-style confidence heuristic over declared provenance, not a finding of authenticity or guilt.');

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
    const gaps = analyzeGaps({ claimId: claim.id, status, support: sup, contradict: con, supportItems, contradictItems, integrityByEvidence, integrityMode: integrity.mode, excludedMismatch, threshold: th });

    return {
      claimId: claim.id, statement: claim.statement, status, supportScore, contradictScore,
      independentSupportOrigins: sup, independentContradictOrigins: con, explanation: why,
      corroboration: {
        supportingEvidenceItems: supportItems.length, independentSupportOrigins: sup.length,
        apparentExcess: Math.max(0, supportItems.length - sup.length),
        falseCorroboration: supportItems.length >= 2 && supportItems.length > sup.length,
        independenceBasis: 'declared_provenance_not_independently_verified',
        clusters: { supports: clusterOf(sideMaps.supports), contradicts: clusterOf(sideMaps.contradicts) },
      },
      findings: gaps.findings, requirements: gaps.requirements,
      assumptions: buildAssumptions({ hasEvidence: sup.length + con.length > 0, supportItems, integrityByEvidence, threshold: th }),
    };
  });

  // --- 4. heuristic warnings about possible UNDECLARED dependence (never change scores)
  const warnings = [];
  const nameGroups = new Map();
  for (const s of c.sources) { const n = norm(s.name); nameGroups.set(n, [...(nameGroups.get(n) ?? []), s.id]); }
  for (const [n, ids] of [...nameGroups].sort(([a], [b]) => cmp(a, b))) {
    const groups = new Set(ids.map((i) => ind.groupOfSource.get(i)));
    if (ids.length > 1 && groups.size > 1) warnings.push({ code: 'SAME_NAME_DIFFERENT_ORIGINS', basis: 'heuristic', sourceIds: ids.sort(), message: `Sources ${ids.map((i) => `"${i}"`).join(', ')} share the name "${n}" but are declared independent; check for an undeclared common origin.` });
  }
  const descGroups = new Map();
  for (const k of classes) { const e = c.evidence.find((x) => x.id === k.canonical); const d = norm(e.description); descGroups.set(d, [...(descGroups.get(d) ?? []), k]); }
  for (const [d, ks] of [...descGroups].sort(([a], [b]) => cmp(a, b))) {
    const groups = new Set(ks.map(groupOf));
    if (ks.length > 1 && groups.size > 1) warnings.push({ code: 'IDENTICAL_DESCRIPTION_ACROSS_ORIGINS', basis: 'heuristic', evidenceIds: ks.map((k) => k.canonical).sort(), message: `Evidence ${ks.map((k) => `"${k.canonical}"`).join(', ')} have identical descriptions but are declared independent; check whether they are the same material.` });
  }
  warnings.sort((a, b) => cmp(a.code + (a.sourceIds ?? a.evidenceIds).join(), b.code + (b.sourceIds ?? b.evidenceIds).join()));
  if (warnings.length > 100) { notes.push(`${warnings.length - 100} additional warning(s) omitted.`); warnings.length = 100; }

  const counts = {};
  for (const cl of claims) counts[cl.status] = (counts[cl.status] ?? 0) + 1;
  if (duplicates.length) notes.push(`${duplicates.length} duplicate evidence item(s) were merged into their canonical artifact; their links are kept but count once.`);
  if (excludedByIntegrity.length) notes.push(`${excludedByIntegrity.length} evidence item(s) failed SHA-256 verification and were excluded from scoring.`);

  return {
    tool: 'proofgap-x', analysisVersion: ANALYSIS_VERSION, schemaVersion: '1.0',
    caseId: c.caseId, title: c.title,
    inputSha256: createHash('sha256').update(canonicalize(c)).digest('hex'),
    disclaimer: 'Prototype analysis of declared evidence provenance. It does not establish forensic authenticity, intent, or guilt, and has not been independently validated.',
    policy: POLICY,
    trust: {
      declaredOnly: ['derivedFrom', 'originGroup', 'strength', 'stance', 'sha256 values whose integrity status is not VERIFIED'],
      independentlyVerified: { sha256Matches: integrity.counts.VERIFIED ?? 0, provenance: 0, independence: 0 },
      note: 'Only SHA-256 byte equality against local files can be verified by this tool. Provenance and independence are never verified.',
    },
    summary: { claims: claims.length, evidence: c.evidence.length, effectiveEvidence: classes.length, statusCounts: Object.fromEntries(Object.entries(counts).sort()) },
    integrity, duplicates, artifacts: mergedArtifacts, excludedByIntegrity, derivedSources, claims, warnings, notes,
  };
}
