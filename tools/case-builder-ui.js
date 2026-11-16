import {serializeCase} from './case-builder-core.js';
const $=id=>document.getElementById(id);
const mk=(tag,attrs,text)=>{
 const e=document.createElement(tag);
 for(const [k,v] of Object.entries(attrs||{}))e.setAttribute(k,String(v));
 if(text!==undefined)e.textContent=text;
 return e;
};
const field=(label,key,value='',type='text')=>{
 const l=mk('label',{},label),i=mk('input',{name:key,type,maxlength:type==='number'?10:500});
 i.value=String(value);
 if(type==='number'){i.min='0';i.max='1';i.step='0.05';}
 l.appendChild(i);return l;
};
const dropdown=(label,key,options,value)=>{
 const l=mk('label',{},label),select=mk('select',{name:key});
 for(const [v,title] of options){const opt=mk('option',{value:v},title);select.appendChild(opt);}
 select.value=value;l.appendChild(select);return l;
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
function add(kind,values){
 const box=$(kind),def=definitions[kind],count=++sequence[kind];
 if(count>80){$('status').textContent='تم بلوغ الحد الأقصى للصفوف';return;}
 const row=mk('section',{class:'row','data-kind':kind});
 const hdr=mk('strong',{},def.title+' '+count);
 const group=mk('div',{class:'fields'});
 for(const [label,key,fallback,type] of def.fields)group.appendChild(field(label,key,values?.[key]??(key==='id'?fallback.replace(/\d+$/,String(count)):fallback),type));
 if(kind==='evidence')group.appendChild(dropdown('الاتجاه / Stance','stance',[['supports','يدعم / Supports'],['contradicts','يناقض / Contradicts']],values?.stance||'supports'));
 const remove=mk('button',{type:'button','data-action':'remove'},'حذف هذا الصف / Remove');
 remove.addEventListener('click',()=>{if(box.querySelectorAll('.row').length>1){row.remove();clearReport();}else $('status').textContent='يلزم صف واحد على الأقل';});
 row.append(hdr,group,remove);box.appendChild(row);
}
// Explicit listeners preserve behavior when captions are translated.
$('add-source').addEventListener('click',()=>{add('sources');clearReport();});
$('add-claim').addEventListener('click',()=>{add('claims');clearReport();});
$('add-evidence').addEventListener('click',()=>{add('evidence');clearReport();});
add('sources');add('claims');add('evidence');
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
  $('status').textContent='تم إنشاء JSON. هذه مدخلات للقضية وليست تقرير نتائج. شغّل محرك ProofGap X لتحليلها.';
 }catch(error){$('status').textContent='تعذر التصدير: '+String(error.message||error);}
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
function clearReport(){
 latestReport=null;
 $('export-report').disabled=true;
 $('analysis-result').textContent='';
}
for (const id of ['case-id','case-title','sources','claims','evidence']) {
 $(id).addEventListener('input',clearReport);
 $(id).addEventListener('change',clearReport);
}
$('run-analysis').addEventListener('click',async()=>{
 clearReport();$('status').textContent='';
 try {
  const {analyzeBuilderRows}=await import('./browser-engine.bundle.js');
  const {report,reportText}=analyzeBuilderRows(inputRows());
  if (!report || report.tool!=='proofgap-x' || !Array.isArray(report.claims))throw Error('Invalid engine response');
  latestReport={reportText,caseId:report.caseId};
  $('export-report').disabled=false;
  const counts=report.summary?.decisionCounts||{};
  const labels={
    supported_by_independent_origins:'مدعوم وفق الأصول المعلنة / Supported under declared assumptions',
    insufficient_support:'دعم مستقل غير كافٍ / Insufficient independent support',
    abstain_possible_undeclared_dependence:'النتيجة غير محسومة: احتمال تبعية خفية / Abstains',
    contradicted:'توجد أدلة مضادة / Contradicted',
    conflicting:'أدلة متعارضة / Conflicting',
    no_evidence:'لا توجد أدلة / No evidence'
  };
  const perClaim=report.claims.map(c=>[
    c.claimId,
    'النتيجة / Result: '+(labels[c.decision]||labels[c.status]||String(c.decision)),
    'أصول الدعم المعلنة / Declared independent support origins: '+String(c.corroboration?.independentSupportOrigins),
    'عدد الأدلة / Evidence items: '+String(c.corroboration?.supportingEvidenceItems)
  ].join(' | '));
  $('analysis-result').textContent='نتيجة تحليل محلي — ليست إثباتًا لصحة الوقائع أو استقلالية المصادر\n'+
   'Case: '+report.caseId+'\n'+perClaim.join('\n')+'\n'+
   'تصنيف الحالات المعلنة / Decision counts: '+JSON.stringify(counts)+'\n'+
   'صدر التقرير محليًا. افحص التقرير الكامل وتفسيراته قبل اتخاذ أي قرار.';
  $('status').textContent='اكتمل التحليل داخل المتصفح. ملف الأدلة الأصلي لم يتم التحقق منه.';
 } catch(error) {
  $('status').textContent='تعذر تحليل القضية: '+String(error.message||error);
 }
});
$('export-report').addEventListener('click',()=>{
 if(!latestReport)return;
 downloadJson(latestReport.reportText,latestReport.caseId+'.proofgap-report.json');
});
