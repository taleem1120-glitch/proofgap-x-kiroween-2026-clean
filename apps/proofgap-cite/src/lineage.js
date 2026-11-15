/**
 * ProofGap Cite: citation lineage → core case.
 *
 * Domain rules (different from ProofGap X):
 *  - A citation cycle (A cites B cites A, or self-citation) is a FINDING ("circular reporting"), not invalid input.
 *    Members of one cycle share one origin group, so they can never corroborate each other.
 *  - Each reference is a core source; `cites` becomes declared derivation (`derivedFrom`).
 *  - Each cited reference is one core evidence item (its saved copy, if any). Citations carry no strength:
 *    a constant is passed because the core requires one, and Cite verdicts never use scores.
 */
import { normalizeUrl, normalizeDoi } from './parse.js';

export const CITATION_STRENGTH = 0.5;

/** Tarjan's strongly connected components over the declared cites graph (iterative, bounded by reference count). */
export function citationCycles(references) {
  const ids = [...references.keys()].sort();
  const index = new Map(), low = new Map(), onStack = new Set(), stack = [], sccs = [];
  let counter = 0;
  for (const start of ids) {
    if (index.has(start)) continue;
    const work = [[start, 0]];
    index.set(start, counter); low.set(start, counter); counter++; stack.push(start); onStack.add(start);
    while (work.length) {
      const frame = work[work.length - 1];
      const [v] = frame;
      const next = references.get(v).cites;
      if (frame[1] < next.length) {
        const w = next[frame[1]++];
        if (!index.has(w)) { index.set(w, counter); low.set(w, counter); counter++; stack.push(w); onStack.add(w); work.push([w, 0]); }
        else if (onStack.has(w)) low.set(v, Math.min(low.get(v), index.get(w)));
      } else {
        work.pop();
        if (work.length) { const u = work[work.length - 1][0]; low.set(u, Math.min(low.get(u), low.get(v))); }
        if (low.get(v) === index.get(v)) {
          const comp = [];
          let w;
          do { w = stack.pop(); onStack.delete(w); comp.push(w); } while (w !== v);
          const selfLoop = comp.length === 1 && references.get(v).cites.includes(v);
          if (comp.length > 1 || selfLoop) sccs.push(comp.sort());
        }
      }
    }
  }
  return sccs.sort((a, b) => (a[0] < b[0] ? -1 : 1));
}

/** Groups of references sharing a normalised URL or DOI (heuristic only; never merges origins). */
export function sameIdentifierGroups(references) {
  const by = new Map();
  for (const r of references.values()) {
    for (const key of [r.url && `url:${normalizeUrl(r.url)}`, r.doi && `doi:${normalizeDoi(r.doi)}`].filter(Boolean)) {
      by.set(key, [...(by.get(key) ?? []), r.id]);
    }
  }
  return [...by].filter(([, v]) => v.length > 1).map(([k, v]) => ({ identifier: k, refs: [...v].sort() })).sort((a, b) => (a.identifier < b.identifier ? -1 : 1));
}

/** Build the domain-neutral core case from a parsed note. */
export function buildCase(note, caseId) {
  const cycles = citationCycles(note.references);
  const cycleOf = new Map();
  for (const comp of cycles) for (const id of comp) cycleOf.set(id, `cyc.${comp[0]}`);
  const refs = [...note.references.values()].sort((a, b) => (a.id < b.id ? -1 : 1));
  const sources = refs.map((r) => {
    const g = cycleOf.get(r.id);
    const parents = r.cites.filter((t) => t !== r.id && !(g && cycleOf.get(t) === g));
    return { id: r.id, name: r.label, ...(parents.length ? { derivedFrom: parents } : {}), ...(g && cycles.find((c) => `cyc.${c[0]}` === g).length > 1 ? { originGroup: g } : {}) };
  });
  const linksByRef = new Map();
  for (const c of note.claims) for (const ct of c.cites) linksByRef.set(ct.id, [...(linksByRef.get(ct.id) ?? []), { claimId: c.id, stance: ct.stance, strength: CITATION_STRENGTH }]);
  const evidence = refs.filter((r) => linksByRef.has(r.id)).map((r) => ({
    id: `doc.${r.id}`, sourceId: r.id, description: r.label, ...(r.saved ? { file: r.saved } : {}), links: linksByRef.get(r.id),
  }));
  return {
    case: { schemaVersion: '1.0', caseId, title: note.title, sources, claims: note.claims.map((c) => ({ id: c.id, statement: c.statement })), evidence },
    cycles,
    identifierGroups: sameIdentifierGroups(note.references),
  };
}
