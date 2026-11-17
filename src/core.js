/**
 * ProofGap core: the stable, versioned interface that applications build on.
 *
 * Applications (apps/*) must import ONLY from this module (enforced by test/core.test.js).
 * The core is domain-neutral: a case is sources, claims, evidence and declared provenance
 * (derivedFrom, originGroup). Each application converts its own input into a case and chooses
 * its own wording through a profile. Wording never changes classification, scores or structure.
 *
 * Guarantees, inherited from the engine and covered by the existing suite:
 *  - strict schema and semantic validation, with bounded input size, counts, strings and depth;
 *  - deterministic output: identical input gives identical bytes;
 *  - file verification only inside an explicit directory (no symlinks, no traversal, resource limits);
 *  - independence is declared, suspected or unknown, and only byte identity is ever verified;
 *  - abstention: `decision` can withhold "supported" while `status` keeps the hard classification.
 *
 * Versioning: CORE_API_VERSION follows semver for this interface. ANALYSIS_VERSION identifies the
 * scoring and classification policy (it changes whenever results can change).
 */
import { parseCaseText, validateCase, CaseValidationError } from './validate.js';
import { analyzeCase, ANALYSIS_VERSION, POLICY, DEFAULT_PROFILE } from './analyze.js';
import { verifyEvidenceFiles, IntegrityConfigError, DEFAULT_INTEGRITY_LIMITS } from './integrity.js';
import { serializeReport } from './report.js';
import { renderText } from './render.js';
import { renderHtml, DEFAULT_HTML_PROFILE } from './html.js';
import { DEFAULT_LIMITS } from './limits.js';
import { constants, openSync, fstatSync, readSync, closeSync, writeFileSync } from 'node:fs';

export const CORE_API_VERSION = '1.0.0';
export { ANALYSIS_VERSION, POLICY, DEFAULT_PROFILE, DEFAULT_HTML_PROFILE, DEFAULT_LIMITS, DEFAULT_INTEGRITY_LIMITS };
export { CaseValidationError, IntegrityConfigError };
export { serializeReport, renderText, renderHtml };

const PROFILE_KEYS = new Set(['id', 'disclaimer', 'claimCaveat']);

/**
 * Validate and analyse one case.
 * @param {object} input
 * @param {object} [input.caseData]  parsed case object (exactly one of caseData / caseText)
 * @param {string} [input.caseText]  JSON text (size-limited parse)
 * @param {string} [input.evidenceDir] opt-in local verification directory
 * @param {object} [input.limits] input limits (defaults: DEFAULT_LIMITS)
 * @param {object} [input.integrityLimits] file-verification limits
 * @param {object} [input.profile] { id, disclaimer, claimCaveat } wording overrides
 * @returns {{ case: object, report: object }}
 */
export function analyze({ caseData, caseText, evidenceDir, limits = DEFAULT_LIMITS, integrityLimits, profile } = {}) {
  if ((caseData === undefined) === (caseText === undefined)) throw new TypeError('analyze() needs exactly one of caseData or caseText');
  if (profile !== undefined) {
    if (!profile || typeof profile !== 'object') throw new TypeError('profile must be an object');
    for (const k of Object.keys(profile)) {
      if (!PROFILE_KEYS.has(k)) throw new TypeError(`unknown profile key "${k}"`);
      if (typeof profile[k] !== 'string' || profile[k].length === 0 || profile[k].length > 500) throw new TypeError(`profile.${k} must be a non-empty string of at most 500 characters`);
    }
  }
  const c = caseText !== undefined ? parseCaseText(caseText, limits) : validateCase(caseData, limits);
  const integrity = evidenceDir !== undefined ? verifyEvidenceFiles(c.evidence, { evidenceDir, limits: integrityLimits }) : undefined;
  return { case: c, report: analyzeCase(c, { integrity, ...(profile ? { profile } : {}) }) };
}

/**
 * Read a regular file as UTF-8, never more than maxBytes + 1 bytes (guards against growth and special files).
 * Errors are CaseValidationError with path "$", so CLIs can report them without stack traces.
 */
export function readInputFile(path, maxBytes = DEFAULT_LIMITS.maxBytes) {
  // O_NONBLOCK prevents a named pipe from hanging before fstat can reject it.
  // O_NOFOLLOW rejects a symlink at the final component on supported POSIX systems.
  const fd = openSync(path, constants.O_RDONLY | (constants.O_NONBLOCK ?? 0) | (constants.O_NOFOLLOW ?? 0));
  try {
    if (!fstatSync(fd).isFile()) throw new CaseValidationError([{ path: '$', message: 'input must be a regular file' }]);
    // Read in fixed-size chunks so the configured maximum does not cause
    // one large up-front allocation. Observe at most maxBytes + 1 bytes.
    const chunks = [];
    const buf = Buffer.allocUnsafe(64 * 1024);
    let n = 0, r;
    while (n <= maxBytes) {
      const wanted = Math.min(buf.length, maxBytes + 1 - n);
      r = readSync(fd, buf, 0, wanted, null);
      if (r === 0) break;
      n += r;
      if (n > maxBytes) {
        throw new CaseValidationError([{ path: '$', message: 'file exceeds ' + maxBytes + ' bytes' }]);
      }
      chunks.push(Buffer.from(buf.subarray(0, r)));
    }
    return Buffer.concat(chunks, n).toString('utf8');
  } finally { closeSync(fd); }
}

/** Write a new output file; refuses to overwrite anything that exists, including symlinks ('wx'). Mode 0600. */
export function writeNewFile(path, text, maxBytes = 64 * 1024 * 1024) {
  if (typeof path !== 'string' || path.length === 0) throw new TypeError('path must be a non-empty string');
  if (typeof text !== 'string') throw new TypeError('text must be a string');
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1 || maxBytes > 64 * 1024 * 1024) {
    throw new RangeError('maxBytes must be a positive safe integer no greater than 64 MiB');
  }
  const size = Buffer.byteLength(text, 'utf8');
  if (size > maxBytes) throw new RangeError(`output exceeds ${maxBytes} bytes`);
  writeFileSync(path, text, { flag: 'wx', mode: 0o600 });
}
, message: `file exceeds ${maxBytes} bytes` }]);
      chunks.push(Buffer.from(buf.subarray(0, r)));
    }
    return Buffer.concat(chunks, n).toString('utf8');
  } finally { closeSync(fd); }
}

/** Write a new output file; refuses to overwrite anything that exists, including symlinks ('wx'). Mode 0600. */
export function writeNewFile(path, text) {
  writeFileSync(path, text, { flag: 'wx', mode: 0o600 });
}
