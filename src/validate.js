import { DEFAULT_LIMITS } from './limits.js';
import { validateSchema } from './schema.js';

export class CaseValidationError extends Error {
  constructor(issues) {
    super(`Invalid case: ${issues.length} issue(s)`);
    this.name = 'CaseValidationError';
    this.issues = issues;
  }
}

const ID_RE = /^[A-Za-z0-9_.-]{1,64}$/;
const SHA_RE = /^[a-f0-9]{64}$/;
const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
const STANCES = new Set(['supports', 'contradicts']);
// eslint-disable-next-line no-control-regex
const BIDI_RE = /[\u202a-\u202e\u2066-\u2069]/;
const LONE_SURROGATE_RE = /[\ud800-\udbff](?![\udc00-\udfff])|(?<![\ud800-\udbff])[\udc00-\udfff]/;
const CONTROL_RE = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

/** Parse JSON text with a size limit. Throws CaseValidationError. */
export function parseCaseText(text, limits = DEFAULT_LIMITS) {
  if (typeof text !== 'string') throw new CaseValidationError([{ path: '$', message: 'input must be text' }]);
  if (Buffer.byteLength(text, 'utf8') > limits.maxBytes) {
    throw new CaseValidationError([{ path: '$', message: `input exceeds ${limits.maxBytes} bytes` }]);
  }
  let data;
  try { data = JSON.parse(text); } catch (e) {
    throw new CaseValidationError([{ path: '$', message: `malformed JSON: ${e.message}` }]);
  }
  return validateCase(data, limits);
}

/**
 * Validate a parsed case; returns the (unchanged) case or throws.
 * Order: (1) forbidden-key scan, (2) JSON Schema (structure, types, limits,
 * safe ids, unsupported properties), (3) semantic checks (unique ids,
 * reference integrity, derivation cycles/depth, caller-supplied limits).
 * Issues are merged; the first issue reported for a path wins.
 */
export function validateCase(data, limits = DEFAULT_LIMITS) {
  if (!isObj(data)) throw new CaseValidationError([{ path: '$', message: 'case must be an object' }]);
  const merged = [];
  const seen = new Set();
  const push = (list) => { for (const i of list) { if (!seen.has(i.path) && merged.length < limits.maxIssues) { seen.add(i.path); merged.push(i); } } };
  const keyIssues = [];
  scanKeys(data, '$', (path, message) => keyIssues.push({ path, message }), 0);
  push(keyIssues);
  push(validateSchema(data, undefined, { maxIssues: limits.maxIssues }));
  push(semanticIssues(data, limits));
  if (merged.length) throw new CaseValidationError(merged);
  return data;
}

function semanticIssues(data, limits) {
  const issues = [];
  const add = (path, message) => { if (issues.length < limits.maxIssues) issues.push({ path, message }); };

  if (data.schemaVersion !== '1.0') add('$.schemaVersion', 'must be "1.0"');
  str(data.caseId, '$.caseId', add, limits, true, ID_RE);
  str(data.title, '$.title', add, limits, true);

  const arr = (name, max) => {
    const v = data[name];
    if (!Array.isArray(v)) { add(`$.${name}`, 'must be an array'); return []; }
    if (v.length > max) { add(`$.${name}`, `exceeds limit of ${max} items`); return []; }
    return v;
  };
  const sources = arr('sources', limits.maxSources);
  const evidence = arr('evidence', limits.maxEvidence);
  const claims = arr('claims', limits.maxClaims);

  const sourceIds = new Set(), claimIds = new Set(), evidenceIds = new Set();

  sources.forEach((s, i) => {
    const p = `$.sources[${i}]`;
    if (!isObj(s)) return add(p, 'must be an object');
    if (str(s.id, `${p}.id`, add, limits, true, ID_RE)) {
      if (sourceIds.has(s.id)) add(`${p}.id`, `duplicate source id "${s.id}"`);
      sourceIds.add(s.id);
    }
    str(s.name, `${p}.name`, add, limits, true);
    if (s.originGroup !== undefined) str(s.originGroup, `${p}.originGroup`, add, limits, true, ID_RE);
    if (s.derivedFrom !== undefined) {
      if (!Array.isArray(s.derivedFrom) || s.derivedFrom.length > limits.maxLinksPerEvidence) add(`${p}.derivedFrom`, 'must be an array within limits');
      else s.derivedFrom.forEach((d, j) => str(d, `${p}.derivedFrom[${j}]`, add, limits, true, ID_RE));
    }
  });
  sources.forEach((s, i) => {
    if (isObj(s) && Array.isArray(s.derivedFrom)) {
      s.derivedFrom.forEach((d, j) => {
        if (typeof d === 'string' && !sourceIds.has(d)) add(`$.sources[${i}].derivedFrom[${j}]`, `unknown source "${d}"`);
      });
    }
  });
  if (issues.length === 0) checkDerivation(sources, limits, add);

  claims.forEach((c, i) => {
    const p = `$.claims[${i}]`;
    if (!isObj(c)) return add(p, 'must be an object');
    if (str(c.id, `${p}.id`, add, limits, true, ID_RE)) {
      if (claimIds.has(c.id)) add(`${p}.id`, `duplicate claim id "${c.id}"`);
      claimIds.add(c.id);
    }
    str(c.statement, `${p}.statement`, add, limits, true);
  });

  evidence.forEach((e, i) => {
    const p = `$.evidence[${i}]`;
    if (!isObj(e)) return add(p, 'must be an object');
    if (str(e.id, `${p}.id`, add, limits, true, ID_RE)) {
      if (evidenceIds.has(e.id)) add(`${p}.id`, `duplicate evidence id "${e.id}"`);
      evidenceIds.add(e.id);
    }
    if (str(e.sourceId, `${p}.sourceId`, add, limits, true, ID_RE) && !sourceIds.has(e.sourceId)) add(`${p}.sourceId`, `unknown source "${e.sourceId}"`);
    str(e.description, `${p}.description`, add, limits, true);
    if (e.sha256 !== undefined && !(typeof e.sha256 === 'string' && SHA_RE.test(e.sha256))) add(`${p}.sha256`, 'must be 64 lowercase hex chars');
    if (!Array.isArray(e.links) || e.links.length > limits.maxLinksPerEvidence) return add(`${p}.links`, 'must be an array within limits');
    e.links.forEach((l, j) => {
      const lp = `${p}.links[${j}]`;
      if (!isObj(l)) return add(lp, 'must be an object');
      if (str(l.claimId, `${lp}.claimId`, add, limits, true, ID_RE) && !claimIds.has(l.claimId)) add(`${lp}.claimId`, `unknown claim "${l.claimId}"`);
      if (!STANCES.has(l.stance)) add(`${lp}.stance`, 'must be "supports" or "contradicts"');
      if (typeof l.strength !== 'number' || !Number.isFinite(l.strength) || l.strength < 0 || l.strength > 1) add(`${lp}.strength`, 'must be a number in [0,1]');
    });
  });

  return issues;
}

function str(v, path, add, limits, required, re) {
  if (typeof v !== 'string' || (required && v.length === 0)) { add(path, 'must be a non-empty string'); return false; }
  if (v.length > limits.maxStringLength) { add(path, `exceeds ${limits.maxStringLength} characters`); return false; }
  if (CONTROL_RE.test(v)) { add(path, 'contains control characters'); return false; }
  if (BIDI_RE.test(v)) { add(path, 'contains bidirectional control characters'); return false; }
  if (LONE_SURROGATE_RE.test(v)) { add(path, 'contains unpaired surrogate code units'); return false; }
  if (re && !re.test(v)) { add(path, `does not match ${re}`); return false; }
  return true;
}

function scanKeys(v, path, add, depth) {
  if (depth > 20) return add(path, 'nesting too deep');
  if (Array.isArray(v)) return v.forEach((x, i) => scanKeys(x, `${path}[${i}]`, add, depth + 1));
  if (isObj(v)) for (const k of Object.keys(v)) {
    if (FORBIDDEN_KEYS.has(k)) add(`${path}.${k}`, 'forbidden key');
    else scanKeys(v[k], `${path}.${k}`, add, depth + 1);
  }
}

function checkDerivation(sources, limits, add) {
  const byId = new Map(sources.map((s) => [s.id, s]));
  const state = new Map(); // 1=visiting 2=done
  const depth = new Map();
  const visit = (id) => {
    if (state.get(id) === 2) return depth.get(id);
    if (state.get(id) === 1) { add('$.sources', `derivation cycle involving "${id}"`); return 0; }
    state.set(id, 1);
    let d = 0;
    for (const p of byId.get(id).derivedFrom ?? []) d = Math.max(d, 1 + visit(p));
    if (d > limits.maxDerivationDepth) add('$.sources', `derivation depth exceeds ${limits.maxDerivationDepth} at "${id}"`);
    state.set(id, 2); depth.set(id, d);
    return d;
  };
  for (const s of sources) visit(s.id);
}
