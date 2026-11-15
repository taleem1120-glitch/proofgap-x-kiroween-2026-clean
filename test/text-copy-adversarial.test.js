import test from 'node:test';
import assert from 'node:assert/strict';
import { compareTextCopies } from '../src/text-copy-cues.js';

const words=(tag,n)=>Array.from({length:n},(_,i)=>`validated ${tag} origin${i} evidence report`).join(' ');
test('shared short boilerplate does not make two otherwise unrelated reports clones',()=>{
  const boiler = words('template',35);
  const a=boiler+' '+words('alpha',90);
  const b=boiler+' '+words('bravo',90);
  const cue=compareTextCopies(a,b);
  assert.equal(cue.suspected,false);
});
test('high lexical overlap is an advisory warning, not proof of common origin',()=>{
  const a=words('source',100);
  const b=a.replaceAll('validated','VALIDATED')+' editorial correction';
  const cue=compareTextCopies(a,b);
  assert.equal(cue.suspected,true);
  assert.equal(cue.reason,'high_textual_overlap_review_origin');
  assert.equal('verified' in cue,false);
});
test('adversarial paraphrases may evade lexical overlap; never claim comprehensive detection',()=>{
  const a=words('report',65);
  const b=words('independent',65);
  const cue=compareTextCopies(a,b);
  assert.equal(cue.suspected,false);
});
