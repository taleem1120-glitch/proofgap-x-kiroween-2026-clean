import test from 'node:test';
import assert from 'node:assert/strict';
import { CITE_SPLITS, generateCiteSplit } from '../bench/cite/dataset.js';

test('Cite saved-text review split is disjoint from development and Phase 11 held-out seeds', () => {
  const ranges = Object.values(CITE_SPLITS).map(({ firstSeed, count }) => new Set(Array.from({ length: count }, (_, i) => firstSeed + i)));
  for (let i = 0; i < ranges.length; i++) {
    for (let j = i + 1; j < ranges.length; j++) {
      for (const seed of ranges[i]) assert.equal(ranges[j].has(seed), false, `seed overlap: ${seed}`);
    }
  }
  assert.equal(CITE_SPLITS.textReviewHeldout.firstSeed, 700001);
  assert.equal(CITE_SPLITS.textReviewHeldout.count, 150);
});

test('fresh Cite review split keeps hidden truth out of the note and materializes saved text', () => {
  const [note] = generateCiteSplit('textReviewHeldout');
  assert.ok(note.files.size > 0);
  assert.equal(note.text.includes('corroborated'), false);
  assert.ok(Object.values(note.truth).some(x => x.scenario === 'reencoded_repost'));
});
