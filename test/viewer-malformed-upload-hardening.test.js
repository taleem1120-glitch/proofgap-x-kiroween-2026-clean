import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {renderHtml,serializeReport,analyzeCase,validateCase} from '../src/index.js';
import {base} from './helpers.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('generated legitimate report has the necessary schema guards',()=>{
 const report=JSON.parse(serializeReport(analyzeCase(validateCase(base()))));
 const js=read('viewer/app.js');
 const fn=js.match(/  function valid\(r\) \{[\s\S]*?\n  \}/)[0];
 const context=vm.createContext({});
 vm.runInContext(fn+'; this.check=valid;',context);
 assert.equal(context.check(report),true);
 for(const mutilate of [
  x=>{x.claims=[{claimId:'bad'}];},
  x=>{x.graph.edges=[{}];},
  x=>{x.graph.nodes=Array.from({length:2001},()=>({id:'x',type:'claim'}));},
  x=>{x.integrity.results=[null];},
  x=>{x.warnings=null;},
  x=>{x.inputSha256=null;}
 ]){
   const damaged=structuredClone(report);mutilate(damaged);
   assert.equal(context.check(damaged),false);
 }
});
test('malformed upload cannot crash second panel and maximum upload is bounded',()=>{
 const source=read('viewer/app.js');
 assert.match(source,/catch \(e\) \{\s*\/\/ A malicious or malformed local report/);
 assert.match(source,/rejected\+\+/);
 assert.match(source,/5 \* 1024 \* 1024/);
 assert.doesNotMatch(source,/eval\s*\(|innerHTML|outerHTML|fetch\s*\(/);
});
