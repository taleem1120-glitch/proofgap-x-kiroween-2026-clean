#!/usr/bin/env node
// Application 2: ProofGap Cite — citation lineage analysis for research and news notes.
import { basename } from 'node:path';
import { readInputFile, writeNewFile, IntegrityConfigError } from '../../src/core.js';
import { analyzeNote, renderLint, serializeCiteReport, renderCiteHtml, allCorroborated, CiteValidationError, CITE_LIMITS } from './src/index.js';

// Exit codes: 0 ok, 1 invalid input / I/O failure, 2 usage, 3 gaps found (only with --fail-on-gaps).
const USAGE = 'Usage: proofgap-cite <note.md> [--sources dir] [--format lint|json|html] [--out file] [--fail-on-gaps]';
const usage = () => { console.error(USAGE); process.exit(2); };

const args = process.argv.slice(2);
const input = args.shift();
if (!input || input.startsWith('-')) usage();
const opt = {};
let failOnGaps = false;
while (args.length) {
  const f = args.shift();
  if (f === '--fail-on-gaps') { if (failOnGaps) usage(); failOnGaps = true; continue; }
  const v = args.shift();
  if (!['--sources', '--format', '--out'].includes(f) || v === undefined || v.startsWith('-') || Object.hasOwn(opt, f)) usage();
  opt[f] = v;
}
const format = opt['--format'] ?? 'lint';
if (!['lint', 'json', 'html'].includes(format)) usage();

try {
  const report = analyzeNote(readInputFile(input, CITE_LIMITS.maxBytes), { sourcesDir: opt['--sources'], noteName: basename(input) });
  const out = format === 'json' ? serializeCiteReport(report) : format === 'html' ? renderCiteHtml([serializeCiteReport(report)]) : renderLint(report);
  if (opt['--out']) writeNewFile(opt['--out'], out);
  else process.stdout.write(out);
  if (failOnGaps && !allCorroborated(report)) process.exit(3);
} catch (e) {
  if (e instanceof CiteValidationError) {
    console.error(e.message);
    for (const i of e.issues) console.error(`  ${basename(input)}:${i.line}: ${i.message}`);
  } else if (e && e.name === 'CaseValidationError') {
    console.error(e.message);
    for (const i of e.issues) console.error(`  ${i.path}: ${i.message}`);
  } else if (e instanceof IntegrityConfigError) {
    console.error(`Error: ${e.message}`);
  } else {
    console.error(`Error: ${e && e.code ? e.code : 'unexpected failure'}`); // no stack traces or paths leaked
  }
  process.exit(1);
}
