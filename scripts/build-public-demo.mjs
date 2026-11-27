import { mkdirSync, readFileSync, writeFileSync, lstatSync, readdirSync, realpathSync } from 'node:fs';
import { resolve, dirname, join, relative, sep } from 'node:path';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';

export const PUBLIC_FILES = Object.freeze([
 'index.html','assets/lang.js','viewer/showcase.html','apps/proofgap-cite/showcase.html',
 'tools/case-builder.html','tools/case-builder-ui.js','tools/case-builder-core.js',
 'tools/case-builder-locale.js','tools/browser-engine.bundle.js',
 'docs/USER_GUIDE_AR.md','docs/JUDGES_QUICKSTART_2026.md','.kiro/KIRO_USAGE.md',
 'tools/THIRD_PARTY_LICENSES.md','LICENSE','NOTICE'
]);
const hash = b => createHash('sha256').update(b).digest('hex');
export function buildPublicDemo(root, destination) {
 root=realpathSync(root); destination=resolve(destination);
 if(destination===root || root.startsWith(destination+sep)) throw Error('Unsafe output location');
 // An existing output is deliberately rejected: no stale files or symlink reuse.
 try { lstatSync(destination); throw Error('Output already exists'); } catch(e) { if(e.code!=='ENOENT') throw e; }
 const parent=realpathSync(dirname(destination));
 if(parent!==dirname(destination)) throw Error('Output parent must be canonical');
 const inputs=PUBLIC_FILES.map(path=>{
   const source=join(root,path);
   if(realpathSync(source)!==source || !lstatSync(source).isFile()) throw Error('Unsafe input: '+path);
   const bytes=readFileSync(source);
   if(bytes.length>5_000_000) throw Error('Oversized input: '+path);
   return {path,bytes};
 });
 mkdirSync(destination);
 for(const {path,bytes} of inputs){
   const target=join(destination,path);
   mkdirSync(dirname(target),{recursive:true});
   writeFileSync(target,bytes,{flag:'wx'});
 }
 const manifest=inputs.map(({path,bytes})=>({path,sha256:hash(bytes)}));
 writeFileSync(join(destination,'.nojekyll'),'');
 writeFileSync(join(destination,'public-demo-manifest.json'),JSON.stringify({files:manifest},null,2)+'\n');
 return manifest;
}
export function verifyPublicDemo(root,destination){
 const walk=dir=>readdirSync(dir,{withFileTypes:true}).flatMap(e=>{
   const p=join(dir,e.name);
   if(e.isDirectory())return walk(p);
   if(!e.isFile())throw Error('Unexpected non-file: '+p);
   return [relative(destination,p).split(sep).join('/')];
 });
 const expected=[...PUBLIC_FILES,'.nojekyll','public-demo-manifest.json'].sort();
 const actual=walk(destination).sort();
 if(JSON.stringify(actual)!==JSON.stringify(expected))throw Error('Unexpected public inventory');
 const manifest=JSON.parse(readFileSync(join(destination,'public-demo-manifest.json'),'utf8'));
 const wanted=PUBLIC_FILES.map(path=>({path,sha256:hash(readFileSync(join(root,path)))}));
 if(JSON.stringify(manifest)!==JSON.stringify({files:wanted}))throw Error('Manifest mismatch');
 for(const {path,sha256} of wanted)if(hash(readFileSync(join(destination,path)))!==sha256)throw Error('Byte mismatch: '+path);
 if(readFileSync(join(destination,'.nojekyll')).length!==0)throw Error('Invalid .nojekyll');
 return wanted.length;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const dest=process.argv[2]; if(!dest)throw Error('Usage: node scripts/build-public-demo.mjs OUTPUT');
 buildPublicDemo(process.cwd(),dest);
 console.log('Verified '+verifyPublicDemo(process.cwd(),resolve(dest))+' allow-listed source files');
}
