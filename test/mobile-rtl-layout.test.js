import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const css=readFileSync(new URL('../viewer/style.css',import.meta.url),'utf8');
test('mobile controls have usable tap targets and graphs scroll within viewport',()=>{
 assert.match(css,/min-height:\s*44px/);
 assert.match(css,/\.graphwrap\s*\{[^}]*overflow-x:\s*auto/);
 assert.match(css,/\.card table\s*\{[^}]*overflow-x:\s*auto/);
 assert.match(css,/@media\s*\(max-width:\s*560px\)/);
 assert.match(css,/\.controls\s*\{\s*align-items:\s*stretch;\s*flex-direction:\s*column;/);
});
test('RTL uses directional borders and bidi-safe graph column headers',()=>{
 assert.match(css,/html\[dir="rtl"\]\s+\.disclaimer/);
 assert.match(css,/html\[dir="rtl"\]\s+th,/);
 assert.match(css,/unicode-bidi:\s*isolate/);
 assert.match(css,/border-inline-start/);
});
test('mobile layout retains technical graph detail via scrolling rather than truncating node geometry',()=>{
 assert.match(css,/svg\.graph\s*\{[^}]*min-width:\s*560px/);
 assert.doesNotMatch(css,/display:\s*none\s*!important/);
});
