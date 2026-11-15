// Adversarial challenge diagnostics using author-generated cases: NOT independent validation.
import { compareTextCopies } from '../src/text-copy-cues.js';
import { createHash } from 'node:crypto';
const base = (kind,n) => Array.from({length:70},(_,i)=>`analyst ${kind} source${n} observation${i} evidence`).join(' ');
const sha=s=>createHash('sha256').update(s).digest('hex');
const cases=[];
for(let i=0;i<40;i++){
 const s=base('municipal',i);
 cases.push({kind:'formatting-repost',y:true,a:s,b:s.toUpperCase().replaceAll(' ','  ')+' footnote'});
 const u=base('municipal',i), v=base('environmental',i);
 cases.push({kind:'unrelated',y:false,a:u,b:v});
}
for(let i=0;i<20;i++){
 const boiler=base('standard disclaimer',0);
 const a=boiler+' '+base('audit',i)+' '+base('district',i);
 const b=boiler+' '+base('independent',i)+' '+base('regional',i);
 cases.push({kind:'shared-boilerplate',y:false,a,b});
}
const results={};for(const x of cases){const observed=compareTextCopies(x.a,x.b).suspected;const row=results[x.kind]??={tp:0,fp:0,tn:0,fn:0};row[observed?(x.y?'tp':'fp'):(x.y?'fn':'tn')]++;}
const tally=Object.values(results).reduce((out,x)=>{for(const k of ['tp','fp','tn','fn'])out[k]+=x[k];return out},{tp:0,fp:0,tn:0,fn:0});
const ratio=(n,d)=>d?Number((n/d).toFixed(4)):null;
console.log(JSON.stringify({kind:'developer_authored_adversarial_challenge_not_independent',total:cases.length,perCategory:results,tally,precision:ratio(tally.tp,tally.tp+tally.fp),recall:ratio(tally.tp,tally.tp+tally.fn),falsePositiveRate:ratio(tally.fp,tally.fp+tally.tn),limitations:'Not blind, not customer data, no third-party or commercial-vendor comparison; lexical paraphrase unsupported; scores must not be used as real-world performance.'},null,2));
