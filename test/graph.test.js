import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { analyzeCase, validateCase, verifyEvidenceFiles } from '../src/index.js';
import { genCase } from './gen.js';

const sha = (x) => createHash('sha256').update(x).digest('hex');
let dir;
before(() => { dir = mkdtempSync(join(tmpdir(), 'pgx-g-')); writeFileSync(join(dir, 'a.txt'), 'same'); writeFileSync(join(dir, 'b.txt'), 'same'); });
after(() => rmSync(dir, { recursive: true, force: true }));

const caseWith = (fileB) => validateCase({ schemaVersion: '1.0', caseId: 'G', title: 't', claims: [{ id: 'c1', statement: 's' }],
  sources: [{ id: 'p', name: 'Camera' }, { id: 'q', name: 'camera' }, { id: 'r', name: 'r', derivedFrom: ['p'] }, { id: 't', name: ' CAMERA ' }],
  evidence: [
    { id: 'e1', sourceId: 'p', description: 'frame', file: 'a.txt', sha256: sha('same'), links: [{ claimId: 'c1', stance: 'supports', strength: 0.5 }] },
    { id: 'e2', sourceId: 'q', description: 'frame2', file: fileB, sha256: sha('same'), links: [{ claimId: 'c1', stance: 'supports', strength: 0.5 }] },
    { id: 'e3', sourceId: 'r', description: 'copy', links: [{ claimId: 'c1', stance: 'supports', strength: 0.5 }] },
    { id: 'e4', sourceId: 't', description: 'other', links: [{ claimId: 'c1', stance: 'supports', strength: 0.5 }] },
  ] });

test('edge bases: same_bytes is "verified" only when both files were VERIFIED, else "declared"; heuristics are "suspected"', () => {
  const c = caseWith('b.txt');
  const verified = analyzeCase(c, { integrity: verifyEvidenceFiles(c.evidence, { evidenceDir: dir }) }).graph;
  assert.equal(verified.edges.find((e) => e.relation === 'same_bytes').basis, 'verified');
  const declared = analyzeCase(c).graph;
  assert.equal(declared.edges.find((e) => e.relation === 'same_bytes').basis, 'declared');
  const missing = caseWith('nope.txt');
  assert.equal(analyzeCase(missing, { integrity: verifyEvidenceFiles(missing.evidence, { evidenceDir: dir }) }).graph.edges.find((e) => e.relation === 'same_bytes').basis, 'declared');
  // p and q hold byte-identical files, so they are NOT declared independent: no same-name cue between them; t is independent of both
  const sus = declared.edges.filter((e) => e.basis === 'suspected' && e.cue === 'SAME_NAME_DIFFERENT_ORIGINS');
  assert.ok(sus.length >= 1 && sus.every((e) => [e.from, e.to].includes('source:t') || [e.from, e.to].includes('source:p')));
  assert.ok(declared.edges.some((e) => e.relation === 'derived_from' && e.basis === 'declared'));
});

test('graph integrity on random cases: only 4 bases, every edge endpoint is a node, counts add up, deterministic', () => {
  for (let seed = 9500; seed < 9600; seed++) {
    const g = analyzeCase(validateCase(genCase(seed))).graph;
    const ids = new Set(g.nodes.map((n) => n.id));
    assert.equal(ids.size, g.nodes.length, 'duplicate node ids');
    for (const e of g.edges) { assert.ok(['verified', 'declared', 'suspected', 'unknown'].includes(e.basis)); assert.ok(ids.has(e.from) && ids.has(e.to), `${seed}: ${e.from} -> ${e.to}`); }
    assert.equal(Object.values(g.basisCounts).reduce((a, b) => a + b, 0), g.edges.length);
    assert.equal(g.edges.filter((e) => e.basis === 'verified').length, 0, 'no verification ran, so nothing may be verified');
    assert.deepEqual(analyzeCase(validateCase(genCase(seed))).graph, g);
  }
});

test('unknown edges: every pair of distinct origins bearing on a claim is marked independence_not_established', () => {
  const rep = analyzeCase(validateCase(genCase(9601)));
  for (const cl of rep.claims) {
    const o = [...new Set([...cl.independentSupportOrigins, ...cl.independentContradictOrigins].map((x) => x.origin))];
    const n = rep.graph.edges.filter((e) => e.basis === 'unknown' && e.claimId === cl.claimId).length;
    assert.equal(n, (o.length * (o.length - 1)) / 2);
  }
});

test('unknown-origin graph rendering is bounded and reports every omitted pair', async () => {
  const { buildGraph } = await import('../src/graph.js');
  const origins = Array.from({ length: 100 }, (_, i) => ({ origin: 'root-' + String(i).padStart(3, '0') }));
  const input = {
    c: { sources: [], evidence: [] },
    classes: [], roots: new Map(), integrityByEvidence: new Map(), warnings: [],
    claims: [{ claimId: 'large-claim', independentSupportOrigins: origins, independentContradictOrigins: [] }],
  };
  const a = buildGraph(input), b = buildGraph(input);
  assert.equal(a.edges.filter((e) => e.basis === 'unknown').length, 2000);
  assert.equal(a.omittedUnknownEdges, 2950);
  assert.deepEqual(a, b);
  assert.equal(a.basisCounts.unknown, 2000);
});
