import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

test('two-app landing links only to present local showcase files',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 for(const url of ['viewer/showcase.html','apps/proofgap-cite/showcase.html']){
   assert.ok(html.includes('href="'+url+'"'));
   assert.ok(existsSync(new URL('../'+url,import.meta.url)));
 }
 assert.match(html,/Content-Security-Policy/);
 assert.match(html,/script-src 'self'/);
 assert.match(html,/<script src="assets\/lang.js" defer><\/script>/);
 assert.doesNotMatch(html,/<script(?! src="assets\/lang.js" defer><\/script>)[^>]*>|https?:\/\/|onerror\s*=|onclick\s*=/i);
});

test('language dropdown and translations contain ten unique supported locales',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const js=readFileSync(new URL('../assets/lang.js',import.meta.url),'utf8');
 for(const language of ['en','ar','fr','es','de','pt','tr','fa','hi','zh']){
  assert.ok(html.includes('value="'+language+'"'));
  assert.ok(js.includes('"'+language+'":['));
 }
 assert.match(js,/document\.documentElement\.dir=/);
 assert.match(js,/node\.textContent=dict\[lang\]\[key\]/);
 assert.doesNotMatch(js,/innerHTML|fetch\(|XMLHttpRequest/);
});
