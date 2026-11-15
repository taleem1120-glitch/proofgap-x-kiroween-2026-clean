// Diagnostic ONLY: generated scenarios, not an independent/real-world benchmark.
import { createHash } from 'node:crypto';
import { compareTextCopies } from '../src/text-copy-cues.js';

const hash = (s) => createHash('sha256').update(s).digest('hex');
const base = (n) => Array.from({length: 70}, (_, i) => `investigative report section${i} dataset${n} source integrity record`).join(' ');
const fixtures = [];
for (let n = 0; n < 100; n++) {
  const original = base(n);
  fixtures.push({ truth: true, group: 'format_only', a: original, b: original.replaceAll('report', 'REPORT').replaceAll(' ', '  ') + ' editor note' });
  fixtures.push({ truth: true, group: 'byte_identical', a: original, b: original });
  fixtures.push({ truth: false, group: 'unrelated', a: original, b: Array.from({length:70},(_,i)=>`climate survey station${n} reading${i} unrelated material`).join(' ') });
}
function score(predict) {
  const stats = {TP:0,FP:0,TN:0,FN:0};
  for (const f of fixtures) stats[f.truth ? (predict(f) ? 'TP' : 'FN') : (predict(f) ? 'FP' : 'TN')]++;
  const precision = stats.TP + stats.FP ? stats.TP / (stats.TP + stats.FP) : null;
  const recall = stats.TP + stats.FN ? stats.TP / (stats.TP + stats.FN) : null;
  const fpr = stats.FP + stats.TN ? stats.FP / (stats.FP + stats.TN) : null;
  return {...stats, precision, recall, fpr};
}
const output = {
  kind: 'synthetic_author_built_diagnostic_not_independent_validation',
  fixtures: fixtures.length,
  exactBytes: score(f=>hash(f.a)===hash(f.b)),
  advisoryTextResemblance: score(f=>compareTextCopies(f.a,f.b).suspected),
  limitations: ['Synthetic repetitive text', 'No real case data', 'High risk of false alerts on shared boilerplate not measured', 'Not a claim of forensic authenticity or market superiority']
};
console.log(JSON.stringify(output,null,2));
