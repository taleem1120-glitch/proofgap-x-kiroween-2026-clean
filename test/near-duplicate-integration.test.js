import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyzeNote } from '../apps/proofgap-cite/src/index.js';

const base = ('The independent review records the same sequence of events and observations, ' +
  'including the original publication details and the evidence references for this report. ').repeat(4);
const changed = base.replace('observations', 'observation');

test('near-duplicate citation labels trigger abstention but never merge origins or scores', () => {
  const note = `# Synthetic note
## Claims
- A synthetic claim [^a] [^b]
## References
[^a]: ${base} {kind=primary}
[^b]: ${changed} {kind=primary}
`;
  const r = analyzeNote(note);
  assert.equal(r.claims[0].decision, 'abstain_suspected_shared_origin');
  assert.equal(r.claims[0].citeEvidence.independentOrigins, 2);
  assert.equal(r.claims[0].citeEvidence.primaryRootedOrigins, 2);
  assert.ok(r.claims[0].findings.some((f) => f.code === 'NEAR_DUPLICATE_TEXT_DIFFERENT_LINEAGE' && f.basis === 'heuristic'));
});

test('unrelated citation labels do not trigger near-duplicate abstention', () => {
  const note = `# Synthetic note
## Claims
- A synthetic claim [^a] [^b]
## References
[^a]: ${base} {kind=primary}
[^b]: Completely unrelated gardening and weather information. {kind=primary}
`;
  const r = analyzeNote(note);
  assert.equal(r.claims[0].decision, 'independently_corroborated');
  assert.equal(r.claims[0].citeEvidence.independentOrigins, 2);
});
