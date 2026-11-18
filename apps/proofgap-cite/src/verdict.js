/**
 * ProofGap Cite verdicts, computed from the core report (never from scores).
 *
 * Rule: a claim is `independently_corroborated` only if at least 2 of its independent support origins (as computed by
 * the core from declared lineage and verified byte identity) each trace to a reference declared kind=primary that
 * declares no upstream of its own, and no heuristic cue links two of those origins. Everything else names exactly what is missing.
 */
import { findNearDuplicatePairs } from './text-similarity.js';
import { detectSharedPassage } from '../../../src/text-copy-cues.js';

export const CITE_VERDICTS = Object.freeze({
  independently_corroborated: 'two or more independent origins that each trace to a declared primary source',
  abstain_suspected_shared_origin: 'enough declared primary origins, but a cue (same URL/DOI, same title, shared saved file) suggests they may be one',
  origin_unresolved: 'separately declared origins, but fewer than two trace to a declared primary source',
  single_origin: 'every citation traces to one origin',
  circular_reporting: 'support comes only from references that cite each other',
  conflicting: 'independent origins both support and contradict the claim',
  contradicted: 'only contradicting citations',
  unsupported: 'no citation',
});

const q = (xs) => xs.map((x) => `[^${x}]`).join(', ');

export function citeVerdicts({ report, note, cycles, identifierGroups, textDocuments = [] }) {
  const textById = new Map(textDocuments.map((d) => [d.id, d.text]));
  const refs = note.references;
  const isPrimaryRoot = (root) => {
    if (!root.startsWith('source:')) return false;
    const r = refs.get(root.slice(7));
    return Boolean(r && r.kind === 'primary' && r.cites.length === 0);
  };
  const isCircular = (o) => o.origin.split('+').every((x) => x.startsWith('group:cyc.') || x.startsWith('artifact:'));
  const cycleRefs = new Set(cycles.flat());
  const lineOf = new Map(note.claims.map((c) => [c.id, c.line]));
  const out = new Map();

  for (const cl of report.claims) {
    const sup = cl.independentSupportOrigins, con = cl.independentContradictOrigins;
    const cited = note.claims.find((c) => c.id === cl.claimId).cites;
    const primaryOrigins = sup.filter((o) => o.origin.split('+').some(isPrimaryRoot));
    const findings = [], missing = [];
    const F = (code, basis, severity, message, refsInvolved = []) => findings.push({ code, basis, severity, message, evidence: refsInvolved.map((r) => `doc.${r}`), origins: [] });

    // saved copies the core found to be one artifact (identical bytes / declared hash), among this claim's citations
    const citedIds = new Set(cited.map((c) => c.id));
    const linkedByArtifact = new Set();
    for (const a of report.artifacts ?? []) {
      const holders = a.sources.filter((x) => citedIds.has(x));
      if (holders.length < 2) continue;
      for (const h of holders) linkedByArtifact.add(h);
      const res = a.members.map((m) => report.integrity.results.find((r) => r.evidenceId === m));
      const verified = res.every((r) => r && r.observedSha256 && !r.observedEmpty && r.observedSha256 === res[0].observedSha256);
      F('SAVED_COPY_IDENTICAL', 'logical', 'high', `The saved files of ${q(holders)} are ${verified ? 'byte-identical (verified by hashing the local files)' : 'declared identical (same hash), not verified'}; they count as one source, whatever their outlets or URLs.`, holders);
    }
    // per-reference lineage facts for this claim
    for (const ct of cited) {
      const r = refs.get(ct.id);
      if (cycleRefs.has(r.id) || linkedByArtifact.has(r.id)) continue; // origin known via cycle or shared saved file
      if (r.kind === 'secondary' && r.cites.length === 0) F('SECONDARY_WITHOUT_UPSTREAM', 'logical', 'medium', `[^${r.id}] is declared secondary but names no upstream source (cites=), so its origin is unknown.`, [r.id]);
      if (!r.kindDeclared && r.cites.length === 0) F('ORIGIN_KIND_UNDECLARED', 'logical', 'medium', `[^${r.id}] does not declare kind=primary or kind=secondary; whether it is an original source is unknown.`, [r.id]);
      if (r.kind === 'primary' && r.cites.length > 0) F('PRIMARY_WITH_UPSTREAM', 'logical', 'medium', `[^${r.id}] is declared primary but also cites ${q(r.cites)}; it is treated as derived, not as an original.`, [r.id]);
    }
    const inCycle = cited.filter((c) => cycleRefs.has(c.id)).map((c) => c.id);
    if (inCycle.length) F('CIRCULAR_REPORTING', 'logical', 'high', `${q(inCycle)} sit in a citation cycle (${cycles.filter((cy) => cy.some((x) => inCycle.includes(x))).map((cy) => cy.join(' → ') + ' → ' + cy[0]).join('; ')}); no original source is declared inside the loop.`, inCycle);
    // Full saved-text comparison is opt-in via --sources and uses only safely extracted UTF-8 files.
    // Pair count is bounded by the extractor (30 documents); each pair has a 1,000-comparison budget.
    const textRefs = cited.filter((c) => textById.has(c.id));
    for (let i = 0; i < textRefs.length; i++) {
      for (let j = i + 1; j < textRefs.length; j++) {
        const left = textRefs[i].id, right = textRefs[j].id;
        const cue = detectSharedPassage(textById.get(left), textById.get(right), { maxComparisons: 1000 });
        if (cue.longestRunTokens >= 60) {
          const locations = cue.candidates.slice(0, 2).map((x) => `tokens ${x.startA}-${x.startA + x.tokens - 1} in [^${left}] / ${x.startB}-${x.startB + x.tokens - 1} in [^${right}]`).join('; ');
          F('SHARED_PASSAGE_TEXT_OVERLAP', 'heuristic', 'medium',
            `A contiguous shared passage of ${cue.longestRunTokens} normalized tokens was found between [^${left}] and [^${right}] (${locations || 'locations unavailable'}). This is a review cue only; quotations, templates and syndication can explain overlap.`, [left, right]);
        }
        if (cue.incomplete) F('SHARED_PASSAGE_SCAN_INCOMPLETE', 'heuristic', 'low',
          `The shared-passage scan for [^${left}] and [^${right}] was incomplete (${cue.basis}); absence of a detected passage is not informative.`, [left, right]);
      }
    }

    // identifier cues linking two different support origins of this claim
    const originOfRef = new Map(sup.flatMap((o) => o.sourceIds.map((s) => [s, o.origin])));
    const idCues = identifierGroups.filter((g) => new Set(g.refs.map((r) => originOfRef.get(r)).filter(Boolean)).size >= 2);
    // Compare reference labels as a bounded review cue. Similarity never merges citation origins.
    const nearText = findNearDuplicatePairs(cited.map((ct) => ({ id: ct.id, text: refs.get(ct.id).label })));
    const nearTextCues = nearText.pairs.filter((p) => originOfRef.has(p.left) && originOfRef.has(p.right) && originOfRef.get(p.left) !== originOfRef.get(p.right));
    for (const p of nearTextCues) F('NEAR_DUPLICATE_TEXT_DIFFERENT_LINEAGE', 'heuristic', 'medium',
      `[^${p.left}] and [^${p.right}] have highly similar normalized reference text (shingle similarity ${p.similarity}); review publication history, but similarity does not prove a shared origin.`, [p.left, p.right]);
    if (nearText.truncated) F('NEAR_DUPLICATE_SCAN_BOUNDED', 'heuristic', 'low',
      'Near-duplicate text review reached its deterministic comparison/result budget; some citation pairs may not have been compared.');
    for (const g of idCues) F('SAME_IDENTIFIER_DIFFERENT_LINEAGE', 'heuristic', 'medium', `${q(g.refs)} share ${g.identifier.replace(':', ' ')} but are declared as separate lineages; they may be the same piece (syndication or reposting).`, g.refs);

    let verdict;
    if (sup.length === 0 && con.length === 0) {
      verdict = 'unsupported';
      missing.push('At least one citation; to count as independently corroborated, two sources that each trace to a separate primary source.');
    } else if (sup.length > 0 && con.length > 0) {
      verdict = 'conflicting';
      missing.push(`A documented reason why the contradicting origin(s) ${con.map((o) => o.origin).join(', ')} do not apply, or further primary evidence.`);
    } else if (sup.length === 0) {
      verdict = 'contradicted';
      missing.push('Any supporting primary source.');
    } else if (sup.every(isCircular)) {
      verdict = 'circular_reporting';
      missing.push('The original source that the circularly citing references rely on (a document, dataset or statement), cited directly.');
    } else if (sup.length === 1) {
      verdict = 'single_origin';
      const o = sup[0];
      const roots = o.origin.split('+').filter((x) => x.startsWith('source:')).map((x) => x.slice(7));
      missing.push(primaryOrigins.length
        ? `A second primary source that does not derive from ${q(roots)}.`
        : `A primary source behind ${roots.length ? q(roots) : `origin ${o.origin}`}, plus a second, independent primary source.`);
    } else if (primaryOrigins.length >= 2) {
      const coreCues = cl.abstentionCues ?? [];
      if (idCues.length || coreCues.length || nearTextCues.length || nearText.truncated) {
        verdict = 'abstain_suspected_shared_origin';
        const reviewRefs = [
          ...idCues.flatMap((g) => g.refs),
          ...nearTextCues.flatMap((p) => [p.left, p.right]),
        ].map((r) => `[^${r}]`);
        const reasons = [...new Set([...reviewRefs, ...coreCues])];
        if (nearText.truncated) reasons.push('the near-duplicate scan reached its comparison/result budget');
        missing.push(`Resolve ${reasons.join(', ')} and confirm the cited pieces are genuinely separate (check bylines, syndication notes, publication history); the bounded text scan was ${nearText.truncated ? 'incomplete' : 'complete'}.`);
      } else verdict = 'independently_corroborated';
    } else {
      verdict = 'origin_unresolved';
      const unresolved = sup.filter((o) => !primaryOrigins.includes(o));
      missing.push(`For origin(s) ${unresolved.map((o) => o.sourceIds.map((s) => `[^${s}]`).join('+')).join(', ')}: the primary source each relies on (add kind=primary references, or cites= to them). Different URLs or outlets alone do not show independence.`);
    }
    const sev = { high: 0, medium: 1, low: 2, info: 3 };
    findings.sort((a, b) => sev[a.severity] - sev[b.severity] || (a.code < b.code ? -1 : a.code > b.code ? 1 : 0));
    out.set(cl.claimId, {
      verdict, line: lineOf.get(cl.claimId), findings, missing,
      citations: cited.length, independentOrigins: sup.length, primaryRootedOrigins: primaryOrigins.length,
      explanation: `${cited.filter((c) => c.stance === 'supports').length} supporting citation(s) → ${sup.length} independent origin(s), ${primaryOrigins.length} tracing to a declared primary source. Verdict: ${verdict.replace(/_/g, ' ')} (${CITE_VERDICTS[verdict]}).`,
    });
  }
  return out;
}
