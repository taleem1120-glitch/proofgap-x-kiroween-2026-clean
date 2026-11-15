#!/usr/bin/env node
// Usage: node bench/format.js bench/results/<file>.json  -> markdown tables (no hand-copied numbers)
import { readFileSync } from 'node:fs';
const run = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const f = (x) => (x.value === null ? 'n/a' : `${(100 * x.value).toFixed(1)}% (${(100 * x.ci95[0]).toFixed(1)}–${(100 * x.ci95[1]).toFixed(1)}) ${x.k}/${x.n}`);
for (const split of ['dev', 'heldout', 'heldout2']) {
  const r = run[split]; if (!r) continue;
  console.log(`\n### ${split}: ${r.cases} cases, ${r.claims} claims, ${r.positives} truly corroborated (seeds ${r.seeds.firstSeed}..${r.seeds.firstSeed + r.seeds.count - 1})\n`);
  for (const [view, title] of [['declaredOnly', 'Declared-provenance scenarios'], ['undeclaredOnly', 'Undeclared-copy scenarios (hidden dependence)'], ['all', 'All scenarios']]) {
    console.log(`**${title}**\n\n| Detector | Precision (95% Wilson CI) | Recall | False-positive rate |\n|---|---|---|---|`);
    for (const [dn, v] of Object.entries(r.results)) console.log(`| ${dn} | ${f(v[view].precision)} | ${f(v[view].recall)} | ${f(v[view].falsePositiveRate)} |`);
    console.log('');
  }
  const has020 = 'P_proofgap_0_2_0' in r.results, hasDec = 'P_proofgap_current_decision' in r.results;
  console.log(`**Per-scenario correct counts**\n\n| Scenario | kind | truth | claims | 0.1.0 |${has020 ? ' 0.2.0 |' : ''} current status |${hasDec ? ' current decision |' : ''}\n|---|---|---|---|---|${has020 ? '---|' : ''}---|${hasDec ? '---|' : ''}`);
  for (const [s, v] of Object.entries(r.byScenario).sort()) console.log(`| ${s} | ${v.kind} | ${v.truth ? 'corroborated' : 'not'} | ${v.n} | ${v.correct.P_proofgap_0_1_0} |${has020 ? ` ${v.correct.P_proofgap_0_2_0} |` : ''} ${v.correct.P_proofgap_current} |${hasDec ? ` ${v.correct.P_proofgap_current_decision} |` : ''}`);
  if (r.warnings) console.log(`\n**Heuristic warnings** (${r.warnings.task}): precision ${f(r.warnings.precision)}, recall ${f(r.warnings.recall)}, FPR ${f(r.warnings.falsePositiveRate)}.\n\n**Abstention:** ${r.abstention.abstained} of ${r.abstention.statusSupported} status-SUPPORTED claims abstained (${r.abstention.abstainedWhenTrulyUncorroborated} truly uncorroborated, ${r.abstention.abstainedWhenTrulyCorroborated} truly corroborated).`);
  const l = r.latencyMsPerCase; console.log(`\nLatency per case (analyzeCase, ms): median ${l.median.toFixed(3)}, p95 ${l.p95.toFixed(3)}, max ${l.max.toFixed(3)}.`);
}
const s = run.scaling;
console.log(`\n### Scaling (single run, max-size input)\n\ninput ${s.input.sources} sources / ${s.input.evidence} evidence / ${s.input.claims} claims (${s.inputBytes} bytes) → report ${s.reportBytes} bytes; wall ${s.wallMs.toFixed(0)} ms; heapUsed Δ ${s.heapUsedDeltaMB.toFixed(1)} MB; RSS ${s.rssMB.toFixed(0)} MB (gc exposed: ${s.gcExposed}).`);
console.log(`\nEnvironment: Node ${run.node}, ${run.platform}, ${run.cpuCount}× ${run.cpu}, ${run.totalMemMB} MB RAM.`);
