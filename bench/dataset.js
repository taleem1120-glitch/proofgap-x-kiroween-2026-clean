// Synthetic benchmark dataset with HIDDEN ground truth.
// Truth for a claim = number of TRULY independent origins behind its supporting evidence (known to the
// generator, never shown to any detector). Positive class = "claim is truly corroborated" (>= 2 true origins).
import { rng } from '../test/prng.js';

export const SPLITS = Object.freeze({
  dev: { firstSeed: 1, count: 200 },          // used while developing; may be inspected and tuned against
  heldout: { firstSeed: 100_001, count: 200 }, // not inspected during development; evaluated after code freeze
});

const H = (n) => n.toString(16).padStart(64, '0');
const strength = (r) => (1 + r.int(10)) / 10;

// Each scenario returns { sources, evidence(without ids), trueOrigins }.
// `kind` marks whether the dependence is declared in the case ('declared') or hidden ('undeclared').
export const SCENARIOS = {
  genuine_independent:       { weight: 14, kind: 'declared',   make(r, p, c) { const k = 2 + r.int(3); const sources = [], items = []; for (let i = 0; i < k; i++) { sources.push({ id: `${p}o${i}`, name: `${p} origin ${i} ${r.int(1e6)}` }); items.push({ src: `${p}o${i}` }); } return { sources, items, trueOrigins: k }; } },
  genuine_with_copy:         { weight: 8,  kind: 'declared',   make(r, p) { const sources = [{ id: `${p}a`, name: `${p} A ${r.int(1e6)}` }, { id: `${p}b`, name: `${p} B ${r.int(1e6)}` }, { id: `${p}ac`, name: `${p} A copy ${r.int(1e6)}`, derivedFrom: [`${p}a`] }]; return { sources, items: [{ src: `${p}a` }, { src: `${p}b` }, { src: `${p}ac` }], trueOrigins: 2 }; } },
  derived_from_distinct_roots:{ weight: 6, kind: 'declared',   make(r, p) { const sources = [{ id: `${p}x`, name: `${p} X ${r.int(1e6)}`, derivedFrom: [`${p}rx`] }, { id: `${p}y`, name: `${p} Y ${r.int(1e6)}`, derivedFrom: [`${p}ry`] }, { id: `${p}rx`, name: `${p} RX ${r.int(1e6)}` }, { id: `${p}ry`, name: `${p} RY ${r.int(1e6)}` }]; return { sources, items: [{ src: `${p}x` }, { src: `${p}y` }], trueOrigins: 2 }; } },
  bridge_three_roots:        { weight: 3,  kind: 'declared',   make(r, p) { const sources = [{ id: `${p}r1`, name: `${p} R1 ${r.int(1e6)}` }, { id: `${p}r2`, name: `${p} R2 ${r.int(1e6)}` }, { id: `${p}br`, name: `${p} bridge ${r.int(1e6)}`, derivedFrom: [`${p}r1`, `${p}r2`] }]; return { sources, items: [{ src: `${p}r1` }, { src: `${p}r2` }, { src: `${p}br` }], trueOrigins: 1 }; } },
  single_item:               { weight: 6,  kind: 'declared',   make(r, p) { return { sources: [{ id: `${p}s`, name: `${p} only ${r.int(1e6)}` }], items: [{ src: `${p}s` }], trueOrigins: 1 }; } },
  same_source_duplicates:    { weight: 6,  kind: 'declared',   make(r, p) { const h = H(r.int(1e9) + 1); return { sources: [{ id: `${p}s`, name: `${p} only ${r.int(1e6)}` }], items: [{ src: `${p}s`, sha: h }, { src: `${p}s`, sha: h }], trueOrigins: 1 }; } },
  declared_copies:           { weight: 12, kind: 'declared',   make(r, p) { const n = 2 + r.int(4); const sources = [{ id: `${p}o`, name: `${p} original ${r.int(1e6)}` }]; const items = [{ src: `${p}o` }]; let prev = `${p}o`; for (let i = 0; i < n; i++) { const parent = r.bool(0.5) ? prev : `${p}o`; sources.push({ id: `${p}c${i}`, name: `${p} copy ${i} ${r.int(1e6)}`, derivedFrom: [parent] }); items.push({ src: `${p}c${i}` }); prev = `${p}c${i}`; } return { sources, items, trueOrigins: 1 }; } },
  hash_laundering:           { weight: 8,  kind: 'declared',   make(r, p) { const n = 2 + r.int(3); const h = H(r.int(1e9) + 7); const sources = [], items = []; for (let i = 0; i < n; i++) { sources.push({ id: `${p}l${i}`, name: `${p} laundered ${i} ${r.int(1e6)}` }); items.push({ src: `${p}l${i}`, sha: h }); } return { sources, items, trueOrigins: 1 }; } },
  shared_origin_group:       { weight: 8,  kind: 'declared',   make(r, p) { const n = 2 + r.int(3); const sources = [], items = []; for (let i = 0; i < n; i++) { sources.push({ id: `${p}g${i}`, name: `${p} member ${i} ${r.int(1e6)}`, originGroup: `${p}grp` }); items.push({ src: `${p}g${i}` }); } return { sources, items, trueOrigins: 1 }; } },
  group_plus_derivation:     { weight: 4,  kind: 'declared',   make(r, p) { const sources = [{ id: `${p}o`, name: `${p} orig ${r.int(1e6)}` }, { id: `${p}c`, name: `${p} copy ${r.int(1e6)}`, originGroup: `${p}z`, derivedFrom: [`${p}o`] }]; return { sources, items: [{ src: `${p}o` }, { src: `${p}c` }], trueOrigins: 1 }; } },
  undeclared_copy:           { weight: 6,  kind: 'undeclared', make(r, p) { const n = 2 + r.int(2); const sources = [], items = []; for (let i = 0; i < n; i++) { sources.push({ id: `${p}u${i}`, name: `${p} unrelated-looking ${i} ${r.int(1e6)}` }); items.push({ src: `${p}u${i}` }); } return { sources, items, trueOrigins: 1 }; } },
  undeclared_copy_with_cues: { weight: 4,  kind: 'undeclared', make(r, p) { const nm = `${p} Camera ${r.int(1e6)}`; const n = 2; const sources = [], items = []; for (let i = 0; i < n; i++) { sources.push({ id: `${p}v${i}`, name: i ? ` ${nm.toUpperCase()} ` : nm }); items.push({ src: `${p}v${i}`, desc: 'Door open frame' }); } return { sources, items, trueOrigins: 1 }; } },
  no_support:                { weight: 5,  kind: 'declared',   make(r, p) { return { sources: [{ id: `${p}n`, name: `${p} neg ${r.int(1e6)}` }], items: [], contraSrc: `${p}n`, trueOrigins: 0 }; } },
};

const TOTAL_WEIGHT = Object.values(SCENARIOS).reduce((a, s) => a + s.weight, 0);
const pickScenario = (r) => { let x = r.int(TOTAL_WEIGHT); for (const [k, s] of Object.entries(SCENARIOS)) { if ((x -= s.weight) < 0) return k; } };

export function generateCase(seed) {
  const r = rng(seed);
  const nClaims = 3 + r.int(4);
  const c = { schemaVersion: '1.0', caseId: `B${seed}`, title: `Benchmark case ${seed} (synthetic)`, sources: [], claims: [], evidence: [] };
  const truth = {};
  let ev = 0;
  for (let k = 0; k < nClaims; k++) {
    const claimId = `c${k}`, p = `k${k}-`;
    const name = pickScenario(r), sc = SCENARIOS[name].make(r, p, claimId);
    c.claims.push({ id: claimId, statement: `Claim ${k}` });
    c.sources.push(...sc.sources);
    for (const it of sc.items) c.evidence.push({ id: `e${ev++}`, sourceId: it.src, description: it.desc ?? `item ${ev} ${r.int(1e6)}`, ...(it.sha ? { sha256: it.sha } : {}), links: [{ claimId, stance: 'supports', strength: strength(r) }] });
    if (sc.contraSrc) c.evidence.push({ id: `e${ev++}`, sourceId: sc.contraSrc, description: `contra ${ev}`, links: [{ claimId, stance: 'contradicts', strength: strength(r) }] });
    truth[claimId] = { scenario: name, kind: SCENARIOS[name].kind, trueOrigins: sc.trueOrigins, corroborated: sc.trueOrigins >= 2 };
  }
  return { id: c.caseId, case: c, truth };
}

export function generateSplit(name) {
  const { firstSeed, count } = SPLITS[name];
  return Array.from({ length: count }, (_, i) => generateCase(firstSeed + i));
}
