# ProofGap X / ProofGap Cite — Independent Security Review Packet

**Purpose:** provide an external security reviewer with a reproducible, bounded scope and honest evidence. This is not the review report and does not assert that a third party has reviewed the product.

## Candidate under review

- Repository: `taleem1120-glitch/proofgap-x-kiroween-2026-clean`
- Candidate branch: `release/proofgap-final-gate-2026-11-24`
- Exact candidate source commit: read `source.commit` from the supplied `manifest.json`; that field is authoritative. Confirm the manifest commit against the source archive and PR #44 immediately before review kickoff. Do not rely on a branch name or a hard-coded SHA in this packet.
- Candidate-specific automated evidence is recorded in `manifest.json` under `automatedEvidence`. Each record must have `result: success` and `validatedCommit` equal to `source.commit`. Reconfirm the current PR head and all run pages before review kickoff. Any code change requires a new exact-SHA review bundle and retest.
- Runtime: Node.js >=20; zero declared runtime dependencies; local/offline analysis model.

## Review scope requested

1. Input parsing, schema/semantic validation, prototype-pollution defenses, resource limits and malformed Unicode/control handling.
2. Evidence path handling, symlink/hard-link/race conditions, bounded file reads, hash verification semantics and no-overwrite output creation.
3. ProofGap Cite Markdown parsing, saved-file path containment, text-copy review limits, false-positive/false-negative handling and abstention.
4. HTML rendering, CSP, escaping, DOM construction, local file picker, Blob downloads and browser storage.
5. CLI argument handling, error messages, filesystem permissions and output path behaviour.
6. Dependency and supply-chain posture, GitHub Actions permissions, pinned actions, lockfile, packaging and release process.
7. Threat model completeness, residual risks, user-facing claims, privacy/data-flow notes and incident response.

## Reproduction commands

```sh
node --version
npm ci --ignore-scripts
npm test
npm run validate:local
npm audit --audit-level=high
node scripts/release-source-gate.js
npm pack --dry-run --json
```

Browser review:
```sh
npm install --prefix /tmp/proofgap-playwright --no-save --ignore-scripts playwright@1.56.1 @axe-core/playwright@4.10.2
/tmp/proofgap-playwright/node_modules/.bin/playwright install --with-deps chromium firefox webkit
NODE_PATH=/tmp/proofgap-playwright/node_modules PW_BROWSER=chromium node scripts/e2e-responsive.cjs
NODE_PATH=/tmp/proofgap-playwright/node_modules PW_BROWSER=chromium node scripts/e2e-accessibility.cjs
```
Repeat browser commands for Firefox and WebKit. CI run links and exact SHA must be recorded separately.

## Existing evidence supplied for review

- `docs/THREAT_MODEL.md` — author-maintained threat model, explicitly not independently reviewed.
- `docs/PRIVACY_AND_DATA_FLOW.md` — source-based data-flow review; hosting and endpoint controls remain out of scope.
- `docs/BENCHMARK.md` — author-built synthetic benchmark protocol and limitations.
- `docs/FINAL_RELEASE_GATE_AND_OPERATOR_RUNBOOK.md` — release acceptance criteria.
- Automated test suites: `test/security.test.js`, `test/integrity.test.js`, `test/observed.test.js`, `test/fuzz.test.js`, `test/cite.test.js`, `test/viewer.test.js`, `test/core.test.js`, `test/cli.test.js`.
- CI uses read-only repository permissions, checkout with persisted credentials disabled, pinned action SHAs, and dependency installation without lifecycle scripts for the application test jobs.

## Known risks to challenge (not accepted as resolved)

- Declared provenance can be false or incomplete; hidden common origin is undetectable without a cue.
- SHA-256 equality proves byte equality only; it does not prove authenticity, authorship, provenance, truth or independence.
- Re-encoded, edited, translated, cropped, OCR'd, paraphrased or otherwise transformed copies may evade detection.
- Byte-identical public documents/templates may cause conservative over-merging.
- Filesystem race mitigations are not a formal descriptor-relative race-free traversal guarantee.
- Windows/macOS and case-insensitive/Unicode-normalising filesystems are not established by current Ubuntu CI.
- Reports are not cryptographically signed and ProofGap does not establish chain of custody.
- Automated static checks and browser tests are not a penetration test or independent assurance.

## Required reviewer deliverables

- Reviewer identity, organisation, qualifications and independence/conflict statement.
- Exact commit SHA, test environment and scope actually covered.
- Methodology and tools/versions; tests not performed must be listed.
- Findings with severity, affected file/line, exploitability, impact, reproduction, evidence and recommended remediation.
- Explicit review of false positives/negatives and residual risk.
- Retest results for each remediation; unresolved and accepted risks identified by owner.
- Signed conclusion: PASS / CONDITIONAL / FAIL, with date.
- Permission to publish a redacted executive summary, if applicable.

## Disclosure and handling

Use GitHub's private vulnerability reporting for this repository if it is enabled, or coordinate a private channel directly with the repository owner before sending exploit details. Do not put secrets, victim data, live evidence or working exploit payloads in public issues or pull requests. No security contact address is invented in this packet.

**Current disposition:** external independent review NOT COMPLETED. A green CI run, author self-review or this packet must never be represented as an independent security audit.
