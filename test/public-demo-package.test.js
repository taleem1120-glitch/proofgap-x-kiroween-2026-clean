import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync,symlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {PUBLIC_FILES,buildPublicDemo,verifyPublicDemo} from '../scripts/build-public-demo.mjs';
test('public demo is byte-identical and excludes non-allowlisted files',()=>{
 const base=mkdtempSync(join(tmpdir(),'proofgap-public-'));
 try{
  const root=join(base,'source'),dest=join(base,'site');mkdirSync(root);
  for(const p of PUBLIC_FILES){mkdirSync(dirname(join(root,p)),{recursive:true});writeFileSync(join(root,p),p);}
  writeFileSync(join(root,'docs','EXTERNAL_REVIEW_OUTREACH.md'),'excluded fixture');
  buildPublicDemo(root,dest);assert.equal(verifyPublicDemo(root,dest),PUBLIC_FILES.length);
  assert.throws(()=>buildPublicDemo(root,dest),/already exists/);
  writeFileSync(join(dest,'extra.txt'),'unexpected');assert.throws(()=>verifyPublicDemo(root,dest),/inventory/);
  rmSync(join(dest,'extra.txt'));writeFileSync(join(dest,'index.html'),'tampered');assert.throws(()=>verifyPublicDemo(root,dest),/Byte mismatch/);
  rmSync(join(root,'index.html'));symlinkSync(join(root,'LICENSE'),join(root,'index.html'));
  assert.throws(()=>buildPublicDemo(root,join(base,'unsafe')),/Unsafe input/);
 }finally{rmSync(base,{recursive:true,force:true});}
});
