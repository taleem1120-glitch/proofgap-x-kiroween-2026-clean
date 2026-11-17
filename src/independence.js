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

export function resolveRoots(sources, extraRoots = new Map()) {
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
    for (const r of extraRoots.get(id) ?? []) out.add(r); // shared-artifact roots (D11), inherited by derivatives
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
 * Group the given sources into independence groups.
 * Locality: ONLY the listed sourceIds (those cited for the claim being analysed) take part, so a source that does not
 * bear on the claim can never merge origins that do (fixes D9). Sources sharing any root, and sources that cite the
 * same artifact, are merged. Label = sorted component roots (restricted to the listed sources) joined by '+'.
 * @returns Map sourceId -> group label
 */
export function groupSources(rootsBySource, sourceIds, artifactSourceSets = []) {
  const uf = new UnionFind();
  for (const id of sourceIds) { const rs = rootsBySource.get(id); for (const r of rs) uf.union(rs[0], r); }
  // A non-citing source must never become an implicit bridge between claim sources.
  // Restrict artifact joins to the local claim source set (D9).
  const localIds = new Set(sourceIds);
  for (const set of artifactSourceSets) {
    const flat = [...new Set(set.filter((id) => localIds.has(id)))].flatMap((id) => rootsBySource.get(id));
    for (const r of flat) uf.union(flat[0], r);
  }
  const comps = new Map();
  for (const id of sourceIds) for (const r of rootsBySource.get(id)) {
    const rep = uf.find(r);
    if (!comps.has(rep)) comps.set(rep, new Set());
    comps.get(rep).add(r);
  }
  const label = new Map([...comps].map(([rep, set]) => [rep, [...set].sort().join('+')]));
  const out = new Map();
  for (const id of sourceIds) out.set(id, label.get(uf.find(rootsBySource.get(id)[0])));
  return out;
}

/** Whole-case grouping (all sources participate). Kept for callers that need a global view. */
export function buildIndependence(sources, artifactSourceSets = []) {
  const rootsBySource = resolveRoots(sources);
  const groupOfSource = groupSources(rootsBySource, sources.map((s) => s.id), artifactSourceSets);
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

/**
 * Independent-origin packing (analysis 0.3.0, fixes D10).
 *
 * Definition: the number of independent origins behind a set of items is the MAXIMUM number of items
 * whose declared root sets are pairwise disjoint. Properties (tested):
 *  - adding an item never lowers the count (no "corroboration denial" by adding a bridge/copy);
 *  - an item whose roots are a superset of another's (a copy/merge) never raises it;
 *  - items sharing any root can never both be counted.
 * Exact for overlap components of up to EXACT_LIMIT minimal root sets; larger components use a deterministic
 * greedy (smallest set first) and are flagged `approximate: true` (greedy may UNDER-count, never over-count).
 * @param items [{ key, roots: string[] }]
 * @returns { origins: [{ label, rootsKey }], assign: Map key -> label, approximate }
 */
export const EXACT_LIMIT = 22;
/**
 * @param items [{ key, roots: string[] }]
 * @param weightOf (label) => strength in [0,1] of that exact root set (used only to choose among equally large packings,
 *        so that the choice never depends on identifiers; ties after weight fall back to labels, which then cannot
 *        change counts or scores)
 */
export function packOrigins(items, weightOf = () => 0) {
  const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
  // Fail closed: malformed or ambiguous roots must never become counted origins.
  // The public label format uses "+" as a separator; accepting "+" inside roots
  // would make different root sets indistinguishable. Schema validation should
  // enforce the same restriction at the input boundary.
  if (!Array.isArray(items)) throw new TypeError('items must be an array');
  const itemKeys = new Set();
  for (const item of items) {
    if (item == null || !Array.isArray(item.roots) || item.roots.length === 0)
      throw new TypeError('each item must have a nonempty roots array');
    if (itemKeys.has(item.key)) throw new Error('duplicate evidence key');
    itemKeys.add(item.key);
    for (const root of item.roots)
      if (typeof root !== 'string' || root.length === 0 || root.includes('+'))
        throw new TypeError('root must be a nonempty string without +');
  }
  const byLabel = new Map();
  const labelOf = (it) => [...new Set(it.roots)].sort().join('+');
  for (const it of items) { const label = labelOf(it); if (!byLabel.has(label)) byLabel.set(label, new Set(label.split('+'))); }
  const labels = [...byLabel.keys()].sort((a, b) => byLabel.get(a).size - byLabel.get(b).size || cmp(a, b));
  const isSubset = (m, l) => [...byLabel.get(m)].every((r) => byLabel.get(l).has(r));
  // keep only minimal root sets (a strict superset can always be swapped for its subset without losing disjointness)
  const minimal = labels.filter((l) => !labels.some((m) => m !== l && byLabel.get(m).size < byLabel.get(l).size && isSubset(m, l)));
  const overlaps = (a, b) => { const A = byLabel.get(a), B = byLabel.get(b); for (const r of A) if (B.has(r)) return true; return false; };
  // Evaluate and validate every retained label exactly once, including singleton
  // components that never enter the exact-search comparator.
  const logWeights = new Map();
  for (const label of minimal) {
    const strength = weightOf(label);
    if (typeof strength !== 'number' || !Number.isFinite(strength) || strength < 0 || strength > 1) {
      throw new TypeError('weightOf must return a finite strength in [0, 1]');
    }
    logWeights.set(label, -Math.log(1 - Math.min(strength, 0.999999)));
  }
  const logw = (l) => logWeights.get(l);
  const seen = new Set(), comps = [];
  for (const l of minimal) {
    if (seen.has(l)) continue;
    const comp = [], stack = [l]; seen.add(l);
    while (stack.length) { const x = stack.pop(); comp.push(x); for (const y of minimal) if (!seen.has(y) && overlaps(x, y)) { seen.add(y); stack.push(y); } }
    comps.push(comp.sort((a, b) => logw(b) - logw(a) || cmp(a, b)));
  }
  let approximate = false;
  const chosen = [];
  for (const comp of comps) {
    if (comp.length === 1) { chosen.push(comp[0]); continue; }
    if (comp.length <= EXACT_LIMIT) {
      // Precompute conflict bitmasks once. The previous exact search repeatedly walked
      // root Sets for every candidate/picked pair; this turns the hot inner loop into
      // integer bit tests and adds a safe upper-bound prune.
      const conflictMasks = comp.map((label, i) => {
        let mask = 0;
        for (let j = 0; j < comp.length; j++) if (i !== j && overlaps(label, comp[j])) mask |= (1 << j);
        return mask;
      });
      const weights = comp.map(logw);
      let best = [], bestW = -1;
      const rec = (i, picked, w, blocked) => {
        if (i === comp.length) {
          if (picked.length > best.length || (picked.length === best.length && w > bestW + 1e-12)) {
            best = [...picked]; bestW = w;
          }
          return;
        }
        // Even if every remaining non-conflicting vertex were selected, could this
        // branch beat the best? This is an admissible upper bound, never a heuristic.
        let available = 0, upperWeight = w;
        for (let j = i; j < comp.length; j++) {
          if ((blocked & (1 << j)) === 0) { available++; upperWeight += Math.max(0, weights[j]); }
        }
        if (picked.length + available < best.length) return;
        if (picked.length + available === best.length && upperWeight <= bestW + 1e-12) return;
        const bit = 1 << i;
        if ((blocked & bit) === 0) {
          picked.push(comp[i]);
          rec(i + 1, picked, w + weights[i], blocked | conflictMasks[i] | bit);
          picked.pop();
        }
        rec(i + 1, picked, w, blocked);
      };
      rec(0, [], 0, 0);
      chosen.push(...best);
    } else {
      approximate = true; // greedy: may under-count, never over-count
      const picked = [];
      for (const l of [...comp].sort((a, b) => byLabel.get(a).size - byLabel.get(b).size || logw(b) - logw(a) || cmp(a, b))) if (picked.every((p) => !overlaps(p, l))) picked.push(l);
      chosen.push(...picked);
    }
  }
  chosen.sort(cmp);
  const assign = new Map();
  for (const it of items) {
    const label = labelOf(it), set = byLabel.get(label);
    assign.set(it.key, chosen.includes(label) ? label : chosen.find((c) => [...byLabel.get(c)].some((r) => set.has(r))));
  }
  return { origins: chosen, assign, approximate, labelOf };
}
