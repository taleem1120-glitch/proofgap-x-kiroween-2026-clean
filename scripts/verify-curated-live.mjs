import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { PUBLIC_FILES } from './build-public-demo.mjs';
import { SITE_URL } from './public-release-smoke.mjs';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const manifest={files:PUBLIC_FILES.map(path=>({path,sha256:hash(readFileSync(path))}))};
async function get(path) {
 const res=await fetch(new URL(path,SITE_URL),{redirect:'error',cache:'no-store',signal:AbortSignal.timeout(15000)});
 return res;
}
const response=await get('public-demo-manifest.json');
if(!response.ok)throw Error('Missing public manifest');
const manifestText=await response.text();
if(manifestText!==JSON.stringify(manifest,null,2)+'\n')throw Error('Public manifest mismatch');
for(const {path,sha256} of manifest.files){
 const res=await get(path);
 if(!res.ok)throw Error('Missing '+path);
 const bytes=Buffer.from(await res.arrayBuffer());
 if(bytes.length>5_000_000||hash(bytes)!==sha256)throw Error('Public bytes mismatch: '+path);
}
// These probes are regression indicators, not an exhaustive enumeration of host files.
for(const path of ['docs/EXTERNAL_REVIEW_OUTREACH.md','package.json','scripts/build-public-demo.mjs','test/public-demo-package.test.js']){
 const res=await get(path);
 if(res.status!==404&&res.status!==410)throw Error('Excluded path not absent: '+path+' HTTP '+res.status);
}
console.log(JSON.stringify({status:'verified_curated_public_bytes',files:manifest.files.length,excludedProbes:4}));
