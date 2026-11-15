import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCaseText, validateCase, analyzeCase, serializeReport, CaseValidationError, DEFAULT_LIMITS } from '../src/index.js';
import { rng, SEEDS } from './prng.js';
import { base, ev } from './helpers.js';

const clone = (x) => JSON.parse(JSON.stringify(x));
const expectInvalid = (fn, re) => {
  try { fn(); } catch (e) {
    assert.ok(e instanceof CaseValidationError, `unexpected error type: ${e && e.stack}`);
    assert.ok(e.issues.length >= 1 && e.issues.length <= DEFAULT_LIMITS.maxIssues);
    for (const i of e.issues) { assert.equal(typeof i.path, 'string'); assert.match(i.path, /^\$/); assert.equal(typeof i.message, 'string'); }
    if (re) assert.ok(e.issues.some((i) => re.test(`${i.path} ${i.message}`)), JSON.stringify(e.issues.slice(0, 3)));
    return e.issues;
  }
  assert.fail('expected CaseValidationError');
};

/** Random acyclic valid case (parents always earlier in the list). */
function genValid(r) {
  const nS = 1 + r.int(8), nC = 1 + r.int(4), nE = r.int(14);
  const c = { schemaVersion: '1.0', caseId: `C${r.int(99)}`, title: 'Generated', sources: [], claims: [], evidence: [] };
  for (let i = 0; i < nS; i++) {
    const s = { id: `s${i}`, name: `Source ${i} ☃ 😀` };
    if (i > 0 && r.bool(0.4)) s.derivedFrom = [...new Set(Array.from({ length: 1 + r.int(2) }, () => `s${r.int(i)}`))];
    if (r.bool(0.15)) s.originGroup = `g${r.int(2)}`;
    c.sources.push(s);
  }
  for (let i = 0; i < nC; i++) c.claims.push({ id: `c${i}`, statement: `Claim ${i}` });
  for (let i = 0; i < nE; i++) {
    const e = { id: `e${i}`, sourceId: `s${r.int(nS)}`, description: `desc ${r.int(5)}`, links: [] };
    if (r.bool(0.3)) e.sha256 = r.int(3).toString().repeat(64);
    for (let k = 0, n = r.int(3); k < n; k++) e.links.push({ claimId: `c${r.int(nC)}`, stance: r.pick(['supports', 'contradicts']), strength: r.int(101) / 100 });
    c.evidence.push(e);
  }
  return c;
}

// Independent oracle: is the declared derivation graph acyclic?
function acyclic(sources) {
  const g = new Map(sources.map((s) => [s.id, s.derivedFrom ?? []])); const st = new Map();
  const dfs = (n) => { if (st.get(n) === 2) return true; if (st.get(n) === 1) return false; st.set(n, 1); for (const p of g.get(n) ?? []) if (!dfs(p)) return false; st.set(n, 2); return true; };
  return [...g.keys()].every(dfs);
}

test(`property: generated valid cases validate, analyze deterministically, and satisfy invariants (${SEEDS.length} seeds)`, () => {
  for (const seed of SEEDS) {
    const r = rng(seed), c = genValid(r);
    try {
      validateCase(c);
      const a = serializeReport(analyzeCase(c)), b = serializeReport(analyzeCase(clone(c)));
      assert.equal(a, b);
      const rep = JSON.parse(a);
      assert.doesNotMatch(a, /[<>&]/);
      assert.equal(rep.summary.effectiveEvidence + rep.duplicates.length, c.evidence.length);
      for (const cl of rep.claims) {
        for (const k of ['supportScore', 'contradictScore']) assert.ok(cl[k] >= 0 && cl[k] <= 1);
        assert.ok(cl.independentSupportOrigins.length <= c.sources.length);
        assert.ok(cl.explanation.length >= 2);
      }
      // evidence order must not change conclusions (hash differs since it hashes input order)
      const shuffled = clone(c); shuffled.evidence.reverse();
      const strip = (x) => { const y = JSON.parse(x); delete y.inputSha256; return y; };
      assert.deepEqual(strip(serializeReport(analyzeCase(shuffled))), strip(a));
    } catch (e) { e.message = `seed ${seed}: ${e.message}`; throw e; }
  }
});

test('property: random mutations of a valid case either validate (and then analyze safely) or fail with CaseValidationError only', () => {
  const junk = [null, undefined, NaN, Infinity, -1, 1e999, 0, 2, '', 'x'.repeat(2001), '\u0000', 'a\u202eb', '\ud800', '😀'.repeat(1001), [], {}, [[]], { a: 1 }, true, '__proto__', 'bad id', 'e1'];
  let valid = 0, invalid = 0;
  for (const seed of SEEDS) {
    const r = rng(seed * 7 + 1), c = genValid(r);
    // collect mutable locations
    const locs = [];
    const walk = (o) => { if (o && typeof o === 'object') for (const k of Object.keys(o)) { locs.push([o, k]); walk(o[k]); } };
    walk(c);
    for (let m = 0, n = 1 + r.int(3); m < n && locs.length; m++) {
      const [o, k] = r.pick(locs);
      const op = r.int(3);
      if (op === 0) o[k] = r.pick(junk); else if (op === 1) delete o[k]; else o[`k${r.int(9)}`] = r.pick(junk);
    }
    const text = JSON.stringify(c); // NaN/Infinity/undefined become null/omitted: also realistic
    try {
      const v = parseCaseText(text);
      const rep = serializeReport(analyzeCase(v)); JSON.parse(rep); valid++;
      assert.ok(acyclic(v.sources));
    } catch (e) {
      assert.ok(e instanceof CaseValidationError, `seed ${seed}: ${e && e.stack}`);
      invalid++;
    }
  }
  assert.ok(invalid > 20 && valid > 0, `mutation mix degenerate: valid=${valid} invalid=${invalid}`);
});

test('fuzz: arbitrary garbage text only ever yields CaseValidationError', () => {
  const alphabet = ['{', '}', '[', ']', '"', ':', ',', '\\', 'null', 'true', '1e999', '-', '"schemaVersion"', '"1.0"', '"__proto__"', ' ', '\n', '\u0000', '\ufeff', '😀', '\u2028'];
  for (const seed of SEEDS) {
    const r = rng(seed * 13 + 5);
    let t = ''; for (let i = 0, n = r.int(60); i < n; i++) t += r.pick(alphabet);
    try { parseCaseText(t); } catch (e) { assert.ok(e instanceof CaseValidationError, `seed ${seed} ${JSON.stringify(t)}: ${e && e.stack}`); }
  }
  for (const t of ['', ' ', 'null', '1', '"s"', '[]', '{}', '\ufeff{}', '{"a":1,}', "{'a':1}", '{"a":NaN}']) expectInvalid(() => parseCaseText(t));
});

test('fuzz: truncating a valid document at every 7th byte never crashes', () => {
  const text = JSON.stringify(genValid(rng(42)));
  let rejected = 0;
  for (let i = 0; i < text.length; i += 7) { try { parseCaseText(text.slice(0, i)); } catch (e) { assert.ok(e instanceof CaseValidationError); rejected++; } }
  assert.ok(rejected > 10);
});

test('malformed JSON: deep nesting does not crash or hang', () => {
  for (const n of [1000, 50_000, 400_000]) {
    expectInvalid(() => parseCaseText('['.repeat(n) + ']'.repeat(n)));
    expectInvalid(() => parseCaseText('{"a":'.repeat(n) + '1' + '}'.repeat(n)));
  }
  const nested = clone(base()); let o = nested; for (let i = 0; i < 30; i++) { o.n = {}; o = o.n; }
  expectInvalid(() => validateCase(nested), /nesting too deep|unsupported property/);
});

test('oversized values are rejected at each limit boundary', () => {
  const L = DEFAULT_LIMITS;
  const ok = (c) => validateCase(c);
  const withTitle = (n) => ({ ...base(), title: 'x'.repeat(n) });
  ok(withTitle(L.maxStringLength)); expectInvalid(() => ok(withTitle(L.maxStringLength + 1)), /exceeds/);
  expectInvalid(() => ok(withTitle(0)), /non-empty/);
  const manySrc = (n) => ({ ...base(), sources: Array.from({ length: n }, (_, i) => ({ id: `s${i}`, name: 'n' })) });
  ok(manySrc(L.maxSources)); expectInvalid(() => ok(manySrc(L.maxSources + 1)), /exceeds limit/);
  const manyClaims = (n) => ({ ...base(), claims: Array.from({ length: n }, (_, i) => ({ id: `c${i}`, statement: 's' })) });
  ok(manyClaims(L.maxClaims)); expectInvalid(() => ok(manyClaims(L.maxClaims + 1)), /exceeds limit/);
  const manyEv = (n) => { const c = base(); c.evidence = Array.from({ length: n }, (_, i) => ({ id: `e${i}`, sourceId: 's1', description: `d${i}`, links: [] })); return c; };
  ok(manyEv(L.maxEvidence)); expectInvalid(() => ok(manyEv(L.maxEvidence + 1)), /exceeds limit/);
  const links = (n) => { const c = base(); c.evidence = [{ id: 'e1', sourceId: 's1', description: 'd', links: Array.from({ length: n }, () => ({ claimId: 'c1', stance: 'supports', strength: 1 })) }]; return c; };
  ok(links(L.maxLinksPerEvidence)); expectInvalid(() => ok(links(L.maxLinksPerEvidence + 1)), /exceeds limit/);
  expectInvalid(() => parseCaseText(JSON.stringify(withTitle(L.maxBytes))), /exceeds \d+ bytes/);
  // multibyte: byte limit counts bytes, not characters
  expectInvalid(() => parseCaseText(JSON.stringify({ t: '😀'.repeat(L.maxBytes / 4) })), /bytes/);
});

test('error flood: many invalid items cannot produce unbounded issue lists', () => {
  const c = base(); c.evidence = Array.from({ length: 5000 }, () => ({ bogus: true }));
  const issues = expectInvalid(() => validateCase(c));
  assert.ok(issues.length <= DEFAULT_LIMITS.maxIssues);
});

test('prototype pollution: forbidden keys at any depth are rejected and Object.prototype stays clean', () => {
  const locations = ['{"__proto__":{"polluted":1},', '{"constructor":{"prototype":{"polluted":1}},', '{"prototype":{"polluted":1},'];
  const tail = JSON.stringify(base()).slice(1);
  for (const head of locations) expectInvalid(() => parseCaseText(head + tail), /forbidden key/);
  const deepProto = base(); deepProto.sources[0] = JSON.parse('{"id":"s1","name":"n","__proto__":{"polluted":1}}');
  expectInvalid(() => validateCase(deepProto), /forbidden key/);
  const ev2 = JSON.parse(JSON.stringify(base()).replace('"evidence":[]', '"evidence":[{"id":"e1","sourceId":"s1","description":"d","links":[{"claimId":"c1","stance":"supports","strength":1,"constructor":1}]}]'));
  expectInvalid(() => validateCase(ev2), /forbidden key/);
  assert.equal({}.polluted, undefined); assert.equal(Object.prototype.polluted, undefined);
  assert.equal(Object.getPrototypeOf({}), Object.prototype);
  // ids that merely look like prototype members are only allowed as plain data and must not break analysis
  const c = base(); c.sources = [{ id: 'toString', name: 'a' }, { id: 'hasOwnProperty', name: 'b' }]; c.evidence = [ev('valueOf', 'toString'), ev('e2', 'hasOwnProperty')];
  const rep = analyzeCase(validateCase(c));
  assert.equal(rep.claims[0].status, 'supported_by_independent_origins');
});

test('duplicate identifiers (sources, claims, evidence) are rejected at the right path', () => {
  const dupSrc = base(); dupSrc.sources.push({ id: 's1', name: 'x' });
  expectInvalid(() => validateCase(dupSrc), /sources\[2\]\.id duplicate source id/);
  const dupClaim = base(); dupClaim.claims.push({ id: 'c1', statement: 'x' });
  expectInvalid(() => validateCase(dupClaim), /claims\[1\]\.id duplicate claim id/);
  const dupEv = base(); dupEv.evidence = [ev('e1', 's1'), ev('e1', 's2')];
  expectInvalid(() => validateCase(dupEv), /evidence\[1\]\.id duplicate evidence id/);
  // ids are case-sensitive, so these are distinct and valid
  const cs = base(); cs.sources.push({ id: 'S1', name: 'x' }); validateCase(cs);
});

test('invalid provenance references are rejected', () => {
  const a = base(); a.sources[0].derivedFrom = ['ghost'];
  expectInvalid(() => validateCase(a), /sources\[0\]\.derivedFrom\[0\] unknown source "ghost"/);
  const b = base(); b.evidence = [ev('e1', 'ghost')];
  expectInvalid(() => validateCase(b), /evidence\[0\]\.sourceId unknown source/);
  const c = base(); c.evidence = [{ ...ev('e1', 's1'), links: [{ claimId: 'ghost', stance: 'supports', strength: 1 }] }];
  expectInvalid(() => validateCase(c), /claimId unknown claim/);
  const d = base(); d.sources[0].derivedFrom = ['s1']; // self reference
  expectInvalid(() => validateCase(d), /cycle/);
});

test('property: validation accepts a case iff the derivation graph is acyclic (random edge sets, independent oracle)', () => {
  let sawCycle = 0, sawAcyclic = 0;
  for (const seed of SEEDS) {
    const r = rng(seed * 31 + 9), n = 2 + r.int(8);
    const sources = Array.from({ length: n }, (_, i) => ({ id: `s${i}`, name: 'n' }));
    for (const s of sources) if (r.bool(0.5)) s.derivedFrom = [...new Set(Array.from({ length: 1 + r.int(2) }, () => `s${r.int(n)}`))];
    const c = { ...base(), sources };
    const expected = acyclic(sources);
    let accepted = true;
    try { validateCase(c); } catch (e) { assert.ok(e instanceof CaseValidationError); accepted = false; assert.ok(e.issues.some((i) => /cycle/.test(i.message)), `seed ${seed}`); }
    assert.equal(accepted, expected, `seed ${seed}`);
    expected ? sawAcyclic++ : sawCycle++;
  }
  assert.ok(sawCycle > 10 && sawAcyclic > 10, `${sawCycle}/${sawAcyclic}`);
});

test('excessive derivation depth: chain at the limit is accepted, one beyond is rejected; no stack overflow on huge chains', () => {
  const chain = (n) => ({ ...base(), sources: Array.from({ length: n }, (_, i) => ({ id: `d${i}`, name: 'n', ...(i ? { derivedFrom: [`d${i - 1}`] } : {}) })) });
  validateCase(chain(DEFAULT_LIMITS.maxDerivationDepth + 1));
  expectInvalid(() => validateCase(chain(DEFAULT_LIMITS.maxDerivationDepth + 2)), /depth exceeds/);
  const big = chain(DEFAULT_LIMITS.maxSources);
  const t0 = Date.now();
  expectInvalid(() => validateCase(big), /depth exceeds/);
  assert.ok(Date.now() - t0 < 2000, 'depth check should be fast');
});

test('wide fan-in derivation graphs stay within time bounds (no exponential blow-up)', () => {
  // diamond ladder: 2^k paths but only 2k+1 nodes
  const k = 24, sources = [{ id: 'n0', name: 'n' }];
  for (let i = 1; i <= k; i++) {
    sources.push({ id: `a${i}`, name: 'n', derivedFrom: [i === 1 ? 'n0' : `m${i - 1}`] }, { id: `b${i}`, name: 'n', derivedFrom: [i === 1 ? 'n0' : `m${i - 1}`] }, { id: `m${i}`, name: 'n', derivedFrom: [`a${i}`, `b${i}`] });
  }
  const c = { ...base(), sources, evidence: [ev('e1', `m${k}`)] };
  const t0 = Date.now();
  validateCase(c); const rep = analyzeCase(c);
  assert.ok(Date.now() - t0 < 2000);
  assert.equal(rep.claims[0].independentSupportOrigins.length, 1);
});

test('Unicode edge cases', () => {
  const stmt = (s) => { const c = base(); c.claims[0].statement = s; return c; };
  // accepted: emoji, combining marks, RTL scripts, zero-width joiner sequences, CJK, newline/tab
  for (const ok of ['😀 👨‍👩‍👧', 'e\u0301', 'שלום עולם', 'مرحبا', '日本語', 'tab\there\nnewline', 'a\u200bb']) {
    const rep = serializeReport(analyzeCase(validateCase(stmt(ok))));
    assert.equal(JSON.parse(rep).claims[0].statement, ok);
  }
  // rejected: NUL and other C0/C1-adjacent controls, DEL, bidi overrides/isolates, lone surrogates
  const bad = ['a\u0000b', 'a\u0007b', 'a\u007fb', 'a\u202eb', 'a\u202ab', 'a\u2066b', 'a\u2069b', 'a\ud800b', 'a\udc00b', '\udbff'];
  for (const b of bad) expectInvalid(() => validateCase(stmt(b)), /statement/);
  // same via raw JSON escapes (what a file would actually contain)
  const raw = (esc) => JSON.stringify(base()).replace('"Claim"', `"a${esc}b"`);
  for (const esc of ['\\u0000', '\\ud800', '\\u202e', '\\udc00']) expectInvalid(() => parseCaseText(raw(esc)), /statement/);
  // length counts UTF-16 code units, consistently for schema and limit
  validateCase(stmt('😀'.repeat(DEFAULT_LIMITS.maxStringLength / 2)));
  expectInvalid(() => validateCase(stmt('😀'.repeat(DEFAULT_LIMITS.maxStringLength / 2 + 1))), /exceeds/);
  // homoglyph / non-ASCII / lookalike identifiers are rejected; ASCII-only ids
  for (const id of ['аbc', 'ｓ1', 's1\u200b', 's１', 'é', '😀']) { const c = base(); c.sources[0].id = id; expectInvalid(() => validateCase(c), /sources\[0\]\.id/); }
  // line/paragraph separators survive as escapes in output (safe for JS embedding)
  const out = serializeReport(analyzeCase(validateCase(stmt('a\u2028b\u2029c'))));
  assert.doesNotMatch(out, /[\u2028\u2029]/);
  // BOM-prefixed file is not silently accepted
  expectInvalid(() => parseCaseText('\ufeff' + JSON.stringify(base())));
});

test('numeric edge cases in strength', () => {
  for (const s of ['1e999', '-1e999', '-0.0000001', '1.0000001', '"0.5"', 'null', 'true', '[0.5]']) {
    const t = JSON.stringify({ ...base(), evidence: [ev('e1', 's1')] }).replace('"strength":0.5', `"strength":${s}`);
    expectInvalid(() => parseCaseText(t), /strength/);
  }
  const edge = JSON.stringify({ ...base(), evidence: [ev('e1', 's1')] }).replace('"strength":0.5', '"strength":-0');
  parseCaseText(edge);
});
