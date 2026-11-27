import test from 'node:test';
import assert from 'node:assert/strict';
import { CITE_SPLITS, generateCiteSplit } from '../bench/cite/dataset.js';

const scenarios = (split) => generateCiteSplit(split).flatMap((note) => Object.values(note.truth).map((claim) => claim.scenario));

test('new template scenarios cannot perturb historical benchmark cohorts', () => {
  for (const splitName of ['dev', 'heldout', 'textReviewHeldout']) {
    const names = scenarios(splitName);
    assert.equal(names.length > 0, true);
    assert.equal(names.includes('independent_shared_template'), false, `long template leaked into ${splitName}`);
    assert.equal(names.includes('independent_short_template'), false, `short template leaked into ${splitName}`);
    assert.equal(generateCiteSplit(splitName).length, CITE_SPLITS[splitName].count);
  }
});

test('long-template stress cohort contains independent sources with saved source bytes', () => {
  const notes = generateCiteSplit('templateHeldout');
  assert.equal(notes.length, CITE_SPLITS.templateHeldout.count);
  const cases = notes.flatMap((note) => Object.values(note.truth)
    .filter((claim) => claim.scenario === 'independent_shared_template')
    .map((claim) => ({ note, claim })));
  assert.equal(cases.length, 54, 'the stable long-template cohort distribution must remain unchanged');
  assert.equal(scenarios('templateHeldout').includes('independent_short_template'), false);
  for (const { note, claim } of cases) {
    assert.equal(claim.corroborated, true);
    assert.equal(claim.refs.length, 2);
    for (const source of claim.refs) assert.ok(note.files.has(`${source.id}.txt`));
  }
});

test('short-template cohort uses fewer than 60 shared tokens and retains distinct findings', () => {
  const notes = generateCiteSplit('shortTemplateHeldout');
  assert.equal(notes.length, CITE_SPLITS.shortTemplateHeldout.count);
  const cases = notes.flatMap((note) => Object.values(note.truth)
    .filter((claim) => claim.scenario === 'independent_short_template')
    .map((claim) => ({ note, claim })));
  assert.ok(cases.length > 0, 'reserved cohort must exercise the short-boilerplate scenario');
  const boiler = 'This report is published for public information and does not necessarily represent the views of any public authority or institution.';
  assert.ok(boiler.split(/\s+/u).length < 60);
  for (const { note, claim } of cases) {
    assert.equal(claim.corroborated, true);
    assert.equal(claim.refs.length, 2);
    const [a, b] = claim.refs.map((source) => note.files.get(`${source.id}.txt`));
    assert.ok(a && b);
    assert.ok(a.startsWith(boiler) && b.startsWith(boiler));
    assert.notEqual(a, b, 'substantive source text must remain distinct');
  }
});
