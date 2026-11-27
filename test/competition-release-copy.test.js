import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('competition landing presents actual end-to-end mobile analysis with provenance warning',()=>{
 const page=read('index.html');
 assert.match(page,/href="tools\/case-builder\.html"/);
 assert.match(page,/data-i18n="openBuilder"/);
 assert.match(page,/data-i18n="builderNote"/);
 assert.match(page,/href="viewer\/showcase\.html"/);
 assert.match(page,/href="apps\/proofgap-cite\/showcase\.html"/);
 assert.doesNotMatch(page,/Core case analysis still requires its CLI/);
});
test('judges quickstart states verified deployment and direct phone analysis',()=>{
 const guide=read('docs/JUDGES_QUICKSTART_2026.md');
 assert.match(guide,/Analyze Locally/);
 assert.match(guide,/deployed source commit `[a-f0-9]{40}`/);
 assert.match(guide,/15 public file hashes verified/);
 assert.match(guide,/actions\/runs\/46061739240/);
 assert.match(guide,/not a fresh independent CLI execution/);
 assert.doesNotMatch(guide,/not yet verified/);
 assert.match(guide,/not verify real-world provenance/);
 assert.doesNotMatch(guide,/212-test suite/);
});
test('public release gate verifies the mobile bundle and both distinct apps',()=>{
 const source=read('scripts/public-release-smoke.mjs');
 for(const path of ['index.html','viewer/showcase.html','apps/proofgap-cite/showcase.html','tools/browser-engine.bundle.js'])
  assert.ok(source.includes("'"+path+"'"));
});
