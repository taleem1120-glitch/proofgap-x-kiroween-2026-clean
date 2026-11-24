// Synthetic benchmark for ProofGap Cite with HIDDEN ground truth (never written into the note).
// Truth per claim: corroborated = backed by >= 2 truly independent primary origins and no contradiction.
// Some scenarios are deliberately indistinguishable from the note alone, to measure the cost of abstention honestly.
import { rng } from '../../test/prng.js';

export const CITE_SPLITS = Object.freeze({
  dev: { firstSeed: 1, count: 150 },             // used while developing
  heldout: { firstSeed: 500_001, count: 150 },   // Phase 11 held-out record; do not tune against it
  textReviewHeldout: { firstSeed: 700_001, count: 150 }, // fresh split reserved for opt-in saved-text review
});

// make(r, p) -> { refs: [{id, label, attrs, file?, bytes?}], cites: [{id, stance}], truth: boolean }
const ref = (id, label, attrs = {}, bytes) => ({ id, label, attrs, ...(bytes !== undefined ? { bytes } : {}) });
const sup = (...ids) => ids.map((id) => ({ id, stance: 'supports' }));
const u = (r, host) => `https://${host}.example/${r.int(1e6)}`;

export const CITE_SCENARIOS = {
  two_primaries:              { weight: 12, make(r, p) { const n = 2 + r.int(2); const refs = []; for (let i = 0; i < n; i++) refs.push(ref(`${p}p${i}`, `Agency ${p}${i} dataset`, { kind: 'primary', url: u(r, `agency${i}`) }, `primary ${p}${i} ${r.int(1e9)}`)); const k = r.int(3); for (let j = 0; j < k; j++) refs.push(ref(`${p}s${j}`, `Outlet ${p}${j} story`, { kind: 'secondary', url: u(r, `outlet${j}`), cites: `${p}p${r.int(n)}` }, `secondary ${p}${j} ${r.int(1e9)}`)); return { refs, cites: sup(...refs.map((x) => x.id)), truth: true }; } },
  echo_declared:              { weight: 10, make(r, p) { const refs = [ref(`${p}pr`, `City press release ${p}`, { kind: 'primary', url: u(r, 'city') }, `pr ${p} ${r.int(1e9)}`)]; const n = 2 + r.int(4); let prev = `${p}pr`; for (let i = 0; i < n; i++) { const parent = r.bool(0.5) ? prev : `${p}pr`; refs.push(ref(`${p}e${i}`, `Outlet ${p}${i} report`, { kind: 'secondary', url: u(r, `news${i}`), cites: parent }, `echo ${p}${i} ${r.int(1e9)}`)); prev = `${p}e${i}`; } return { refs, cites: sup(...refs.map((x) => x.id)), truth: false }; } },
  echo_identical_files:       { weight: 8,  make(r, p) { const shared = `wire copy ${p} ${r.int(1e9)}`; const n = 2 + r.int(2); const refs = []; for (let i = 0; i < n; i++) refs.push(ref(`${p}w${i}`, `Outlet ${p}${i} wire story`, { kind: 'primary', url: u(r, `site${i}`) }, shared)); return { refs, cites: sup(...refs.map((x) => x.id)), truth: false }; } },
  circular:                   { weight: 6,  make(r, p) { const n = 2 + r.int(2); const refs = []; for (let i = 0; i < n; i++) refs.push(ref(`${p}c${i}`, `Blog ${p}${i}`, { kind: 'secondary', url: u(r, `blog${i}`), cites: `${p}c${(i + 1) % n}` }, `blog ${p}${i} ${r.int(1e9)}`)); return { refs, cites: sup(...refs.map((x) => x.id)), truth: false }; } },
  undeclared_independent:     { weight: 6,  make(r, p) { const refs = [0, 1].map((i) => ref(`${p}u${i}`, `Outlet ${p}${i} feature`, { kind: 'secondary', url: u(r, `mag${i}`) }, `feature ${p}${i} ${r.int(1e9)}`)); return { refs, cites: sup(...refs.map((x) => x.id)), truth: true }; } },
  undeclared_echo:            { weight: 6,  make(r, p) { const refs = [0, 1].map((i) => ref(`${p}v${i}`, `Outlet ${p}${i} feature`, { kind: 'secondary', url: u(r, `mag${i}`) }, `feature ${p}${i} ${r.int(1e9)}`)); return { refs, cites: sup(...refs.map((x) => x.id)), truth: false }; } },
  syndicated_same_url:        { weight: 6,  make(r, p) { const url = u(r, 'wire'); const refs = [0, 1].map((i) => ref(`${p}y${i}`, `Wire story ${p} edition ${i}`, { kind: 'primary', url: i ? `${url}?utm_source=feed${i}` : url }, `edition ${p}${i} ${r.int(1e9)}`)); return { refs, cites: sup(...refs.map((x) => x.id)), truth: false }; } },
  reencoded_repost:           { weight: 6,  make(r, p) { const base = `report ${p} ${r.int(1e9)}`; const refs = [0, 1].map((i) => ref(`${p}x${i}`, `Site ${p}${i} report`, { kind: 'primary', url: u(r, `host${i}`) }, `${base}\n${i ? 're-encoded copy' : ''}`)); return { refs, cites: sup(...refs.map((x) => x.id)), truth: false }; } },
  single_primary:             { weight: 5,  make(r, p) { const refs = [ref(`${p}o`, `Court filing ${p}`, { kind: 'primary', url: u(r, 'court') }, `filing ${p} ${r.int(1e9)}`)]; return { refs, cites: sup(refs[0].id), truth: false }; } },
  unsupported:                { weight: 4,  make() { return { refs: [], cites: [], truth: false }; } },
  conflicting:                { weight: 4,  make(r, p) { const refs = [0, 1, 2].map((i) => ref(`${p}q${i}`, `Lab ${p}${i} result`, { kind: 'primary', url: u(r, `lab${i}`) }, `lab ${p}${i} ${r.int(1e9)}`)); return { refs, cites: [...sup(refs[0].id, refs[1].id), { id: refs[2].id, stance: 'contradicts' }], truth: false }; } },
};
const TOTAL = Object.values(CITE_SCENARIOS).reduce((a, s) => a + s.weight, 0);
const pick = (r) => { let x = r.int(TOTAL); for (const [k, s] of Object.entries(CITE_SCENARIOS)) if ((x -= s.weight) < 0) return k; };

/** One synthetic note: { name, text, files: Map(name -> bytes), truth: { claimId -> {scenario, corroborated, refs[]} } } */
export function generateNote(seed) {
  const r = rng(seed);
  const nClaims = 3 + r.int(4);
  const claims = [], refs = [], files = new Map(), truth = {};
  for (let k = 0; k < nClaims; k++) {
    const scenario = pick(r), s = CITE_SCENARIOS[scenario].make(r, `k${k}`);
    // The fresh saved-text-review cohort deliberately includes long, re-encoded copies.
    // Preserve the exact historical Phase 11 generator for every earlier seed.
    if (seed >= CITE_SPLITS.textReviewHeldout.firstSeed && scenario === 'reencoded_repost') {
      const body = Array.from({ length: 28 }, (_, i) =>
        `The archived investigative record ${i} documents the same sequence of observations, measurements, and independently reviewable source details for this report.`
      ).join(' ');
      const edited = body.replace('same sequence of observations', 'same ordered sequence of observations');
      s.refs[0].bytes = `Original publication. ${body} End of original record.`;
      s.refs[1].bytes = `Re-encoded repost. ${edited.toUpperCase().replaceAll(' ', '\\u00a0')} End of repost.`;
    }
    for (const x of s.refs) {
      const attrs = { ...x.attrs };
      if (x.bytes !== undefined) { attrs.saved = `${x.id}.txt`; files.set(attrs.saved, x.bytes); }
      refs.push(`[^${x.id}]: ${x.label} {${Object.entries(attrs).map(([a, b]) => `${a}=${b}`).join(', ')}}`);
    }
    claims.push(`- Claim ${k} of note ${seed}. ${s.cites.map((c) => (c.stance === 'contradicts' ? `[-^${c.id}]` : `[^${c.id}]`)).join(' ')}`);
    truth[`c${k + 1}`] = { scenario, corroborated: s.truth, refs: s.refs.filter((x) => s.cites.some((c) => c.id === x.id && c.stance === 'supports')).map((x) => ({ id: x.id, url: x.attrs.url ?? null, label: x.label })) };
  }
  return { name: `note-${seed}.md`, text: `# Benchmark note ${seed} (synthetic)\n## Claims\n${claims.join('\n')}\n## References\n${refs.join('\n')}\n`, files, truth };
}
export const generateCiteSplit = (name) => Array.from({ length: CITE_SPLITS[name].count }, (_, i) => generateNote(CITE_SPLITS[name].firstSeed + i));
