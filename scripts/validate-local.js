#!/usr/bin/env node
// Local validation runner: executes test groups + deterministic benchmark and records
// commands, exact counts, environment and file hashes under validation/<UTC-id>/ (never overwrites).
// Usage: node scripts/validate-local.js
// Local only: no network access. Does NOT touch GitHub or CI.
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { cpus, totalmem, platform, arch, release } from 'node:os';

const sh = (cmd, args) => spawnSync(cmd, args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const sha = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');
const id = new Date().toISOString().replace(/[-:]/g, '').replace(/\..*/, 'Z');
const dir = `validation/${id}`;
mkdirSync(dir, { recursive: false });

const GROUPS = {
  all: null, // npm test
  security: ['test/security.test.js', 'test/integrity.test.js', 'test/fuzz.test.js', 'test/cli.test.js', 'test/schema.test.js'],
  provenance: ['test/regression.test.js', 'test/adversarial.test.js', 'test/metamorphic.test.js', 'test/gaps.test.js', 'test/proofgap.test.js'],
  // viewer/planner/graph are listed separately below; security also includes viewer.test.js checks of CSP/escaping
  fileIntegrity: ['test/integrity.test.js'],
  viewerAndPlanner: ['test/viewer.test.js', 'test/planner.test.js', 'test/graph.test.js'],
  benchmarkTests: ['test/benchmark.test.js', 'test/demo.test.js'],
};

const parse = (out) => { const g = (k) => Number((out.match(new RegExp(`^# ${k} (\\d+)`, 'm')) ?? [])[1]); return { tests: g('tests'), pass: g('pass'), fail: g('fail'), cancelled: g('cancelled'), skipped: g('skipped'), todo: g('todo') }; };

const steps = [];
for (const [name, files] of Object.entries(GROUPS)) {
  const [cmd, args] = files ? ['node', ['--test', ...files]] : ['npm', ['test']];
  const r = sh(cmd, args);
  writeFileSync(`${dir}/${name}.log`, r.stdout + (r.stderr ? `\n--- stderr ---\n${r.stderr}` : ''));
  steps.push({ name, command: `${cmd} ${args.join(' ')}`, exitCode: r.status, ...parse(r.stdout) });
}

// Deterministic benchmark: run again, compare the ACCURACY parts with the committed run (latency/memory are machine dependent).
const benchOut = `${dir}/bench.json`;
const b = sh('node', ['--expose-gc', 'bench/run.js', 'all', '--out', benchOut]);
writeFileSync(`${dir}/bench.log`, b.stdout + (b.stderr ? `\n--- stderr ---\n${b.stderr}` : ''));
const acc = (p) => { const j = JSON.parse(readFileSync(p, 'utf8')); return JSON.stringify(['dev', 'heldout', 'heldout2'].map((s) => ({ results: j[s].results, byScenario: j[s].byScenario, claims: j[s].claims, positives: j[s].positives, warnings: j[s].warnings, abstention: j[s].abstention }))); };
const reference = 'bench/results/phase5-run1.json'; // phase3-run1.json was produced by engine 0.2.0 + the Phase 3 generator and is kept as history
const accuracyIdentical = b.status === 0 && acc(benchOut) === acc(reference);

const git = (...a) => sh('git', a).stdout.trim();
const summary = {
  id, node: process.version, npm: sh('npm', ['--version']).stdout.trim(),
  os: `${platform()} ${release()} ${arch()}`, cpu: cpus()[0]?.model, cpuCount: cpus().length, totalMemMB: Math.round(totalmem() / 1048576),
  git: { commit: git('rev-parse', 'HEAD'), branch: git('rev-parse', '--abbrev-ref', 'HEAD'), dirtyFiles: git('status', '--porcelain').split('\n').filter(Boolean) },
  lockfileSha256: sha('package-lock.json'), packageJsonSha256: sha('package.json'), schemaSha256: sha('schemas/case.v1.schema.json'),
  steps,
  benchmark: { command: 'node --expose-gc bench/run.js all --out <dir>/bench.json', exitCode: b.status, referenceFile: reference, accuracyIdenticalToReference: accuracyIdentical, note: 'accuracy compared; latency/memory are machine dependent and are not compared' },
  ci: { status: 'BLOCKED_BY_BILLING', note: 'GitHub Actions jobs were never started (account billing/spending limit). No remote CI result exists; nothing here is a CI result.' },
  notTested: ['Node 20', 'Windows', 'macOS', 'case-insensitive filesystems', 'real-world case data', 'browsers other than headless Chromium (viewer)', 'screen readers (viewer)'],
};
summary.allGreen = steps.every((s) => s.exitCode === 0 && s.fail === 0 && s.tests > 0) && accuracyIdentical;
writeFileSync(`${dir}/summary.json`, JSON.stringify(summary, null, 2) + '\n');
const md = [`# Local validation ${id}`, '', `Node ${summary.node}, npm ${summary.npm}, ${summary.os}, ${summary.cpuCount}× ${summary.cpu}, ${summary.totalMemMB} MB`, `Commit ${summary.git.commit} (${summary.git.branch}); uncommitted files at run time: ${summary.git.dirtyFiles.length}`, '',
  '| Group | Command | Tests | Pass | Fail | Exit |', '|---|---|---|---|---|---|', ...steps.map((s) => `| ${s.name} | \`${s.command}\` | ${s.tests} | ${s.pass} | ${s.fail} | ${s.exitCode} |`), '',
  `Benchmark accuracy identical to \`${reference}\`: **${accuracyIdentical}** (exit ${b.status}).`, '', `GitHub Actions CI: **BLOCKED_BY_BILLING** (not PASSED, not CODE_FAILED).`, '', `Overall local result: **${summary.allGreen ? 'ALL LOCAL CHECKS PASSED' : 'FAILURES PRESENT'}**`, `NOT TESTED: ${summary.notTested.join(', ')}`, ''].join('\n');
writeFileSync(`${dir}/summary.md`, md);
console.log(md);
process.exit(summary.allGreen ? 0 : 1);
