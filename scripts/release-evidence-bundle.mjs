#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const git = (args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).trim();
const hash = (data) => createHash('sha256').update(data).digest('hex');
const fail = (message) => { console.error('RELEASE EVIDENCE ERROR: ' + message); process.exit(1); };

function verify(dir) {
  const folder = resolve(dir);
  const sumsFile = join(folder, 'SHA256SUMS');
  if (!existsSync(sumsFile)) fail('SHA256SUMS is missing');
  const lines = readFileSync(sumsFile, 'utf8').trim().split(/\r?\n/).filter(Boolean);
  if (!lines.length) fail('SHA256SUMS is empty');
  for (const line of lines) {
    const match = /^([a-f0-9]{64})  ([A-Za-z0-9._-]+)$/.exec(line);
    if (!match) fail('invalid checksum line: ' + line);
    const file = join(folder, match[2]);
    if (!existsSync(file)) fail('missing file: ' + match[2]);
    const actual = hash(readFileSync(file));
    if (actual !== match[1]) fail('checksum mismatch: ' + match[2]);
    console.log('OK ' + match[2] + ' ' + actual);
  }
  const manifest = JSON.parse(readFileSync(join(folder, 'manifest.json'), 'utf8'));
  if (manifest.schema !== 'proofgap-release-evidence/v1') fail('unsupported manifest schema');
  if (!manifest.source || !/^[a-f0-9]{40}$/.test(manifest.source.commit || '')) fail('manifest source commit is missing or invalid');
  const sourceLine = lines.find((line) => line.endsWith('  source.tar'));
  if (!sourceLine || manifest.sourceArchiveSha256 !== sourceLine.slice(0, 64)) fail('manifest/source archive checksum mismatch');
  if (!Array.isArray(manifest.automatedEvidence)) fail('automatedEvidence must be an array');
  const required = ['CI', 'Cross-browser compatibility and security audit', 'Regenerate ProofGap Cite showcase'];
  const byName = new Map();
  for (const item of manifest.automatedEvidence) {
    if (!item || item.result !== 'success' || item.validatedCommit !== manifest.source.commit ||
        typeof item.url !== 'string' || !item.url.startsWith('https://') ||
        !Number.isInteger(item.runId) || item.runId <= 0) {
      fail('automated evidence must be successful, linked, and bound to the exact source commit');
    }
    if (byName.has(item.name)) fail('duplicate automated evidence workflow: ' + item.name);
    byName.set(item.name, item);
  }
  for (const name of required) {
    if (!byName.has(name)) fail('missing required automated evidence: ' + name);
  }
  console.log('VERIFIED exact-SHA automated evidence: ' + required.join(', '));
  console.log('VERIFIED commit ' + manifest.source.commit);
  console.log('Checksum verification proves byte integrity only; it is not production approval.');
}

function build(outputArg) {
  if (git(['status', '--porcelain'])) fail('working tree is not clean');
  const commit = git(['rev-parse', 'HEAD']);
  const branch = process.env.GITHUB_REF_NAME || git(['branch', '--show-current']);
  let automatedEvidence = [];
  if (process.env.PROOFGAP_AUTOMATED_EVIDENCE_JSON) {
    try { automatedEvidence = JSON.parse(process.env.PROOFGAP_AUTOMATED_EVIDENCE_JSON); }
    catch { fail('PROOFGAP_AUTOMATED_EVIDENCE_JSON is not valid JSON'); }
    if (!Array.isArray(automatedEvidence) || automatedEvidence.some((item) => item.result !== 'success' || item.validatedCommit !== commit || typeof item.url !== 'string')) {
      fail('automated evidence must contain successful runs validated against the exact source commit');
    }
    const names = new Set(automatedEvidence.map((item) => item.name));
    for (const required of ['CI', 'Cross-browser compatibility and security audit', 'Regenerate ProofGap Cite showcase']) {
      if (!names.has(required)) fail('missing successful exact-SHA workflow evidence: ' + required);
    }
  }
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  const output = resolve(outputArg || join(root, '..', 'proofgap-release-evidence-' + commit.slice(0, 12)));
  if (output === root || output.startsWith(root + '/')) fail('output must be outside the repository');
  if (existsSync(output) && readdirSync(output).length) fail('output directory is not empty');
  mkdirSync(output, { recursive: true });
  const archive = execFileSync('git', ['archive', '--format=tar', '--prefix=source/', commit], { cwd: root, maxBuffer: 256 * 1024 * 1024 });
  writeFileSync(join(output, 'source.tar'), archive, { flag: 'wx' });
  const archiveHash = hash(archive);
  const manifest = {
    schema: 'proofgap-release-evidence/v1',
    repository: 'https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean',
    pullRequest: 'https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/pull/44',
    source: { commit, branch, version: pkg.version, archive: 'source.tar' },
    sourceArchiveSha256: archiveHash,
    generatedAt: new Date().toISOString(),
    evidenceBoundary: automatedEvidence.length
      ? 'Every listed automated workflow run is required to have conclusion success and validatedCommit equal to this source commit. Automated checks are not independent assurance.'
      : 'No automated workflow evidence was embedded. Obtain successful exact-SHA CI, cross-browser/security, and showcase runs before treating this bundle as validation evidence.',
    automatedEvidence,
    independentAssurance: {
      securityAudit: 'OPEN_NOT_PERFORMED',
      humanAccessibilityReview: 'OPEN_NOT_PERFORMED',
      deploymentPrivacyOwnerApproval: 'OPEN_NOT_GRANTED',
      productionApproval: 'NO_GO'
    },
    limitations: [
      'CI is automated evidence, not an independent security audit.',
      'Automated accessibility scans are not human assistive-technology testing.',
      'Synthetic benchmark results are not real-world accuracy validation.',
      'SHA-256 proves byte integrity only, not authenticity, provenance or chain of custody.',
      'No signed reviewer report or production release signature is included.'
    ]
  };
  writeFileSync(join(output, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n', { flag: 'wx' });
  const manifestHash = hash(readFileSync(join(output, 'manifest.json')));
  writeFileSync(join(output, 'SHA256SUMS'), manifestHash + '  manifest.json\n' + archiveHash + '  source.tar\n', { flag: 'wx' });
  console.log('Created: ' + output);
  console.log('Commit: ' + commit);
  console.log('SHA256 source.tar: ' + archiveHash);
  console.log('Review bundle only; not a production release.');
}

const args = process.argv.slice(2);
if (args[0] === '--verify') {
  if (!args[1]) fail('usage: --verify <bundle-directory>');
  verify(args[1]);
} else {
  if (args.length > 1) fail('usage: [output-directory] OR --verify <bundle-directory>');
  build(args[0]);
}
