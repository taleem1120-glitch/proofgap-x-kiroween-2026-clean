/**
 * Evidence Independence Engine.
 *
 * Everything here is derived from DECLARED provenance (derivedFrom / originGroup)
 * plus artifact identity (identical sha256). Nothing here is independently
 * verified; reports label it as such.
 *
 * Model
 *  - Each source resolves to a set of ROOT keys: `source:<id>` for an undeclared-parent
 *    source, `group:<g>` for a declared originGroup, plus every root of every parent.
 *  - Roots that any single source depends on are UNIONED (union-find). An independence
 *    group is a connected component of roots. Two sources are independent only if they
 *    fall in different components. (Fixes D4-D6: no partial-overlap or originGroup bypass.)
 *  - Evidence items that are the same artifact (see analyze.js) but cited under different
 *    sources union those sources' roots too, so credit never depends on id ordering (D3).
 */

export function resolveRoots(sources) {
  const byId = new Map(sources.map((s) => [s.id, s]));
  const memo = new Map();
  const visiting = new Set();
  const roots = (id) => {
    if (memo.has(id)) return memo.get(id);
    if (visiting.has(id)) throw new Error(`derivation cycle at "${id}" (input must be validated first)`);
    visiting.add(id);
    const s = byId.get(id);
    const out = new Set();
    const parents = s.derivedFrom ?? [];
    if (s.originGroup) out.add(`group:${s.originGroup}`);
    if (parents.length === 0 && !s.originGroup) out.add(`source:${id}`);
    for (const p of parents) for (const r of roots(p)) out.add(r);
    visiting.delete(id);
    const arr = [...out].sort();
    memo.set(id, arr);
    return arr;
  };
  const res = new Map();
  for (const s of sources) res.set(s.id, roots(s.id));
  return res;
}

class UnionFind {
  constructor() { this.parent = new Map(); }
  find(x) {
    if (!this.parent.has(x)) this.parent.set(x, x);
    let r = x;
    while (this.parent.get(r) !== r) r = this.parent.get(r);
    while (this.parent.get(x) !== r) { const n = this.parent.get(x); this.parent.set(x, r); x = n; }
    return r;
  }
  union(a, b) { const ra = this.find(a), rb = this.find(b); if (ra !== rb) this.parent.set(ra < rb ? rb : ra, ra < rb ? ra : rb); }
}

/**
 * @param sources validated sources
 * @param artifactSourceSets array of arrays of sourceIds that cite the SAME artifact
 * @returns {rootsBySource, groupOfSource, groups} where group label = sorted component roots joined by '+'
 */
export function buildIndependence(sources, artifactSourceSets = []) {
  const rootsBySource = resolveRoots(sources);
  const uf = new UnionFind();
  for (const rs of rootsBySource.values()) for (const r of rs) uf.union(rs[0], r);
  for (const set of artifactSourceSets) {
    const flat = set.flatMap((id) => rootsBySource.get(id));
    for (const r of flat) uf.union(flat[0], r);
  }
  const comps = new Map();
  for (const rs of rootsBySource.values()) for (const r of rs) {
    const rep = uf.find(r);
    if (!comps.has(rep)) comps.set(rep, new Set());
    comps.get(rep).add(r);
  }
  const labelOfRep = new Map([...comps].map(([rep, set]) => [rep, [...set].sort().join('+')]));
  const groupOfSource = new Map();
  for (const [id, rs] of rootsBySource) groupOfSource.set(id, labelOfRep.get(uf.find(rs[0])));
  return { rootsBySource, groupOfSource, groups: [...new Set(groupOfSource.values())].sort() };
}

/** Declared relationship facts about a source (transitive ancestors, declared group). */
export function describeSources(sources) {
  const byId = new Map(sources.map((s) => [s.id, s]));
  const memo = new Map();
  const anc = (id) => {
    if (memo.has(id)) return memo.get(id);
    const out = new Set();
    for (const p of byId.get(id).derivedFrom ?? []) { out.add(p); for (const a of anc(p)) out.add(a); }
    memo.set(id, out);
    return out;
  };
  const info = new Map();
  for (const s of sources) {
    info.set(s.id, { name: s.name, originGroup: s.originGroup ?? null, directParents: [...(s.derivedFrom ?? [])].sort(), ancestors: [...anc(s.id)].sort() });
  }
  return info;
}

/** Plain-language reasons why a cluster of evidence counts as ONE independent origin. */
export function explainCluster({ label, sourceIds, evidenceIds, mergedArtifacts, info }) {
  const reasons = [];
  for (const id of sourceIds) {
    const i = info.get(id);
    if (i.directParents.length === 0 && !i.originGroup) reasons.push(`Source "${id}" is declared as an original source (no declared parents).`);
    if (i.directParents.length) reasons.push(`Source "${id}" is declared as derived from ${i.directParents.map((p) => `"${p}"`).join(', ')}${i.ancestors.length > i.directParents.length ? ` (transitively from ${i.ancestors.map((p) => `"${p}"`).join(', ')})` : ''}, so it cannot independently corroborate its upstream.`);
    if (i.originGroup) reasons.push(`Source "${id}" declares shared origin group "${i.originGroup}"; sources in the same group are treated as one origin.`);
  }
  for (const a of mergedArtifacts) reasons.push(`Evidence ${a.members.map((m) => `"${m}"`).join(', ')} is the same artifact (${a.basis}); sources ${a.sources.map((s) => `"${s}"`).join(', ')} are therefore treated as one origin.`);
  if (label.includes('+')) reasons.push(`Origin roots ${label.split('+').map((r) => `"${r}"`).join(', ')} are linked by a declared derivation or shared artifact and are merged into one independence group.`);
  reasons.push(`${evidenceIds.length} evidence item(s) in this group count as 1 independent origin. This is based on DECLARED provenance, which has not been independently verified.`);
  return reasons;
}
