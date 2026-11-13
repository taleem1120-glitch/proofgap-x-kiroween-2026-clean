#!/usr/bin/env node
import { openSync, fstatSync, readSync, closeSync, writeFileSync } from 'node:fs';
import { analyzeText, CaseValidationError, DEFAULT_LIMITS } from './index.js';

// Exit codes: 0 ok, 1 invalid input / I/O failure, 2 usage error.
const USAGE = 'Usage: proofgap <case.json> [--out report.json]';
const usage = () => { console.error(USAGE); process.exit(2); };

const args = process.argv.slice(2);
let input, output;
if (args.length === 1) [input] = args;
else if (args.length === 3 && args[1] === '--out') [input, , output] = args;
else usage();
if (input.startsWith('-') || (output !== undefined && output.startsWith('-'))) usage();

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
  const report = analyzeText(readBounded(input, DEFAULT_LIMITS.maxBytes));
  if (output) writeFileSync(output, report, { flag: 'wx', mode: 0o600 }); // 'wx': fail if path exists (incl. symlinks)
  else process.stdout.write(report);
} catch (e) {
  if (e instanceof CaseValidationError) {
    console.error(e.message);
    for (const i of e.issues) console.error(`  ${i.path}: ${i.message}`);
  } else {
    console.error(`Error: ${e && e.code ? e.code : 'unexpected failure'}`); // no stack traces / paths leaked
  }
  process.exit(1);
}
