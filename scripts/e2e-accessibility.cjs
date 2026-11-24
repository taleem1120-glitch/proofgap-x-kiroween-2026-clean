'use strict';

const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium, firefox, webkit } = require('playwright');
const AxeBuilder = require('@axe-core/playwright').default;

const browserName = process.env.PW_BROWSER || 'chromium';
const browserType = { chromium, firefox, webkit }[browserName];
if (!browserType) throw new Error('Unsupported PW_BROWSER: ' + browserName);

const root = path.resolve(__dirname, '..');
const mime = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8', '.svg':'image/svg+xml' };
const server = http.createServer((req, res) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname); }
  catch { res.writeHead(400).end('Bad request'); return; }
  const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\\/+/, '');
  const target = path.resolve(root, relative);
  if (target !== root && !target.startsWith(root + path.sep)) { res.writeHead(403).end('Forbidden'); return; }
  fs.readFile(target, (error, data) => {
    if (error) { res.writeHead(404).end('Not found'); return; }
    res.writeHead(200, { 'content-type': mime[path.extname(target)] || 'application/octet-stream', 'x-content-type-options':'nosniff' });
    res.end(data);
  });
});

const pages = [
  { name:'home', path:'/' },
  { name:'proofgap-x-report', path:'/viewer/showcase.html' },
  { name:'proofgap-cite-report', path:'/apps/proofgap-cite/showcase.html' },
  { name:'case-builder', path:'/tools/case-builder.html' },
];

(async () => {
  await new Promise(resolve => server.listen(4174, '127.0.0.1', resolve));
  const browser = await browserType.launch({ headless:true });
  const findings = [];
  try {
    for (const spec of pages) {
      const page = await browser.newPage({ viewport:{width:1280,height:900} });
      await page.goto('http://127.0.0.1:4174' + spec.path, { waitUntil:'networkidle' });
      const metadata = await page.evaluate(() => ({
        title: document.title,
        lang: document.documentElement.getAttribute('lang'),
        mainCount: document.querySelectorAll('main').length,
        duplicateIds: [...document.querySelectorAll('[id]')].map(x=>x.id).filter((id,i,a)=>a.indexOf(id)!==i),
        unlabeledControls: [...document.querySelectorAll('input:not([type=hidden]),select,textarea')].filter(x =>
          !x.labels?.length && !x.getAttribute('aria-label') && !x.getAttribute('aria-labelledby')).map(x=>x.outerHTML.slice(0,180)),
        unnamedButtons: [...document.querySelectorAll('button,[role=button]')].filter(x =>
          !((x.innerText||'').trim()) && !x.getAttribute('aria-label') && !x.getAttribute('aria-labelledby') && !x.getAttribute('title')).map(x=>x.outerHTML.slice(0,180)),
        unnamedLinks: [...document.querySelectorAll('a[href]')].filter(x =>
          !((x.innerText||'').trim()) && !x.getAttribute('aria-label') && !x.getAttribute('aria-labelledby') && !x.querySelector('img[alt],svg[aria-label],svg title')).map(x=>x.outerHTML.slice(0,180)),
        missingImageAlt: [...document.querySelectorAll('img:not([alt])')].map(x=>x.outerHTML.slice(0,180)),
        invalidAriaRefs: [...document.querySelectorAll('[aria-labelledby],[aria-describedby]')].flatMap(x =>
          ['aria-labelledby','aria-describedby'].flatMap(a => (x.getAttribute(a)||'').split(/\\s+/).filter(Boolean).filter(id=>!document.getElementById(id)).map(id=>a+':'+id))),
      }));
      if (!metadata.title || !metadata.lang || metadata.mainCount < 1) findings.push({page:spec.name,kind:'page-landmarks',metadata});
      for (const key of ['duplicateIds','unlabeledControls','unnamedButtons','unnamedLinks','missingImageAlt','invalidAriaRefs']) {
        if (metadata[key].length) findings.push({page:spec.name,kind:key,items:metadata[key]});
      }
      const axe = await new AxeBuilder({ page })
        .withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','best-practice'])
        .analyze();
      for (const v of axe.violations) findings.push({
        page:spec.name,kind:'axe:'+v.id,impact:v.impact,help:v.help,
        helpUrl:v.helpUrl,nodes:v.nodes.slice(0,8).map(n=>({target:n.target,summary:n.failureSummary}))
      });
      await page.close();
    }
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }

  const blockers = findings.filter(x => x.impact === 'critical' || x.impact === 'serious' || !x.impact);
  const advisory = findings.filter(x => x.impact === 'moderate' || x.impact === 'minor');
  console.log(JSON.stringify({browser:browserName,pages:pages.map(x=>x.name),wcagTags:['wcag2a','wcag2aa','wcag21a','wcag21aa','best-practice'],blockers:blockers.length,advisory:advisory.length,findings},null,2));
  if (blockers.length) process.exitCode = 1;
})();
