// Random VALID case generator for metamorphic tests (seeded; independent of src/).
import { rng } from './prng.js';

export function genCase(seed) {
  const r = rng(seed);
  const nS = 3 + r.int(7), nC = 1 + r.int(4), nE = 3 + r.int(12);
  const c = { schemaVersion: '1.0', caseId: `G${seed}`, title: 'Generated', sources: [], claims: [], evidence: [] };
  for (let i = 0; i < nS; i++) {
    const s = { id: `s${i}`, name: `Source ${i}` };
    if (i > 0 && r.bool(0.45)) s.derivedFrom = [...new Set(Array.from({ length: 1 + r.int(2) }, () => `s${r.int(i)}`))];
    if (r.bool(0.15)) s.originGroup = `g${r.int(2)}`;
    c.sources.push(s);
  }
  for (let i = 0; i < nC; i++) c.claims.push({ id: `c${i}`, statement: `Claim ${i}` });
  for (let i = 0; i < nE; i++) {
    const e = { id: `e${i}`, sourceId: `s${r.int(nS)}`, description: `item ${i} ${r.int(1000)}`, links: [] };
    if (r.bool(0.25)) e.sha256 = (r.int(4) + 1).toString().repeat(64);
    for (let k = 0, n = 1 + r.int(2); k < n; k++) e.links.push({ claimId: `c${r.int(nC)}`, stance: r.bool(0.8) ? 'supports' : 'contradicts', strength: (1 + r.int(10)) / 10 });
    c.evidence.push(e);
  }
  return c;
}

export const clone = (x) => JSON.parse(JSON.stringify(x));

export function shuffle(arr, r) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = r.int(i + 1); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

/** Shuffle every array in the case (sources, claims, evidence, links, derivedFrom). */
export function shuffleCase(c, seed) {
  const r = rng(seed);
  const x = clone(c);
  x.sources = shuffle(x.sources, r); x.claims = shuffle(x.claims, r); x.evidence = shuffle(x.evidence, r);
  for (const s of x.sources) if (s.derivedFrom) s.derivedFrom = shuffle(s.derivedFrom, r);
  for (const e of x.evidence) e.links = shuffle(e.links, r);
  return x;
}

/** Consistently rename every id with a bijection that scrambles sort order. */
export function relabel(c, seed) {
  const r = rng(seed);
  const names = new Map();
  const ids = [...c.sources.map((s) => `S:${s.id}`), ...c.claims.map((x) => `C:${x.id}`), ...c.evidence.map((e) => `E:${e.id}`)];
  const pool = shuffle(ids.map((_, i) => i), r);
  ids.forEach((k, i) => names.set(k, `${k[0].toLowerCase()}${String(pool[i]).padStart(4, '0')}${'zyxw'[i % 4]}`));
  const S = (id) => names.get(`S:${id}`), C = (id) => names.get(`C:${id}`), E = (id) => names.get(`E:${id}`);
  const x = clone(c);
  for (const s of x.sources) { s.id = S(s.id); if (s.derivedFrom) s.derivedFrom = s.derivedFrom.map(S); }
  for (const cl of x.claims) cl.id = C(cl.id);
  for (const e of x.evidence) { e.id = E(e.id); e.sourceId = S(e.sourceId); for (const l of e.links) l.claimId = C(l.claimId); }
  return { case: x, claim: C, source: S, evidence: E };
}

/** Compact per-claim view used to compare reports across transformations. */
export const view = (rep) => rep.claims.map((c) => ({
  claimId: c.claimId, status: c.status, supportScore: c.supportScore, contradictScore: c.contradictScore,
  supOrigins: c.independentSupportOrigins.length, conOrigins: c.independentContradictOrigins.length,
}));
export const stripHash = (rep) => { const y = clone(rep); delete y.inputSha256; return y; };
