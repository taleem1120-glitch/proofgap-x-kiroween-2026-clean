import test from 'node:test';
import assert from 'node:assert/strict';
import {validateCase} from '../src/validate.js';
import {analyzeCase} from '../src/analyze.js';
function sample(n){
 const sources=Array.from({length:n},(_,i)=>({id:'s'+i,name:'Independent synthetic source '+i}));
 const evidence=Array.from({length:n},(_,i)=>({id:'e'+i,sourceId:'s'+i,description:'Synthetic source document '+i,
  links:[{claimId:'c1',stance:'supports',strength:0.7}]}));
 return{schemaVersion:'1.0',caseId:'SCALE-'+n,title:'Synthetic independent source origins',
  sources,claims:[{id:'c1',statement:'A fictional claim'}],evidence};
}
test('unknown-origin visual edges are capped without changing underlying independent origin count',()=>{
 const report=analyzeCase(validateCase(sample(120)));
 const cl=report.claims[0];
 assert.equal(cl.corroboration.independentSupportOrigins,120);
 assert.equal(cl.status,'supported_by_independent_origins');
 assert.equal(report.graph.basisCounts.unknown,2000);
 assert.equal(report.graph.omittedUnknownEdges,120*119/2-2000);
 assert.equal(report.graph.edges.filter(x=>x.basis==='unknown').length,2000);
});
test('small graphs stay exhaustive and do not misreport omissions',()=>{
 const report=analyzeCase(validateCase(sample(8)));
 assert.equal(report.graph.basisCounts.unknown,28);
 assert.equal(report.graph.omittedUnknownEdges,undefined);
});
test('visual cap does not depend on source insertion order',()=>{
 const forward=analyzeCase(validateCase(sample(90)));
 const reverse=sample(90);reverse.sources.reverse();reverse.evidence.reverse();
 const reordered=analyzeCase(validateCase(reverse));
 assert.equal(forward.claims[0].corroboration.independentSupportOrigins,reordered.claims[0].corroboration.independentSupportOrigins);
 assert.deepEqual(forward.graph.edges,reordered.graph.edges);
});
