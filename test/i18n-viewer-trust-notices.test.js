import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {renderHtml} from '../src/html.js';
import {analyzeCase,serializeReport,validateCase} from '../src/index.js';
import {base} from './helpers.js';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('viewer renders translation hooks but keeps raw report JSON unchanged',()=>{
 const raw=serializeReport(analyzeCase(validateCase(base())));
 const html=renderHtml([raw]);
 for(const id of ['pg-offline','pg-intro','pg-footer','pg-skip','pg-language','pg-open-files'])assert.ok(html.includes('id="'+id+'"'),id);
 assert.ok(html.includes(raw.trimEnd()));
 assert.ok(html.includes('sha256-'));
});
test('translated text-only trust notices and errors never insert HTML',()=>{
 const js=read('viewer/app.js');
 assert.match(js,/translateStatic\(\)/);
 assert.match(js,/node\.textContent=L\(pair\[1\]\)/);
 for(const key of ['headerOffline','headerCaveat','footerCaveat','invalidJson','bytesMatched','localHash'])assert.ok(read('viewer/i18n.js').includes('"'+key+'"'),key);
 assert.doesNotMatch(js,/innerHTML|outerHTML|insertAdjacentHTML|document\.write/);
});
test('case header displays hash prefix using actual report bytes',()=>{
 const js=read('viewer/app.js');
 assert.ok(js.includes("report.inputSha256.slice(0, 16)"));
 assert.ok(!js.includes("L('inputHash') + '  +"));
});
