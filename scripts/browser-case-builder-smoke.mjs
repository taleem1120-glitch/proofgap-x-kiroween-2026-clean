import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFileSync,mkdirSync} from 'node:fs';
import {resolve,extname} from 'node:path';
import assert from 'node:assert/strict';
import {validateCase} from '../src/validate.js';
import {analyzeCase} from '../src/analyze.js';
import {serializeReport} from '../src/report.js';
const roots=new Map([
 ['/tools/case-builder.html','tools/case-builder.html'],
 ['/tools/case-builder-ui.js','tools/case-builder-ui.js'],
 ['/tools/case-builder-core.js','tools/case-builder-core.js'],
 ['/tools/browser-engine.bundle.js','tools/browser-engine.bundle.js']
]);
const server=createServer((req,res)=>{
 const pathname=new URL(req.url,'http://127.0.0.1').pathname;
 if(!roots.has(pathname)){res.writeHead(404);res.end();return;}
 const file=roots.get(pathname);
 res.writeHead(200,{'Content-Type':extname(file)==='.html'?'text/html; charset=utf-8':'text/javascript; charset=utf-8','Cache-Control':'no-store'});
 res.end(readFileSync(resolve(file)));
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const port=server.address().port;
const browser=await chromium.launch();
try{
 const context=await browser.newContext({viewport:{width:360,height:800},acceptDownloads:true});
 const page=await context.newPage();
 const exceptions=[];
 page.on('pageerror',e=>exceptions.push(String(e)));
 await page.goto('http://127.0.0.1:'+port+'/tools/case-builder.html');
 assert.equal(await page.locator('#sources .row').count(),1);
 await page.locator('#add-source').click();
 assert.equal(await page.locator('#sources .row').count(),2,'one tap must create exactly one source row');
 await page.locator('#sources .row').nth(1).locator('[name=name]').fill('Derived screenshot');
 await page.locator('#sources .row').nth(1).locator('[name=derivedFrom]').fill('s1');
 const downloadReady=page.waitForEvent('download');
 await page.locator('#case-form button[type=submit]').click();
 const download=await downloadReady;
 const raw=readFileSync(await download.path(),'utf8');
 const data=JSON.parse(raw);
 assert.equal(validateCase(data),data);
 assert.equal(data.sources.length,2);
 assert.equal(data.sources[1].derivedFrom[0],'s1');
 assert.equal(analyzeCase(data).claims.length,1);
 // Delayed engine loading: edit the case while an asynchronous import is pending.
 // A stale report must not become downloadable when the previous request finishes.
 let engineReleased;
 const releaseEngine=new Promise(resolve=>{engineReleased=resolve;});
 let engineRequested;
 const requestSeen=new Promise(resolve=>{engineRequested=resolve;});
 await page.route('**/tools/browser-engine.bundle.js',async route=>{
   engineRequested();
   await releaseEngine;
   await route.continue();
 });
 await page.locator('#run-analysis').click();
 await requestSeen;
 assert.equal(await page.locator('#run-analysis').isDisabled(),true,'duplicate analysis launch not blocked');
 await page.locator('#case-title').fill('Changed while analysis is loading');
 engineReleased();
 await page.waitForFunction(()=>!document.getElementById('run-analysis').disabled);
 assert.equal(await page.locator('#export-report').isDisabled(),true,'stale report was published after editing');
 assert.equal((await page.locator('#analysis-result').innerText()).trim(),'','stale result was displayed');
 await page.unroute('**/tools/browser-engine.bundle.js');
 await page.locator('#case-title').fill('قضية افتراضية — مصدر واحد وتقارير متعددة');

 assert.ok(!(await page.locator('#status').innerText()).includes('تعذر'));
 // Run the actual shared core from Chromium and download its byte-identical report.
 await page.locator('#run-analysis').click();
 await page.waitForFunction(()=>/اكتمل التحليل|تعذر تحليل القضية/.test(document.getElementById('status').textContent),{timeout:10000});
 assert.match(await page.locator('#status').innerText(),/اكتمل التحليل/);
 assert.equal(await page.locator('#export-report').isEnabled(),true);
 const caseDecision=await page.locator('#analysis-result').innerText();
 assert.match(caseDecision,/Declared independent support origins: 1/);
 const reportReady=page.waitForEvent('download');
 await page.locator('#export-report').click();
 const reportDownload=await reportReady;
 const reportText=readFileSync(await reportDownload.path(),'utf8');
 assert.equal(reportText,serializeReport(analyzeCase(data)),'browser/core hash or policy drift');
 assert.match(await page.locator('#analysis-result').innerText(),/دعم مستقل غير كافٍ|النتيجة \/ Result/);
 // A user adding then removing a source must not leave a stale downloadable report.
 await page.locator('#add-source').click();
 assert.equal(await page.locator('#export-report').isDisabled(),true);
 assert.equal(await page.locator('#sources .row').nth(2).locator('[name=id]').inputValue(),'s3');
 await page.locator('#sources .row').nth(2).locator('[data-action=remove]').click();
 assert.equal(await page.locator('#export-report').isDisabled(),true);
 await page.locator('#run-analysis').click();
 await page.waitForFunction(()=>/اكتمل التحليل|تعذر تحليل القضية/.test(document.getElementById('status').textContent));
 assert.equal(await page.locator('#export-report').isEnabled(),true);
 mkdirSync('artifacts/browser-visual-review',{recursive:true});
 await page.screenshot({path:'artifacts/browser-visual-review/mobile-end-to-end-analysis-360-ar.png',animations:'disabled',fullPage:true});
 const {w,screen}=await page.evaluate(()=>({w:document.documentElement.scrollWidth,screen:document.documentElement.clientWidth}));
 assert.ok(w<=screen+2,'builder mobile horizontal overflow '+w+'/'+screen);
 // A source cycle must not trigger any second download.
 await page.locator('#sources .row').nth(0).locator('[name=derivedFrom]').fill('s2');
 assert.equal(await page.locator('#export-report').isDisabled(),true);
 await page.locator('#case-form button[type=submit]').click();
 assert.match(await page.locator('#status').innerText(),/Circular/);
 assert.deepEqual(exceptions,[]);
 console.log(JSON.stringify({status:'pass',viewport:360,validDownload:true,validCoreInput:true,liveCoreAnalysis:true,byteIdenticalReport:true,cycleRejected:true,overflow:false,noJsErrors:true}));
 await context.close();
}finally{await browser.close();await new Promise(ok=>server.close(ok));}
