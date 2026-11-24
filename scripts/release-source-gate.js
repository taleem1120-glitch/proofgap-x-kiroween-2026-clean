// Read-only source/package gate; does NOT certify public deployment or contest submission.
import { existsSync, lstatSync, readFileSync } from 'node:fs';

const paths = [
  'index.html','LICENSE','NOTICE','README.md','package.json','package-lock.json',
  '.kiro/KIRO_USAGE.md','.kiro/steering/proofgap-x.md',
  '.kiro/specs/proofgap-x/requirements.md','.kiro/specs/proofgap-x/design.md',
  '.kiro/specs/proofgap-x/tasks.md','.kiro/specs/proofgap-x/acceptance.md',
  'src/core.js','apps/proofgap-x/cli.js','apps/proofgap-cite/cli.js',
  'viewer/showcase.html','apps/proofgap-cite/showcase.html',
];
const results = paths.map(path => {
  try {
    const stat = lstatSync(path);
    return { path, ok: stat.isFile() && !stat.isSymbolicLink() };
  } catch {
    return { path, ok: false };
  }
});
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const checks = [
  { name: 'Apache-2.0 declared', ok: pkg.license === 'Apache-2.0' },
  { name: 'Node.js >=20 declared', ok: pkg.engines?.node === '>=20' },
  { name: 'two separate applications exist', ok: existsSync('apps/proofgap-x/cli.js') && existsSync('apps/proofgap-cite/cli.js') },
  { name: 'Kiro usage evidence file is present and factual', ok: readFileSync('.kiro/KIRO_USAGE.md', 'utf8').includes('Kiro Web') },
  { name: 'no proprietary ATHARNEX/EvidenceForge X imports in shared core', ok: !/ATHARNEX|EvidenceForge/i.test(readFileSync('src/core.js', 'utf8')) },
  { name: 'Apache-2.0 NOTICE is included in package file allowlist', ok: readFileSync('NOTICE', 'utf8').includes('Copyright 2026') && pkg.files?.includes('NOTICE') },
  { name: 'offline HTML demos are present', ok: results.filter(x => x.path.endsWith('showcase.html')).every(x => x.ok) },
  { name: 'npm publishing remains disabled until an explicit distribution decision', ok: pkg.private === true },
];
const ok = results.every(x => x.ok) && checks.every(x => x.ok);
const report = {
  kind: 'local_repository_source_gate_not_submission_certification',
  ok,
  checks,
  files: results,
  notVerified: [
    'live URLs accessible to judges',
    'public YouTube video under 3 minutes',
    'Devpost submission completed',
    'independent penetration test',
    'real-world independent competitive superiority',
    'commercial purchase evidence',
  ],
};
console.log(JSON.stringify(report, null, 2));
process.exitCode = ok ? 0 : 1;
