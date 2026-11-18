import test from 'node:test';
import assert from 'node:assert/strict';
import { compareTextCopies,detectSharedPassage } from '../src/text-copy-cues.js';
const part=(label,n=100)=>Array.from({length:n},(_,i)=>`evidence ${label} marker${i} observation analysis`).join(' ');
test('partial reuse exposes 100-token embedded excerpt without asserting source lineage',()=>{
 const common=part('unique',45);
 const a=part('alpha',60)+' '+common+' '+part('endingA',70);
 const b=part('introB',65)+' '+common+' '+part('endingB',60);
 const partial=detectSharedPassage(a,b);
 assert.equal(partial.review,true);
 assert.equal(partial.basis,'shared_passage_unverified_review_only');
 assert.ok(partial.longestRunTokens>=200);
 assert.equal(compareTextCopies(a,b).suspected,false);
});
test('unrelated articles are not flagged as partial near-copies',()=>{
 const result=detectSharedPassage(part('first'),part('second'));
 assert.equal(result.review,false);
 assert.equal(result.candidates.length,0);
});
test('standard boilerplate produces REVIEW-only: cannot infer common origin',()=>{
 const template=part('generic legal notice',20);
 const a=template+' '+part('first',90);
 const b=template+' '+part('second',90);
 const result=detectSharedPassage(a,b);
 assert.equal(result.review,true);
 assert.equal(result.basis,'shared_passage_unverified_review_only');
 assert.equal('verified' in result,false);
});
test('short, unsupported, or invalid bounds fail conservatively',()=>{
 assert.equal(detectSharedPassage('short phrase','short phrase').review,false);
 assert.throws(()=>detectSharedPassage(part('x'),part('x'),{minRunTokens:0}),RangeError);
 assert.throws(()=>detectSharedPassage(part('x'),part('x'),{maxCandidates:100}),RangeError);
});

test('repeated-text resource limits return an inconclusive manual-review signal',()=>{
 const repeated=Array.from({length:6500},()=> 'repeat').join(' ');
 const x=detectSharedPassage(repeated,repeated,{maxComparisons:1000});
 assert.equal(x.review,true);
 assert.equal(x.incomplete,true);
 assert.equal(x.basis,'comparison_budget_exceeded_manual_review');
});

test('repeated seed positions disclose incomplete candidate coverage',()=>{
 const passage=part('repeated-passage',60);
 const a=Array.from({length:7},(_,i)=>passage+' separator'+i).join(' ');
 const result=detectSharedPassage(a,passage);
 assert.equal(result.review,true);
 assert.equal(result.incomplete,true);
 assert.equal(result.basis,'candidate_index_truncated_manual_review');
 assert.ok(result.longestRunTokens>=60);
});
test('Arabic diacritics are retained when detecting a shared passage',()=>{
 const marked=Array.from({length:35},(_,i)=>'مُستندٌ أصليّ رقم'+i+' دليلٌ موثّق').join(' ');
 const plain=marked.replace(/[\\u064b-\\u065f]/g,'');
 const result=detectSharedPassage(marked,plain);
 assert.equal(result.review,false);
 assert.equal(result.basis,'no_long_shared_passage');
});
