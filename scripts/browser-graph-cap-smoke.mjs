import {chromium} from 'playwright';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
import {validateCase} from '../src/validate.js';
import {analyzeCase} from '../src/analyze.js';
import {renderHtml} from '../src/html.js';
import {serializeReport} from '../src/report.js';
const n=120;
const obj={schemaVersion:'1.0',caseId:'BROWSER-GRAPH-CAP',title:'Synthetic load case',claims:[{id:'c',statement:'Fictional event'}],
 sources:Array.from({length:n},(_,i)=>({id:'s'+i,name:'Synthetic distinct source '+i})),
 evidence:Array.from({length:n},(_,i)=>({id:'e'+i,sourceId:'s'+i,description:'Document '+i,links:[{claimId:'c',stance:'supports',strength:.7}]}))};
const report=analyzeCase(validateCase(obj)),omitted=n*(n-1)/2-2000;
assert.equal(report.graph.omittedUnknownEdges,omitted);
assert.equal(report.claims[0].corroboration.independentSupportOrigins,n);
const temp=mkdtempSync(join(tmpdir(),'pg-graph-browser-'));
const file=join(temp,'report.html');writeFileSync(file,renderHtml([serializeReport(report)]));
const browser=await chromium.launch();
try {
 const page=await browser.newPage({viewport:{width:411,height:914}});
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('file://'+file);
 const note=page.locator('p.note[role=note]');
 assert.equal(await note.count(),1);
 await page.locator('#pg-language').selectOption('ar');
 assert.ok((await note.textContent()).includes(String(omitted)),'Arabic explanation must disclose omission count');
 assert.ok((await page.locator('.panel').innerText()).includes('120'),'origin count missing');
 await page.locator('#pg-language').selectOption('en');
 assert.match(await note.textContent(),/were omitted/);
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({browser:'chromium',status:'pass',independentOrigins:n,unknownEdgesRetained:2000,unknownEdgesOmitted:omitted,originCountUnchanged:true}));
} finally {await browser.close();rmSync(temp,{recursive:true,force:true});}
