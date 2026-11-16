// Post-deployment gate: public GitHub Pages must serve the exact committed release bytes.
// No telemetry, account data or case content is uploaded by this script.
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');
export const DEPLOYMENT_FILES=Object.freeze([
 'index.html',
 'assets/lang.js',
 'viewer/showcase.html',
 'apps/proofgap-cite/showcase.html',
 'tools/case-builder.html',
 'tools/case-builder-ui.js',
 'tools/case-builder-core.js',
 'tools/browser-engine.bundle.js'
]);
export const SITE_URL='https://taleem1120-glitch.github.io/proofgap-x-kiroween-2026-clean/';
export async function checkDeployedSite(base=SITE_URL, fetcher=fetch, fileReader=readFileSync) {
 const parsed=new URL(base);
 if(!['https:','http:'].includes(parsed.protocol)||(
   parsed.protocol==='http:' && !['127.0.0.1','localhost'].includes(parsed.hostname)
 ))throw new TypeError('Only HTTPS or localhost HTTP sites may be verified');
 const report=[];
 for(const path of DEPLOYMENT_FILES){
  const expected=fileReader(path);
  const uri=new URL(path,parsed);
  const res=await fetcher(uri.href,{redirect:'error',signal:AbortSignal.timeout(15000),cache:'no-store'});
  if(!res.ok)throw Error('Release asset failed: '+path+' (HTTP '+res.status+')');
  const declaredLen=Number(res.headers.get('content-length')||0);
  if(declaredLen>5_000_000)throw Error('Oversized public asset: '+path);
  const actual=Buffer.from(await res.arrayBuffer());
  if(actual.length>5_000_000)throw Error('Oversized public payload: '+path);
  if(sha256(actual)!==sha256(expected))
   throw Error('Public site does not match the release commit: '+path);
  report.push({path,status:'byte-identical',sha256:sha256(actual)});
 }
 return {status:'verified_release_bytes_only',files:report.length,report,
  caveat:'This checks deployment byte identity, not visual accessibility, application behavior, provenance authenticity or real-world accuracy.'};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{
  console.log(JSON.stringify(await checkDeployedSite(),null,2));
 }catch(error){
  console.error('PUBLIC DEPLOYMENT NOT VERIFIED: '+String(error?.message||error));
  process.exitCode=1;
 }
}
