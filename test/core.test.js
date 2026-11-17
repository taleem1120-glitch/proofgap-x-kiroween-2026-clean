// Shared core interface (src/core.js) and the two-application boundary.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, mkdtempSync, writeFileSync, rmSync, lstatSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as core from '../src/core.js';
import { analyzeCase, validateCase, serializeReport } from '../src/index.js';
import { genCase, clone } from './gen.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const walk = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });

test('core exposes a semver API version and the documented surface', () => {
  assert.match(core.CORE_API_VERSION, /^1\.\d+\.\d+$/);
  for (const k of ['analyze', 'readInputFile', 'writeNewFile', 'serializeReport', 'renderText', 'renderHtml', 'CaseValidationError', 'IntegrityConfigError', 'DEFAULT_PROFILE', 'DEFAULT_LIMITS']) assert.ok(k in core, k);
});

test('applications import nothing from the engine except src/core.js (and their own files)', () => {
  for (const f of walk(join(root, 'apps')).filter((p) => p.endsWith('.js'))) {
    for (const m of readFileSync(f, 'utf8').matchAll(/from\s+'([^']+)'/g)) {
      const spec = m[1];
      if (spec.startsWith('node:') || spec.startsWith('./')) continue;
      assert.match(spec, /(^|\/)src\/core\.js$/, `${f.slice(root.length)} imports ${spec}`);
    }
  }
});

test('the two applications live in separate folders and do not import each other', () => {
  assert.deepEqual(readdirSync(join(root, 'apps')).sort(), ['proofgap-cite', 'proofgap-x']);
  for (const [a, b] of [['proofgap-x', 'proofgap-cite'], ['proofgap-cite', 'proofgap-x']]) {
    for (const f of walk(join(root, 'apps', a)).filter((p) => p.endsWith('.js'))) assert.doesNotMatch(readFileSync(f, 'utf8'), new RegExp(`apps/${b}|\\.\\./${b}/`), f);
  }
});

test('core.analyze with the default profile is byte-identical to the engine (60 generated cases)', () => {
  for (let seed = 15000; seed < 15060; seed++) {
    const c = genCase(seed);
    assert.equal(serializeReport(core.analyze({ caseData: clone(c) }).report), serializeReport(analyzeCase(validateCase(clone(c)))), `seed ${seed}`);
  }
});

test('a profile changes wording only: classification, scores, graph, plans unchanged; application id recorded', () => {
  const profile = { id: 'demo-app', disclaimer: 'Custom disclaimer.', claimCaveat: 'Custom caveat.' };
  for (let seed = 15100; seed < 15140; seed++) {
    const c = genCase(seed);
    const a = JSON.parse(serializeReport(core.analyze({ caseData: clone(c) }).report));
    const b = JSON.parse(serializeReport(core.analyze({ caseData: clone(c), profile }).report));
    assert.equal(b.application, 'demo-app'); assert.equal(a.application, undefined);
    assert.equal(b.disclaimer, 'Custom disclaimer.');
    const strip = (r) => { const x = clone(r); delete x.application; delete x.disclaimer; for (const cl of x.claims) cl.explanation = cl.explanation.filter((e) => e !== 'Custom caveat.' && e !== core.DEFAULT_PROFILE.claimCaveat); return x; };
    assert.deepEqual(strip(b), strip(a), `seed ${seed}`);
  }
});

test('analyze() rejects ambiguous input and malformed profiles', () => {
  const c = genCase(15200);
  assert.throws(() => core.analyze({}), TypeError);
  assert.throws(() => core.analyze({ caseData: c, caseText: '{}' }), TypeError);
  assert.throws(() => core.analyze({ caseData: c, profile: { tool: 'x' } }), /unknown profile key/);
  assert.throws(() => core.analyze({ caseData: c, profile: { disclaimer: '' } }), /non-empty/);
  assert.throws(() => core.analyze({ caseData: c, profile: { disclaimer: 'x'.repeat(501) } }), /at most 500/);
  assert.throws(() => core.analyze({ caseText: '{bad' }), core.CaseValidationError);
});

test('renderHtml: the default header is unchanged; a custom header is escaped as text', () => {
  const s = serializeReport(analyzeCase(validateCase(genCase(15201))));
  assert.match(core.renderHtml([s]), /<h1>ProofGap X — evidence independence &amp; proof gaps<\/h1>/);
  const h = core.renderHtml([s], { heading: '<img src=x onerror=alert(1)>', title: 't', intro: 'i', footer: 'f' });
  assert.match(h, /<h1>&lt;img src=x onerror=alert\(1\)&gt;<\/h1>/);
  assert.doesNotMatch(h, /<img src=x/);
});

test('app 1 CLI shim and app folder produce identical bytes', async () => {
  const { spawnSync } = await import('node:child_process');
  const a = spawnSync(process.execPath, [join(root, 'src/cli.js'), join(root, 'examples/sample-case.json')], { encoding: 'utf8' });
  const b = spawnSync(process.execPath, [join(root, 'apps/proofgap-x/cli.js'), join(root, 'examples/sample-case.json')], { encoding: 'utf8' });
  assert.equal(a.status, 0); assert.equal(a.stdout, b.stdout);
});


test('readInputFile reads bounded UTF-8 input in chunks and detects a byte beyond the limit', () => {
  const dir = mkdtempSync(join(tmpdir(), 'pgx-core-io-'));
  try {
    const path = join(dir, 'input.txt');
    const content = 'x'.repeat(150_000) + '✓';
    writeFileSync(path, content);
    assert.equal(core.readInputFile(path, Buffer.byteLength(content)), content);
    assert.throws(() => core.readInputFile(path, Buffer.byteLength(content) - 1), core.CaseValidationError);
    writeFileSync(path, '');
    assert.equal(core.readInputFile(path, 1), '');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('writeNewFile validates arguments and byte limits, creates private files, and never overwrites', () => {
  const dir = mkdtempSync(join(tmpdir(), 'pgx-core-write-'));
  try {
    const path = join(dir, 'out.txt');
    assert.throws(() => core.writeNewFile('', 'x'), TypeError);
    assert.throws(() => core.writeNewFile(path, Buffer.from('x')), TypeError);
    for (const max of [0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER]) {
      assert.throws(() => core.writeNewFile(path, 'x', max), RangeError);
    }
    assert.throws(() => core.writeNewFile(path, '✓', 2), RangeError);
    core.writeNewFile(path, '✓', 3);
    assert.equal(readFileSync(path, 'utf8'), '✓');
    assert.equal(lstatSync(path).mode & 0o777, 0o600);
    assert.throws(() => core.writeNewFile(path, 'replacement'), { code: 'EEXIST' });
    assert.equal(readFileSync(path, 'utf8'), '✓');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
