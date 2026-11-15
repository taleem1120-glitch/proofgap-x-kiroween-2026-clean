import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { verifyEvidenceFiles, DEFAULT_INTEGRITY_LIMITS } from '../src/integrity.js';

const sha = (data) => createHash('sha256').update(data).digest('hex');
const record = (id, file, bytes) => ({ id, file, sha256: sha(bytes) });

test('streaming deadline is checked after reading chunks, never reports VERIFIED after a timeout', () => {
  const root = mkdtempSync(join(tmpdir(), 'pgx-stream-time-'));
  try {
    const bytes = Buffer.alloc(100_000, 7);
    writeFileSync(join(root, 'large.bin'), bytes);
    let tick = 0;
    const r = verifyEvidenceFiles([record('e1', 'large.bin', bytes)], {
      evidenceDir: root,
      limits: { ...DEFAULT_INTEGRITY_LIMITS, maxMillis: 1 },
      now: () => tick++,
    });
    assert.equal(r.results[0].status, 'NOT_CHECKED');
    assert.equal(r.results[0].reason, 'time_limit');
    assert.equal(r.results[0].verified, false);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('normal streaming within budget still verifies identical bytes', () => {
  const root = mkdtempSync(join(tmpdir(), 'pgx-stream-ok-'));
  try {
    const bytes = Buffer.alloc(100_000, 3);
    writeFileSync(join(root, 'large.bin'), bytes);
    const r = verifyEvidenceFiles([record('e1', 'large.bin', bytes)], {
      evidenceDir: root,
      limits: { ...DEFAULT_INTEGRITY_LIMITS, maxMillis: 1000 },
      now: () => 0,
    });
    assert.equal(r.results[0].status, 'VERIFIED');
    assert.equal(r.usage.totalBytes, bytes.length);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
