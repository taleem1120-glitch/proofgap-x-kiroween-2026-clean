// Safe case authoring: structural data only; never represents source assertions as verified facts.
// Shared by offline browser interface and deterministic Node regression tests.
const safeId=/^[A-Za-z0-9_.-]{1,64}$/;
const forbidden=/[\u0000-\u001f\u007f\u202a-\u202e\u2066-\u2069]/;
function id(x){return typeof x==='string'&&safeId.test(x)}
const loneSurrogate=/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/;
function name(x){return typeof x==='string'&&x.trim().length>0&&x.length<=2000&&!forbidden.test(x)&&!loneSurrogate.test(x)}
function reject(message){throw new Error(message)}
function unique(items,label){const all=new Set();for(const x of items){if(!id(x.id))reject(label+' ID must use Latin letters, numbers, period, dash or underscore');if(all.has(x.id))reject('Duplicate '+label+' ID: '+x.id);all.add(x.id);}return all}
export function buildCaseFromRows(input){
 if(!input||typeof input!=='object')reject('Invalid form');
 const sources=input.sources||[],claims=input.claims||[],evidence=input.evidence||[];
 if(!id(input.caseId)||!name(input.title))reject('Valid case ID and title are required');
 if(!Array.isArray(sources)||!Array.isArray(claims)||!Array.isArray(evidence)||sources.length<1||claims.length<1||evidence.length<1)reject('At least one source, claim and evidence item required');
 if(sources.length>40||claims.length>30||evidence.length>80)reject('Builder limits exceeded');
 const sourceIds=unique(sources,'source'),claimIds=unique(claims,'claim');unique(evidence,'evidence');
 const src=sources.map(s=>{
  if(!name(s.name))reject('Source name required');
  const parents=String(s.derivedFrom||'').split(',').map(x=>x.trim()).filter(Boolean);
  if(parents.length>20||new Set(parents).size!==parents.length)reject('Duplicate or excessive parent references');
  for(const p of parents)if(!sourceIds.has(p)||p===s.id)reject('Invalid upstream source: '+p);
  const grp=String(s.originGroup||'').trim();
  if(grp&&!id(grp))reject('Invalid origin-group identifier');
  return {id:s.id,name:s.name.trim(),...(parents.length?{derivedFrom:parents}:{}),...(grp?{originGroup:grp}:{})};
 });
 // Prevent feedback loops from being presented as independent ancestry.
 const by=new Map(src.map(s=>[s.id,s]));const seen=new Set(),active=new Set();
 function visit(k,depth){if(depth>50||active.has(k))reject('Circular or too-deep source ancestry');if(seen.has(k))return;active.add(k);for(const p of by.get(k).derivedFrom||[])visit(p,depth+1);active.delete(k);seen.add(k)}
 for(const s of src)visit(s.id,0);
 const cl=claims.map(c=>{if(!name(c.statement))reject('Claim statement required');return{id:c.id,statement:c.statement.trim()}});
 const ev=evidence.map(e=>{
  if(!sourceIds.has(e.sourceId)||!claimIds.has(e.claimId))reject('Evidence must reference an existing source and claim');
  if(!name(e.description))reject('Evidence description required');
  const strength=Number(e.strength);
  if(String(e.strength).trim()===''||!Number.isFinite(strength)||strength<0||strength>1)reject('Strength must be a declared estimate in [0, 1]');
  if(!['supports','contradicts'].includes(e.stance))reject('Unsupported evidence stance');
  return{id:e.id,sourceId:e.sourceId,description:e.description.trim(),links:[{claimId:e.claimId,stance:e.stance,strength}]};
 });
 return {schemaVersion:'1.0',caseId:input.caseId,title:input.title.trim(),sources:src,claims:cl,evidence:ev};
}
export function serializeCase(input){return JSON.stringify(buildCaseFromRows(input),null,2)+'\n'}
