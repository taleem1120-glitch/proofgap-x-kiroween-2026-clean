/**
 * Application 2: ProofGap Cite — citation lineage analysis for research and news notes.
 * Built only on the ProofGap core interface (src/core.js).
 */
import { analyze, serializeReport, renderHtml, CORE_API_VERSION } from '../../../src/core.js';
import { parseNote, CiteValidationError, CITE_LIMITS } from './parse.js';
import { buildCase } from './lineage.js';
import { citeVerdicts, CITE_VERDICTS } from './verdict.js';

export { CiteValidationError, CITE_LIMITS, CITE_VERDICTS, parseNote };
export const CITE_VERSION = '0.1.0';
export const REQUIRED_CORE_API = '1.';

export const CITE_PROFILE = Object.freeze({
  id: 'proofgap-cite',
  disclaimer: 'Prototype analysis of DECLARED citation lineage. It does not judge whether a claim is true, whether a source is reliable, or anyone\'s intent. Kinds, URLs, DOIs and cites= are declarations by the note author; only byte identity of saved files is verified.',
  claimCaveat: 'Citation counts and different URLs are not independence; only declared lineage and verified saved-file identity are used.',
});
export const CITE_HTML_PROFILE = Object.freeze({
  title: 'ProofGap Cite report viewer',
  heading: 'ProofGap Cite — citation lineage & false corroboration',
  intro: 'Shows how many genuinely independent origins stand behind each cited claim in a research or news note, under the lineage the note declares. It does not judge truth or reliability.',
  footer: 'ProofGap Cite prototype · built on the ProofGap core · synthetic example data · not independently validated.',
});

const safeCaseId = (s) => (String(s).replace(/[^A-Za-z0-9_.-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 64) || 'note');

/**
 * Analyse a Markdown note.
 * @param {string} text note contents
 * @param {object} [opts] { sourcesDir, noteName, limits }
 * @returns {object} deterministic Cite report (a core report extended with Cite verdicts)
 */
export function analyzeNote(text, { sourcesDir, noteName = 'note', limits = CITE_LIMITS } = {}) {
  if (!CORE_API_VERSION.startsWith(REQUIRED_CORE_API)) throw new Error(`ProofGap Cite needs core API ${REQUIRED_CORE_API}x, found ${CORE_API_VERSION}`);
  const note = parseNote(text, limits);
  const built = buildCase(note, safeCaseId(noteName));
  let core;
  try { core = analyze({ caseData: built.case, evidenceDir: sourcesDir, profile: CITE_PROFILE }); }
  catch (e) {
    // Translate core validation errors (e.g. a lineage deeper than the core limit) into note-level issues.
    if (e && e.name === 'CaseValidationError') throw new CiteValidationError(e.issues.map((i) => ({ line: 0, message: `lineage: ${i.message}` })));
    throw e;
  }
  const report = JSON.parse(serializeReport(core.report)); // plain, canonical copy we can extend
  const verdicts = citeVerdicts({ report, note, cycles: built.cycles, identifierGroups: built.identifierGroups });
  const counts = {};
  for (const cl of report.claims) {
    const v = verdicts.get(cl.claimId);
    cl.coreDecision = cl.decision;
    cl.decision = v.verdict;
    cl.line = v.line;
    cl.missing = v.missing;
    cl.citeEvidence = { citations: v.citations, independentOrigins: v.independentOrigins, primaryRootedOrigins: v.primaryRootedOrigins };
    cl.findings = [...v.findings, ...cl.findings];
    cl.explanation = [v.explanation, ...cl.explanation];
    counts[v.verdict] = (counts[v.verdict] ?? 0) + 1;
  }
  for (const n of report.graph.nodes) if (n.type === 'claim') { n.coreDecision = n.decision; n.decision = verdicts.get(n.ref).verdict; }
  report.summary.coreDecisionCounts = report.summary.decisionCounts;
  report.summary.decisionCounts = Object.fromEntries(Object.entries(counts).sort());
  report.cite = {
    citeVersion: CITE_VERSION, coreApiVersion: CORE_API_VERSION, note: { name: noteName, title: note.title, claims: note.claims.length, references: note.references.size },
    references: [...note.references.values()].sort((a, b) => (a.id < b.id ? -1 : 1)).map((r) => ({ id: r.id, line: r.line, label: r.label, kind: r.kind, kindDeclared: r.kindDeclared, url: r.url, doi: r.doi, saved: r.saved, cites: r.cites })),
    cycles: built.cycles, identifierGroups: built.identifierGroups, noteFindings: note.notes,
    policy: 'independently_corroborated requires >= 2 independent support origins (core), each tracing to a reference declared kind=primary with no declared upstream, and no cue linking them. Citation counts, URLs and DOIs never establish independence.',
  };
  return report;
}

export const serializeCiteReport = (r) => serializeReport(r);
export const renderCiteHtml = (serialized) => renderHtml(serialized, CITE_HTML_PROFILE);

const clip = (s, n) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);
// eslint-disable-next-line no-control-regex
const clean = (s) => String(s).replace(/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/g, '?');

/** Lint-style text: one block per claim, `file:line: [verdict] …`, then what is missing. */
export function renderLint(report) {
  const name = clean(report.cite.note.name), o = [];
  for (const cl of [...report.claims].sort((a, b) => a.line - b.line)) {
    const e = cl.citeEvidence;
    o.push(`${name}:${cl.line}: [${cl.decision}] "${clean(clip(cl.statement, 70))}": ${e.citations} citation(s) -> ${e.independentOrigins} independent origin(s), ${e.primaryRootedOrigins} primary-rooted${cl.corroboration.falseCorroboration ? `  (${cl.corroboration.apparentExcess} citation(s) add no independent support)` : ''}`);
    for (const f of cl.findings.filter((x) => x.code !== 'PROVENANCE_UNVERIFIED' && x.code !== 'NO_DECLARED_HASH')) o.push(`    ${f.basis === 'heuristic' ? 'suspect' : 'finding'} ${f.code}: ${clean(f.message)}`);
    for (const m of cl.missing) o.push(`    missing: ${clean(m)}`);
  }
  for (const f of report.cite.noteFindings) o.push(`${name}:${f.line}: [note] ${f.code}: ${clean(f.message)}`);
  const i = report.integrity;
  if (i.mode !== 'not_requested') for (const r of i.results.filter((x) => x.file && ['MISSING', 'UNSAFE_PATH', 'MISMATCH'].includes(x.status))) o.push(`${name}: [saved-file] ${r.evidenceId.slice(4)}: ${r.status} (${r.reason})`);
  const c = report.summary.decisionCounts;
  o.push(`summary: ${Object.entries(c).map(([k, v]) => `${k}=${v}`).join(' ')}${i.mode === 'not_requested' ? '  (saved files not checked; use --sources)' : ''}`);
  return `${o.join('\n')}\n`;
}

/** true when every claim is independently corroborated (used by --fail-on-gaps). */
export const allCorroborated = (report) => report.claims.every((c) => c.decision === 'independently_corroborated');
