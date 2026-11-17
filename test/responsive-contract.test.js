import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const pages = [
  ['home', 'index.html'],
  ['ProofGap X', 'viewer/showcase.html'],
  ['ProofGap Cite', 'apps/proofgap-cite/showcase.html'],
  ['case builder', 'tools/case-builder.html'],
];

async function pageSource(path) {
  return readFile(new URL('../' + path, import.meta.url), 'utf8');
}

test('all judge-facing pages declare a device-width viewport', async () => {
  for (const [name, path] of pages) {
    const html = await pageSource(path);
    assert.match(html, /<meta\s+name=["']viewport["']\s+content=["'][^"']*width=device-width/i, name);
  }
});

test('showcase pages retain mobile and desktop layout breakpoints', async () => {
  for (const [name, path] of pages.slice(1, 3)) {
    const html = await pageSource(path);
    assert.match(html, /@media\s*\(max-width:\s*560px\)/, name + ' mobile breakpoint');
    assert.match(html, /@media\s*\(min-width:\s*1100px\)/, name + ' desktop breakpoint');
    assert.match(html, /grid-template-columns:\s*minmax\(0,\s*1fr\)/, name + ' shrinkable grid columns');
  }
});

test('evidence diagrams and data tables use bounded, local horizontal scrolling', async () => {
  for (const [name, path] of pages.slice(1, 3)) {
    const html = await pageSource(path);
    assert.match(html, /\.graphwrap\s*\{[^}]*overflow-x:\s*auto/s, name + ' graph scroll container');
    assert.match(html, /\.card table\s*\{[^}]*overflow-x:\s*auto/s, name + ' table scroll container');
    assert.match(html, /svg\.graph\s*\{[^}]*min-width:\s*560px/s, name + ' readable graph minimum width');
  }
});

test('home and case builder layouts can shrink and wrap controls', async () => {
  const home = await pageSource('index.html');
  assert.match(home, /repeat\(auto-fit,\s*minmax\(min\(100%,\s*300px\),\s*1fr\)\)/, 'home cards auto-fit');

  const builder = await pageSource('tools/case-builder.html');
  assert.match(builder, /repeat\(auto-fit,\s*minmax\(min\(100%,\s*220px\),\s*1fr\)\)/, 'builder fields auto-fit');
  assert.match(builder, /input,select,textarea\s*\{[^}]*width:\s*100%/s, 'builder controls fill their available column');
  assert.match(builder, /\.nav\s*\{[^}]*flex-wrap:\s*wrap/s, 'builder navigation wraps');
});
