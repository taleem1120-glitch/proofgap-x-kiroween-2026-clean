#!/usr/bin/env node
// Usage: node --expose-gc bench/cite/run.js <dev|heldout|textReviewHeldout> [--review-text-copies] [--out file.json]
// Positive prediction = "independently corroborated". Accuracy is deterministic; latency/memory are machine dependent.
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { performance } from 'node:perf_hooks';
import { generateCiteSplit, CITE_SPLITS } from './dataset.js';
import { confusion, summarize } from '../metrics.js';
import { analyzeNote } from '../../apps/proofgap-cite/src/index.js';
import { normalizeUrl } from '../../apps/proofgap-cite/src/parse.js';

const split = process.argv[2];
if (!CITE_SPLITS[split]) { console.error(`split must be one of ${Object.keys(CITE_SPLITS).join(', ')}`); process.exit(2); }
const reviewTextCopies = process.argv.includes('--review-text-copies');
const out = process.argv.includes('--out') ? process.argv[process.argv.indexOf('--out') + 1] : null;

const DETECTORS = {
  B1_two_or_more_citations: (t) => t.refs.length >= 2,
  B2_distinct_urls: (t) => new Set(t.refs.map((x) => (x.url ? normalizeUrl(x.url) : `id:${x.id}`))).size >= 2,
  B3_distinct_outlets: (t) => new Set(t.refs.map((x) => x.label.toLowerCase())).size >= 2,
  cite_without_saved_files: (t, a) => a.decision === 'independently_corroborated',
  cite_with_saved_files: (t, a, b) => b.decision === 'independently_corroborated',
};
const rows = Object.fromEntries(Object.keys(DETECTORS).map((k) => [k, []]));
const byScenario = {}, ms = [];
for (const n of generateCiteSplit(split)) {
  const dir = mkdtempSync(join(tmpdir(), 'pgx-cite-bench-'));
  try {
    for (const [f, bytes] of n.files) writeFileSync(join(dir, f), bytes);
    const noFiles = analyzeNote(n.text, { noteName: n.name });
    const t0 = performance.now();
    const withFiles = analyzeNote(n.text, { noteName: n.name, sourcesDir: dir, reviewTextCopies });
    ms.push(performance.now() - t0);
    for (const [cid, t] of Object.entries(n.truth)) {
      const a = noFiles.claims.find((c) => c.claimId === cid), b = withFiles.claims.find((c) => c.claimId === cid);
      const s = (byScenario[t.scenario] ??= { n: 0, truth: t.corroborated, predictedPositive: {}, citeVerdictsWithFiles: {} });
      s.n++;
      s.citeVerdictsWithFiles[b.decision] = (s.citeVerdictsWithFiles[b.decision] ?? 0) + 1;
      for (const [k, f] of Object.entries(DETECTORS)) {
        const pred = f(t, a, b);
        rows[k].push({ truth: t.corroborated, pred });
        s.predictedPositive[k] = (s.predictedPositive[k] ?? 0) + (pred ? 1 : 0);
      }
    }
  } finally { rmSync(dir, { recursive: true, force: true }); }
}

// representative large note: 200 claims, 500 references (CITE_LIMITS maxima), 2 citations per claim
const big = (() => {
  const refs = [], claims = [];
  for (let i = 0; i < 500; i++) refs.push(`[^r${i}]: Source ${i} {kind=${i % 5 === 0 ? 'primary' : 'secondary'}${i % 5 ? `, cites=r${i - (i % 5)}` : ''}, url=https://s${i}.example/a}`);
  for (let i = 0; i < 200; i++) claims.push(`- Claim ${i}. [^r${(i * 7) % 500}] [^r${(i * 13 + 1) % 500}]`);
  return `# Large\n## Claims\n${claims.join('\n')}\n## References\n${refs.join('\n')}\n`;
})();
globalThis.gc?.();
const h0 = process.memoryUsage().heapUsed, t0 = performance.now();
analyzeNote(big, { noteName: 'large.md' });
const largeMs = performance.now() - t0, heapMB = (process.memoryUsage().heapUsed - h0) / 1048576;

const result = { split, savedTextReviewEnabled: reviewTextCopies, seeds: CITE_SPLITS[split], notes: CITE_SPLITS[split].count, claims: rows.cite_with_saved_files.length,
  positives: rows.cite_with_saved_files.filter((x) => x.truth).length, node: process.version,
  detectors: Object.fromEntries(Object.entries(rows).map(([k, v]) => [k, summarize(confusion(v))])), byScenario,
  latency: { medianMsPerNoteWithFiles: [...ms].sort((a, b) => a - b)[Math.floor(ms.length / 2)], largeNote: { claims: 200, references: 500, ms: largeMs, heapUsedDeltaMB: heapMB, gcExposed: typeof globalThis.gc === 'function' } } };
const f = (x) => (x.value === null ? 'n/a' : `${x.k}/${x.n} (${(100 * x.value).toFixed(1)}%, CI ${x.ci95.map((v) => (100 * v).toFixed(1)).join('–')})`);
console.log(`== Cite ${split}: ${result.notes} notes, ${result.claims} claims, ${result.positives} truly corroborated ==`);
for (const [k, s] of Object.entries(result.detectors)) console.log(`  ${k.padEnd(26)} TP ${s.tp} FP ${s.fp} TN ${s.tn} FN ${s.fn} | precision ${f(s.precision)} | recall ${f(s.recall)} | FPR ${f(s.falsePositiveRate)}`);
for (const [k, s] of Object.entries(byScenario).sort()) console.log(`  ${k.padEnd(24)} n=${String(s.n).padStart(3)} truth=${s.truth ? 'Y' : 'N'} cite+files positive=${s.predictedPositive.cite_with_saved_files} no-files=${s.predictedPositive.cite_without_saved_files} urls=${s.predictedPositive.B2_distinct_urls}  verdicts ${JSON.stringify(s.citeVerdictsWithFiles)}`);
console.log(`  latency: median ${result.latency.medianMsPerNoteWithFiles.toFixed(2)} ms/note (with files); large note ${largeMs.toFixed(1)} ms, heap +${heapMB.toFixed(1)} MB`);
if (out) writeFileSync(out, JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
