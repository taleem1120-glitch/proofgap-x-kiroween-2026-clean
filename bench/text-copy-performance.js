// Repeatable microbenchmark, not an external accuracy or competitor comparison.
// Node.js >=20, zero dependencies. Reports machine information and all 30 samples.
import { performance } from 'node:perf_hooks';
import { cpus, platform, arch, totalmem } from 'node:os';
import { compareTextCopies } from '../src/text-copy-cues.js';

const samples = 30;
const lengths = [100, 1000, 2500];
const percentile = (sorted, p) => sorted[Math.ceil(p * sorted.length) - 1];
const all = [];

for (const n of lengths) {
  const a = Array.from({length:n}, (_,i)=>`case evidence item${i} provenance timestamp original author report`).join(' ');
  const b = a.replaceAll('report','REPORT').replaceAll('  ',' ') + ' editorial update';
  // Test only supported inputs; values beyond maxChars intentionally produce no score.
  // Warm the JIT, then retain every sample, including slow samples.
  for(let i=0;i<5;i++) compareTextCopies(a,b);
  const latencies = [];
  for(let i=0;i<samples;i++) {
    const t = performance.now();
    const result = compareTextCopies(a,b);
    const ms = performance.now()-t;
    if (!result.suspected) throw new Error(`unexpected diagnostic result at size ${n}`);
    latencies.push(ms);
  }
  const sorted=[...latencies].sort((x,y)=>x-y);
  all.push({tokensPerTextApprox:n*7, iterations:samples, medianMs:percentile(sorted,0.5), p95Ms:percentile(sorted,0.95), maxMs:sorted.at(-1), samplesMs:latencies});
}
console.log(JSON.stringify({kind:'microbenchmark_not_real_world_validation',node:process.version,os:platform(),arch:arch(),cpu:cpus()[0]?.model,memMB:Math.round(totalmem()/1048576),workloads:all,limits:'only plain text, no PDF/OCR, no attacker-driven concurrent load, includes memory allocation, excludes file I/O'},null,2));
