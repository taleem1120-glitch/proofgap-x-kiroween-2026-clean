// Browser-level smoke checks: rendered DOM, mobile geometry, RTL, and byte-identical JSON download.
// Run with an explicitly installed Playwright Chromium in the CI environment.
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
const browser = await chromium.launch({headless:true});
const pages=[
  'viewer/showcase.html',
  'apps/proofgap-cite/showcase.html'
];
const all=[];
try {
 for(const file of pages) {
  for(const viewport of [{width:360,height:800},{width:411,height:914},{width:1280,height:900}]) {
   const context=await browser.newContext({viewport,acceptDownloads:true,locale:'en-US'});
   const page=await context.newPage();
   const errors=[];
   page.on('pageerror',err=>errors.push(String(err)));
   await page.goto('file://'+resolve(file));
   const reports=page.locator('.panel');
   const count=await reports.count();
   assert.ok(count>=1, file+' no reports rendered');
   const sourceJson=await page.locator('script[type="application/json"].pgx-report').first().textContent();
   const report=JSON.parse(sourceJson);
   const key=report.caseId;
   assert.ok((await page.locator('.panel').first().innerText()).includes(key),file+' report identity absent');
   const language=page.locator('#pg-language');
   const codes=['en','ar','fr','es','de','pt','tr','fa','hi','zh'];
   for (const code of codes) {
     await language.selectOption(code);
     assert.equal(await page.locator('html').getAttribute('lang'),code);
     assert.equal(await page.locator('html').getAttribute('dir'),['ar','fa'].includes(code)?'rtl':'ltr');
     assert.equal(await reports.count(),count,'switching '+code+' lost report');
     assert.ok((await page.locator('.panel').first().innerText()).includes(key),'case ID changed in '+code);
     assert.ok((await page.locator('#pg-translation-scope').innerText()).trim().length>20);
     const {scrollWidth,clientWidth}=await page.evaluate(()=>({
       scrollWidth:document.documentElement.scrollWidth,
       clientWidth:document.documentElement.clientWidth
     }));
     if (scrollWidth>clientWidth+2)
       throw new Error(file+' '+code+' body overflows at '+viewport.width+': '+scrollWidth+'/'+clientWidth);
   }
   await language.selectOption('ar');
   assert.match(await page.locator('#pg-translation-scope').innerText(),/الواجهة/);
   assert.equal(await page.locator('.graphwrap').count(),count);
   const downloaded=page.waitForEvent('download');
   await page.locator('.panel').first().getByRole('button').click();
   const download=await downloaded;
   const filename=download.suggestedFilename();
   assert.ok(filename.endsWith('.proofgap-report.json'));
   const downloadBytes=readFileSync(await download.path(),'utf8');
   assert.deepEqual(JSON.parse(downloadBytes),report,'exported JSON changed with localization');
   assert.equal(downloadBytes,sourceJson.trim()+'\n','raw JSON bytes differ from original embedded report');
   await language.selectOption('en');
   assert.equal(await page.locator('html').getAttribute('dir'),'ltr');
   assert.ok(errors.length===0,file+' page JS errors '+errors.join('; '));
   all.push({file,viewport:viewport.width,panels:count,languagesChecked:codes.length,rtlPassed:true,bodyOverflow:false,jsonStable:true});
   await context.close();
  }
 }
 console.log(JSON.stringify({kind:'headless_browser_smoke_not_human_review',passed:all.length,scenarios:all},null,2));
} finally { await browser.close(); }
