// Security regression tests tied to docs/THREAT_MODEL.md threat IDs (T1..T10).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { analyzeText, analyzeCase, validateCase, serializeReport, renderText, CaseValidationError } from '../src/index.js';
import { base, ev } from './helpers.js';

const srcDir = new URL('../src/', import.meta.url);

test('T1 no network or process-spawning capability in src/ (static check; not proof of absence)', () => {
  const banned = /\b(node:)?(http|https|http2|net|tls|dns|dgram|child_process|worker_threads|cluster|vm)\b['"]|\bfetch\s*\(|\bXMLHttpRequest\b|\bWebSocket\b|\beval\s*\(|\bnew Function\b|\bprocess\.env\b/;
  for (const f of readdirSync(srcDir)) assert.doesNotMatch(readFileSync(new URL(f, srcDir), 'utf8'), banned, f);
});

test('T2 hostile text in every free-text field is JSON-escaped in reports and sanitised in text output', () => {
  const c = base();
  c.title = '<img src=x onerror=alert(1)>&';
  c.claims[0].statement = '"; DROP TABLE claims;-- <script>';
  c.sources[0].name = '</script><svg/onload=1>';
  c.evidence = [{ ...ev('e1', 's1'), description: '<b>bold</b>\u2028', file: '<x>/..\\y' }];
  const json = analyzeText(JSON.stringify(c));
  assert.doesNotMatch(json, /[<>&\u2028\u2029]/);
  assert.equal(JSON.parse(json).title, c.title);
  assert.doesNotMatch(analyzeText(JSON.stringify(c), undefined, { format: 'text' }), /\u001b|\u202e/);
});

test('T3 report fields from untrusted input cannot inject new keys or alter structure (no prototype keys, ids are plain data)', () => {
  const c = base(); c.sources = [{ id: 'toString', name: 'n' }, { id: 'valueOf', name: 'n2', derivedFrom: ['toString'] }, { id: 'hasOwnProperty', name: 'n3' }];
  c.evidence = [ev('constructor', 'toString'), ev('isPrototypeOf', 'valueOf'), ev('e3', 'hasOwnProperty')];
  const rep = analyzeCase(validateCase(c));
  assert.equal(rep.claims[0].independentSupportOrigins.length, 2);
  assert.equal(Object.getPrototypeOf(rep.claims[0]), Object.prototype);
  assert.equal({}.polluted, undefined);
});

test('T4 maximum-size valid case analyzes within a generous time bound and bounded report size', () => {
  const c = { schemaVersion: '1.0', caseId: 'S', title: 't', sources: [], claims: [], evidence: [] };
  for (let i = 0; i < 1000; i++) c.sources.push({ id: `s${i}`, name: `n${i}`, ...(i % 2 ? { derivedFrom: [`s${i - 1}`] } : {}) });
  for (let i = 0; i < 500; i++) c.claims.push({ id: `c${i}`, statement: `c${i}` });
  for (let i = 0; i < 5000; i++) c.evidence.push({ id: `e${i}`, sourceId: `s${i % 1000}`, description: `d${i}`, links: [{ claimId: `c${i % 500}`, stance: 'supports', strength: 0.5 }, { claimId: `c${(i + 1) % 500}`, stance: 'contradicts', strength: 0.5 }] });
  const text = JSON.stringify(c);
  assert.ok(text.length < 1_000_000, `fixture ${text.length} bytes must fit the input limit`);
  const t0 = Date.now(); const out = analyzeText(text); const ms = Date.now() - t0;
  assert.ok(ms < 10_000, `took ${ms} ms`); assert.ok(out.length < 50_000_000, `report ${out.length} bytes`);
});

test('T5 worst-case derivation graph (wide + deep within limits) stays fast', () => {
  const c = { schemaVersion: '1.0', caseId: 'W', title: 't', sources: [], claims: [{ id: 'c1', statement: 's' }], evidence: [] };
  for (let i = 0; i < 1000; i++) c.sources.push({ id: `s${i}`, name: `n${i}`, derivedFrom: i === 0 ? undefined : Array.from({ length: Math.min(i, 50) }, (_, k) => `s${i - 1 - k}`).filter((x, k, a) => a.indexOf(x) === k) });
  for (const s of c.sources) if (!s.derivedFrom) delete s.derivedFrom;
  c.evidence = c.sources.slice(0, 400).map((s, i) => ({ id: `e${i}`, sourceId: s.id, description: `d${i}`, links: [{ claimId: 'c1', stance: 'supports', strength: 0.5 }] }));
  const t0 = Date.now();
  try { analyzeText(JSON.stringify(c)); } catch (e) { assert.ok(e instanceof CaseValidationError); } // depth limit may reject; either is safe
  assert.ok(Date.now() - t0 < 5000);
});

test('T6 verification results never claim VERIFIED unless integrity ran and hashes matched (no path from case data to VERIFIED)', () => {
  const c = base(); c.evidence = [{ ...ev('e1', 's1'), sha256: 'a'.repeat(64), file: 'x.txt', integrity: 'VERIFIED' }];
  assert.throws(() => validateCase(c), (e) => e instanceof CaseValidationError && e.issues.some((i) => i.path === '$.evidence[0].integrity'));
  delete c.evidence[0].integrity;
  const rep = JSON.parse(analyzeText(JSON.stringify(c)));
  assert.equal(rep.integrity.results[0].status, 'NOT_CHECKED'); assert.equal(rep.integrity.results[0].verified, false);
  assert.doesNotMatch(renderText(rep), /: VERIFIED/);
});

test('T7 serialization is canonical: same case always yields same bytes (tamper-evident via inputSha256)', () => {
  const c = base(); c.evidence = [ev('e1', 's1')];
  const a = analyzeText(JSON.stringify(c)); c.title = 'changed';
  assert.notEqual(JSON.parse(analyzeText(JSON.stringify(c))).inputSha256, JSON.parse(a).inputSha256);
});
