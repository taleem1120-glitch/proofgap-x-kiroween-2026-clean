import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildCaseFromRows,serializeCase } from '../tools/case-builder-core.js';
import { validateCase } from '../src/validate.js';
import { analyzeCase } from '../src/analyze.js';
const template=()=>({
 caseId:'COMP-DEMO',title:'قضية افتراضية للاختبار',
 sources:[{id:'s1',name:'Primary record'},{id:'s2',name:'Forwarded screenshot',derivedFrom:'s1'},{id:'s3',name:'Independent receipt'}],
 claims:[{id:'c1',statement:'A claim about a fictional event'}],
 evidence:[{id:'e1',sourceId:'s1',claimId:'c1',description:'Original record',stance:'supports',strength:'0.8'},
 {id:'e2',sourceId:'s2',claimId:'c1',description:'Forward of record',stance:'supports',strength:'0.8'},
 {id:'e3',sourceId:'s3',claimId:'c1',description:'Independent record',stance:'supports',strength:'0.7'}]
});
test('case-builder output validates with the real schema and core engine',()=>{
 const input=template();
 const output=buildCaseFromRows(input);
 assert.equal(validateCase(output),output);
 const report=analyzeCase(output);
 assert.ok(report.claims[0].corroboration.independentSupportOrigins>=1);
 assert.equal(serializeCase(input),serializeCase(input),'deterministic export');
 assert.equal(output.evidence[0].links[0].strength,0.8);
});
test('derivatives are not independently counted as additional corroboration',()=>{
 const obj=buildCaseFromRows(template()),out=analyzeCase(obj);
 assert.equal(out.claims[0].corroboration.independentSupportOrigins,2);
 assert.equal(out.claims[0].corroboration.supportingEvidenceItems,3);
});
test('report exposes total, supporting and contradicting evidence counts without conflating them',()=>{
 const input=template();
 input.evidence[2].stance='contradicts';
 const report=analyzeCase(buildCaseFromRows(input));
 const claim=report.claims[0];
 assert.equal(report.summary.evidence,3,'case total must include all three evidence items');
 assert.equal(claim.corroboration.supportingEvidenceItems,2,'support count must include only supporting evidence');
 assert.equal(claim.corroboration.contradictingEvidenceItems,1,'contradiction count must include the opposing item');
 assert.equal(claim.decision,'conflicting');
});
test('builder rejects cycles, missing references and duplicate IDs before export',()=>{
 const a=template();a.sources[0].derivedFrom='s2';
 assert.throws(()=>buildCaseFromRows(a),/Circular/);
 const b=template();b.evidence[0].sourceId='not-present';
 assert.throws(()=>buildCaseFromRows(b),/existing source/);
 const c=template();c.sources[1].id='s1';
 assert.throws(()=>buildCaseFromRows(c),/Duplicate/);
});
test('builder rejects forged strengths, controls, unsupported IDs and excessive rows',()=>{
 const a=template();a.evidence[0].strength='Infinity';
 assert.throws(()=>buildCaseFromRows(a),/Strength/);
 const b=template();b.evidence[0].strength='';
 assert.throws(()=>buildCaseFromRows(b),/Strength/);
 const c=template();c.sources[0].id='مصدري';
 assert.throws(()=>buildCaseFromRows(c),/ID/);
 const d=template();d.claims[0].statement='safe\u202e deceptive';
 assert.throws(()=>buildCaseFromRows(d),/statement/);
});
test('browser authoring tool remains entirely local with a restrictive CSP',()=>{
 const html=readFileSync(new URL('../tools/case-builder.html',import.meta.url),'utf8');
 const ui=readFileSync(new URL('../tools/case-builder-ui.js',import.meta.url),'utf8');
 assert.match(html,/connect-src 'none'/);
 assert.match(html,/script type="module" src="case-builder-ui.js"/);
 assert.doesNotMatch(ui,/fetch\(|XMLHttpRequest|innerHTML|eval\(/);
});

test('case builder rejects lone Unicode surrogate units before hashing or exporting',()=>{
 const malformed=template();
 malformed.claims[0].statement='report with unpaired '+String.fromCharCode(0xd800)+' code unit';
 assert.throws(()=>buildCaseFromRows(malformed),/Claim statement required/);
 const valid=template();valid.title='ملف عربي مع رمز صالح 😀';
 assert.equal(validateCase(buildCaseFromRows(valid)).caseId,'COMP-DEMO');
});
