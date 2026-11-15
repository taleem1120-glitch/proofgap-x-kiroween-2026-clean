#!/usr/bin/env node
// Usage: node bench/run-files.js <split> [--out file.json]
// Before/after on IDENTICAL materialized cases: ProofGap 0.3.0 (bench/legacy/v0.3.0) vs current, both WITH --evidence-dir.
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { performance } from 'node:perf_hooks';
import { generateSplit, SPLITS } from './dataset.js';
import { materialize } from './files.js';
import { confusion, summarize } from './metrics.js';
import * as current from '../src/index.js';
import * as v030 from './legacy/v0.3.0/src/index.js';

const args = process.argv.slice(2);
const split = args[0];
if (!SPLITS[split]) { console.error(`unknown split; one of ${Object.keys(SPLITS).join(', ')}`); process.exit(2); }
const out = args.includes('--out') ? args[args.indexOf('--out') + 1] : null;

const ENGINES = { before_v0_3_0: v030, after_current: current };
const rows = { before_v0_3_0: [], after_current: [] };
const ms = { before_v0_3_0: [], after_current: [] };
const newLinks = { verifiedLinksOnTrulyCorroboratedClaims: 0, verifiedLinkClaims: 0 };
for (const item of generateSplit(split)) {
  const dir = mkdtempSync(join(tmpdir(), 'pgx-bench-'));
  try {
    const m = materialize(item, dir);
    current.validateCase(m.case);
    for (const [name, eng] of Object.entries(ENGINES)) {
      const t0 = performance.now();
      const rep = eng.analyzeCase(m.case, { integrity: eng.verifyEvidenceFiles(m.case.evidence, { evidenceDir: dir }) });
      ms[name].push(performance.now() - t0);
      for (const [claimId, t] of Object.entries(item.truth)) {
        const cl = rep.claims.find((x) => x.claimId === claimId);
        rows[name].push({ claimId, scenario: t.scenario, kind: t.kind, mode: m.modes[claimId] ?? null, truth: t.corroborated,
          status: cl.status === 'supported_by_independent_origins', decision: cl.decision === 'supported_by_independent_origins' });
        if (name === 'after_current') {
          const ids = new Set([...cl.independentSupportOrigins.flatMap((o) => o.evidenceIds)]);
          const linked = rep.graph.edges.some((e) => e.relation === 'same_bytes' && e.discoveredBy === 'local_hashing' && (ids.has(e.from.slice(9)) || ids.has(e.to.slice(9))));
          if (linked) { newLinks.verifiedLinkClaims++; if (t.corroborated) newLinks.verifiedLinksOnTrulyCorroboratedClaims++; }
        }
      }
    }
  } finally { rmSync(dir, { recursive: true, force: true }); }
}

const metrics = (rs, field) => summarize(confusion(rs.map((r) => ({ truth: r.truth, pred: r[field] }))));
const result = { split, seeds: SPLITS[split], cases: SPLITS[split].count, node: process.version, engines: {} };
for (const name of Object.keys(ENGINES)) {
  const rs = rows[name], und = rs.filter((r) => r.kind === 'undeclared');
  const byMode = {};
  for (const mode of ['byte_identical', 'reencoded']) {
    const x = und.filter((r) => r.mode === mode);
    byMode[mode] = { n: x.length, falselyAssertedByDecision: x.filter((r) => r.decision).length, falselyAssertedByStatus: x.filter((r) => r.status).length };
  }
  const byScenario = {};
  for (const r of rs) { const s = (byScenario[r.scenario] ??= { n: 0, truth: r.truth, decisionCorrect: 0 }); s.n++; if (r.decision === r.truth) s.decisionCorrect++; }
  result.engines[name] = {
    claims: rs.length, positives: rs.filter((r) => r.truth).length,
    decision: { all: metrics(rs, 'decision'), declaredOnly: metrics(rs.filter((r) => r.kind === 'declared'), 'decision'), undeclaredOnly: metrics(und, 'decision') },
    status: { all: metrics(rs, 'status'), undeclaredOnly: metrics(und, 'status') },
    undeclaredByCopyMode: byMode, byScenario,
    msPerCase: { median: [...ms[name]].sort((a, b) => a - b)[Math.floor(ms[name].length / 2)], note: 'integrity hashing + analysis; machine dependent' },
  };
}
result.newVerifiedLinks = newLinks;
const p = (x) => (x.value === null ? 'n/a' : `${x.k}/${x.n} (${(100 * x.value).toFixed(1)}%, CI ${x.ci95.map((v) => (100 * v).toFixed(1)).join('–')})`);
console.log(`== file-backed ${split}: ${result.cases} cases, ${result.engines.after_current.claims} claims, ${result.engines.after_current.positives} truly corroborated ==`);
for (const [name, e] of Object.entries(result.engines)) {
  console.log(`  ${name}`);
  console.log(`    decision all:        precision ${p(e.decision.all.precision)}  recall ${p(e.decision.all.recall)}  FPR ${p(e.decision.all.falsePositiveRate)}`);
  console.log(`    decision declared:   precision ${p(e.decision.declaredOnly.precision)}  recall ${p(e.decision.declaredOnly.recall)}  FPR ${p(e.decision.declaredOnly.falsePositiveRate)}`);
  console.log(`    decision undeclared: FPR ${p(e.decision.undeclaredOnly.falsePositiveRate)}   status undeclared FPR ${p(e.status.undeclaredOnly.falsePositiveRate)}`);
  for (const [mode, v] of Object.entries(e.undeclaredByCopyMode)) console.log(`    undeclared ${mode}: n=${v.n} falsely asserted (decision) ${v.falselyAssertedByDecision}, (status) ${v.falselyAssertedByStatus}`);
  console.log(`    ms/case median ${e.msPerCase.median.toFixed(2)}`);
}
console.log(`  new verified (local-hashing) links: on ${newLinks.verifiedLinkClaims} claims, of which truly corroborated: ${newLinks.verifiedLinksOnTrulyCorroboratedClaims}`);
if (out) writeFileSync(out, JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
