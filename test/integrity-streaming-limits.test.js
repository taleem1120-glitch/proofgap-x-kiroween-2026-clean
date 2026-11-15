import { test } from 'node:test';
import assert from 'node:assert/strict';
import { appendFileSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { verifyEvidenceFiles, DEFAULT_INTEGRITY_LIMITS } from '../src/integrity.js';

const sha = (s) => createHash('sha256').update(s).digest('hex');
const evidence = (file, hash) => [{ id: 'e1', sourceId: 's1', description: 'fixture', file, sha256: hash, links: [] }];
const limits = (opts) => ({ ...DEFAULT_INTEGRITY_LIMITS, ...opts });

test('file growth after initial fstat cannot exceed the total-byte budget or produce VERIFIED', () => {
  const root = mkdtempSync(join(tmpdir(), 'pgx-budget-'));
  try {
    const file = join(root, 'grow.txt');
    writeFileSync(file, 'a');
    let ticks = 0;
    const now = () => {
      ticks++;
      // deadline call #1; initial hashFile check #2; first chunk check #3,
      // after fstat and before read. This deterministically models a growing file.
      if (ticks === 3) appendFileSync(file, 'bcde');
      return 0;
    };
    const result = verifyEvidenceFiles(evidence('grow.txt', sha('abcde')), {
      evidenceDir: root,
      limits: limits({ maxTotalBytes: 2 }),
      now,
    });
    assert.equal(result.results[0].status, 'NOT_CHECKED');
    assert.equal(result.results[0].reason, 'total_bytes_limit');
    assert.equal(result.results[0].verified, false);
    assert.equal(result.usage.totalBytes, 0);
    assert.ok(ticks >= 3);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('deadline expiring immediately before a streaming read must not yield VERIFIED', () => {
  const root = mkdtempSync(join(tmpdir(), 'pgx-time-'));
  try {
    writeFileSync(join(root, 'ok.txt'), 'abc');
    let ticks = 0;
    const now = () => (++ticks >= 3 ? 20 : 0);
    const result = verifyEvidenceFiles(evidence('ok.txt', sha('abc')), {
      evidenceDir: root,
      limits: limits({ maxMillis: 10 }),
      now,
    });
    assert.equal(result.results[0].status, 'NOT_CHECKED');
    assert.equal(result.results[0].reason, 'time_limit');
    assert.equal(result.results[0].verified, false);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
