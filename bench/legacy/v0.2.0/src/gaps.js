/**
 * Proof Gap Intelligence Engine.
 *
 * FINDINGS are LOGICAL: they follow deterministically from the declared case data and
 * the stated policy (see POLICY in analyze.js). RECOMMENDATIONS are HEURISTIC: suggestions
 * about what kind of evidence could narrow the gap. They never name specific evidence,
 * sources or results that do not already exist in the case, and they say what the
 * suggested item would NOT prove.
 */

// Fixed, documented heuristic ordering of recommendation importance (lower = earlier).
// It is an ordering convention, not a probability or measured impact.
export const REQUIREMENT_PRIORITY = Object.freeze({
  INTEGRITY_MISMATCH: 1,
  SELF_CONTRADICTORY_ORIGIN: 2,
  CONFLICT_UNRESOLVED: 3,
  NO_LINKED_EVIDENCE: 4,
  FALSE_CORROBORATION: 5,
  BELOW_INDEPENDENCE_THRESHOLD: 6,
  ONLY_CONTRADICTING_EVIDENCE: 7,
  INTEGRITY_UNVERIFIED: 8,
  INTEGRITY_UNAVAILABLE: 9,
  PROVENANCE_UNVERIFIED: 10,
});
const SEVERITY = { high: 0, medium: 1, low: 2, info: 3 };
const q = (xs) => xs.map((x) => `"${x}"`).join(', ');

/**
 * @param c per-claim facts: { claimId, status, support[], contradict[], supportItems[], integrityByEvidence: Map, threshold }
 * @returns {findings, requirements, assumptions}
 */
export function analyzeGaps(c) {
  const findings = [];
  const reqs = [];
  const add = (f) => findings.push({ basis: 'logical', ...f });
  const need = (code, action, wouldShow, wouldNotShow, addresses) =>
    reqs.push({ code, basis: 'heuristic', addresses, action, wouldShow, wouldNotShow });

  const supOrigins = c.support.map((x) => x.origin), conOrigins = c.contradict.map((x) => x.origin);
  const itemIds = c.supportItems;

  if (c.support.length === 0 && c.contradict.length === 0) {
    add({ code: 'NO_LINKED_EVIDENCE', severity: 'high', message: 'No effective evidence is linked to this claim.', evidence: [], origins: [] });
    need('NO_LINKED_EVIDENCE', 'Identify and obtain evidence bearing on this claim from at least two origins that do not derive from one another, and record each one\'s provenance.',
      'Whether any documented support exists and from how many declared origins.', 'That the claim is true, or that the new sources are truly independent (that needs separate provenance verification).', ['NO_LINKED_EVIDENCE']);
  }

  if (c.support.length > 0 && itemIds.length > c.support.length && itemIds.length >= 2) {
    add({ code: 'FALSE_CORROBORATION', severity: c.support.length < c.threshold ? 'high' : 'medium',
      message: `${itemIds.length} supporting evidence items collapse to ${c.support.length} independent origin(s); the extra items are duplicates or derivatives and add no independent corroboration.`,
      evidence: itemIds, origins: supOrigins });
    need('FALSE_CORROBORATION', `Trace the derived or duplicated items back to their upstream original(s) (${q(supOrigins)}) and compare each copy against its original.`,
      'Whether the copies faithfully reproduce the original, and what the original itself contains.', 'That the original is accurate, or that the copies independently corroborate it.', ['FALSE_CORROBORATION']);
  }

  if (c.support.length >= 1 && c.support.length < c.threshold && c.contradict.length === 0) {
    add({ code: 'BELOW_INDEPENDENCE_THRESHOLD', severity: 'high',
      message: `Support comes from ${c.support.length} independent origin(s); policy requires at least ${c.threshold}.`, evidence: itemIds, origins: supOrigins });
    need('BELOW_INDEPENDENCE_THRESHOLD', `Obtain evidence for this claim from an origin that is not ${q(supOrigins)}, not derived from them, and not in their origin groups.`,
      'Whether a second, separately declared origin also supports the claim.', 'That the claim is true, or that the new origin is independent beyond what its declared provenance states.', ['BELOW_INDEPENDENCE_THRESHOLD']);
  }

  if (c.support.length === 0 && c.contradict.length > 0) {
    add({ code: 'ONLY_CONTRADICTING_EVIDENCE', severity: 'high', message: `Only contradicting evidence from ${c.contradict.length} independent origin(s) is linked; nothing supports this claim.`, evidence: c.contradictItems, origins: conOrigins });
    need('ONLY_CONTRADICTING_EVIDENCE', 'Re-examine whether the claim as worded is still defensible; look for any evidence that supports it, or revise the claim.',
      'Whether any support exists at all.', 'That the contradicting evidence is correct.', ['ONLY_CONTRADICTING_EVIDENCE']);
  }

  if (c.support.length > 0 && c.contradict.length > 0) {
    add({ code: 'CONFLICT_UNRESOLVED', severity: 'high',
      message: `${c.support.length} independent origin(s) support and ${c.contradict.length} contradict this claim. The conflict is not resolved by the case data.`,
      evidence: [...new Set([...itemIds, ...c.contradictItems])].sort(), origins: [...new Set([...supOrigins, ...conOrigins])].sort() });
    need('CONFLICT_UNRESOLVED', 'Document how each side was collected (method, time, access) and look for a further origin that is independent of both sides.',
      'Which side has better-documented collection and whether a third independent origin leans one way.', 'Which side is correct; a third source does not settle the matter by majority.', ['CONFLICT_UNRESOLVED']);
    const both = supOrigins.filter((o) => conOrigins.includes(o));
    if (both.length) {
      add({ code: 'SELF_CONTRADICTORY_ORIGIN', severity: 'high', message: `Origin(s) ${q(both)} both support and contradict this claim.`, evidence: [], origins: both });
      need('SELF_CONTRADICTORY_ORIGIN', `Ask the holder of origin(s) ${q(both)} (or review its records) to explain the opposing items: different versions, different time points, or a data-entry error.`,
        'Whether the opposing items are reconcilable.', 'Which of the opposing items is accurate.', ['SELF_CONTRADICTORY_ORIGIN']);
    }
  }

  // Integrity: only declared hashes matter. Status comes from integrity.js, never from the case author.
  const allItems = [...new Set([...itemIds, ...c.contradictItems])].sort();
  const by = (st) => allItems.filter((id) => c.integrityByEvidence.get(id)?.status === st);
  const withHash = allItems.filter((id) => c.integrityByEvidence.get(id)?.declaredSha256);
  const mismatch = by('MISMATCH');
  const notVerified = withHash.filter((id) => c.integrityByEvidence.get(id).status !== 'VERIFIED' && !mismatch.includes(id));
  const noHash = allItems.filter((id) => !c.integrityByEvidence.get(id)?.declaredSha256);
  if (c.excludedMismatch.length) {
    add({ code: 'INTEGRITY_MISMATCH', severity: 'high', message: `Evidence ${q(c.excludedMismatch)} failed SHA-256 verification (file differs from declared hash) and was EXCLUDED from scoring.`, evidence: c.excludedMismatch, origins: [] });
    need('INTEGRITY_MISMATCH', `Investigate why the file for ${q(c.excludedMismatch)} differs from its declared hash (wrong file, modification, or wrong hash recorded) and re-acquire or correct the record.`,
      'Whether the discrepancy is a recording error or a changed file.', 'Who changed it, when, or whether the content is otherwise reliable.', ['INTEGRITY_MISMATCH']);
  }
  if (notVerified.length && c.integrityMode === 'not_requested') {
    add({ code: 'INTEGRITY_UNVERIFIED', severity: 'medium', message: `Declared SHA-256 values for ${q(notVerified)} were NOT verified against local files. They must not be treated as verified.`, evidence: notVerified, origins: [] });
    need('INTEGRITY_UNVERIFIED', 'Place the evidence files in a local evidence directory and re-run with --evidence-dir to check declared hashes.',
      'That the local bytes match the hash recorded in the case.', 'That the file is authentic, unaltered before the hash was taken, or that its content is true.', ['INTEGRITY_UNVERIFIED']);
  } else if (notVerified.length) {
    add({ code: 'INTEGRITY_UNAVAILABLE', severity: 'medium', message: `Declared SHA-256 values for ${q(notVerified)} could not be verified (missing file, unsafe path, or limit reached); treated as unverified.`, evidence: notVerified, origins: [] });
    need('INTEGRITY_UNAVAILABLE', `Supply a regular file (no symlinks) at the declared relative path for ${q(notVerified)} inside the evidence directory, or correct its path.`,
      'That the local bytes match the declared hash.', 'Authenticity, provenance or truth of the content.', ['INTEGRITY_UNAVAILABLE']);
  }
  if (noHash.length && c.support.length + c.contradict.length > 0) {
    add({ code: 'NO_DECLARED_HASH', severity: 'info', message: `Evidence ${q(noHash)} has no declared SHA-256, so its integrity cannot be checked.`, evidence: noHash, origins: [] });
  }

  if (c.status === 'supported_by_independent_origins') {
    add({ code: 'PROVENANCE_UNVERIFIED', severity: 'low', message: `Independence of ${q(supOrigins)} rests on DECLARED provenance only; no independent provenance verification was performed.`, evidence: itemIds, origins: supOrigins });
    need('PROVENANCE_UNVERIFIED', `Check custody or acquisition records for the origins ${q(supOrigins)} to determine whether any of them copied from another or shares an undeclared upstream.`,
      'Whether the declared independence is credible.', 'That the evidence is true or complete.', ['PROVENANCE_UNVERIFIED']);
  }

  findings.sort((a, b) => SEVERITY[a.severity] - SEVERITY[b.severity] || (a.code < b.code ? -1 : a.code > b.code ? 1 : 0));
  reqs.sort((a, b) => REQUIREMENT_PRIORITY[a.code] - REQUIREMENT_PRIORITY[b.code]);
  reqs.forEach((r, i) => { r.rank = i + 1; });
  return { findings, requirements: reqs };
}

export function buildAssumptions({ hasEvidence, supportItems, integrityByEvidence, threshold }) {
  const a = [];
  if (!hasEvidence) return a;
  a.push('Provenance (derivedFrom, originGroup) is as declared by the case author and has not been independently verified.');
  a.push('Strength values are author-assigned judgments, not measurements.');
  a.push(`"${threshold} or more independent origins" is a policy threshold, not proof that a claim is true.`);
  if (supportItems.length) {
    const v = supportItems.filter((id) => integrityByEvidence.get(id)?.status === 'VERIFIED').length;
    a.push(`${v} of ${supportItems.length} supporting evidence item(s) have a declared SHA-256 VERIFIED against a local file; the others are unverified. Verification confirms byte equality only, not authenticity.`);
  }
  return a;
}
