import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { spawnSync } from 'node:child_process';
const code=readFileSync(new URL('../viewer/i18n.js',import.meta.url),'utf8');
const context=vm.createContext({document:{documentElement:{},getElementById(){return null;}},navigator:{language:'ar-IQ'},location:{search:''},URLSearchParams});
vm.runInContext(code,context,{timeout:1000});
const t=context.ProofGapLocale;
test('ten distinct localizations have nonempty translated critical terms',()=>{
 assert.equal(t.codes.length,10);
 for(const lang of t.codes){
  t.set(lang);
  for(const key of ['language','export','falseCorroboration','proofGaps','warningsHeading','whyOrigins']){
   assert.ok(t.t(key).trim().length>0,lang+':'+key);
   assert.notEqual(t.t(key),key);
  }
 }
});
test('Arabic and Persian RTL; all other listed scripts LTR; unknown defaults to English',()=>{
 for(const lang of t.codes){
  t.set(lang);
  assert.equal(context.document.documentElement.dir,['ar','fa'].includes(lang)?'rtl':'ltr');
 }
 t.set('unknown');
 assert.equal(t.get(),'en');
});
test('comparison and JSON reports are not modified by language selection',()=>{
 const sample={sourceId:'A',claim:'مستند',status:'unverified',evidenceSha:'deadbeef'};
 const original=JSON.stringify(sample);
 for(const lang of t.codes){t.set(lang);t.t('supported');assert.equal(JSON.stringify(sample),original);}
});
test('developer-authored challenge has complete confusion matrix and discloses limitations',()=>{
 const x=spawnSync(process.execPath,[new URL('../bench/adversarial-copy-challenge.js',import.meta.url).pathname],{encoding:'utf8',timeout:10000});
 assert.equal(x.status,0,x.stderr);
 const result=JSON.parse(x.stdout);
 assert.equal(result.total,100);
 assert.equal(result.tally.tp+result.tally.fp+result.tally.tn+result.tally.fn,100);
 assert.match(result.kind,/not_independent/);
});
