// No local-file acquisition in the browser. Never label any hash as verified.
const STATES=['VERIFIED','MISMATCH','MISSING','UNSAFE_PATH','NOT_CHECKED'];
export function integrityNotRequested(evidence) {
 const results=[...evidence].sort((a,b)=>a.id<b.id?-1:1).map(e=>({
  evidenceId:e.id,status:'NOT_CHECKED',verified:false,
  declaredSha256:e.sha256??null,file:e.file??null,
  reason:e.sha256?'verification_not_requested':'no_declared_hash'
 }));
 const counts=Object.fromEntries(STATES.map(s=>[s,s==='NOT_CHECKED'?results.length:0]));
 return {mode:'not_requested',counts,results};
}
