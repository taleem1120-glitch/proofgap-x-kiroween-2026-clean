import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const src=readFileSync(new URL('../viewer/i18n.js',import.meta.url),'utf8');
const keys=JSON.parse(src.match(/var keys=(\[[^\n]*\]);/)[1]);
const rows=JSON.parse(src.match(/var rows=(\{[^\n]*\});/)[1]);
const supported=['en','ar','fr','es','de','pt','tr','fa','hi','zh'];

test('complete viewer dictionary key coverage for all ten languages, with zero empty labels',()=>{
 assert.deepEqual(Object.keys(rows),supported);
 assert.equal(new Set(keys).size,keys.length);
 for(const lang of supported){
  assert.equal(rows[lang].length,keys.length,lang+' missing translations');
  for(let i=0;i<keys.length;i++){
   const label=rows[lang][i];
   assert.equal(typeof label,'string',lang+':'+keys[i]);
   assert.ok(label.trim(),lang+':'+keys[i]);
   assert.ok(!/[<>]/.test(label),lang+':'+keys[i]+' contains markup characters');
  }
 }
});

test('language choice on landing propagates into BOTH app links without changing destination',()=>{
 const anchors=['viewer/showcase.html','apps/proofgap-cite/showcase.html'].map(href=>({
  href,
  getAttribute(name){return name==='href'?this.href:null;},
  setAttribute(name,value){assert.equal(name,'href');this.href=value;}
 }));
 const langNode={value:'en',onChange:null,addEventListener(type,callback){this.onChange=callback;}};
 const nodes=[
  {key:'tagline',textContent:'',getAttribute(){return this.key;}},
  {key:'language',textContent:'',getAttribute(){return this.key;}}
 ];
 const store=new Map();
 const sandbox=vm.createContext({
  document:{documentElement:{},getElementById(id){return id==='language'?langNode:null;},
   querySelectorAll(s){return s==='[data-i18n]'?nodes:anchors;}},
  navigator:{language:'ar-IQ'},
  localStorage:{getItem(k){return store.get(k)||null;},setItem(k,v){store.set(k,v);}}
 });
 vm.runInContext(readFileSync(new URL('../assets/lang.js',import.meta.url),'utf8'),sandbox,{timeout:1000});
 assert.equal(langNode.value,'ar');
 assert.equal(sandbox.document.documentElement.dir,'rtl');
 assert.ok(anchors.every(x=>x.href.endsWith('?lang=ar')));
 assert.equal(store.get('proofgap-lang'),'ar');
 langNode.onChange(); // same language no duplicate query
 assert.ok(anchors.every(x=>x.href.endsWith('?lang=ar')&&!x.href.includes('?lang=ar?')));
 langNode.value='fr';langNode.onChange();
 assert.ok(anchors.every(x=>x.href.endsWith('?lang=fr')));
 assert.equal(sandbox.document.documentElement.dir,'ltr');
 assert.equal(nodes[0].textContent,rows.en?nodes[0].textContent:''); // string-valued text; translations remain content not markup
});
