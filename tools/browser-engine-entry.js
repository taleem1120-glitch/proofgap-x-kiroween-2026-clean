// Entry point bundles the REAL shared src/analyze.js, not a reimplemented scoring engine.
import {analyzeCase} from '../src/analyze.js';
import {serializeReport} from '../src/report.js';
import {buildCaseFromRows} from './case-builder-core.js';
export function analyzeBuilderRows(input){
 const validated=buildCaseFromRows(input);
 const report=analyzeCase(validated);
 return {caseData:validated,report,reportText:serializeReport(report)};
}
