import test from 'node:test';
import assert from 'node:assert/strict';
import { CITE_SPLITS, generateCiteSplit } from '../bench/cite/dataset.js';

test('new shared-template scenario cannot perturb historical benchmark cohorts', () => {
  for (const splitName of ['dev', 'heldout', 'textReviewHeldout']) {
    const notes = generateCiteSplit(splitName);
    assert.equal(notes.length, CITE_SPLITS[splitName].count);
    for (const note of notes) {
      for (const claim of Object.values(note.truth)) {
        assert.notEqual(claim.scenario, 'independent_shared_template', `unexpected template scenario in ${splitName}`);
      }
    }
  }
});

test('fresh template cohort contains independent sources with saved source bytes', () => {
  const notes = generateCiteSplit('templateHeldout');
  assert.equal(notes.length, CITE_SPLITS.templateHeldout.count);
  const cases = notes.flatMap((note) =>
    Object.values(note.truth)
      .filter((claim) => claim.scenario === 'independent_shared_template')
      .map((claim) => ({ note, claim }))
  );
  assert.ok(cases.length > 0, 'reserved cohort must exercise the shared-template scenario');
  for (const { note, claim } of cases) {
    assert.equal(claim.corroborated, true);
    assert.equal(claim.refs.length, 2);
    for (const source of claim.refs) {
      assert.ok(note.files.has(`${source.id}.txt`), `missing saved bytes for ${source.id}`);
    }
  }
});
