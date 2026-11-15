#!/usr/bin/env node
import { openSync, fstatSync, readSync, closeSync, writeFileSync } from 'node:fs';
import { analyzeText, CaseValidationError, IntegrityConfigError, DEFAULT_LIMITS } from './index.js';

// Exit codes: 0 ok, 1 invalid input / I/O failure, 2 usage error.
const USAGE = 'Usage: proofgap <case.json> [--out report-file] [--evidence-dir dir] [--format json|text|html] [--compare other-case.json (html only)]';
const usage = () => { console.error(USAGE); process.exit(2); };

const args = process.argv.slice(2);
const input = args.shift();
if (!input || input.startsWith('-')) usage();
const opt = {};
const FLAGS = new Set(['--out', '--evidence-dir', '--format', '--compare']);
while (args.length) {
  const f = args.shift(), v = args.shift();
  if (!FLAGS.has(f) || v === undefined || v.startsWith('-') || Object.hasOwn(opt, f)) usage();
  opt[f] = v;
}
if (opt['--format'] !== undefined && !['json', 'text', 'html'].includes(opt['--format'])) usage();
if (opt['--compare'] !== undefined && opt['--format'] !== 'html') usage();
const output = opt['--out'];

/** Read a regular file, never more than maxBytes+1 bytes (guards against growth/special files). */
function readBounded(path, maxBytes) {
  const fd = openSync(path, 'r');
  try {
    if (!fstatSync(fd).isFile()) throw new CaseValidationError([{ path: '$', message: 'input must be a regular file' }]);
    const buf = Buffer.alloc(maxBytes + 1);
    let n = 0, r;
    while (n < buf.length && (r = readSync(fd, buf, n, buf.length - n, null)) > 0) n += r;
    if (n > maxBytes) throw new CaseValidationError([{ path: '$', message: `file exceeds ${maxBytes} bytes` }]);
    return buf.toString('utf8', 0, n);
  } finally { closeSync(fd); }
}

try {
  // Entire report is computed BEFORE any output file is created, so invalid
  // input never leaves a partial or empty output file behind.
  const report = analyzeText(readBounded(input, DEFAULT_LIMITS.maxBytes), undefined,
    { evidenceDir: opt['--evidence-dir'], format: opt['--format'] ?? 'json',
      compareText: opt['--compare'] !== undefined ? readBounded(opt['--compare'], DEFAULT_LIMITS.maxBytes) : undefined });
  if (output) writeFileSync(output, report, { flag: 'wx', mode: 0o600 }); // 'wx': fail if path exists (incl. symlinks)
  else process.stdout.write(report);
} catch (e) {
  if (e instanceof CaseValidationError) {
    console.error(e.message);
    for (const i of e.issues) console.error(`  ${i.path}: ${i.message}`);
  } else if (e instanceof IntegrityConfigError) {
    console.error(`Error: ${e.message}`);
  } else {
    console.error(`Error: ${e && e.code ? e.code : 'unexpected failure'}`); // no stack traces / paths leaked
  }
  process.exit(1);
}
