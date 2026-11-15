#!/usr/bin/env node
// An OPTIONAL advisory text-copy cue report, not verification of common provenance.
// No raw text is emitted; the caller supplies a local JSON fixture.
import { readInputFile } from '../src/core.js';
import { findSuspectedTextCopies } from '../src/text-copy-cues.js';
const usage='Usage: node scripts/text-copy-audit.js <documents.json>';
try {
  if (process.argv.length !== 3 || process.argv[2].startsWith('-')) throw new Error(usage);
  const input=JSON.parse(readInputFile(process.argv[2],2_500_000));
  if (!input || typeof input !== 'object' || Array.isArray(input) || !Array.isArray(input.documents))
    throw new TypeError('expected JSON object with documents array');
  const pairs=findSuspectedTextCopies(input.documents);
  const report={
    tool:'ProofGap advisory text resemblance',
    verification:'not_verified',
    note:'Only near-copy text review candidates. Similarity does not prove shared origin or independent truth.',
    documentCount:input.documents.length,
    suspectedPairs:pairs,
  };
  process.stdout.write(JSON.stringify(report,null,2)+'\n');
} catch (err) {
  process.stderr.write('Text-copy audit rejected input: '+String(err.message||err)+'\n');
  process.exitCode=1;
}
