import { canonicalize } from './canonical.js';

/**
 * Serialize a report as stable, pretty JSON. Characters that could enable
 * HTML/script injection if the file is embedded in a page are \u-escaped.
 * No timestamps: identical input yields byte-identical output.
 */
export function serializeReport(report) {
  const sorted = JSON.parse(canonicalize(report));
  return JSON.stringify(sorted, null, 2)
    .replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029') + '\n';
}
