import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
const base=new URL('../',import.meta.url);
test('two-app landing links only to present local showcase files',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 for(const url of ['viewer/showcase.html','apps/proofgap-cite/showcase.html']){
   assert.ok(html.includes('href="'+url+'"'));
   assert.ok(existsSync(new URL('../'+url,import.meta.url)));
 }
 assert.match(html,/Content-Security-Policy/);
 assert.doesNotMatch(html,/<script\b|https?:\/\/|onerror\s*=|onclick\s*=/i);
});
