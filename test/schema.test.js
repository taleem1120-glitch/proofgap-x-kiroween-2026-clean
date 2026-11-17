import { test } from 'node:test';
import assert from 'node:assert/strict';
import { caseSchema, validateSchema, DEFAULT_LIMITS, validateCase, parseCaseText, CaseValidationError } from '../src/index.js';
import { base, ev } from './helpers.js';

const paths = (data) => validateSchema(data).map((i) => i.path);
const msgFor = (data, path) => validateSchema(data).find((i) => i.path === path)?.message;

test('schema file is versioned and consistent with DEFAULT_LIMITS', () => {
  assert.equal(caseSchema.$id, 'urn:proofgap-x:schema:case:1.0');
  assert.equal(caseSchema.properties.schemaVersion.const, '1.0');
  const p = caseSchema.properties, d = caseSchema.$defs;
  assert.equal(p.sources.maxItems, DEFAULT_LIMITS.maxSources);
  assert.equal(p.evidence.maxItems, DEFAULT_LIMITS.maxEvidence);
  assert.equal(p.claims.maxItems, DEFAULT_LIMITS.maxClaims);
  assert.equal(d.text.maxLength, DEFAULT_LIMITS.maxStringLength);
  assert.equal(d.evidence.properties.links.maxItems, DEFAULT_LIMITS.maxLinksPerEvidence);
  assert.equal(d.source.properties.derivedFrom.maxItems, DEFAULT_LIMITS.maxLinksPerEvidence);
});

test('every object in the schema rejects unsupported properties', () => {
  const walk = (n, where) => {
    if (n.type === 'object') assert.equal(n.additionalProperties, false, where);
    for (const [k, v] of Object.entries(n.properties ?? {})) walk(v, `${where}.${k}`);
    for (const [k, v] of Object.entries(n.$defs ?? {})) walk(v, `${where}.$defs.${k}`);
  };
  walk(caseSchema, '$');
});

test('valid base case passes schema', () => {
  const c = base(); c.evidence = [ev('e1', 's1')];
  assert.deepEqual(validateSchema(c), []);
});

test('unsupported properties are rejected with exact paths', () => {
  const c = base(); c.extra = 1; c.sources[0].color = 'red'; c.evidence = [{ ...ev('e1', 's1'), foo: 1 }];
  c.evidence[0].links[0].note = 'x';
  assert.deepEqual(paths(c).sort(), ['$.evidence[0].foo', '$.evidence[0].links[0].note', '$.extra', '$.sources[0].color']);
  assert.equal(msgFor(c, '$.extra'), 'unsupported property');
});

test('required fields and types produce path-specific messages', () => {
  const c = base(); delete c.title; c.claims = 'x'; c.sources = [{ id: 5, name: [] }];
  assert.equal(msgFor(c, '$.title'), 'is required');
  assert.equal(msgFor(c, '$.claims'), 'must be of type array');
  assert.equal(msgFor(c, '$.sources[0].id'), 'must be of type string');
  assert.equal(msgFor(c, '$.sources[0].name'), 'must be of type string');
});

test('schema rejects unsafe identifiers', () => {
  for (const bad of ['', 'a b', 'a/b', '../x', 'a\n', 'x'.repeat(65), 'аbc' /* Cyrillic a */, 'id;drop', '<s>']) {
    const c = base(); c.sources[0].id = bad;
    assert.ok(paths(c).includes('$.sources[0].id'), JSON.stringify(bad));
  }
});

test('schema rejects out-of-range strength and bad stance/hash', () => {
  const c = base(); c.evidence = [ev('e1', 's1', 'maybe', 1.0001, { sha256: 'ABC' })];
  assert.deepEqual(paths(c).sort(), ['$.evidence[0].links[0].stance', '$.evidence[0].links[0].strength', '$.evidence[0].sha256']);
});

test('validateSchema refuses schemas using unsupported keywords (strictness of the validator itself)', () => {
  assert.throws(() => validateSchema(1, { type: 'number', multipleOf: 2 }), /unsupported keyword "multipleOf"/);
  assert.throws(() => validateSchema({}, { $ref: '#/$defs/missing', $defs: {} }), /unresolvable/);
});

test('schema issues and semantic issues are merged, one per path, within cap', () => {
  const c = base(); c.extra = 1; c.evidence = [ev('e1', 'nope')];
  try { validateCase(c); assert.fail(); } catch (e) {
    assert.ok(e instanceof CaseValidationError);
    const ps = e.issues.map((i) => i.path);
    assert.ok(ps.includes('$.extra') && ps.includes('$.evidence[0].sourceId'));
    assert.equal(new Set(ps).size, ps.length);
  }
});


test('public case validation APIs reject malformed resource limits and merge partial overrides', () => {
  const c = base();
  for (const limits of [null, [], 'bad', { maxBytes: 0 }, { maxSources: -1 }, { maxEvidence: 1.5 }, { maxClaims: Number.NaN }, { maxIssues: Number.POSITIVE_INFINITY }, { maxLinksPerEvidence: Number.MAX_SAFE_INTEGER + 1 }, { maxSourcs: 10 }]) {
    assert.throws(() => validateCase(c, limits), /limits|limit/i);
    assert.throws(() => parseCaseText(JSON.stringify(c), limits), /limits|limit/i);
  }
  assert.doesNotThrow(() => validateCase(c, { maxSources: 1 }));
});

 
test('case limits reject exotic prototypes and accessors without invoking getters', () => {
  assert.throws(() => validateCase(base(), new Date()), /plain object/i);
  let invoked = false;
  const limits = Object.defineProperty({}, 'maxSources', { enumerable: true, get() { invoked = true; return 1; } });
  assert.throws(() => validateCase(base(), limits), /data property/i);
  assert.equal(invoked, false);
  const symbolLimits = { maxSources: 1, [Symbol('unexpected')]: 2 };
  assert.throws(() => validateCase(base(), symbolLimits), /unknown case limit/i);
});
