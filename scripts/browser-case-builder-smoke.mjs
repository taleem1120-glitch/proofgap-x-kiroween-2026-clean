import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFileSync} from 'node:fs';
import {resolve,extname} from 'node:path';
import assert from 'node:assert/strict';
import {validateCase} from '../src/validate.js';
import {analyzeCase} from '../src/analyze.js';
const roots=new Map([
 ['/tools/case-builder.html','tools/case-builder.html'],
 ['/tools/case-builder-ui.js','tools/case-builder-ui.js'],
 ['/tools/case-builder-core.js','tools/case-builder-core.js']
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
 assert.ok(!(await page.locator('#status').innerText()).includes('تعذر'));
 const {w,screen}=await page.evaluate(()=>({w:document.documentElement.scrollWidth,screen:document.documentElement.clientWidth}));
 assert.ok(w<=screen+2,'builder mobile horizontal overflow '+w+'/'+screen);
 // A source cycle must not trigger any second download.
 await page.locator('#sources .row').nth(0).locator('[name=derivedFrom]').fill('s2');
 await page.locator('#case-form button[type=submit]').click();
 assert.match(await page.locator('#status').innerText(),/Circular/);
 assert.deepEqual(exceptions,[]);
 console.log(JSON.stringify({status:'pass',viewport:360,validDownload:true,validCoreInput:true,cycleRejected:true,overflow:false,noJsErrors:true}));
 await context.close();
}finally{await browser.close();await new Promise(ok=>server.close(ok));}
