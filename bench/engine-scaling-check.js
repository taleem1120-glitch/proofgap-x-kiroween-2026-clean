// Reproducible workload and performance telemetry. Author-generated, not a commercial benchmark.
// This script verifies larger input analysis returns finite outputs; timing is observational.
import {performance} from 'node:perf_hooks';
import {analyzeCase} from '../src/analyze.js';
import {validateCase} from '../src/validate.js';
import {serializeReport} from '../src/report.js';
import {createHash} from 'node:crypto';
const sha=s=>createHash('sha256').update(s).digest('hex');
function fixture(n){
 const sources=[],claims=[{id:'claim-1',statement:'Synthetic test statement'}],evidence=[];
 for(let i=0;i<n;i++){
  const id='src-'+i;
  sources.push({id,name:'Synthetic primary '+i});
  evidence.push({id:'e-'+i,sourceId:id,description:'Synthetic independent evidence '+i,
   links:[{claimId:'claim-1',stance:'supports',strength:.6}]});
 }
 return{schemaVersion:'1.0',caseId:'PERF-'+n,title:'Synthetic performance workload',sources,claims,evidence};
}
const results=[];
for(const n of [12,36,72,144,288]){
 const input=fixture(n);
 const start=performance.now();
 const report=analyzeCase(validateCase(input));
 const ms=Math.round((performance.now()-start)*100)/100;
 // Conservative CI runaway guard, not a user-facing latency or throughput promise.
 if(ms>10000)throw new Error('analysis exceeded 10 second safety ceiling at '+n+' synthetic sources');
 const bytes=Buffer.byteLength(serializeReport(report));
 if(report.claims[0].corroboration.independentSupportOrigins!==n)throw Error('unrelated roots unexpectedly merged at '+n);
 if(!Number.isFinite(ms)||bytes<1000)throw Error('invalid benchmark result');
 results.push({sources:n,evidence:n,claims:1,analysisMilliseconds:ms,reportBytes:bytes,outputSha256:sha(serializeReport(report))});
}
console.log(JSON.stringify({
 kind:'author_generated_scaling_observation_not_hardware_normalized',
 node:process.version,
 platform:process.platform,
 peakRssBytes:process.memoryUsage().rss,
 output:results,
 caution:'Machine-relative measurements; not evidence of field accuracy, vendor superiority, or a guaranteed latency SLA.'
},null,2));
