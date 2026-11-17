/**
 * ProofGap Cite: Markdown research-note parser and domain validation.
 *
 * Input format (documented in apps/proofgap-cite/README.md):
 *
 *   # Note title
 *   ## Claims
 *   - Claim text. [^r1] [^r2] [-^r3]      ([^id] supports, [-^id] contradicts)
 *   - A claim with no citation.            (reported as UNSUPPORTED)
 *   ## References                          (optional heading; definitions may appear anywhere)
 *   [^r1]: Outlet or title text {kind=primary, url=https://..., doi=10.x/y, saved=files/r1.html, cites=r2;r3}
 *
 * Nothing about a reference is trusted: kind, url, doi and cites are DECLARATIONS by the note author.
 * Different URLs never imply independence; identical URLs or DOIs never prove sameness.
 */

export class CiteValidationError extends Error {
  constructor(issues) {
    super(`Invalid note: ${issues.length} issue(s)`);
    this.name = 'CiteValidationError';
    this.issues = issues; // [{ line, message }]
  }
}

export const CITE_LIMITS = Object.freeze({
  maxBytes: 512 * 1024,
  maxLines: 20000,
  maxLineLength: 4000,
  maxClaims: 200,
  maxReferences: 500,
  maxCitationsPerClaim: 50,
  maxCitesPerReference: 50,
  maxTextLength: 2000,
  maxIssues: 100,
});

const ID = '[A-Za-z0-9_.-]{1,60}';
const ID_RE = new RegExp(`^${ID}$`);
const DEF_RE = new RegExp(`^\\\\[\\\\^(${ID})\\\\]:\\\\s*(.*)$`);
const CITE_RE = new RegExp(`\\\\[(-?)\\\\^(${ID})\\\\]`, 'g');
const ATTR_RE = /\\{([^{}]*)\\}\\s*$/;
const KINDS = new Set(['primary', 'secondary', 'unknown']);
const ATTR_KEYS = new Set(['kind', 'url', 'doi', 'saved', 'cites']);
// eslint-disable-next-line no-control-regex
const CONTROL_RE = /[\\u0000-\\u0008\\u000b\\u000c\\u000e-\\u001f\\u007f\\u202a-\\u202e\\u2066-\\u2069]/;
const FORBIDDEN_IDS = new Set(['__proto__', 'constructor', 'prototype']);

function normalizeCiteLimits(limits = CITE_LIMITS) {
  if (limits === null || typeof limits !== 'object' || Array.isArray(limits)) throw new TypeError('limits must be a plain object');
  const proto = Object.getPrototypeOf(limits);
  if (proto !== Object.prototype && proto !== null) throw new TypeError('limits must be a plain object');
  const normalized = { ...CITE_LIMITS };
  const allowed = new Set(Object.keys(CITE_LIMITS));
  for (const key of Reflect.ownKeys(limits)) {
    if (typeof key !== 'string' || !allowed.has(key)) throw new TypeError('unknown Cite limit: ' + String(key));
    const descriptor = Object.getOwnPropertyDescriptor(limits, key);
    if (!descriptor || !Object.hasOwn(descriptor, 'value')) throw new TypeError('limits.' + key + ' must be a data property');
    normalized[key] = descriptor.value;
  }
  for (const [key, value] of Object.entries(normalized)) if (!Number.isSafeInteger(value) || value < 1) throw new TypeError('limits.' + key + ' must be a positive safe integer');
  return normalized;
}

/** Normalise an identifier for the SAME-IDENTIFIER heuristic only (never for trust). */
export function normalizeUrl(u) {
  try {
    const x = new URL(u);
    if (!['http:', 'https:'].includes(x.protocol)) return null;
    const host = x.hostname.toLowerCase().replace(/^www\\./, '');
    const path = x.pathname.replace(/\\/+$/, '') || '/';
    return `${host}${path}`; // query and fragment dropped (tracking parameters)
  } catch { return null; }
}
export const normalizeDoi = (d) => (/^10\\.\\d{4,9}\\/\\S+$/i.test(d) ? d.toLowerCase() : null);

/**
 * @param {string} text Markdown note
 * @returns {{ title: string, claims: Array, references: Map, notes: Array }}
 */
export function parseNote(text, limits = CITE_LIMITS) {
  limits = normalizeCiteLimits(limits);
  const issues = [];
  const add = (line, message) => { if (issues.length < limits.maxIssues) issues.push({ line, message }); };
  if (typeof text !== 'string') throw new CiteValidationError([{ line: 0, message: 'note must be text' }]);
  if (Buffer.byteLength(text, 'utf8') > limits.maxBytes) throw new CiteValidationError([{ line: 0, message: `note exceeds ${limits.maxBytes} bytes` }]);
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const lines = text.split(/\\r?\\n/);
  if (lines.length > limits.maxLines) throw new CiteValidationError([{ line: 0, message: `note exceeds ${limits.maxLines} lines` }]);

  let title = null, inFence = false, section = null, sawClaims = false;
  const claims = [], references = new Map();
  lines.forEach((raw, i) => {
    const ln = i + 1;
    if (raw.length > limits.maxLineLength) { add(ln, `line exceeds ${limits.maxLineLength} characters`); return; }
    if (/^\\s*(```|~~~)/.test(raw)) { inFence = !inFence; return; }
    if (inFence) return;
    if (CONTROL_RE.test(raw)) { add(ln, 'line contains control or bidirectional characters'); return; }
    const h = /^(#{1,6})\\s+(.*?)\\s*#*\\s*$/.exec(raw);
    if (h) {
      if (h[1].length === 1 && title === null) title = h[2];
      section = h[2].trim().toLowerCase();
      if (section === 'claims') sawClaims = true;
      return;
    }
    const def = DEF_RE.exec(raw);
    if (def) {
      const [, id, rest] = def;
      if (FORBIDDEN_IDS.has(id)) { add(ln, `reference id "${id}" is not allowed`); return; }
      if (references.has(id)) { add(ln, `duplicate reference [^${id}] (first defined on line ${references.get(id).line})`); return; }
      if (references.size >= limits.maxReferences) { add(ln, `more than ${limits.maxReferences} references`); return; }
      const ref = { id, line: ln, label: rest, kind: 'unknown', kindDeclared: false, url: null, doi: null, saved: null, cites: [] };
      const am = ATTR_RE.exec(rest);
      if (am) {
        ref.label = rest.slice(0, am.index).trim();
        for (const part of am[1].split(',').map((x) => x.trim()).filter(Boolean)) {
          const eq = part.indexOf('=');
          if (eq < 1) { add(ln, `malformed attribute "${part}" (expected key=value)`); continue; }
          const k = part.slice(0, eq).trim(), v = part.slice(eq + 1).trim();
          if (!ATTR_KEYS.has(k)) { add(ln, `unknown attribute "${k}" (allowed: ${[...ATTR_KEYS].join(', ')})`); continue; }
          if (!v) { add(ln, `attribute "${k}" is empty`); continue; }
          if (k === 'kind') { if (!KINDS.has(v)) add(ln, 'kind must be primary, secondary or unknown'); else { ref.kind = v; ref.kindDeclared = true; } }
          else if (k === 'cites') {
            const ids = v.split(';').map((x) => x.trim()).filter(Boolean);
            if (ids.length > limits.maxCitesPerReference) add(ln, `cites more than ${limits.maxCitesPerReference} references`);
            for (const c of ids) { if (!ID_RE.test(c)) add(ln, `cites: invalid reference id "${c}"`); else if (!ref.cites.includes(c)) ref.cites.push(c); }
          } else if (k === 'url') { if (normalizeUrl(v) === null) add(ln, 'url must be an http(s) URL'); else ref.url = v; }
          else if (k === 'doi') { if (normalizeDoi(v) === null) add(ln, 'doi must look like 10.NNNN/suffix'); else ref.doi = v; }
          else ref.saved = v; // path safety is enforced by the core when files are verified
        }
      }
      if (!ref.label) add(ln, 'reference needs a label (outlet or title)');
      else if (ref.label.length > limits.maxTextLength) add(ln, `reference label exceeds ${limits.maxTextLength} characters`);
      references.set(id, ref);
      return;
    }
    const item = /^\\s*(?:[-*+]|\\d+[.)])\\s+(.*)$/.exec(raw);
    if (item && section === 'claims') {
      if (claims.length >= limits.maxClaims) { add(ln, `more than ${limits.maxClaims} claims`); return; }
      const body = item[1];
      const cites = [];
      for (const m of body.matchAll(CITE_RE)) {
        const stance = m[1] === '-' ? 'contradicts' : 'supports';
        if (!cites.some((c) => c.id === m[2] && c.stance === stance)) cites.push({ id: m[2], stance });
      }
      const statement = body.replace(CITE_RE, '').replace(/\\s+/g, ' ').trim();
      if (!statement) { add(ln, 'claim has no text'); return; }
      if (statement.length > limits.maxTextLength) { add(ln, `claim exceeds ${limits.maxTextLength} characters`); return; }
      if (cites.length > limits.maxCitationsPerClaim) { add(ln, `claim has more than ${limits.maxCitationsPerClaim} citations`); return; }
      claims.push({ id: `c${claims.length + 1}`, line: ln, statement, cites });
    }
  });
  if (inFence) add(lines.length, 'unclosed code fence');
  if (!sawClaims) add(0, 'note has no "## Claims" section');
  else if (claims.length === 0) add(0, 'the "## Claims" section has no list items');

  for (const c of claims) for (const ct of c.cites) if (!references.has(ct.id)) add(c.line, `citation [^${ct.id}] has no reference definition`);
  for (const r of references.values()) for (const t of r.cites) {
    if (!references.has(t)) add(r.line, `[^${r.id}] cites [^${t}], which is not defined`);
  }
  if (issues.length) throw new CiteValidationError(issues.sort((a, b) => a.line - b.line));
  const used = new Set(claims.flatMap((c) => c.cites.map((x) => x.id)));
  const notes = [...references.values()].filter((r) => !used.has(r.id) && ![...references.values()].some((o) => o.cites.includes(r.id)))
    .map((r) => ({ code: 'UNUSED_REFERENCE', line: r.line, refs: [r.id], message: `[^${r.id}] is defined but never cited by a claim or another reference.` }));
  return { title: title ?? 'Untitled note', claims, references, notes };
}
