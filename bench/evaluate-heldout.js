#!/usr/bin/env node
/** Evaluation harness. Input labels MUST come from independently adjudicated
 * held-out data for an independent benchmark; this script does not create any.
 * Do not equate lexical similarity with a known source-origin label.
 */
import { readInputFile } from '../src/core.js';
import { compareTextCopies } from '../src/text-copy-cues.js';
import { createHash } from 'node:crypto';
const sha = s => createHash('sha256').update(s,'utf8').digest('hex');
const metrics = m => ({
  ...m,
  precision: m.tp+m.fp ? m.tp/(m.tp+m.fp) : null,
  recall: m.tp+m.fn ? m.tp/(m.tp+m.fn) : null,
  falsePositiveRate: m.fp+m.tn ? m.fp/(m.fp+m.tn) : null,
  specificity: m.fp+m.tn ? m.tn/(m.fp+m.tn) : null,
  coverage: m.tp+m.fp+m.tn+m.fn+m.abstainedPositive+m.abstainedNegative
    ? (m.tp+m.fp+m.tn+m.fn)/(m.tp+m.fp+m.tn+m.fn+m.abstainedPositive+m.abstainedNegative) : null
});
function run(cases, method) {
  const m={tp:0,fp:0,tn:0,fn:0,unknown:0,abstainedPositive:0,abstainedNegative:0};
  const grouped={};
  for(const row of cases) {
    const raw=method==='sha256'
      ? {suspected:sha(row.a)===sha(row.b),reason:'exact_bytes'}
      : compareTextCopies(row.a,row.b);
    if (row.label==='unknown') {m.unknown++;continue;}
    const positive=row.label==='same_origin';
    const group=grouped[row.group]??={tp:0,fp:0,tn:0,fn:0,abstainedPositive:0,abstainedNegative:0};
    if (raw.reason==='insufficient_or_unsupported_text') {
      const bucket=positive?'abstainedPositive':'abstainedNegative';
      m[bucket]++;group[bucket]++;continue;
    }
    const bucket=raw.suspected?(positive?'tp':'fp'):(positive?'fn':'tn');
    m[bucket]++;
    group[bucket]++;
  }
  return {overall:metrics(m),byGroup:Object.fromEntries(Object.entries(grouped).map(([k,v])=>[k,metrics(v)]))};
}
try {
  if(process.argv.length!==3)throw new TypeError('Usage: node bench/evaluate-heldout.js <authorized-labeled-cases.json>');
  const data=JSON.parse(readInputFile(process.argv[2],6_000_000));
  if(!data||!Array.isArray(data.cases)||data.cases.length<1||data.cases.length>2000)
    throw new TypeError('cases must contain 1 to 2000 labeled examples');
  const ids=new Set();let total=0;
  for(const x of data.cases) {
    if(!x||typeof x.id!=='string'||!x.id||ids.has(x.id)||
      typeof x.a!=='string'||typeof x.b!=='string'||
      x.a.length>200000||x.b.length>200000||
      !['same_origin','different_origin','unknown'].includes(x.label)||
      typeof x.group!=='string'||!/^[-\w]{1,40}$/.test(x.group))
      throw new TypeError('invalid case: require unique id, bounded texts, label and category');
    total += x.a.length+x.b.length;
    if(total>5_000_000)throw new RangeError('evaluation input character budget exceeded');
    ids.add(x.id);
  }
  const output={
    tool:'ProofGap held-out evaluation harness',
    datasetStatus:data.independentAdjudication===true?'self_attested_independence_not_verified':'unverified_dataset',
    important:'Source ancestry is external ground truth, never established by this similarity detector. Independent evaluators must verify collection, labels, split by source family, and no tuning on the held-out set.',
    cases:data.cases.length,
    unknownLabelsExcludedFromRates:data.cases.filter(x=>x.label==='unknown').length,
    sha256:run(data.cases,'sha256'),
    lexicalCue:run(data.cases,'lexical')
  };
  process.stdout.write(JSON.stringify(output,null,2)+'\n');
} catch(err) {
  process.stderr.write('Evaluation rejected: '+String(err.message||err)+'\n');
  process.exitCode=1;
}
