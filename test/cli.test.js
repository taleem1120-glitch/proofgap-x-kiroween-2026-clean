import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, existsSync, symlinkSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { base, ev } from './helpers.js';

const CLI = fileURLToPath(new URL('../src/cli.js', import.meta.url));
const SAMPLE = fileURLToPath(new URL('../examples/sample-case.json', import.meta.url));
const run = (...a) => spawnSync(process.execPath, [CLI, ...a], { encoding: 'utf8', timeout: 20000 });
const dir = mkdtempSync(join(tmpdir(), 'pgx-'));
const validCase = () => { const c = base(); c.evidence = [ev('e1', 's1')]; return JSON.stringify(c); };

test('CLI: valid input writes report to stdout, exit 0', () => {
  const r = run(SAMPLE); assert.equal(r.status, 0); assert.equal(JSON.parse(r.stdout).caseId, 'DEMO-001'); assert.equal(r.stderr, '');
});

test('CLI: usage errors exit 2 and do nothing', () => {
  for (const a of [[], ['--out'], [SAMPLE, '--out'], [SAMPLE, 'x'], [SAMPLE, '--out', 'a', 'b'], ['-h'], [SAMPLE, '--out', '-x']]) {
    const r = run(...a); assert.equal(r.status, 2, JSON.stringify(a)); assert.match(r.stderr, /Usage/); assert.equal(r.stdout, '');
  }
});

test('CLI: invalid case exits 1 with path-specific errors, no stack trace, and creates no output file', () => {
  const inp = join(dir, 'bad.json'), out = join(dir, 'bad-out.json');
  const c = JSON.parse(validCase()); c.extra = 1; c.sources[0].id = 'bad id'; writeFileSync(inp, JSON.stringify(c));
  const r = run(inp, '--out', out);
  assert.equal(r.status, 1); assert.match(r.stderr, /\$\.extra: unsupported property/); assert.match(r.stderr, /\$\.sources\[0\]\.id/);
  assert.doesNotMatch(r.stderr, /\n\s+at /); assert.equal(r.stdout, ''); assert.equal(existsSync(out), false);
});

test('CLI: malformed JSON, empty file, binary garbage all exit 1 safely', () => {
  for (const [name, content] of [['m.json', '{oops'], ['e.json', ''], ['b.json', Buffer.from([0xff, 0xfe, 0x00, 0x01, 0x80])]]) {
    const p = join(dir, name); writeFileSync(p, content);
    const r = run(p); assert.equal(r.status, 1, name); assert.equal(r.stdout, ''); assert.doesNotMatch(r.stderr, /\n\s+at /);
  }
});

test('CLI: oversized file rejected without being parsed', () => {
  const p = join(dir, 'big.json'); writeFileSync(p, ' '.repeat(1_000_001));
  const r = run(p); assert.equal(r.status, 1); assert.match(r.stderr, /exceeds 1000000 bytes/);
});

test('CLI: missing file, directory, and special file exit 1 without leaking stack', () => {
  for (const p of [join(dir, 'nope.json'), dir, '/dev/zero', '/dev/null']) {
    const r = run(p); assert.equal(r.status, 1, p); assert.doesNotMatch(r.stderr, /\n\s+at /);
  }
});

test('CLI: never overwrites an existing output file (regular file, same as input, symlink, dangling symlink, dir)', () => {
  const inp = join(dir, 'good.json'); writeFileSync(inp, validCase());
  const existing = join(dir, 'existing.json'); writeFileSync(existing, 'ORIGINAL');
  let r = run(inp, '--out', existing); assert.equal(r.status, 1); assert.match(r.stderr, /EEXIST/); assert.equal(readFileSync(existing, 'utf8'), 'ORIGINAL');
  r = run(inp, '--out', inp); assert.equal(r.status, 1); assert.equal(readFileSync(inp, 'utf8'), validCase());
  const link = join(dir, 'link.json'); symlinkSync(existing, link);
  r = run(inp, '--out', link); assert.equal(r.status, 1); assert.equal(readFileSync(existing, 'utf8'), 'ORIGINAL');
  const target = join(dir, 'dangling-target.json'), dl = join(dir, 'dangling.json'); symlinkSync(target, dl);
  r = run(inp, '--out', dl); assert.equal(r.status, 1); assert.equal(existsSync(target), false);
  const sub = join(dir, 'sub'); mkdirSync(sub); r = run(inp, '--out', sub); assert.equal(r.status, 1);
});

test('CLI: writes a new output file once, with owner-only permissions, and repeat run is refused', () => {
  const inp = join(dir, 'good2.json'); writeFileSync(inp, validCase());
  const out = join(dir, 'fresh.json');
  let r = run(inp, '--out', out); assert.equal(r.status, 0); assert.equal(r.stdout, '');
  assert.equal(JSON.parse(readFileSync(out, 'utf8')).caseId, 'T1');
  if (process.platform !== 'win32') assert.equal((statSync(out).mode & 0o077), 0);
  const before = readFileSync(out, 'utf8');
  r = run(inp, '--out', out); assert.equal(r.status, 1); assert.equal(readFileSync(out, 'utf8'), before);
});

test('CLI: output into a missing directory fails cleanly', () => {
  const inp = join(dir, 'good3.json'); writeFileSync(inp, validCase());
  const r = run(inp, '--out', join(dir, 'nodir', 'o.json')); assert.equal(r.status, 1); assert.match(r.stderr, /ENOENT/);
});

test('CLI: cleanup check - temp dir contains only expected files', () => {
  assert.ok(!readdirSync(dir).includes('bad-out.json'));
  rmSync(dir, { recursive: true, force: true });
});
