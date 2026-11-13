#!/usr/bin/env node
import { statSync, readFileSync, writeFileSync } from 'node:fs';
import { analyzeText, CaseValidationError, DEFAULT_LIMITS } from './index.js';

const [, , input, flag, output] = process.argv;
if (!input || (flag && flag !== '--out') || (flag && !output)) {
  console.error('Usage: proofgap <case.json> [--out report.json]');
  process.exit(2);
}
try {
  if (statSync(input).size > DEFAULT_LIMITS.maxBytes) throw new CaseValidationError([{ path: '$', message: `file exceeds ${DEFAULT_LIMITS.maxBytes} bytes` }]);
  const report = analyzeText(readFileSync(input, 'utf8'));
  if (output) writeFileSync(output, report, { flag: 'wx' }); // refuse to overwrite
  else process.stdout.write(report);
} catch (e) {
  if (e instanceof CaseValidationError) {
    console.error(e.message);
    for (const i of e.issues) console.error(`  ${i.path}: ${i.message}`);
    process.exit(1);
  }
  console.error(`Error: ${e.code ?? e.message}`);
  process.exit(1);
}
