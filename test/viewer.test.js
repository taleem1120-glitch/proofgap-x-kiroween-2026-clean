import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, rmSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyzeText, renderHtml, serializeReport, analyzeCase, validateCase } from '../src/index.js';
import { base } from './helpers.js';

const root = (p) => fileURLToPath(new URL(`../${p}`, import.meta.url));
const read = (p) => readFileSync(root(p), 'utf8');
const sha = (s) => createHash('sha256').update(s, 'utf8').digest('base64');
const showcase = () => analyzeText(read('examples/showcase/deceptive.json'), undefined,
  { format: 'html', evidenceDir: root('examples/showcase/evidence'), compareText: read('examples/showcase/independent.json') });

test('viewer source uses no dangerous DOM, eval or network APIs', () => {
  const js = read('viewer/app.js');
  assert.doesNotMatch(js, /innerHTML|outerHTML|insertAdjacentHTML|document\.write|\beval\s*\(|new Function|fetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon|localStorage|sessionStorage|importScripts|<script|<!--/);
  assert.doesNotMatch(read('viewer/style.css'), /@import|url\(|<\/style/i);
});

test('CSP: default-src none, no network, and the inline script/style hashes match the inlined content exactly', () => {
  const html = showcase();
  const csp = html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)[1];
  for (const d of ["default-src 'none'", "connect-src 'none'", "img-src 'none'", "form-action 'none'", "base-uri 'none'", "object-src 'none'"]) assert.ok(csp.includes(d), d);
  const js = html.match(/<script>([\s\S]*)<\/script>\n<\/body>/)[1];
  const css = html.match(/<style>([\s\S]*?)<\/style>/)[1];
  assert.ok(csp.includes(`'sha256-${sha(js)}'`), 'script hash mismatch');
  assert.ok(csp.includes(`'sha256-${sha(css)}'`), 'style hash mismatch');
  assert.doesNotMatch(csp, /unsafe-inline|unsafe-eval|https?:/);
});

test('committed viewer/showcase.html is byte-identical to a fresh deterministic build', () => {
  const a = showcase();
  assert.equal(a, showcase());
  assert.equal(read('viewer/showcase.html'), a, 'run `rm viewer/showcase.html && npm run showcase` and commit the result');
});

test('showcase content: scenario A collapses 8 items to 1 origin with verified byte links; scenario B supports, abstains and contradicts', () => {
  const blocks = [...showcase().matchAll(/<script type="application\/json" class="pgx-report" id="pgx-report-\d">\n([\s\S]*?)\n<\/script>/g)].map((m) => JSON.parse(m[1]));
  assert.equal(blocks.length, 2);
  const [A, B] = blocks, cl = (r, id) => r.claims.find((c) => c.claimId === id);
  assert.deepEqual([cl(A, 'door-0214').corroboration.supportingEvidenceItems, cl(A, 'door-0214').corroboration.independentSupportOrigins, cl(A, 'door-0214').decision], [8, 1, 'insufficient_support']);
  assert.equal(A.graph.basisCounts.verified, 2);
  assert.equal(cl(A, 'door-0214').plan.smallestChange.minimalCount, 1);
  assert.equal(cl(B, 'door-0214').decision, 'supported_by_independent_origins');
  assert.equal(cl(B, 'alarm-off').decision, 'abstain_possible_undeclared_dependence');
  assert.equal(cl(B, 'alarm-off').status, 'supported_by_independent_origins');
  assert.equal(cl(B, 'two-people').decision, 'contradicted');
});

test('hostile labels stay inside the JSON data block (escaped); only expected script elements exist', () => {
  const c = base();
  c.title = '</script><script>alert(1)</script><!--'; c.claims[0].statement = '<img src=x onerror=alert(2)>';
  c.sources[0].name = '"><svg onload=alert(3)>';
  const html = renderHtml([serializeReport(analyzeCase(validateCase(c)))]);
  assert.equal((html.match(/<script/g) ?? []).length, 2, 'one data block + one app script');
  assert.equal((html.match(/<\/script>/g) ?? []).length, 2);
  assert.doesNotMatch(html, /alert\(1\)<\/script>|<img src=x|<svg onload/);
  assert.throws(() => renderHtml(['{"title":"<b>"}']), /must come from serializeReport/);
  assert.throws(() => renderHtml([]), /1 or 2/);
});

test('CLI: --format html writes once (never overwrites); --compare requires html', () => {
  const CLI = root('src/cli.js'), dir = mkdtempSync(join(tmpdir(), 'pgx-html-')), out = join(dir, 'r.html');
  const run = (...a) => spawnSync(process.execPath, [CLI, ...a], { encoding: 'utf8' });
  assert.equal(run(root('examples/sample-case.json'), '--format', 'html', '--out', out).status, 0);
  assert.ok(existsSync(out) && readFileSync(out, 'utf8').startsWith('<!doctype html>'));
  assert.equal(run(root('examples/sample-case.json'), '--format', 'html', '--out', out).status, 1);
  assert.equal(run(root('examples/sample-case.json'), '--compare', root('examples/sample-case.json')).status, 2);
  assert.equal(run(root('examples/sample-case.json'), '--format', 'json', '--compare', root('examples/sample-case.json')).status, 2);
  rmSync(dir, { recursive: true, force: true });
});

test('viewer exposes accessible relationship-basis filters for graph paths and text rows', () => {
  const js = read('viewer/app.js');
  for (const basis of ['all', 'verified', 'declared', 'suspected', 'unknown']) {
    assert.ok(js.includes("value: '" + basis + "'"), 'missing graph filter: ' + basis);
  }
  assert.match(js, /aria-label': 'Filter provenance relationships'/);
  assert.match(js, /x\.element\.style\.display = visible \? '' : 'none'/);
  assert.match(js, /x\.element\.hidden = !visible/);
  assert.match(js, /aria-live': 'polite'/);
  assert.match(read('viewer/style.css'), /\.graphfilter:focus-visible/);
});

test('viewer supports keyboard-accessible node selection and direct provenance path inspection', () => {
  const js = read('viewer/app.js');
  assert.match(js, /grp\.setAttribute\('role', 'button'\)/);
  assert.match(js, /tabindex:\s*0/, 'graph nodes must be reachable by keyboard focus');
  assert.match(js, /grp\.setAttribute\('aria-label', 'Inspect '/);
  assert.match(js, /event\.key === 'Enter' \|\| event\.key === ' '/);
  assert.match(js, /function selectNode\(id\)/);
  assert.match(js, /x\.from === id \|\| x\.to === id/);
  assert.match(js, /selected-edge/);
  assert.match(js, /direct relationship\(s\)/i);
  assert.match(js, /aria-live': 'polite'/);
  assert.match(read('viewer/style.css'), /\.trace-panel/);
});
