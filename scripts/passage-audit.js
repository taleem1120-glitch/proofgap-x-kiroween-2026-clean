#!/usr/bin/env node
// Separate human-review-only passage discovery; never authenticates source lineage.
import { readInputFile } from '../src/core.js';
import { detectSharedPassage } from '../src/text-copy-cues.js';
try {
  if (process.argv.length!==3) throw new TypeError('Usage: node scripts/passage-audit.js <documents.json>');
  const data=JSON.parse(readInputFile(process.argv[2],500_000));
  if (!data||!Array.isArray(data.documents)||data.documents.length>12)
    throw new TypeError('expected documents array of up to 12 entries');
  const seen=new Set();
  for (const item of data.documents){
    if(typeof item?.id!=='string'||!item.id||typeof item.text!=='string'||item.text.length>50_000||seen.has(item.id))
      throw new TypeError('invalid, duplicated or oversized document');
    seen.add(item.id);
  }
  const warnings=[];
  for(let i=0;i<data.documents.length;i++)for(let j=i+1;j<data.documents.length;j++){
    const a=data.documents[i],b=data.documents[j];
    const cue=detectSharedPassage(a.text,b.text);
    if(cue.review)warnings.push({
      refs:[a.id,b.id].sort(),
      basis:'shared_passage_unverified_review_only',
      longestRunTokens:cue.longestRunTokens,
      alert:'may_be_quotation_template_or_reuse; origin_not_proven'
    });
  }
  process.stdout.write(JSON.stringify({tool:'ProofGap passage review',verification:'not_verified',warnings,
    notice:'Common templates and lawful quotations can trigger false alerts; manually verify provenance.'},null,2)+'\n');
}catch(error){
  process.stderr.write('Passage audit rejected input: '+String(error.message||error)+'\n');
  process.exitCode=1;
}
