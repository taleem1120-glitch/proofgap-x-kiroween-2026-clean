// Pinned build-time dependencies: esbuild@0.25.12, @noble/hashes@1.8.0.
// Artifact contains identical policy code from src/analyze.js, only Node-native
// hashing and the non-requested file-integrity adapter are substituted.
import {build} from 'esbuild';
import {resolve} from 'node:path';
const root=process.cwd();
await build({
 entryPoints:[resolve(root,'tools/browser-engine-entry.js')],
 outfile:resolve(root,'tools/browser-engine.bundle.js'),
 platform:'browser',target:['es2022'],format:'esm',bundle:true,minify:false,
 legalComments:'inline',
 plugins:[{
  name:'strict-browser-adapters',
  setup(ctx){
   ctx.onResolve({filter:/^node:crypto$/},()=>({path:resolve(root,'tools/browser-crypto-shim.js')}));
   ctx.onResolve({filter:/^\.\/integrity\.js$/},args=>args.importer.endsWith('/src/analyze.js')?{path:resolve(root,'tools/browser-integrity-shim.js')}:null);
   ctx.onResolve({filter:/^node:/},args=>{throw Error('Unexpected Node built-in in browser analysis: '+args.path)});
  }
 }]
});
