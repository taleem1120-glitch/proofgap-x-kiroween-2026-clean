#!/usr/bin/env node
// Deterministic synthetic benchmark for ProofGap Cite's opt-in saved-text review.
// This measures only the bounded shared-passage cue on constructed fixtures.
// It is not an estimate of real-world accuracy or proof of common provenance.
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { analyzeNote } from '../../apps/proofgap-cite/src/index.js';

const CASES_PER_CLASS = 50;
const SHARED_TOKENS = 90;
const shared = Array.from({ length: SHARED_TOKENS }, (_, i) => \`sharedtoken\${String(i).padStart(3, '0')}\`).join(' ');

function uniqueText(prefix) {
  return Array.from({ length: SHARED_TOKENS }, (_, i) => \`\${prefix}token\${String(i).padStart(3, '0')}\`).join(' ');
}

function makeNote(index, positive) {
  // Positive pairs share a long passage despite different prefixes, suffixes,
  // punctuation and whitespace. Negative pairs have disjoint token vocabularies.
  const left = positive
    ? \`leadleft\${index} \${shared} endingleft\${index}\`
    : uniqueText(\`negativeleft\${index}\`);
  const right = positive
    ? \`leadright\${index} \${shared.replaceAll(' ', ' —\\n')} endingright\${index}\`
    : uniqueText(\`negativeright\${index}\`);
  const note = [
    '# Text review benchmark',
    '## Claims',
    '- A synthetic claim supported by two declared primary references [^a] [^b]',
    '## References',
    '[^a]: Outlet A {kind=primary, url=https://a.example/report, saved=a.txt}',
    '[^b]: Outlet B {kind=primary, url=https://b.example/report, saved=b.txt}',
    '',
  ].join('\\n');
  return { note, left, right };
}

const counts = { tp: 0, fp: 0, tn: 0, fn: 0 };
const dir = mkdtempSync(join(tmpdir(), 'proofgap-cite-text-benchmark-'));
try {
  for (let i = 0; i < CASES_PER_CLASS * 2; i++) {
    const positive = i < CASES_PER_CLASS;
    const fixture = makeNote(i, positive);
    writeFileSync(join(dir, \`a-\${i}.txt\`), fixture.left);
    writeFileSync(join(dir, \`b-\${i}.txt\`), fixture.right);
    const note = fixture.note
      .replace('saved=a.txt', \`saved=a-\${i}.txt\`)
      .replace('saved=b.txt', \`saved=b-\${i}.txt\`);

    const baseline = analyzeNote(note, { sourcesDir: dir, noteName: \`text-review-\${i}.md\` });
    const reviewed = analyzeNote(note, {
      sourcesDir: dir,
      noteName: \`text-review-\${i}.md\`,
      reviewTextCopies: true,
    });
    assert.equal(baseline.claims[0].decision, 'independently_corroborated',
      'text review is opt-in and must not change the default decision');
    assert.equal(reviewed.claims[0].citeEvidence.independentOrigins, 2,
      'text similarity must not merge declared lineage');
    const detected = reviewed.claims[0].findings.some((f) => f.code === 'SHARED_PASSAGE_TEXT_OVERLAP');
    if (positive && detected) counts.tp++;
    else if (positive) counts.fn++;
    else if (detected) counts.fp++;
    else counts.tn++;
    assert.equal(reviewed.claims[0].decision,
      positive ? 'abstain_suspected_shared_origin' : 'independently_corroborated',
      \`unexpected verdict for synthetic case \${i}\`);
  }
} finally {
  rmSync(dir, { recursive: true, force: true });
}

const precision = counts.tp + counts.fp ? counts.tp / (counts.tp + counts.fp) : 0;
const recall = counts.tp + counts.fn ? counts.tp / (counts.tp + counts.fn) : 0;
const fpr = counts.fp + counts.tn ? counts.fp / (counts.fp + counts.tn) : 0;
console.log('ProofGap Cite opt-in shared-passage synthetic benchmark (NOT real-world accuracy)');
console.log(JSON.stringify({
  cases: CASES_PER_CLASS * 2,
  positiveCases: CASES_PER_CLASS,
  negativeCases: CASES_PER_CLASS,
  sharedPassageTokens: SHARED_TOKENS,
  counts,
  precision,
  recall,
  falsePositiveRate: fpr,
  caveat: 'Constructed English UTF-8 local-text fixtures only; does not validate Arabic, OCR, paraphrase, translation, real provenance, or real-world accuracy.',
}, null, 2));
