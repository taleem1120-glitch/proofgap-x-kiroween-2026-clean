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
 const box=$(kind),def=definitions[kind],count=box.querySelectorAll('.row').length+1;
 if(count>80){$('status').textContent='تم بلوغ الحد الأقصى للصفوف';return;}
 const row=mk('section',{class:'row','data-kind':kind});
 const hdr=mk('strong',{},def.title+' '+count);
 const group=mk('div',{class:'fields'});
 for(const [label,key,fallback,type] of def.fields)group.appendChild(field(label,key,values?.[key]??(key==='id'?fallback.replace(/\d+$/,String(count)):fallback),type));
 if(kind==='evidence')group.appendChild(dropdown('الاتجاه / Stance','stance',[['supports','يدعم / Supports'],['contradicts','يناقض / Contradicts']],values?.stance||'supports'));
 const remove=mk('button',{type:'button','data-action':'remove'},'حذف هذا الصف / Remove');
 remove.addEventListener('click',()=>{if(box.querySelectorAll('.row').length>1)row.remove();else $('status').textContent='يلزم صف واحد على الأقل';});
 row.append(hdr,group,remove);box.appendChild(row);
}
// Explicit listeners preserve behavior when captions are translated.
$('add-source').addEventListener('click',()=>add('sources'));
$('add-claim').addEventListener('click',()=>add('claims'));
$('add-evidence').addEventListener('click',()=>add('evidence'));
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
  const blob=new Blob([content],{type:'application/json;charset=utf-8'});
  const link=document.createElement('a'),url=URL.createObjectURL(blob);
  link.href=url;link.download=$('case-id').value.trim()+'.proofgap-case.json';
  document.body.appendChild(link);link.click();link.remove();
  URL.revokeObjectURL(url);
  $('status').textContent='تم إنشاء JSON. هذه مدخلات للقضية وليست تقرير نتائج. شغّل محرك ProofGap X لتحليلها.';
 }catch(error){$('status').textContent='تعذر التصدير: '+String(error.message||error);}
});
