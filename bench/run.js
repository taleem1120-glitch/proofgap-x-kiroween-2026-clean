#!/usr/bin/env node
// Usage: node --expose-gc bench/run.js [dev|heldout|both] [--out file.json]
// Accuracy numbers are deterministic. Latency/memory numbers depend on the machine and are NOT.
import { performance } from 'node:perf_hooks';
import { writeFileSync } from 'node:fs';
import { cpus, totalmem } from 'node:os';
import { generateSplit, SPLITS } from './dataset.js';
import { DETECTORS, analyzeForBench } from './detectors.js';
import { confusion, summarize, percentile } from './metrics.js';
import { validateCase, analyzeText, serializeReport, analyzeCase } from '../src/index.js';

const args = process.argv.slice(2);
const which = ['dev', 'heldout', 'both'].includes(args[0]) ? args[0] : 'both';
const outIdx = args.indexOf('--out');
const out = outIdx >= 0 ? args[outIdx + 1] : null;

function evaluate(name) {
  const data = generateSplit(name);
  const preds = Object.fromEntries(Object.keys(DETECTORS).map((k) => [k, []]));
  const byScenario = {};
  const lat = [];
  for (const item of data) {
    validateCase(item.case);
    const t0 = performance.now();
    const rep = analyzeForBench(item.case);
    lat.push(performance.now() - t0);
    for (const [claimId, t] of Object.entries(item.truth)) {
      for (const [dn, fn] of Object.entries(DETECTORS)) {
        const pred = fn(item.case, claimId, rep);
        preds[dn].push({ truth: t.corroborated, pred, scenario: t.scenario, kind: t.kind });
        const s = (byScenario[t.scenario] ??= { n: 0, truth: t.corroborated, kind: t.kind, correct: {} });
        if (dn === Object.keys(DETECTORS)[0]) s.n++;
        s.correct[dn] = (s.correct[dn] ?? 0) + (pred === t.corroborated ? 1 : 0);
      }
    }
  }
  const claims = data.reduce((a, d) => a + Object.keys(d.truth).length, 0);
  const results = {};
  for (const dn of Object.keys(DETECTORS)) {
    results[dn] = { all: summarize(confusion(preds[dn])),
      declaredOnly: summarize(confusion(preds[dn].filter((p) => p.kind === 'declared'))),
      undeclaredOnly: summarize(confusion(preds[dn].filter((p) => p.kind === 'undeclared'))) };
  }
  return { split: name, cases: data.length, claims, positives: Object.values(preds)[0].filter((p) => p.truth).length,
    seeds: SPLITS[name], results, byScenario,
    latencyMsPerCase: { median: percentile(lat, 0.5), p95: percentile(lat, 0.95), max: Math.max(...lat), note: 'analyzeCase only; machine dependent' } };
}

function scaling() {
  const N = { sources: 1000, evidence: 5000, claims: 500 };
  const c = { schemaVersion: '1.0', caseId: 'SCALE', title: 'scale', sources: [], claims: [], evidence: [] };
  for (let i = 0; i < N.sources; i++) c.sources.push({ id: `s${i}`, name: `S${i}`, ...(i % 3 ? { derivedFrom: [`s${i - 1}`] } : {}) });
  for (let i = 0; i < N.claims; i++) c.claims.push({ id: `c${i}`, statement: `C${i}` });
  for (let i = 0; i < N.evidence; i++) c.evidence.push({ id: `e${i}`, sourceId: `s${i % N.sources}`, description: `d${i}`, links: [{ claimId: `c${i % N.claims}`, stance: i % 7 ? 'supports' : 'contradicts', strength: ((i % 10) + 1) / 10 }] });
  const text = JSON.stringify(c);
  globalThis.gc?.();
  const before = process.memoryUsage();
  const t0 = performance.now();
  const report = analyzeText(text);
  const ms = performance.now() - t0;
  const after = process.memoryUsage();
  return { input: N, inputBytes: Buffer.byteLength(text), reportBytes: Buffer.byteLength(report), wallMs: ms,
    heapUsedDeltaMB: (after.heapUsed - before.heapUsed) / 1048576, rssMB: after.rss / 1048576, gcExposed: typeof globalThis.gc === 'function' };
}

const run = { tool: 'proofgap-x bench', node: process.version, platform: `${process.platform}/${process.arch}`, cpu: cpus()[0]?.model, cpuCount: cpus().length, totalMemMB: Math.round(totalmem() / 1048576) };
if (which === 'dev' || which === 'both') run.dev = evaluate('dev');
if (which === 'heldout' || which === 'both') run.heldout = evaluate('heldout');
run.scaling = scaling();

const pct = (x) => (x.value === null ? 'n/a' : `${(100 * x.value).toFixed(1)}% [${x.ci95.map((v) => (100 * v).toFixed(1)).join('–')}] (${x.k}/${x.n})`);
for (const split of ['dev', 'heldout']) {
  if (!run[split]) continue;
  const r = run[split];
  console.log(`\n== ${split}: ${r.cases} cases, ${r.claims} claims, ${r.positives} truly corroborated ==`);
  for (const view of ['all', 'declaredOnly', 'undeclaredOnly']) {
    console.log(`  -- ${view}`);
    for (const [dn, v] of Object.entries(r.results)) {
      const s = v[view];
      console.log(`  ${dn.padEnd(30)} precision ${pct(s.precision).padEnd(34)} recall ${pct(s.recall).padEnd(34)} FPR ${pct(s.falsePositiveRate)}`);
    }
  }
  console.log(`  latency/case (ms): median ${r.latencyMsPerCase.median.toFixed(3)} p95 ${r.latencyMsPerCase.p95.toFixed(3)} max ${r.latencyMsPerCase.max.toFixed(3)}`);
}
console.log(`\nscaling: ${JSON.stringify(run.scaling)}`);
if (out) writeFileSync(out, JSON.stringify(run, null, 2) + '\n', { flag: 'wx' });
