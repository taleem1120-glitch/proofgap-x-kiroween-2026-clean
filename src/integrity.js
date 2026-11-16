import { createHash } from 'node:crypto';
import { constants, fstatSync, lstatSync, openSync, readSync, closeSync, realpathSync } from 'node:fs';
import { join, sep } from 'node:path';

/**
 * Opt-in local evidence integrity verification.
 *
 * States:
 *  VERIFIED     file found safely inside the configured directory and its SHA-256 equals the declared hash
 *  MISMATCH     file found safely but its SHA-256 differs from the declared hash
 *  MISSING      path is syntactically safe but no such file exists
 *  UNSAFE_PATH  path or file type rejected (traversal, absolute, symlink, non-regular file, escapes root, ...)
 *  NOT_CHECKED  no declared hash was checked (not requested, no hash/file declared, or a resource limit was hit).
 *               If a file was read anyway, `observedSha256` carries the hash the tool computed.
 *
 * VERIFIED only means "these bytes match the declared hash". It says nothing about
 * authenticity, provenance, independence, or truth.
 */
export const INTEGRITY_STATES = Object.freeze(['VERIFIED', 'MISMATCH', 'MISSING', 'UNSAFE_PATH', 'NOT_CHECKED']);

export const DEFAULT_INTEGRITY_LIMITS = Object.freeze({
  maxFiles: 200,
  maxFileBytes: 50 * 1024 * 1024,
  maxTotalBytes: 256 * 1024 * 1024,
  maxMillis: 30_000,
  maxPathLength: 255,
  maxPathDepth: 8,
});

export class IntegrityConfigError extends Error {
  constructor(message) { super(message); this.name = 'IntegrityConfigError'; }
}

const SEGMENT_RE = /^[A-Za-z0-9_.-]{1,255}$/;
const CHUNK = 64 * 1024;

/** Returns null if the relative path is acceptable, else a fixed reason string. */
export function checkRelativePath(p, limits = DEFAULT_INTEGRITY_LIMITS) {
  if (typeof p !== 'string' || p.length === 0) return 'empty_or_non_string_path';
  if (p.length > limits.maxPathLength) return 'path_too_long';
  if (p.startsWith('/')) return 'absolute_path';
  if (p.includes('\\')) return 'backslash_in_path';
  const segs = p.split('/');
  if (segs.length > limits.maxPathDepth) return 'path_too_deep';
  for (const s of segs) {
    if (s === '') return 'empty_path_segment';
    if (s === '.' || s === '..') return 'dot_segment';
    if (!SEGMENT_RE.test(s)) return 'disallowed_characters';
  }
  return null;
}

const entry = (e, status, reason, extra = {}) => ({
  evidenceId: e.id, status, verified: status === 'VERIFIED',
  declaredSha256: e.sha256 ?? null, file: e.file ?? null, ...(reason ? { reason } : {}), ...extra,
});

function count(results) {
  const counts = Object.fromEntries(INTEGRITY_STATES.map((s) => [s, 0]));
  for (const r of results) counts[r.status]++;
  return counts;
}

/** Report block used when verification was not requested. */
export function integrityNotRequested(evidence) {
  const results = [...evidence].sort((a, b) => (a.id < b.id ? -1 : 1)).map((e) =>
    entry(e, 'NOT_CHECKED', e.sha256 ? 'verification_not_requested' : 'no_declared_hash'));
  return { mode: 'not_requested', counts: count(results), results };
}

/**
 * Verify declared hashes against files under `evidenceDir` (explicit opt-in).
 * Never follows symlinks, rejects hard-linked files (conservatively, even when all links
 * are inside the evidence directory), never reads non-regular files, and enforces
 * file-count / per-file / total-byte / time limits.
 */
export function verifyEvidenceFiles(evidence, { evidenceDir, limits = DEFAULT_INTEGRITY_LIMITS, now = Date.now } = {}) {
  if (typeof evidenceDir !== 'string' || evidenceDir.length === 0) throw new IntegrityConfigError('evidenceDir must be a non-empty string');
  let root;
  try {
    root = realpathSync(evidenceDir);
    if (!lstatSync(root).isDirectory()) throw new Error('not a directory');
  } catch { throw new IntegrityConfigError('evidence directory does not exist or is not a directory'); }

  const deadline = now() + limits.maxMillis;
  const cache = new Map(); // relPath -> outcome (a file is read at most once)
  let filesRead = 0, totalBytes = 0;
  const results = [];

  const checkFile = (rel, declared) => {
    const bad = checkRelativePath(rel, limits);
    if (bad) return { status: 'UNSAFE_PATH', reason: bad };
    if (cache.has(rel)) return cache.get(rel);
    const out = hashFile(rel, declared);
    cache.set(rel, out);
    return out;
  };

  const hashFile = (rel) => {
    if (now() > deadline) return { status: 'NOT_CHECKED', reason: 'time_limit' };
    if (filesRead >= limits.maxFiles) return { status: 'NOT_CHECKED', reason: 'file_count_limit' };
    const segs = rel.split('/');
    let cur = root;
    for (let i = 0; i < segs.length; i++) {
      cur = join(cur, segs[i]);
      let st;
      try { st = lstatSync(cur, { throwIfNoEntry: false }); } catch (e) {
        if (e.code === 'ENOTDIR') return { status: 'UNSAFE_PATH', reason: 'not_a_directory' };
        return { status: 'NOT_CHECKED', reason: 'io_error' };
      }
      if (!st) return { status: 'MISSING', reason: 'file_not_found' };
      if (st.isSymbolicLink()) return { status: 'UNSAFE_PATH', reason: 'symlink' };
      const last = i === segs.length - 1;
      if (last && !st.isFile()) return { status: 'UNSAFE_PATH', reason: 'not_a_regular_file' };
      if (!last && !st.isDirectory()) return { status: 'UNSAFE_PATH', reason: 'not_a_directory' };
    }
    let fd;
    try {
      fd = openSync(cur, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0) | (constants.O_NONBLOCK ?? 0));
      const st = fstatSync(fd);
      if (!st.isFile()) return { status: 'UNSAFE_PATH', reason: 'not_a_regular_file' };
      // Hard links can name the same inode from outside evidenceDir; reject all multi-link
      // files rather than pretending a pathname check establishes directory containment.
      if (st.nlink > 1) return { status: 'UNSAFE_PATH', reason: 'hard_link' };
      // Defence against a directory component swapped for a symlink after the lstat walk.
      const real = realpathSync(cur);
      if (!real.startsWith(root + sep)) return { status: 'UNSAFE_PATH', reason: 'escapes_evidence_directory' };
      if (st.size > limits.maxFileBytes) return { status: 'NOT_CHECKED', reason: 'file_size_limit' };
      if (totalBytes + st.size > limits.maxTotalBytes) return { status: 'NOT_CHECKED', reason: 'total_bytes_limit' };
      filesRead++;
      const h = createHash('sha256');
      const buf = Buffer.allocUnsafe(CHUNK);
      let n = 0, r;
      // Check before every read and after each observed chunk. This also catches a slow
      // final read: the next iteration checks the deadline before accepting EOF.
      while (true) {
        if (now() > deadline) return { status: 'NOT_CHECKED', reason: 'time_limit' };
        r = readSync(fd, buf, 0, CHUNK, null);
        if (r === 0) break;
        n += r;
        // Check resource budgets on observed bytes rather than only the initial stat size.
        // A file can grow while it is being read, and a slow read can outlast the deadline.
        if (now() > deadline) return { status: 'NOT_CHECKED', reason: 'time_limit' };
        if (n > limits.maxFileBytes) return { status: 'NOT_CHECKED', reason: 'file_size_limit' };
        if (totalBytes + n > limits.maxTotalBytes) return { status: 'NOT_CHECKED', reason: 'total_bytes_limit' };
        h.update(buf.subarray(0, r));
      }
      // Re-check link count after reading to catch a hard link added during the read.
      if (fstatSync(fd).nlink > 1) return { status: 'UNSAFE_PATH', reason: 'hard_link' };
      totalBytes += n;
      return { status: 'HASHED', computed: h.digest('hex'), size: n };
    } catch (e) {
      if (e.code === 'ELOOP') return { status: 'UNSAFE_PATH', reason: 'symlink' };
      if (e.code === 'ENOENT') return { status: 'MISSING', reason: 'file_not_found' };
      if (e.code === 'EACCES' || e.code === 'EPERM') return { status: 'NOT_CHECKED', reason: 'permission_denied' };
      return { status: 'NOT_CHECKED', reason: 'io_error' };
    } finally { if (fd !== undefined) closeSync(fd); }
  };

  // observedSha256 = SHA-256 the tool itself computed from the local file (a verified fact about bytes).
  // It is recorded even when no hash was declared (status then stays NOT_CHECKED: nothing declared to verify).
  // observedEmpty marks zero-byte files, which carry no content and are never used to link artifacts.
  const observed = (o) => ({ observedSha256: o.computed, ...(o.size === 0 ? { observedEmpty: true } : {}) });
  for (const e of [...evidence].sort((a, b) => (a.id < b.id ? -1 : 1))) {
    if (e.file === undefined) { results.push(entry(e, 'NOT_CHECKED', e.sha256 ? 'no_file_declared' : 'no_declared_hash')); continue; }
    const o = checkFile(e.file);
    if (o.status !== 'HASHED') { results.push(entry(e, o.status, o.reason)); continue; }
    if (!e.sha256) results.push(entry(e, 'NOT_CHECKED', 'no_declared_hash', observed(o)));
    else if (o.computed === e.sha256) results.push(entry(e, 'VERIFIED', null, observed(o)));
    else results.push(entry(e, 'MISMATCH', 'sha256_differs', { computedSha256: o.computed, ...observed(o) }));
  }
  return { mode: 'local_directory', counts: count(results), limits: { ...limits }, usage: { filesRead, totalBytes }, results };
}
