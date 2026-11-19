// Application 2: ProofGap Cite.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync, readFileSync, symlinkSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { analyzeNote, parseNote, renderLint, serializeCiteReport, renderCiteHtml, CiteValidationError, CITE_LIMITS } from '../apps/proofgap-cite/src/index.js';
import { citationCycles } from '../apps/proofgap-cite/src/lineage.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const CLI = join(root, 'apps/proofgap-cite/cli.js');
const EX = join(root, 'apps/proofgap-cite/examples');
let dir;
before(() => {
  dir = mkdtempSync(join(tmpdir(), 'pgx-cite-'));
  writeFileSync(join(dir, 'same1.txt'), 'SYNDICATED BYTES'); writeFileSync(join(dir, 'same2.txt'), 'SYNDICATED BYTES');
  writeFileSync(join(dir, 'other.txt'), 'DIFFERENT BYTES'); writeFileSync(join(dir, 'empty1.txt'), ''); writeFileSync(join(dir, 'empty2.txt'), '');
  symlinkSync(join(dir, 'same1.txt'), join(dir, 'link.txt'));
});
after(() => rmSync(dir, { recursive: true, force: true }));

const note = (claims, refs) => `# T\n## Claims\n${claims.map((c) => `- ${c}`).join('\n')}\n## References\n${refs.join('\n')}\n`;
const run = (claims, refs, opts = {}) => analyzeNote(note(claims, refs), opts);
const v = (r, i = 0) => r.claims[i].decision;
const P = (id, extra = '') => `[^${id}]: Primary ${id} {kind=primary${extra}}`;
const S = (id, extra = '') => `[^${id}]: Secondary ${id} {kind=secondary${extra}}`;
const issues = (fn) => { try { fn(); } catch (e) { assert.ok(e instanceof CiteValidationError, String(e)); return e.issues; } assert.fail('expected CiteValidationError'); };

// ---------- verdicts ----------
test('two independent primaries -> independently_corroborated; copies of them add no origin', () => {
  const r = run(['Claim [^a] [^b] [^c]'], [P('a'), P('b'), S('c', ', cites=a')]);
  assert.equal(v(r), 'independently_corroborated');
  assert.deepEqual(r.claims[0].citeEvidence, { citations: 3, independentOrigins: 2, primaryRootedOrigins: 2 });
});

test('press-release echo: many secondaries citing one primary -> single_origin with exact missing item', () => {
  const r = run(['Claim [^pr] [^a] [^b] [^c] [^d]'], [P('pr'), S('a', ', cites=pr'), S('b', ', cites=a'), S('c', ', cites=b'), S('d', ', cites=pr')]);
  assert.equal(v(r), 'single_origin');
  assert.equal(r.claims[0].citeEvidence.independentOrigins, 1);
  assert.deepEqual(r.claims[0].missing, ['A second primary source that does not derive from [^pr].']);
});

test('circular reporting is a finding, not invalid input (unlike app 1, where cycles are rejected)', () => {
  const r = run(['Claim [^a] [^b]'], [S('a', ', cites=b'), S('b', ', cites=a')]);
  assert.equal(v(r), 'circular_reporting');
  assert.ok(r.claims[0].findings.some((f) => f.code === 'CIRCULAR_REPORTING'));
  assert.deepEqual(r.cite.cycles, [['a', 'b']]);
});

test('self-citation and 3-cycles are detected; a cycle plus a separate primary still cannot reach two primary origins', () => {
  const refs = new Map(Object.entries({ a: { cites: ['a'] }, b: { cites: ['c'] }, c: { cites: ['d'] }, d: { cites: ['b'] }, e: { cites: [] } }));
  assert.deepEqual(citationCycles(refs), [['a'], ['b', 'c', 'd']]);
  const r = run(['Claim [^p] [^x] [^y]'], [P('p'), S('x', ', cites=y'), S('y', ', cites=x')]);
  assert.equal(v(r), 'origin_unresolved');
  assert.equal(r.claims[0].citeEvidence.primaryRootedOrigins, 1);
});

test('unknown provenance: separate URLs and outlets never count as independence', () => {
  const r = run(['Claim [^a] [^b]'], ['[^a]: Outlet A {url=https://a.example/1}', '[^b]: Outlet B {kind=secondary, url=https://b.example/2}']);
  assert.equal(r.claims[0].citeEvidence.independentOrigins, 2, 'core keeps them separate (declared lineage only)');
  assert.equal(v(r), 'origin_unresolved', 'but Cite does not call them corroborated');
  const codes = r.claims[0].findings.map((f) => f.code);
  assert.ok(codes.includes('ORIGIN_KIND_UNDECLARED') && codes.includes('SECONDARY_WITHOUT_UPSTREAM'));
});

test('a primary that declares an upstream is treated as derived, not original', () => {
  const r = run(['Claim [^a] [^b]'], [P('a'), P('b', ', cites=a')]);
  assert.equal(v(r), 'single_origin');
  assert.ok(r.claims[0].findings.some((f) => f.code === 'PRIMARY_WITH_UPSTREAM'));
});

test('unsupported, contradicted and conflicting claims', () => {
  const r = run(['No citation here', 'Only against [-^a]', 'Both ways [^a] [-^b]'], [P('a'), P('b')]);
  assert.deepEqual(r.claims.map((c) => c.decision), ['unsupported', 'contradicted', 'conflicting']);
});

// ---------- adversarial citations ----------
test('same URL (after tracking-parameter and www normalisation) on two "primary" refs -> abstain, never corroborated', () => {
  const r = run(['Claim [^a] [^b]'], [P('a', ', url=https://wire.example/s/1?utm_source=x'), P('b', ', url=https://www.wire.example/s/1/')]);
  assert.equal(v(r), 'abstain_suspected_shared_origin');
  assert.equal(r.claims[0].status, 'supported_by_independent_origins', 'hard status kept separately');
});

test('same DOI on two refs -> abstain; a DOI is never trusted as identity either', () => {
  const r = run(['Claim [^a] [^b]'], [P('a', ', doi=10.5555/x.1'), P('b', ', doi=10.5555/X.1')]);
  assert.equal(v(r), 'abstain_suspected_shared_origin');
  assert.equal(r.claims[0].citeEvidence.independentOrigins, 2, 'identifiers do not merge origins (only a cue)');
});

test('identical titles from different outlets trigger the core cue and abstain', () => {
  const r = run(['Claim [^a] [^b]'], ['[^a]: Mayor resigns {kind=primary}', '[^b]: Mayor resigns {kind=primary}']);
  assert.equal(v(r), 'abstain_suspected_shared_origin');
});

test('byte-identical saved copies under different outlets and URLs are one source (verified); without files the tool does not guess', () => {
  const refs = [P('a', ', url=https://one.example/a, saved=same1.txt'), P('b', ', url=https://two.example/b, saved=same2.txt')];
  const withFiles = run(['Claim [^a] [^b]'], refs, { sourcesDir: dir });
  assert.equal(v(withFiles), 'single_origin');
  assert.ok(withFiles.claims[0].findings.some((f) => f.code === 'SAVED_COPY_IDENTICAL' && /verified by hashing/.test(f.message)));
  const noFiles = run(['Claim [^a] [^b]'], refs);
  assert.equal(v(noFiles), 'independently_corroborated', 'without saved files only declarations exist; this is the documented limitation');
  assert.equal(noFiles.integrity.mode, 'not_requested');
});

test('different bytes, empty files and symlinks never create a "same source" link', () => {
  for (const [f1, f2] of [['same1.txt', 'other.txt'], ['empty1.txt', 'empty2.txt'], ['same1.txt', 'link.txt']]) {
    const r = run(['Claim [^a] [^b]'], [P('a', `, saved=${f1}`), P('b', `, saved=${f2}`)], { sourcesDir: dir });
    assert.equal(v(r), 'independently_corroborated', `${f1}/${f2}`);
    assert.ok(!r.claims[0].findings.some((f) => f.code === 'SAVED_COPY_IDENTICAL'));
  }
  const r = run(['Claim [^a]'], [P('a', ', saved=link.txt')], { sourcesDir: dir });
  assert.deepEqual([r.integrity.results[0].status, r.integrity.results[0].reason, r.integrity.results[0].observedSha256], ['UNSAFE_PATH', 'symlink', undefined]);
});

test('saved paths that escape the sources folder are UNSAFE_PATH and never read', () => {
  const r = run(['Claim [^a] [^b]'], [P('a', ', saved=../etc/passwd'), P('b', ', saved=/etc/hosts')], { sourcesDir: dir });
  assert.deepEqual(r.integrity.results.map((x) => x.status), ['UNSAFE_PATH', 'UNSAFE_PATH']);
});

test('citation tokens inside fenced code blocks are ignored (cannot inject claims or citations)', () => {
  const t = '# T\n## Claims\n- Real [^a]\n```\n- Fake claim [^ghost]\n[^ghost]: not a ref\n```\n## References\n[^a]: Primary a {kind=primary}\n';
  const n = parseNote(t);
  assert.equal(n.claims.length, 1); assert.ok(!n.references.has('ghost'));
});

test('order of references and claims does not change verdicts (metamorphic)', () => {
  const refs = [P('pr'), S('a', ', cites=pr'), P('q'), S('b', ', cites=q'), S('c', ', cites=b;a')];
  const a = run(['X [^a] [^b] [^c]', 'Y [^pr]'], refs), b = run(['X [^c] [^b] [^a]', 'Y [^pr]'], [...refs].reverse());
  assert.deepEqual(a.claims.map((c) => [c.decision, c.citeEvidence]), b.claims.map((c) => [c.decision, c.citeEvidence]));
});

// ---------- domain validation ----------
test('domain validation errors carry line numbers', () => {
  const cases = [
    ['# T\n## Claims\n- c [^x]\n', /citation \[\^x\] has no reference definition/],
    ['# T\n## Claims\n- c [^a]\n[^a]: A\n[^a]: B\n', /duplicate reference/],
    ['# T\n## Claims\n- c [^a]\n[^a]: A {kind=tertiary}\n', /kind must be/],
    ['# T\n## Claims\n- c [^a]\n[^a]: A {colour=red}\n', /unknown attribute "colour"/],
    ['# T\n## Claims\n- c [^a]\n[^a]: A {url=javascript:alert(1)}\n', /url must be an http\(s\) URL/],
    ['# T\n## Claims\n- c [^a]\n[^a]: A {cites=zz}\n', /cites \[\^zz\], which is not defined/],
    ['# T\n## Claims\n- c [^a]\n[^a]: {kind=primary}\n', /needs a label/],
    ['# T\n## Claims\n- c [^__proto__]\n[^__proto__]: A\n', /not allowed/],
    ['# T\n- c [^a]\n[^a]: A\n', /no "## Claims" section/],
    ['# T\n## Claims\n- c\u202e [^a]\n[^a]: A\n', /bidirectional/],
    ['# T\n## Claims\n- c [^a]\n```\n[^a]: A\n', /unclosed code fence/],
  ];
  for (const [t, re] of cases) { const is = issues(() => parseNote(t)); assert.ok(is.some((i) => re.test(i.message)), `${re}: ${JSON.stringify(is)}`); assert.ok(is.every((i) => Number.isInteger(i.line))); }
});

test('resource limits: bytes, claims, references, citations per claim, line length', () => {
  const L = { ...CITE_LIMITS, maxClaims: 3, maxReferences: 3, maxCitationsPerClaim: 2, maxLineLength: 80, maxBytes: 2000 };
  assert.ok(issues(() => parseNote('x'.repeat(2001), L))[0].message.includes('bytes'));
  assert.ok(issues(() => parseNote(note(['a [^r]', 'b [^r]', 'c [^r]', 'd [^r]'], ['[^r]: R']), L)).some((i) => /more than 3 claims/.test(i.message)));
  assert.ok(issues(() => parseNote(note(['a [^r1]'], ['[^r1]: R', '[^r2]: R', '[^r3]: R', '[^r4]: R']), L)).some((i) => /more than 3 references/.test(i.message)));
  assert.ok(issues(() => parseNote(note(['a [^r1] [^r2] [^r3]'], ['[^r1]: R', '[^r2]: R', '[^r3]: R']), L)).some((i) => /more than 2 citations/.test(i.message)));
  assert.ok(issues(() => parseNote(note([`a ${'y'.repeat(90)} [^r1]`], ['[^r1]: R']), L)).some((i) => /line exceeds 80/.test(i.message)));
});

test('a lineage deeper than the core limit is reported as a note issue, not a crash', () => {
  const refs = Array.from({ length: 60 }, (_, i) => `[^r${i}]: R${i} {kind=${i ? 'secondary' : 'primary'}${i ? `, cites=r${i - 1}` : ''}}`);
  assert.ok(issues(() => run(['c [^r59]'], refs)).some((i) => /lineage: derivation depth exceeds/.test(i.message)));
});

test('unused references are reported as note findings', () => {
  const r = run(['c [^a]'], [P('a'), P('spare')]);
  assert.deepEqual(r.cite.noteFindings.map((f) => f.refs[0]), ['spare']);
});

// ---------- demo, outputs, export ----------
test('example note: one claim per verdict, exactly as documented', () => {
  const r = analyzeNote(readFileSync(join(EX, 'water-note.md'), 'utf8'), { sourcesDir: join(EX, 'sources'), noteName: 'water-note.md' });
  assert.deepEqual(r.claims.map((c) => [c.line, c.decision]), [[6, 'single_origin'], [7, 'independently_corroborated'], [8, 'circular_reporting'], [9, 'origin_unresolved'], [10, 'abstain_suspected_shared_origin'], [11, 'unsupported']]);
  assert.deepEqual(r.claims[0].citeEvidence, { citations: 6, independentOrigins: 1, primaryRootedOrigins: 1 });
  const ag = r.integrity.results.find((x) => x.evidenceId === 'doc.ag');
  assert.deepEqual([ag.status, ag.reason], ['MISSING', 'file_not_found']);
});

test('reports are deterministic and the committed Cite showcase equals a fresh build', () => {
  const t = readFileSync(join(EX, 'water-note.md'), 'utf8');
  const a = serializeCiteReport(analyzeNote(t, { sourcesDir: join(EX, 'sources'), noteName: 'water-note.md' }));
  assert.equal(a, serializeCiteReport(analyzeNote(t, { sourcesDir: join(EX, 'sources'), noteName: 'water-note.md' })));
  assert.equal(readFileSync(join(root, 'apps/proofgap-cite/showcase.html'), 'utf8'), renderCiteHtml([a]), 'rebuild: rm apps/proofgap-cite/showcase.html && npm run showcase:cite');
});

test('HTML: hostile labels and claims stay inside the escaped JSON block; Cite header is used', () => {
  const r = run(['<img src=x onerror=alert(1)> [^a]'], ['[^a]: </script><script>alert(2)</script> {kind=primary}']);
  const h = renderCiteHtml([serializeCiteReport(r)]);
  assert.equal((h.match(/<script/g) ?? []).length, 2);
  assert.doesNotMatch(h, /<img src=x|alert\(2\)<\/script>/);
  assert.match(h, /<h1>ProofGap Cite — citation lineage &amp; false corroboration<\/h1>/);
});

test('lint output names file:line and verdict; control characters are neutralised', () => {
  const out = renderLint(run(['A claim [^a]'], ['[^a]: Outlet {kind=primary}']));
  assert.match(out, /^note:3: \[single_origin\] "A claim"/m);
  assert.match(out, /missing: A second primary source/);
});

const cli = (...a) => spawnSync(process.execPath, [CLI, ...a], { encoding: 'utf8' });
test('CLI: lint/json/html, --fail-on-gaps exit 3, usage 2, invalid note 1 with line numbers, never overwrites', () => {
  const ex = join(EX, 'water-note.md');
  let r = cli(ex, '--sources', join(EX, 'sources')); assert.equal(r.status, 0); assert.match(r.stdout, /water-note\.md:6: \[single_origin\]/);
  r = cli(ex, '--fail-on-gaps'); assert.equal(r.status, 3);
  r = cli(ex, '--format', 'json'); assert.equal(r.status, 0); assert.equal(JSON.parse(r.stdout).application, 'proofgap-cite');
  r = cli(ex, '--sources', join(EX, 'sources'), '--review-text-copies', '--format', 'json');
  assert.equal(r.status, 0); assert.equal(JSON.parse(r.stdout).cite.textCopyReview.mode, 'local_saved_text_opt_in');
  for (const a of [[], [ex, '--format', 'xml'], [ex, '--bogus', 'x'], [ex, '--fail-on-gaps', '--fail-on-gaps'], [ex, '--sources']]) assert.equal(cli(...a).status, 2, JSON.stringify(a));
  assert.equal(cli(ex, '--review-text-copies').status, 2, 'text review requires an explicit --sources directory');
  const bad = join(dir, 'bad.md'); writeFileSync(bad, '# T\n## Claims\n- c [^x]\n');
  r = cli(bad); assert.equal(r.status, 1); assert.match(r.stderr, /bad\.md:3: citation \[\^x\]/); assert.doesNotMatch(r.stderr, /\n\s+at /);
  const out = join(dir, 'o.html');
  assert.equal(cli(ex, '--format', 'html', '--out', out).status, 0); assert.ok(existsSync(out));
  assert.equal(cli(ex, '--format', 'html', '--out', out).status, 1, 'refuses to overwrite');
  assert.equal(cli(join(dir, 'missing.md')).status, 1);
});

test('a self-citing "primary" is not an original source (only path where the primary-with-upstream guard matters)', () => {
  const r = run(['Claim [^a] [^b]'], [P('a', ', cites=a'), P('b')]);
  assert.deepEqual(r.cite.cycles, [['a']]);
  assert.equal(r.claims[0].citeEvidence.primaryRootedOrigins, 1);
  assert.equal(v(r), 'origin_unresolved');
});
