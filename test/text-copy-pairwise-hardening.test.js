import test from 'node:test';
import assert from 'node:assert/strict';
import { compareTextCopies, findSuspectedTextCopies } from '../src/text-copy-cues.js';

const sample=(n)=>Array.from({length:50},(_,i)=>`source family ${n} anchor${i} evidence verification`).join(' ');
test('all input records validated, including singletons and final positions',()=>{
  assert.throws(()=>findSuspectedTextCopies([{id:'ok',text:sample(1)},{id:'missing'}]),TypeError);
  assert.throws(()=>findSuspectedTextCopies([{id:'one',text:sample(1)},{id:'one',text:sample(2)}]),TypeError);
  assert.throws(()=>findSuspectedTextCopies([{id:'',text:sample(1)}]),TypeError);
  assert.throws(()=>findSuspectedTextCopies([{id:12,text:sample(1)}]),TypeError);
});
test('precomputed pairwise shingle comparison matches original single-pair comparator',()=>{
  const a=sample(1), b=a.replaceAll('source','SOURCE')+' editor note', c=sample(2);
  const docs=[{id:'b',text:b},{id:'a',text:a},{id:'c',text:c}];
  const result=findSuspectedTextCopies(docs);
  assert.deepEqual(result.map(x=>x.refs),[['a','b']]);
  assert.equal(result[0].jaccard,compareTextCopies(a,b).jaccard);
  assert.equal(result[0].containment,compareTextCopies(a,b).containment);
  assert.equal(result[0].basis,'heuristic_unverified');
});
test('unsupported overlong text safely abstains without treating source as matching',()=>{
  const long='a'.repeat(200001);
  assert.deepEqual(findSuspectedTextCopies([{id:'long',text:long},{id:'ordinary',text:sample(1)}]),[]);
});
test('aggregate budget enforced before quadratic comparison',()=>{
  const huge='x'.repeat(150000);
  assert.throws(()=>findSuspectedTextCopies(Array.from({length:14},(_,i)=>({id:String(i),text:huge}))),RangeError);
});
test('empty list and one valid document return no pairs',()=>{
  assert.deepEqual(findSuspectedTextCopies([]),[]);
  assert.deepEqual(findSuspectedTextCopies([{id:'solo',text:sample(1)}]),[]);
});
