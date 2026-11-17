'use strict';

const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium, devices } = require('playwright');

const root = path.resolve(__dirname, '..');
const mime = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8', '.svg':'image/svg+xml' };
const server = http.createServer((req, res) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname); }
  catch { res.writeHead(400).end('Bad request'); return; }
  const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const target = path.resolve(root, relative);
  if (target !== root && !target.startsWith(root + path.sep)) { res.writeHead(403).end('Forbidden'); return; }
  fs.readFile(target, (error, data) => {
    if (error) { res.writeHead(404).end('Not found'); return; }
    res.writeHead(200, { 'content-type': mime[path.extname(target)] || 'application/octet-stream', 'x-content-type-options':'nosniff' });
    res.end(data);
  });
});

const pages = [
  { name:'home', path:'/', marker:'ProofGap X' },
  { name:'investigation', path:'/viewer/showcase.html', marker:'pg-language' },
  { name:'citation', path:'/apps/proofgap-cite/showcase.html', marker:'pg-language' },
  { name:'case-builder', path:'/tools/case-builder.html', marker:'case-form' },
];
const widths = [320, 360, 390, 430, 768, 1024, 1440, 1920];

(async () => {
  await new Promise(resolve => server.listen(4173, '127.0.0.1', resolve));
  const browser = await chromium.launch({ headless:true });
  const failures = [];
  try {
    for (const pageSpec of pages) {
      for (const width of widths) {
        const page = await browser.newPage({ viewport:{width,height:900} });
        const runtimeErrors = [];
        page.on('pageerror', error => runtimeErrors.push(error.message));
        await page.goto('http://127.0.0.1:4173' + pageSpec.path, { waitUntil:'networkidle' });
        const marker = pageSpec.marker === 'ProofGap X'
          ? page.getByRole('heading', {name:'ProofGap X'}).first()
          : page.locator('#' + pageSpec.marker);
        assert.equal(await marker.count() > 0, true, pageSpec.name + ' marker missing at ' + width + 'px');
        const dimensions = await page.evaluate(() => ({
          viewport: window.innerWidth,
          document: document.documentElement.scrollWidth,
          body: document.body.scrollWidth
        }));
        assert.ok(dimensions.document <= dimensions.viewport + 1,
          pageSpec.name + ' page horizontal overflow at ' + width + 'px: ' + JSON.stringify(dimensions));
        assert.deepEqual(runtimeErrors, [], pageSpec.name + ' runtime errors at ' + width + 'px');
        await page.close();
      }
    }

    // Exercise pointer and keyboard provenance-node selection in both report viewers.
    for (const pagePath of ['/viewer/showcase.html','/apps/proofgap-cite/showcase.html']) {
      const page = await browser.newPage({ viewport:{width:1280,height:900} });
      await page.goto('http://127.0.0.1:4173' + pagePath, {waitUntil:'networkidle'});
      const nodes = page.locator('svg.graph .node[role="button"]');
      assert.ok(await nodes.count() > 0, pagePath + ' should render interactive graph nodes');
      await nodes.first().click();
      assert.equal(await nodes.first().evaluate(node => node.classList.contains('selected-node')), true,
        pagePath + ' pointer selection should mark the node');
      await nodes.first().focus();
      await page.keyboard.press('Enter');
      assert.equal(await nodes.first().evaluate(node => node.classList.contains('selected-node')), true,
        pagePath + ' keyboard selection should keep the node selected');
      await page.close();
    }

    // Exercise the Arabic direction switch on both report viewers and the case builder.
    for (const pagePath of ['/viewer/showcase.html','/apps/proofgap-cite/showcase.html']) {
      const page = await browser.newPage({ viewport:{width:390,height:844} });
      await page.goto('http://127.0.0.1:4173' + pagePath, {waitUntil:'networkidle'});
      await page.locator('#pg-language').selectOption('ar');
      const dir = await page.locator('html').getAttribute('dir');
      assert.equal(dir, 'rtl', pagePath + ' should switch to RTL');
      await page.close();
    }
    {
      const page = await browser.newPage({ viewport:{width:390,height:844} });
      await page.goto('http://127.0.0.1:4173/tools/case-builder.html', {waitUntil:'networkidle'});
      await page.locator('#language').selectOption('ar');
      assert.equal(await page.locator('html').getAttribute('dir'), 'rtl', 'case builder should switch to RTL');
      await page.locator('#add-source').click();
      assert.equal(await page.locator('#sources .row').count(), 2, 'case builder should add a source row');
      await page.locator('#run-analysis').click();
      await page.waitForFunction(() => document.querySelector('#analysis-result')?.textContent?.length > 0, null, {timeout:10000});
      await page.close();
    }

    // Representative mobile-device emulation, not a claim of physical-device coverage.
    const mobile = await browser.newPage({ ...devices['Pixel 7'] });
    await mobile.goto('http://127.0.0.1:4173/', {waitUntil:'networkidle'});
    assert.ok(await mobile.getByRole('link', {name:/Open investigation demo/i}).count() === 1);
    await mobile.close();
    process.stdout.write('PASS: 32 page/viewport checks, graph pointer/keyboard selection, RTL switches, case-builder add/analyze interaction, Pixel 7 emulation.\n');
  } catch (error) {
    failures.push(error);
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
  if (failures.length) {
    console.error(failures.map(error => error.stack || String(error)).join('\n\n'));
    process.exitCode = 1;
  }
})();
