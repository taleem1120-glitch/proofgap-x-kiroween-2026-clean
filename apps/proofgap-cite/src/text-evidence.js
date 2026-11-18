/**
 * Bounded, fail-closed UTF-8 text extraction for ProofGap Cite.
 * Only local .txt/.md/.csv/.json files are supported. No PDF, OCR, HTML or network.
 * Extraction is advisory input for text-copy review; it never verifies provenance.
 */
import { constants, lstatSync, realpathSync, openSync, fstatSync, readSync, closeSync, statSync } from 'node:fs';
import { join, relative, isAbsolute, sep, extname } from 'node:path';

const ALLOWED = new Set(['.txt', '.md', '.csv', '.json']);
const DEFAULTS = Object.freeze({ maxFiles: 30, maxFileBytes: 256 * 1024, maxTotalBytes: 2 * 1024 * 1024, maxMillis: 5000, maxPathLength: 255, maxPathDepth: 8 });
const SEGMENT = /^[A-Za-z0-9_.-]{1,255}$/;
const decoder = new TextDecoder('utf-8', { fatal: true });

function safeRelativePath(p, limits) {
  if (typeof p !== 'string' || !p || p.length > limits.maxPathLength || p.startsWith('/') || p.includes('\\\\')) return false;
  const parts = p.split('/');
  return parts.length <= limits.maxPathDepth && parts.every(x => x && x !== '.' && x !== '..' && SEGMENT.test(x));
}

/**
 * Returns { documents, results, usage }. A failed/unsupported file is recorded, never guessed.
 * Evidence entries are { id, file }; only explicitly saved, cited files should be supplied.
 */
export function extractTextEvidence(evidence, { evidenceDir, now = Date.now, limits = {} } = {}) {
  if (typeof evidenceDir !== 'string' || !evidenceDir) throw new TypeError('evidenceDir is required');
  if (!Array.isArray(evidence) || evidence.length > DEFAULTS.maxFiles) throw new RangeError('text extraction accepts at most 30 files');
  if (typeof now !== 'function') throw new TypeError('now must be a function');
  if (!limits || typeof limits !== 'object' || Object.keys(limits).some((k) => !Object.hasOwn(DEFAULTS, k))) throw new RangeError('invalid text extraction limits');
  const cfg = { ...DEFAULTS, ...limits };
  for (const [k, v] of Object.entries(cfg)) if (!Number.isSafeInteger(v) || v < 1 || v > DEFAULTS[k]) throw new RangeError('invalid text extraction limits');
  const root = realpathSync(evidenceDir);
  if (!lstatSync(root).isDirectory()) throw new TypeError('evidenceDir is not a directory');
  const start = now(), documents = [], results = [];
  let totalBytes = 0, filesRead = 0;
  const seen = new Set();
  const ordered = [...evidence].sort((a, b) => String(a?.id ?? '').localeCompare(String(b?.id ?? '')));
  for (const item of ordered) {
    const itemId = item && typeof item.id === 'string' ? item.id : null;
    const fail = (status, reason) => results.push({ id: itemId, status, reason });
    if (!item || typeof item.id !== 'string' || !item.id || typeof item.file !== 'string') { fail('UNSUPPORTED', 'missing_id_or_file'); continue; }
    if (seen.has(item.id)) { fail('UNSUPPORTED', 'duplicate_id'); continue; }
    seen.add(item.id);
    const rel = item.file;
    if (!safeRelativePath(rel, cfg)) { fail('UNSAFE_PATH', 'invalid_relative_path'); continue; }
    if (!ALLOWED.has(extname(rel).toLowerCase())) { fail('UNSUPPORTED', 'unsupported_text_extension'); continue; }
    if (filesRead >= cfg.maxFiles) { fail('NOT_CHECKED', 'file_count_limit'); continue; }
    if (now() - start > cfg.maxMillis) { fail('NOT_CHECKED', 'time_limit'); continue; }
    let cur = root, fd;
    try {
      for (const part of rel.split('/')) {
        cur = join(cur, part);
        const st = lstatSync(cur, { throwIfNoEntry: false });
        if (!st) throw Object.assign(new Error(), { code: 'ENOENT' });
        if (st.isSymbolicLink()) throw Object.assign(new Error(), { code: 'E_SYMLINK' });
      }
      fd = openSync(cur, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0) | (constants.O_NONBLOCK ?? 0));
      const st = fstatSync(fd);
      if (!st.isFile()) { fail('UNSAFE_PATH', 'not_a_regular_file'); continue; }
      if (st.nlink > 1) { fail('UNSAFE_PATH', 'hard_link'); continue; }
      const real = realpathSync(cur), relReal = relative(root, real);
      if (!relReal || relReal === '..' || relReal.startsWith('..' + sep) || isAbsolute(relReal)) { fail('UNSAFE_PATH', 'escapes_evidence_directory'); continue; }
      const pathStat = statSync(real);
      if (pathStat.dev !== st.dev || pathStat.ino !== st.ino) { fail('UNSAFE_PATH', 'opened_file_path_mismatch'); continue; }
      if (st.size > cfg.maxFileBytes) { fail('NOT_CHECKED', 'file_size_limit'); continue; }
      if (totalBytes + st.size > cfg.maxTotalBytes) { fail('NOT_CHECKED', 'total_bytes_limit'); continue; }
      const chunks = []; let size = 0, rejected = false; const buf = Buffer.allocUnsafe(16 * 1024); let n;
      while ((n = readSync(fd, buf, 0, buf.length, null)) > 0) {
        size += n;
        if (size > cfg.maxFileBytes || totalBytes + size > cfg.maxTotalBytes) { chunks.length = 0; rejected = true; fail('NOT_CHECKED', 'observed_size_limit'); break; }
        if (now() - start > cfg.maxMillis) { chunks.length = 0; rejected = true; fail('NOT_CHECKED', 'time_limit'); break; }
        chunks.push(Buffer.from(buf.subarray(0, n)));
      }
      if (rejected) continue;
      if (fstatSync(fd).nlink > 1) { fail('UNSAFE_PATH', 'hard_link'); continue; }
      const bytes = Buffer.concat(chunks, size);
      totalBytes += size; filesRead++;
      let text;
      try { text = decoder.decode(bytes); } catch { fail('UNSUPPORTED', 'invalid_utf8'); continue; }
      documents.push({ id: item.id, text });
      results.push({ id: item.id, status: 'READ', bytes: size, basis: 'bounded_local_utf8_text' });
    } catch (e) {
      if (e.code === 'ENOENT') fail('MISSING', 'file_not_found');
      else if (e.code === 'E_SYMLINK' || e.code === 'ELOOP') fail('UNSAFE_PATH', 'symlink');
      else fail('NOT_CHECKED', 'io_error');
    } finally { if (fd !== undefined) closeSync(fd); }
  }
  return { documents, results, usage: { filesRead, totalBytes }, limits: cfg };
}
