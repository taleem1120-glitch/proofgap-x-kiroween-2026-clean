import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const cli=new URL('../scripts/text-copy-audit.js',import.meta.url).pathname;
const base=Array.from({length:50},(_,i)=>`independent verification record${i} publishing report`).join(' ');
test('opt-in advisory CLI finds near copies without leaking raw text',()=>{
 const dir=mkdtempSync(join(tmpdir(),'pg-cues-'));
 try{
  const path=join(dir,'input.json');writeFileSync(path,JSON.stringify({documents:[{id:'one',text:base},{id:'two',text:base.replaceAll('publishing','PUBLISHING')+' update'}]}));
  const x=spawnSync(process.execPath,[cli,path],{encoding:'utf8',timeout:10000});
  assert.equal(x.status,0,x.stderr);
  const result=JSON.parse(x.stdout);
  assert.equal(result.verification,'not_verified');
  assert.equal(result.suspectedPairs.length,1);
  assert.equal(result.suspectedPairs[0].basis,'heuristic_unverified');
  assert.ok(!x.stdout.includes('independent verification record'));
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test('invalid or missing inputs fail closed',()=>{
 const x=spawnSync(process.execPath,[cli,'does-not-exist.json'],{encoding:'utf8',timeout:10000});
 assert.notEqual(x.status,0);
 assert.equal(x.stdout,'');
});
