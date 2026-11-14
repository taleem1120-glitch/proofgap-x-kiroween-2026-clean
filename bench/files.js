// File-backed variant of a benchmark case (Phase 6). Writes one local file per evidence item so that
// `--evidence-dir` verification can be exercised. The generator (dataset.js) is NOT changed and no RNG call is
// added, so the underlying cases are exactly the case-data-only benchmark cases.
//
// Ground-truth file content:
//  - undeclared copies (kind 'undeclared'): copyMode chosen deterministically from sha256(caseId|claimId):
//      byte_identical -> every supporting item of that claim carries the SAME bytes (e.g. one attachment forwarded twice)
//      reencoded      -> same text plus an item-specific suffix (bytes differ, e.g. re-saved or re-compressed)
//  - every other item: unique bytes.
//  - items that already declare a sha256 get NO file (their synthetic declared hashes are not real digests, so a file
//    would only produce MISMATCH and silently change those scenarios).
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

export function copyModeOf(caseId, claimId) {
  return createHash('sha256').update(`${caseId}|${claimId}`).digest()[0] % 2 === 0 ? 'byte_identical' : 'reencoded';
}

export function materialize(item, dir) {
  const c = JSON.parse(JSON.stringify(item.case));
  const modes = {};
  for (const [claimId, t] of Object.entries(item.truth)) if (t.kind === 'undeclared') modes[claimId] = copyModeOf(c.caseId, claimId);
  for (const e of c.evidence) {
    if (e.sha256) continue;
    const sup = e.links.find((l) => l.stance === 'supports' && modes[l.claimId]);
    let content = `PGX-SYNTH ${c.caseId} ${e.id} ${e.description}\n`;
    if (sup) {
      content = `PGX-SYNTH ${c.caseId} shared-origin ${sup.claimId}\n`;
      if (modes[sup.claimId] === 'reencoded') content += `re-encoded copy ${e.id}\n`;
    }
    e.file = `${e.id}.txt`;
    writeFileSync(join(dir, e.file), content);
  }
  return { case: c, modes };
}
