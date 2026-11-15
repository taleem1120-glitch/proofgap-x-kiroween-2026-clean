import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { confusion, summarize, wilson, percentile } from '../bench/metrics.js';
import { generateCase, generateSplit, SPLITS, SCENARIOS } from '../bench/dataset.js';
import { DETECTORS } from '../bench/detectors.js';
import { validateCase, analyzeCase } from '../src/index.js';
import { canonicalize } from '../src/canonical.js';

test('metrics: confusion matrix and ratios on a hand-computed example', () => {
  // truth/pred: TP=3, FN=1, FP=2, TN=4
  const pairs = [...Array(3).fill({ truth: true, pred: true }), { truth: true, pred: false }, ...Array(2).fill({ truth: false, pred: true }), ...Array(4).fill({ truth: false, pred: false })];
  const m = confusion(pairs); assert.deepEqual(m, { tp: 3, fp: 2, tn: 4, fn: 1 });
  const s = summarize(m);
  assert.equal(s.precision.value, 3 / 5); assert.equal(s.recall.value, 3 / 4); assert.equal(s.falsePositiveRate.value, 2 / 6); assert.equal(s.accuracy.value, 7 / 10);
});

test('metrics: undefined ratios are null (never silently 0 or 1), Wilson interval matches known values', () => {
  assert.equal(summarize({ tp: 0, fp: 0, tn: 0, fn: 0 }).precision.value, null);
  assert.equal(wilson(0, 0), null);
  const [lo, hi] = wilson(0, 10); assert.equal(lo, 0); assert.ok(Math.abs(hi - 0.2775) < 0.001, String(hi));
  const [l2, h2] = wilson(50, 100); assert.ok(Math.abs(l2 - 0.4038) < 0.001 && Math.abs(h2 - 0.5962) < 0.001);
  assert.equal(percentile([5, 1, 3, 2, 4], 0.5), 3); assert.equal(percentile([], 0.5), null);
});

test('dataset: deterministic, disjoint seeds between dev and held-out, no identical cases across splits', () => {
  assert.deepEqual(generateCase(42), generateCase(42));
  const dev = SPLITS.dev, ho = SPLITS.heldout;
  assert.ok(dev.firstSeed + dev.count <= ho.firstSeed, 'seed ranges overlap');
  const h = (x) => createHash('sha256').update(canonicalize(x.case)).digest('hex');
  const devHashes = new Set(generateSplit('dev').map(h));
  for (const x of generateSplit('heldout')) assert.ok(!devHashes.has(h(x)), `held-out case ${x.id} also in dev`);
});

test('dataset: every case passes the strict validator and labels are consistent with hidden origin counts', () => {
  for (const name of ['dev', 'heldout']) for (const x of generateSplit(name)) {
    validateCase(x.case);
    for (const t of Object.values(x.truth)) assert.equal(t.corroborated, t.trueOrigins >= 2);
  }
});

test('dataset: every scenario is exercised in both splits, and both classes are present', () => {
  for (const name of ['dev', 'heldout']) {
    const seen = new Set(), cls = new Set();
    for (const x of generateSplit(name)) for (const t of Object.values(x.truth)) { seen.add(t.scenario); cls.add(t.corroborated); }
    assert.deepEqual([...seen].sort(), Object.keys(SCENARIOS).sort(), name); assert.equal(cls.size, 2);
  }
});

test('detectors see no ground truth: output is unchanged when the truth object is mutated or removed', () => {
  const x = generateCase(77); const rep = analyzeCase(x.case);
  const before = Object.fromEntries(Object.entries(DETECTORS).map(([k, f]) => [k, x.case.claims.map((c) => f(x.case, c.id, rep))]));
  for (const t of Object.values(x.truth)) { t.corroborated = !t.corroborated; t.trueOrigins = 99; }
  const after = Object.fromEntries(Object.entries(DETECTORS).map(([k, f]) => [k, x.case.claims.map((c) => f(x.case, c.id, rep))]));
  assert.deepEqual(after, before);
});

test('benchmark honesty guard: undeclared-copy scenarios are labelled uncorroborated and ProofGap does NOT detect them (known limitation)', () => {
  let n = 0, fooled = 0;
  for (const x of generateSplit('dev')) { const rep = analyzeCase(x.case); for (const [id, t] of Object.entries(x.truth)) if (t.kind === 'undeclared') { n++; assert.equal(t.corroborated, false); if (DETECTORS.P_proofgap_current(x.case, id, rep)) fooled++; } }
  assert.ok(n > 30); assert.equal(fooled, n, 'if this starts failing, the limitation text in docs/BENCHMARK.md must be revisited, not the test silently edited');
});

// ---- ProofGap Cite benchmark (Phase 11) ----
import { generateNote, generateCiteSplit, CITE_SPLITS, CITE_SCENARIOS } from './../bench/cite/dataset.js';
import { parseNote } from '../apps/proofgap-cite/src/parse.js';

test('cite dataset: deterministic, disjoint dev/held-out seeds, no identical notes across splits, every note parses', () => {
  assert.deepEqual(generateNote(7), generateNote(7));
  assert.ok(CITE_SPLITS.dev.firstSeed + CITE_SPLITS.dev.count <= CITE_SPLITS.heldout.firstSeed);
  const dev = new Set(generateCiteSplit('dev').map((n) => n.text));
  for (const n of generateCiteSplit('heldout')) { assert.ok(!dev.has(n.text)); parseNote(n.text); }
});

test('cite dataset: ground truth is never written into the note, and every scenario appears in both splits', () => {
  for (const name of ['dev', 'heldout']) {
    const seen = new Set();
    for (const n of generateCiteSplit(name)) {
      for (const t of Object.values(n.truth)) seen.add(t.scenario);
      assert.doesNotMatch(n.text, /corroborated|truth|undeclared_|reencoded|scenario/i);
    }
    assert.deepEqual([...seen].sort(), Object.keys(CITE_SCENARIOS).sort(), name);
  }
});
