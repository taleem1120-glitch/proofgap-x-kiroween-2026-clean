import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { readInputFile } from '../src/core.js';

test('input reader accepts ordinary UTF-8 regular files', () => {
  const dir = mkdtempSync(join(tmpdir(), 'pgx-input-'));
  try {
    const p = join(dir, 'case.json'); writeFileSync(p, '{"ok":true}');
    assert.equal(readInputFile(p), '{"ok":true}');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('input reader rejects final-component symlinks on POSIX', { skip: process.platform === 'win32' }, () => {
  const dir = mkdtempSync(join(tmpdir(), 'pgx-link-'));
  try {
    const target = join(dir, 'target.json'), link = join(dir, 'link.json');
    writeFileSync(target, '{"ok":true}'); symlinkSync(target, link);
    assert.throws(() => readInputFile(link), /ELOOP|symbolic link|too many levels/i);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('a named pipe cannot block input reading before regular-file checks', { skip: process.platform === 'win32' }, (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'pgx-fifo-'));
  try {
    const fifo = join(dir, 'pipe.json');
    const made = spawnSync('mkfifo', [fifo], { timeout: 2000, encoding: 'utf8' });
    if (made.error?.code === 'ENOENT') { t.skip('mkfifo not installed'); return; }
    assert.equal(made.status, 0, made.stderr);
    const script = "import {readInputFile} from " + JSON.stringify(new URL('../src/core.js', import.meta.url).href) +
      "; try { readInputFile(process.argv[1]); process.exit(1); } catch (e) { process.exit(e.name === 'CaseValidationError' ? 0 : 2); }";
    const child = spawnSync(process.execPath, ['--input-type=module', '-e', script, fifo], { timeout: 3000, encoding: 'utf8' });
    assert.equal(child.error?.code, undefined, 'input reader hung on a FIFO');
    assert.equal(child.status, 0, child.stderr);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
