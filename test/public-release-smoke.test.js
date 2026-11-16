import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {checkDeployedSite, DEPLOYMENT_FILES} from '../scripts/public-release-smoke.mjs';
const headers={get(){return null;}};
const mockFetch=async url=>{
 const path=new URL(url).pathname.split('/').slice(2).join('/');
 return {ok:true,status:200,headers,arrayBuffer:async()=>readFileSync(path)};
};
test('public release verification recognizes exact eight committed assets',async()=>{
 const result=await checkDeployedSite(undefined,mockFetch);
 assert.equal(result.files,DEPLOYMENT_FILES.length);
 assert.equal(result.status,'verified_release_bytes_only');
 assert.equal(new Set(result.report.map(x=>x.path)).size,DEPLOYMENT_FILES.length);
});
test('public release gate fails when any served asset has an old or changed byte',async()=>{
 const tampered=async url=>{
  const path=new URL(url).pathname.split('/').slice(2).join('/');
  return {ok:true,status:200,headers,arrayBuffer:async()=>path==='tools/browser-engine.bundle.js'?Buffer.from('stale'):readFileSync(path)};
 };
 await assert.rejects(checkDeployedSite(undefined,tampered),/does not match/);
});
test('missing files and insecure remote origins fail closed',async()=>{
 await assert.rejects(checkDeployedSite(undefined,async()=>({ok:false,status:404,headers,arrayBuffer:async()=>Buffer.alloc(0)})),/HTTP 404/);
 await assert.rejects(checkDeployedSite('http://example.com/',mockFetch),/Only HTTPS/);
});
