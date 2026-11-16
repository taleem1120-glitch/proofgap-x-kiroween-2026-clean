import {serializeCase} from './case-builder-core.js';
import {LOCALES,translate,preferredLanguage} from './case-builder-locale.js';
let activeLanguage=preferredLanguage();
const T=(key)=>translate(activeLanguage,key);
const FIELD_KEYS={
 'رمز المصدر / ID':'sourceId','اسم المصدر / Name':'name','مشتق من (رموز مفصولة بفاصلة) / Derived from':'derivedFrom',
 'مجموعة أصل مشتركة / Shared origin group':'originGroup','رمز الادعاء / ID':'claimId','نص الادعاء / Statement':'statement',
 'رمز الدليل / ID':'evidenceId','الوصف / Description':'description','القوة التقديرية / Declared strength':'strength',
 'رمز المصدر / Source ID':'sourceId','رمز الادعاء / Claim ID':'claimId'};
function localize(){
 document.documentElement.lang=activeLanguage;
 document.documentElement.dir=['ar','fa'].includes(activeLanguage)?'rtl':'ltr';
 document.querySelectorAll('[data-l10n]').forEach(node=>{node.textContent=T(node.getAttribute('data-l10n'));});
 document.querySelectorAll('.app-nav a').forEach(a=>{a.href=a.getAttribute('href').split('?')[0]+'?lang='+encodeURIComponent(activeLanguage);});
 try{localStorage.setItem('proofgap-lang',activeLanguage);}catch{}
}

const $=id=>document.getElementById(id);
const mk=(tag,attrs,text)=>{
 const e=document.createElement(tag);
 for(const [k,v] of Object.entries(attrs||{}))e.setAttribute(k,String(v));
 if(text!==undefined)e.textContent=text;
 return e;
};
const field=(label,key,value='',type='text')=>{
 const l=mk('label',{},''),i=mk('input',{name:key,type,maxlength:type==='number'?10:500});
 i.value=String(value);
 if(type==='number'){i.min='0';i.max='1';i.step='0.05';}
 l.append(mk('span',{'data-l10n':FIELD_KEYS[label]||'description'},T(FIELD_KEYS[label]||'description')),i);return l;
};
const dropdown=(label,key,options,value)=>{
 const l=mk('label',{},''),select=mk('select',{name:key});
 for(const [v,title] of options){const opt=mk('option',{value:v,'data-l10n':v},T(v));select.appendChild(opt);}
 select.value=value;l.append(mk('span',{'data-l10n':'stance'},T('stance')),select);return l;
};
const sequence={sources:0,claims:0,evidence:0};
const definitions={
 sources:{
  name:'source',title:'مصدر / Source',fields:[
   ['رمز المصدر / ID','id','s1'],
   ['اسم المصدر / Name','name','Original record'],
   ['مشتق من (رموز مفصولة بفاصلة) / Derived from','derivedFrom',''],
   ['مجموعة أصل مشتركة / Shared origin group','originGroup','']
  ]
 },
 claims:{
  name:'claim',title:'ادعاء / Claim',fields:[
   ['رمز الادعاء / ID','id','c1'],
   ['نص الادعاء / Statement','statement','A fictional event took place']
  ]
 },
 evidence:{
  name:'evidence',title:'دليل / Evidence',fields:[
   ['رمز الدليل / ID','id','e1'],
   ['رمز المصدر / Source ID','sourceId','s1'],
   ['رمز الادعاء / Claim ID','claimId','c1'],
   ['الوصف / Description','description','Record supporting the claim'],
   ['القوة التقديرية / Declared strength','strength','0.7','number']
  ]
 }
};
// Starter examples follow the initial locale only; switching later never rewrites entered evidence.
$('case-title').value=T('demoTitle');
definitions.sources.fields[1][2]=T('demoSource');
definitions.claims.fields[1][2]=T('demoStatement');
definitions.evidence.fields[3][2]=T('demoEvidence');
function add(kind,values){
 const box=$(kind),def=definitions[kind],count=++sequence[kind];
 if(count>80){$('status').textContent=T('limitReached');return;}
 const row=mk('section',{class:'row','data-kind':kind});
 const hdr=mk('strong',{},T(kind==='sources'?'source':kind==='claims'?'claim':'item')+' '+count);
 hdr.setAttribute('data-row-kind',kind);hdr.setAttribute('data-row-number',String(count));
 const group=mk('div',{class:'fields'});
 for(const [label,key,fallback,type] of def.fields)group.appendChild(field(label,key,values?.[key]??(key==='id'?fallback.replace(/\d+$/,String(count)):fallback),type));
 if(kind==='evidence')group.appendChild(dropdown('الاتجاه / Stance','stance',[['supports','يدعم / Supports'],['contradicts','يناقض / Contradicts']],values?.stance||'supports'));
 const remove=mk('button',{type:'button','data-action':'remove','data-l10n':'remove'},T('remove'));
 remove.addEventListener('click',()=>{if(box.querySelectorAll('.row').length>1){row.remove();clearReport();}else $('status').textContent=T('atLeastOne');});
 row.append(hdr,group,remove);box.appendChild(row);
}
// Explicit listeners preserve behavior when captions are translated.
$('add-source').addEventListener('click',()=>{add('sources');clearReport();});
$('add-claim').addEventListener('click',()=>{add('claims');clearReport();});
$('add-evidence').addEventListener('click',()=>{add('evidence');clearReport();});
add('sources');add('claims');add('evidence');
const languageSelect=$('language');
languageSelect.value=activeLanguage;
localize();
languageSelect.addEventListener('change',()=>{
 if(!LOCALES.includes(languageSelect.value))return;
 activeLanguage=languageSelect.value;
 localize();
 // Labels switch language, but evidence text and canonical JSON must not be translated.
 if(latestReport){$('analysis-result').textContent='';$('status').textContent=T('preview');}
 document.querySelectorAll('[data-row-kind]').forEach(node=>{const kind=node.getAttribute('data-row-kind');node.textContent=T(kind==='sources'?'source':kind==='claims'?'claim':'item')+' '+node.getAttribute('data-row-number');});
});
function rows(kind){return Array.from($(kind).querySelectorAll('.row'),row=>{
 const out={};for(const input of row.querySelectorAll('[name]'))out[input.name]=input.value;return out;
});}
$('case-form').addEventListener('submit',event=>{
 event.preventDefault();
 $('status').textContent='';
 try{
  const content=serializeCase({caseId:$('case-id').value.trim(),title:$('case-title').value.trim(),
   sources:rows('sources'),claims:rows('claims'),evidence:rows('evidence')});
  downloadJson(content,$('case-id').value.trim()+'.proofgap-case.json');
  $('status').textContent=T('caseExported');
 }catch(error){$('status').textContent=T('invalidExport')+': '+String(error.message||error);}
});

function inputRows(){
 return {caseId:$('case-id').value.trim(),title:$('case-title').value.trim(),
   sources:rows('sources'),claims:rows('claims'),evidence:rows('evidence')};
}
function downloadJson(content,name){
 const blob=new Blob([content],{type:'application/json;charset=utf-8'});
 const link=document.createElement('a'),url=URL.createObjectURL(blob);
 link.href=url;link.download=name;
 document.body.appendChild(link);link.click();link.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
}
let latestReport=null;
let formRevision=0;
function clearReport(){
 formRevision++;
 latestReport=null;
 $('export-report').disabled=true;
 $('analysis-result').textContent='';
 $('status').textContent='';
}
for (const id of ['case-id','case-title','sources','claims','evidence']) {
 $(id).addEventListener('input',clearReport);
 $(id).addEventListener('change',clearReport);
}
$('run-analysis').addEventListener('click',async()=>{
 clearReport();
 const revision=formRevision;
 $('run-analysis').disabled=true;
 $('status').textContent=T('localAnalysis');
 try {
  const snapshot=inputRows();
  const {analyzeBuilderRows}=await import('./browser-engine.bundle.js');
  if (revision!==formRevision) return; // Changed input while the engine was loading.
  const {report,reportText}=analyzeBuilderRows(snapshot);
  if (revision!==formRevision) return; // Do not publish stale analysis.
  if (!report || report.tool!=='proofgap-x' || !Array.isArray(report.claims))throw Error('Invalid engine response');
  latestReport={reportText,caseId:report.caseId};
  $('export-report').disabled=false;
  const counts=report.summary?.decisionCounts||{};
  const perClaim=report.claims.map(c=>[
    c.claimId,
    T('localResult')+': '+T(c.decision||c.status),
    T('supportOrigins')+': '+String(c.corroboration?.independentSupportOrigins),
    T('evidenceItems')+': '+String(c.corroboration?.supportingEvidenceItems)
  ].join(' | '));
  $('analysis-result').textContent=T('uncertainty')+'\n'+
   T('case')+': '+report.caseId+'\n'+perClaim.join('\n')+'\n'+
   T('decisionCounts')+': '+JSON.stringify(counts)+'\n'+
   T('preview');
  $('status').textContent=T('analysisDone');
 } catch(error) {
  if (revision===formRevision) $('status').textContent=T('analysisFailed')+': '+String(error.message||error);
 } finally {
  $('run-analysis').disabled=false;
 }
});
$('export-report').addEventListener('click',()=>{
 if(!latestReport)return;
 downloadJson(latestReport.reportText,latestReport.caseId+'.proofgap-report.json');
});
