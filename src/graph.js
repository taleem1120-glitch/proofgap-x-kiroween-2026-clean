/**
 * Evidence Independence Graph (machine-readable; rendered by the local viewer).
 *
 * Every edge carries a `basis`:
 *   verified  – checked by this tool against local bytes (only: two evidence files the tool hashed
 *               itself with identical non-empty bytes; with or without a declared hash)
 *   declared  – stated by the case author (derivedFrom, originGroup, held_by, supports/contradicts, equal declared hashes)
 *   suspected – heuristic cue only (same source name, identical description); never changes scores
 *   unknown   – no declared relationship between two origins that both bear on a claim; the policy
 *               TREATS them as independent, but independence is unknown, not established
 */
const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

export function buildGraph({ c, classes, roots, integrityByEvidence, warnings, claims }) {
  const nodes = [], edges = [];
  const groups = [...new Set(c.sources.filter((s) => s.originGroup).map((s) => s.originGroup))].sort();
  for (const s of [...c.sources].sort((a, b) => cmp(a.id, b.id))) {
    nodes.push({ id: `source:${s.id}`, type: 'source', ref: s.id, label: s.name,
      role: s.derivedFrom?.length ? 'derived' : s.originGroup ? 'grouped' : 'declared_original', roots: roots.get(s.id) });
  }
  for (const g of groups) nodes.push({ id: `group:${g}`, type: 'origin_group', ref: g, label: g });
  for (const e of [...c.evidence].sort((a, b) => cmp(a.id, b.id))) {
    const i = integrityByEvidence.get(e.id);
    nodes.push({ id: `evidence:${e.id}`, type: 'evidence', ref: e.id, label: e.description, integrity: i?.status ?? 'NOT_CHECKED', hasDeclaredHash: Boolean(e.sha256) });
  }
  for (const cl of claims) nodes.push({ id: `claim:${cl.claimId}`, type: 'claim', ref: cl.claimId, label: cl.statement, status: cl.status, decision: cl.decision });

  const add = (from, to, relation, basis, extra = {}) => edges.push({ from, to, relation, basis, ...extra });
  for (const s of c.sources) {
    for (const p of s.derivedFrom ?? []) add(`source:${s.id}`, `source:${p}`, 'derived_from', 'declared');
    if (s.originGroup) add(`source:${s.id}`, `group:${s.originGroup}`, 'member_of_origin_group', 'declared');
  }
  for (const e of c.evidence) {
    add(`evidence:${e.id}`, `source:${e.sourceId}`, 'held_by', 'declared');
    for (const l of e.links) add(`evidence:${e.id}`, `claim:${l.claimId}`, l.stance, 'declared', { strength: l.strength });
  }
  for (const k of classes) {
    const [first, ...rest] = [...k.members].sort();
    for (const m of rest) {
      // verified only if the tool hashed BOTH files itself and got the same non-empty bytes
      const o1 = integrityByEvidence.get(first), o2 = integrityByEvidence.get(m);
      const bothObserved = k.basis === 'sha256' && o1?.observedSha256 && !o1.observedEmpty && o1.observedSha256 === o2?.observedSha256;
      const declaredBoth = Boolean(o1?.declaredSha256 && o2?.declaredSha256);
      add(`evidence:${m}`, `evidence:${first}`, k.basis === 'sha256' ? 'same_bytes' : 'same_source_and_description', bothObserved ? 'verified' : 'declared',
        bothObserved && !declaredBoth ? { discoveredBy: 'local_hashing' } : {});
    }
  }
  for (const w of warnings) {
    const ids = w.sourceIds ? w.sourceIds.map((x) => `source:${x}`) : w.evidenceIds.map((x) => `evidence:${x}`);
    for (let i = 1; i < ids.length; i++) add(ids[i], ids[0], 'possibly_same_origin', 'suspected', { cue: w.code });
  }
  const originLabels = [...new Set(claims.flatMap((cl) => [...cl.independentSupportOrigins, ...cl.independentContradictOrigins].map((o) => o.origin)))].sort();
  for (const o of originLabels) nodes.push({ id: `origin:${o}`, type: 'origin', ref: o, label: o, roots: o.split('+') });
  // unknown: pairs of distinct origins bearing on the same claim, with no declared link (policy treats them as independent)
  for (const cl of claims) {
    const origins = [...cl.independentSupportOrigins, ...cl.independentContradictOrigins].map((o) => o.origin);
    const uniq = [...new Set(origins)].sort();
    for (let i = 0; i < uniq.length; i++) for (let j = i + 1; j < uniq.length; j++) {
      add(`origin:${uniq[i]}`, `origin:${uniq[j]}`, 'independence_not_established', 'unknown', { claimId: cl.claimId });
    }
  }
  edges.sort((a, b) => cmp(JSON.stringify([a.basis, a.relation, a.from, a.to, a.claimId ?? "", a.strength ?? -1, a.cue ?? "", a.discoveredBy ?? ""]), JSON.stringify([b.basis, b.relation, b.from, b.to, b.claimId ?? "", b.strength ?? -1, b.cue ?? "", b.discoveredBy ?? ""])));
  const basisCounts = { verified: 0, declared: 0, suspected: 0, unknown: 0 };
  for (const e of edges) basisCounts[e.basis]++;
  return { nodes, edges, basisCounts };
}
