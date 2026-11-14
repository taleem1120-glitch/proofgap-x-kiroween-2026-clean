/** Human-readable rendering of a report. Pure function of the report; no I/O. */
// Strip anything that could manipulate a terminal (controls, bidi); input was validated, this is defence in depth.
// eslint-disable-next-line no-control-regex
const clean = (s) => String(s).replace(/[\u0000-\u0008\u000b-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/g, '?');
const q = (xs) => xs.map((x) => `"${clean(x)}"`).join(', ');

const LABEL = {
  supported_by_independent_origins: 'SUPPORTED (under declared assumptions)',
  insufficient_support: 'INSUFFICIENT SUPPORT',
  conflicting: 'CONFLICTING EVIDENCE',
  contradicted: 'CONTRADICTED',
  no_evidence: 'NO EVIDENCE',
};

export function renderText(r) {
  const o = [];
  o.push(`ProofGap X report — case ${clean(r.caseId)}: ${clean(r.title)}`);
  o.push(`analysis ${r.analysisVersion} | input sha256 ${r.inputSha256}`);
  o.push(r.disclaimer, '');
  const i = r.integrity;
  o.push(`Integrity verification: ${i.mode === 'not_requested' ? 'NOT REQUESTED (declared hashes are UNVERIFIED)' : 'local directory'}`);
  o.push('  ' + Object.entries(i.counts).map(([k, v]) => `${k}=${v}`).join('  '));
  for (const e of i.results.filter((x) => x.declaredSha256 || x.observedSha256)) {
    const tail = e.verified ? '' : !e.declaredSha256 ? ' — no declared hash; bytes hashed locally (nothing to verify against)' : ' — hash is declared only, not verified';
    o.push(`  - ${clean(e.evidenceId)}: ${e.status}${e.reason ? ` (${e.reason})` : ''}${tail}`);
  }
  o.push('');
  for (const c of r.claims) {
    o.push(`CLAIM ${clean(c.claimId)}: ${clean(c.statement)}`);
    o.push(`  Verdict: ${LABEL[c.status]}  | support score ${c.supportScore} | contradict score ${c.contradictScore}`);
    const k = c.corroboration;
    if (k.supportingEvidenceItems > 0) {
      o.push(`  Corroboration: ${k.supportingEvidenceItems} supporting item(s) → ${k.independentSupportOrigins} independent origin(s)${k.falseCorroboration ? '  ** FALSE CORROBORATION: extra items add no independence **' : ''}`);
      for (const cl of k.clusters.supports) {
        o.push(`    · origin ${clean(cl.origin)} [items ${q(cl.evidenceIds)}]`);
        for (const why of cl.reasons) o.push(`        - ${clean(why)}`);
      }
    }
    for (const cl of k.clusters.contradicts) o.push(`    · CONTRADICTS from origin ${clean(cl.origin)} [items ${q(cl.evidenceIds)}]`);
    if (c.findings.length) {
      o.push('  Findings (logical — follow from the declared data and policy):');
      for (const f of c.findings) o.push(`    [${f.severity.toUpperCase()}] ${f.code}: ${clean(f.message)}`);
    }
    if (c.requirements.length) {
      o.push('  What could narrow the gap (heuristic suggestions, ranked; not conclusions):');
      for (const q2 of c.requirements) {
        o.push(`    ${q2.rank}. ${clean(q2.action)}`);
        o.push(`         would show: ${clean(q2.wouldShow)}`);
        o.push(`         would NOT show: ${clean(q2.wouldNotShow)}`);
      }
    }
    if (c.assumptions.length) { o.push('  Assumptions:'); for (const a of c.assumptions) o.push(`    - ${clean(a)}`); }
    o.push('');
  }
  if (r.warnings.length) {
    o.push('Heuristic warnings (possible UNDECLARED dependence; scores unaffected):');
    for (const w of r.warnings) o.push(`  - ${w.code}: ${clean(w.message)}`);
    o.push('');
  }
  if (r.notes.length) { o.push('Notes:'); for (const n of r.notes) o.push(`  - ${clean(n)}`); }
  return o.join('\n') + '\n';
}
