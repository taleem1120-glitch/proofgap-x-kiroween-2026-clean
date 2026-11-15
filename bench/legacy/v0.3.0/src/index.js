import { parseCaseText } from './validate.js';
import { analyzeCase } from './analyze.js';
import { serializeReport } from './report.js';
import { verifyEvidenceFiles } from './integrity.js';
import { renderText } from './render.js';
import { renderHtml } from './html.js';
export { parseCaseText, validateCase, CaseValidationError } from './validate.js';
export { analyzeCase, resolveOrigins, POLICY, ANALYSIS_VERSION } from './analyze.js';
export { verifyEvidenceFiles, integrityNotRequested, checkRelativePath, INTEGRITY_STATES, DEFAULT_INTEGRITY_LIMITS, IntegrityConfigError } from './integrity.js';
export { renderText } from './render.js';
export { classify } from './classify.js';
export { planClaim } from './planner.js';
export { buildGraph } from './graph.js';
export { renderHtml } from './html.js';
export { serializeReport } from './report.js';
export { DEFAULT_LIMITS } from './limits.js';
export { validateSchema, caseSchema } from './schema.js';

export const analyzeText = (text, limits, opts = {}) => {
  const c = parseCaseText(text, limits);
  const integrity = opts.evidenceDir ? verifyEvidenceFiles(c.evidence, { evidenceDir: opts.evidenceDir, limits: opts.integrityLimits }) : undefined;
  const report = analyzeCase(c, { integrity });
  if (opts.format === 'text') return renderText(report);
  if (opts.format === 'html') return renderHtml([serializeReport(report), ...(opts.compareText !== undefined ? [analyzeText(opts.compareText, limits, { ...opts, compareText: undefined, format: 'json' })] : [])]);
  return serializeReport(report);
};
