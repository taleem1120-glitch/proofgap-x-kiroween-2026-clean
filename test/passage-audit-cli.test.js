import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const cli=new URL('../scripts/passage-audit.js',import.meta.url).pathname;
const sample=(t,n=55)=>Array.from({length:n},(_,i)=>`origin ${t} evidence${i} analysis testimony`).join(' ');
test('CLI flags long shared excerpt with no raw text leakage or authenticity claim',()=>{
 const dir=mkdtempSync(join(tmpdir(),'pg-passage-'));
 try{
  const common=sample('confidential_x123',38);
  const a=sample('before_A')+' '+common+' '+sample('after_A');
  const b=sample('before_B')+' '+common+' '+sample('after_B');
  const path=join(dir,'data.json');
  writeFileSync(path,JSON.stringify({documents:[{id:'caseA',text:a},{id:'caseB',text:b}]}));
  const x=spawnSync(process.execPath,[cli,path],{encoding:'utf8',timeout:10000});
  assert.equal(x.status,0,x.stderr);
  const result=JSON.parse(x.stdout);
  assert.equal(result.verification,'not_verified');
  assert.equal(result.warnings.length,1);
  assert.equal(result.warnings[0].basis,'shared_passage_unverified_review_only');
  assert.ok(!x.stdout.includes('confidential_x123'));
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test('CLI fails closed on duplicate ids or missing files',()=>{
 const dir=mkdtempSync(join(tmpdir(),'pg-passage-'));
 try{
  const path=join(dir,'data.json');
  writeFileSync(path,JSON.stringify({documents:[{id:'same',text:sample('a')},{id:'same',text:sample('b')}]}));
  const x=spawnSync(process.execPath,[cli,path],{encoding:'utf8',timeout:10000});
  assert.notEqual(x.status,0);assert.equal(x.stdout,'');
  const y=spawnSync(process.execPath,[cli,join(dir,'missing.json')],{encoding:'utf8',timeout:10000});
  assert.notEqual(y.status,0);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
