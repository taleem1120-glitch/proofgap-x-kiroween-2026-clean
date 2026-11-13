import { parseCaseText } from './validate.js';
import { analyzeCase } from './analyze.js';
import { serializeReport } from './report.js';
export { parseCaseText, validateCase, CaseValidationError } from './validate.js';
export { analyzeCase, resolveOrigins } from './analyze.js';
export { serializeReport } from './report.js';
export { DEFAULT_LIMITS } from './limits.js';

export const analyzeText = (text, limits) => serializeReport(analyzeCase(parseCaseText(text, limits)));
