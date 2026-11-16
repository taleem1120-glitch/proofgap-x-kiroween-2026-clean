import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { readInputFile, CaseValidationError } from '../src/core.js';

test('CLI input reader rejects final-component symlinks atomically on POSIX', { skip: process.platform === 'win32' }, () => {
  const dir = mkdtempSync(join(tmpdir(), 'pgx-input-nofollow-'));
  try {
    const target = join(dir, 'target.json');
    const link = join(dir, 'link.json');
    writeFileSync(target, '{"ok":true}');
    symlinkSync(target, link);
    assert.throws(
      () => readInputFile(link),
      (error) => error instanceof CaseValidationError || error.code === 'ELOOP'
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('CLI input reader rejects FIFOs without blocking on POSIX', { skip: process.platform === 'win32' }, (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'pgx-input-fifo-'));
  try {
    const fifo = join(dir, 'input.pipe');
    const made = spawnSync('mkfifo', [fifo], { timeout: 2000, encoding: 'utf8' });
    if (made.error?.code === 'ENOENT') {
      t.skip('mkfifo is unavailable on this platform');
      return;
    }
    assert.equal(made.status, 0, made.stderr);
    const script = `const { readInputFile, CaseValidationError } = await import('./src/core.js');
try { readInputFile(process.argv[1]); process.exit(1); }
catch (error) { process.exit(error instanceof CaseValidationError ? 0 : 2); }`;
    const child = spawnSync(process.execPath, ['--input-type=module', '-e', script, fifo], {
      timeout: 3000,
      encoding: 'utf8'
    });
    assert.equal(child.error?.code, undefined, 'input reader blocked on a FIFO');
    assert.equal(child.status, 0, child.stderr);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
