import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {LOCALES,translate} from '../tools/case-builder-locale.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const required=['choose','home','investigation','citation','builder','case','sources','claims','evidence','analyze','exportReport','supportOrigins','sourceNotVerified','langScope'];
test('case builder has ten complete locale dictionaries without English/Arabic mixed labels',()=>{
 assert.deepEqual(LOCALES,['en','ar','fr','es','de','pt','tr','fa','hi','zh']);
 for(const code of LOCALES) for(const key of required){
  const value=translate(code,key);
  assert.ok(value.trim()&&value!==key,code+':'+key);
  assert.ok(!value.includes('<')&&!value.includes('>'),code+':'+key);
 }
 assert.equal(translate('ar','analyze'),'تحليل القضية محليًا');
 assert.equal(translate('en','analyze'),'Analyze locally');
});
test('case builder provides main and both distinct app links with language selection',()=>{
 const page=read('tools/case-builder.html');
 assert.match(page,/id="language"/);
 assert.match(page,/data-l10n="home"/);
 assert.match(page,/data-l10n="investigation"/);
 assert.match(page,/data-l10n="citation"/);
 assert.match(page,/viewer\/showcase\.html/);
 assert.match(page,/apps\/proofgap-cite\/showcase\.html/);
});
test('translated builder text does not modify user-entered data or JSON',()=>{
 const source=read('tools/case-builder-ui.js');
 assert.match(source,/document\.documentElement\.dir=/);
 assert.match(source,/textContent=T\(node\.getAttribute\('data-l10n'\)\)/);
 assert.match(source,/localStorage\.setItem\('proofgap-lang'/);
 assert.doesNotMatch(source,/innerHTML\s*=|fetch\(/);
});
