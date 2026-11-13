import { createHash } from 'node:crypto';
import { canonicalize } from './canonical.js';

export const ANALYSIS_VERSION = '0.1.0';
const MIN_INDEPENDENT_ORIGINS = 2;

/**
 * Resolve each source to its independence group: the sorted set of root
 * origins it derives from (or its explicit originGroup). Sources sharing a
 * group are NOT independent of each other.
 */
export function resolveOrigins(sources) {
  const byId = new Map(sources.map((s) => [s.id, s]));
  const memo = new Map();
  const roots = (id) => {
    if (memo.has(id)) return memo.get(id);
    const s = byId.get(id);
    let result;
    if (s.originGroup) result = new Set([`group:${s.originGroup}`]);
    else if (!s.derivedFrom || s.derivedFrom.length === 0) result = new Set([`source:${id}`]);
    else { result = new Set(); for (const p of s.derivedFrom) for (const r of roots(p)) result.add(r); }
    memo.set(id, result);
    return result;
  };
  const out = new Map();
  for (const s of sources) out.set(s.id, [...roots(s.id)].sort());
  return out;
}

/** Noisy-OR combination of strengths; deterministic, order independent. */
const combine = (xs) => Math.round((1 - xs.reduce((p, x) => p * (1 - x), 1)) * 1e4) / 1e4;

export function analyzeCase(c) {
  const origins = resolveOrigins(c.sources);
  const notes = [];

  // Duplicate evidence: same sha256 (or same source+description) counts once.
  const seen = new Map();
  const duplicates = [];
  const effective = [];
  for (const e of [...c.evidence].sort((a, b) => (a.id < b.id ? -1 : 1))) {
    const key = e.sha256 ? `sha256:${e.sha256}` : `src:${e.sourceId}|${e.description.trim().toLowerCase()}`;
    if (seen.has(key)) duplicates.push({ evidenceId: e.id, duplicateOf: seen.get(key), basis: key.startsWith('sha256') ? 'sha256' : 'source+description' });
    else { seen.set(key, e.id); effective.push(e); }
  }

  const derivedSources = c.sources
    .filter((s) => (s.derivedFrom && s.derivedFrom.length) || s.originGroup)
    .map((s) => ({ sourceId: s.id, originGroups: origins.get(s.id) }))
    .sort((a, b) => (a.sourceId < b.sourceId ? -1 : 1));

  const claims = [...c.claims].sort((a, b) => (a.id < b.id ? -1 : 1)).map((claim) => {
    const side = { supports: new Map(), contradicts: new Map() }; // groupKey -> {strength, evidenceIds}
    for (const e of effective) for (const l of e.links) {
      if (l.claimId !== claim.id) continue;
      const key = origins.get(e.sourceId).join('+');
      const m = side[l.stance];
      const cur = m.get(key) ?? { strength: 0, evidenceIds: [] };
      cur.strength = Math.max(cur.strength, l.strength); // one origin counts once
      cur.evidenceIds.push(e.id);
      m.set(key, cur);
    }
    const summarize = (m) => [...m.entries()].sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([origin, v]) => ({ origin, strength: v.strength, evidenceIds: v.evidenceIds.sort() }));
    const sup = summarize(side.supports), con = summarize(side.contradicts);
    const supportScore = combine(sup.map((x) => x.strength));
    const contradictScore = combine(con.map((x) => x.strength));

    let status; const why = [];
    if (sup.length === 0 && con.length === 0) {
      status = 'no_evidence'; why.push('No effective evidence is linked to this claim.');
    } else if (sup.length > 0 && con.length > 0) {
      status = 'conflicting';
      why.push(`${sup.length} independent origin(s) support and ${con.length} contradict this claim; review the conflict manually.`);
    } else if (con.length > 0) {
      status = 'contradicted';
      why.push(`Only contradicting evidence from ${con.length} independent origin(s) is linked.`);
    } else if (sup.length < MIN_INDEPENDENT_ORIGINS) {
      status = 'insufficient_support';
      why.push(`Support comes from ${sup.length} independent origin(s); at least ${MIN_INDEPENDENT_ORIGINS} are needed. Derived copies and duplicates do not add independence.`);
    } else {
      status = 'supported_by_independent_origins';
      why.push(`Supported by ${sup.length} independent origins (combined score ${supportScore}).`);
    }
    why.push('This is a statistical-style confidence heuristic over declared provenance, not a finding of authenticity or guilt.');
    return { claimId: claim.id, statement: claim.statement, status, supportScore, contradictScore,
      independentSupportOrigins: sup, independentContradictOrigins: con, explanation: why };
  });

  const counts = {};
  for (const cl of claims) counts[cl.status] = (counts[cl.status] ?? 0) + 1;
  if (duplicates.length) notes.push(`${duplicates.length} duplicate evidence item(s) were excluded from scoring.`);

  return {
    tool: 'proofgap-x', analysisVersion: ANALYSIS_VERSION, schemaVersion: '1.0',
    caseId: c.caseId, title: c.title,
    inputSha256: createHash('sha256').update(canonicalize(c)).digest('hex'),
    disclaimer: 'Prototype analysis of declared evidence provenance. It does not establish forensic authenticity, intent, or guilt, and has not been independently validated.',
    summary: { claims: claims.length, evidence: c.evidence.length, effectiveEvidence: effective.length, statusCounts: Object.fromEntries(Object.entries(counts).sort()) },
    duplicates, derivedSources, claims, notes,
  };
}
