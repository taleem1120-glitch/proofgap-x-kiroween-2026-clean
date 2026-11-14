#!/usr/bin/env node
// Application 1: ProofGap X — independent evidence evaluation and proof-gap analysis.
// Input: a structured JSON case. Built only on the ProofGap core interface (src/core.js).
import { analyze, readInputFile, writeNewFile, serializeReport, renderText, renderHtml, CaseValidationError, IntegrityConfigError } from '../../src/core.js';

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
const format = opt['--format'] ?? 'json';
if (!['json', 'text', 'html'].includes(format)) usage();
if (opt['--compare'] !== undefined && format !== 'html') usage();

try {
  // The whole output is computed BEFORE any file is created, so invalid input never leaves a partial file.
  const run = (path) => analyze({ caseText: readInputFile(path), evidenceDir: opt['--evidence-dir'] }).report;
  const report = run(input);
  let out;
  if (format === 'text') out = renderText(report);
  else if (format === 'html') out = renderHtml([serializeReport(report), ...(opt['--compare'] !== undefined ? [serializeReport(run(opt['--compare']))] : [])]);
  else out = serializeReport(report);
  if (opt['--out']) writeNewFile(opt['--out'], out);
  else process.stdout.write(out);
} catch (e) {
  if (e instanceof CaseValidationError) {
    console.error(e.message);
    for (const i of e.issues) console.error(`  ${i.path}: ${i.message}`);
  } else if (e instanceof IntegrityConfigError) {
    console.error(`Error: ${e.message}`);
  } else {
    console.error(`Error: ${e && e.code ? e.code : 'unexpected failure'}`); // no stack traces or paths leaked
  }
  process.exit(1);
}
