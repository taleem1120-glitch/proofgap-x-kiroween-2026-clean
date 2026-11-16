import test from 'node:test';
import assert from 'node:assert/strict';
import {analyzeCase} from '../src/analyze.js';
import {serializeReport} from '../src/report.js';
import {buildCaseFromRows} from '../tools/case-builder-core.js';
import {analyzeBuilderRows} from '../tools/browser-engine.bundle.js';
const sample=()=>({
 caseId:'CASE-1',title:'Multilingual synthetic evidence / أدلة افتراضية',
 sources:[{id:'s1',name:'Original data'},{id:'s2',name:'Copied summary',derivedFrom:'s1'},{id:'s3',name:'Independent transaction'}],
 claims:[{id:'c1',statement:'An invented transaction occurred'}],
 evidence:[{id:'e1',sourceId:'s1',claimId:'c1',description:'Original record',stance:'supports',strength:'0.8'},
 {id:'e2',sourceId:'s2',claimId:'c1',description:'Summary copy',stance:'supports',strength:'0.9'},
 {id:'e3',sourceId:'s3',claimId:'c1',description:'Independent receipt',stance:'supports',strength:'0.7'}]
});
test('browser bundle runs EXACT original classification and canonical hash',()=>{
 const input=sample(),native=analyzeCase(buildCaseFromRows(input)),browser=analyzeBuilderRows(input);
 assert.deepEqual(browser.report,native);
 assert.equal(browser.reportText,serializeReport(native));
 assert.equal(browser.report.claims[0].corroboration.independentSupportOrigins,2);
});
test('corroboration never increases by adding declared copies in browser policy',()=>{
 const input=sample(),original=analyzeBuilderRows(input).report;
 input.sources.push({id:'s4',name:'Derivative',derivedFrom:'s1'});
 input.evidence.push({id:'e4',sourceId:'s4',claimId:'c1',description:'Copy of original',stance:'supports',strength:'1'});
 const after=analyzeBuilderRows(input).report;
 assert.equal(after.claims[0].corroboration.independentSupportOrigins,original.claims[0].corroboration.independentSupportOrigins);
});
