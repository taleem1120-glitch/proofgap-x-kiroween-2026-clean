/**
 * Self-contained offline HTML viewer for one or two reports.
 * - No network: CSP `default-src 'none'`; inline script/style allowed only by SHA-256 hash; no connect/img/font sources.
 * - Reports are embedded as non-executable `application/json` blocks. serializeReport() already \u-escapes < > & U+2028/9,
 *   so embedded text cannot terminate the block. This function re-checks that invariant and refuses otherwise.
 * - Output is deterministic for identical reports.
 */
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const read = (name) => readFileSync(new URL(`../viewer/${name}`, import.meta.url), 'utf8');
const b64 = (s) => createHash('sha256').update(s, 'utf8').digest('base64');

export const DEFAULT_HTML_PROFILE = Object.freeze({
  title: 'ProofGap X report viewer',
  heading: 'ProofGap X — evidence independence & proof gaps',
  intro: 'Results describe the structure of support under declared provenance. They are not findings of truth, authenticity, intent or guilt.',
  footer: 'ProofGap X prototype · synthetic example data · not forensic software · not independently validated.',
});

export function renderHtml(serializedReports, options = {}) {
  const { title, heading, intro, footer } = { ...DEFAULT_HTML_PROFILE, ...options };
  const custom = Object.keys(options).length > 0;
  if (!Array.isArray(serializedReports) || serializedReports.length < 1 || serializedReports.length > 2) throw new Error('renderHtml expects 1 or 2 serialized reports');
  for (const r of serializedReports) {
    if (typeof r !== 'string' || /[<>&\u2028\u2029]/.test(r)) throw new Error('report text must come from serializeReport (unescaped markup characters found)');
    JSON.parse(r);
  }
  const js = read('i18n.js') + '\n' + read('app.js'), css = read('style.css');
  const csp = `default-src 'none'; script-src 'sha256-${b64(js)}'; style-src 'sha256-${b64(css)}'; img-src 'none'; connect-src 'none'; font-src 'none'; form-action 'none'; base-uri 'none'; object-src 'none'; frame-src 'none'`;
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const blocks = serializedReports.map((r, i) => `<script type="application/json" class="pgx-report" id="pgx-report-${i}">\n${r.trimEnd()}\n</script>`).join('\n');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="${esc(csp)}">
<meta name="referrer" content="no-referrer">
<title>${esc(title)}</title>
<style>${css}</style>
</head>
<body>
<a class="skip" href="#reports" id="pg-skip">Skip to reports</a>
<header class="top">
<h1>${custom ? esc(heading) : 'ProofGap X — evidence independence &amp; proof gaps'}</h1>
<p id="pg-offline">Offline viewer. Nothing is uploaded: this page has no network access (Content-Security-Policy) and only reads the reports embedded in it or files you choose below.</p>
<p id="pg-intro">${custom ? esc(intro) : 'Results describe the structure of support under <strong>declared</strong> provenance. They are not findings of truth, authenticity, intent or guilt.'}</p>
<p id="pg-translation-scope" role="note">Interface translations do not modify original report text.</p>\n<div class="controls"><label class="file"><span id="pg-language-caption">Language</span>: <select id="pg-language" aria-label="Interface language"><option value="en">English</option><option value="ar">العربية</option><option value="fr">Français</option><option value="es">Español</option><option value="de">Deutsch</option><option value="pt">Português</option><option value="tr">Türkçe</option><option value="fa">فارسی</option><option value="hi">हिन्दी</option><option value="zh">中文</option></select></label><label class="file"><span id="pg-open-files">Open 1–2 report JSON files</span>: <input id="file" type="file" accept="application/json,.json" multiple></label><span id="status" role="status" aria-live="polite"></span></div>
</header>
<main id="reports" class="grid" tabindex="-1"></main>
<footer id="pg-footer">${custom ? esc(footer) : 'ProofGap X prototype · synthetic example data · not forensic software · not independently validated.'}</footer>
${blocks}
<script>${js}</script>
</body>
</html>
`;
}
