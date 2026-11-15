import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
const cli=new URL('../bench/evaluate-heldout.js',import.meta.url).pathname;
const text=Array.from({length:50},(_,i)=>'analyst evidence item'+i+' tracing corroboration').join(' ');
function run(data){
 const dir=mkdtempSync(join(tmpdir(),'pg-heldout-'));
 try{
  const file=join(dir,'cases.json');writeFileSync(file,JSON.stringify(data));
  return spawnSync(process.execPath,[cli,file],{encoding:'utf8',timeout:10000});
 }finally{rmSync(dir,{recursive:true,force:true});}
}
test('heldout evaluator reports confusion matrices for true labels and withholds third-party validation claim',()=>{
 const a=text, b=a.toUpperCase()+' editorial note';
 const d={cases:[
  {id:'same1',a,b,label:'same_origin',group:'formatting'},
  {id:'different1',a:text,b:Array.from({length:60},(_,i)=>'unrelated climate notice'+i).join(' '),label:'different_origin',group:'different'},
  {id:'unknown1',a:text,b:text,label:'unknown',group:'uncertain'}
 ]};
 const x=run(d);assert.equal(x.status,0,x.stderr);
 const out=JSON.parse(x.stdout);
 assert.equal(out.datasetStatus,'unverified_dataset');
 assert.equal(out.unknownLabelsExcludedFromRates,1);
 assert.equal(out.sha256.overall.fn,1);
 assert.equal(out.lexicalCue.overall.tp,1);
 assert.equal(out.lexicalCue.overall.tn,1);
 assert.equal(out.lexicalCue.overall.unknown,1);
 assert.equal(out.lexicalCue.overall.recall,1);
 assert.ok(!x.stdout.includes(text));
});
test('bad labels, duplicate ids and large inputs fail closed',()=>{
 const base={id:'a',a:text,b:text,label:'same_origin',group:'category'};
 for(const bad of [
  {...base,label:'yes'},
  [base,{...base}],
  {...base,group:'../../secret'},
  {...base,a:'x'.repeat(200001)}
 ]){
  const cases=Array.isArray(bad)?bad:[bad];
  const x=run({cases});assert.notEqual(x.status,0);assert.equal(x.stdout,'');
 }
});
