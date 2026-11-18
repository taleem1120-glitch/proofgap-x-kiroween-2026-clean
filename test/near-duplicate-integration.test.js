import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateCase } from '../src/index.js';
import { analyzeCase } from '../src/analyze.js';

const original = ('The independent review records the same sequence of events and observations, ' +
  'including the original publication details and the evidence references for this report. ').repeat(4);
const altered = original.replaceAll('observations', 'observationS');

const source = (id) => ({ id, name: 'Distinct outlet ' + id });
const evidence = (id, sourceId, description) => ({
  id, sourceId, description,
  links: [{ claimId: 'c1', stance: 'supports', strength: 0.7 }],
});

test('near-duplicate descriptions trigger abstention cue but never merge origins or scores', () => {
  const c = validateCase({
    schemaVersion: '1.0', caseId: 'near-text', title: 'synthetic',
    sources: [source('a'), source('b')],
    claims: [{ id: 'c1', statement: 'Synthetic claim' }],
    evidence: [evidence('e1', 'a', original), evidence('e2', 'b', altered)],
  });
  const r = analyzeCase(c).claims[0];
  assert.equal(r.status, 'supported_by_independent_origins');
  assert.equal(r.decision, 'abstain_possible_undeclared_dependence');
  assert.equal(r.independentSupportOrigins.length, 2);
  assert.equal(r.corroboration.independentSupportOrigins, 2);
  assert.ok(r.abstentionCues.includes('NEAR_DUPLICATE_TEXT_ACROSS_ORIGINS'));
  assert.equal(r.supportScore, 0.91);
});

test('unrelated descriptions do not trigger near-duplicate abstention', () => {
  const c = validateCase({
    schemaVersion: '1.0', caseId: 'different-text', title: 'synthetic',
    sources: [source('a'), source('b')],
    claims: [{ id: 'c1', statement: 'Synthetic claim' }],
    evidence: [
      evidence('e1', 'a', original),
      evidence('e2', 'b', 'Completely unrelated material about weather forecasts and gardening. '.repeat(8)),
    ],
  });
  const r = analyzeCase(c).claims[0];
  assert.equal(r.status, 'supported_by_independent_origins');
  assert.equal(r.decision, 'supported_by_independent_origins');
  assert.equal(r.independentSupportOrigins.length, 2);
});
