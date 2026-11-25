# ProofGap X — Reproducible Release Evidence Bundle

**Status:** review artifact builder; not a production release mechanism.

## Purpose

Create a source archive tied to the exact checked-out Git commit, a machine-readable manifest, and SHA-256 checksums. This lets an external reviewer inspect a stable source object and detect byte changes after receipt.

## Prerequisites

- Node.js 20 or later
- Git
- A clean working tree
- The exact candidate commit checked out locally

## Build

From the repository root:

    node scripts/release-evidence-bundle.mjs

Or supply an output directory outside the repository:

    node scripts/release-evidence-bundle.mjs /absolute/path/to/proofgap-review-bundle

The command refuses to package a dirty working tree and refuses to overwrite a non-empty output directory. It creates:

- source.tar — Git archive of the exact HEAD commit; no working-tree-only files.
- manifest.json — repository, PR, commit, branch, package version, archive digest, automated evidence references, open assurance gates and limitations.
- SHA256SUMS — checksums for the manifest and source archive.

## Verify

On the recipient's machine:

    node scripts/release-evidence-bundle.mjs --verify /path/to/proofgap-review-bundle

Both files must report OK, followed by exact-SHA automated evidence verification and VERIFIED commit .... The verifier also requires the three named workflow records (CI, cross-browser/security, and showcase) to be successful, linked to HTTPS run URLs, carry positive run IDs, and match the source commit. A checksum mismatch, missing file, malformed manifest, missing/duplicate evidence, or mismatched SHA fails closed.

## Independent reviewer procedure

1. Verify SHA256SUMS before extracting or reviewing.
2. Extract source.tar in an isolated directory.
3. Confirm the source commit in manifest.json against the public repository and PR #44.
4. Re-run the documented tests in docs/INDEPENDENT_SECURITY_REVIEW_PACKET.md using the exact source commit.
5. Record reviewer identity, qualifications, independence/conflict disclosure, exact SHA, environment, scope, findings, severity, reproduction steps, limitations and retest results.
6. Return an attributed or signed report. Do not edit the manifest to imply reviewer approval.

## Evidence boundary

The GitHub Actions workflow runs on a push to the candidate branch when release-bundle source, tests, or documentation files change, and also supports manual dispatch. It waits for successful CI, cross-browser/security, and showcase runs for the exact checked-out SHA, requires all three workflow types to have succeeded on that same SHA, and passes those records to the builder. Both the builder and standalone verifier reject any evidence record with a different SHA or non-success result. The standalone verifier also rejects a manifest with missing or duplicate required evidence even if an attacker recomputes the manifest checksum. In detached CI checkouts, the branch name is taken from `GITHUB_REF_NAME`. A locally generated bundle without `PROOFGAP_AUTOMATED_EVIDENCE_JSON` explicitly contains no automated workflow evidence. Never distribute a bundle with missing or mismatched exact-SHA evidence as a validated candidate.

The checksum proves byte integrity only. It does not prove authorship, authenticity, chain of custody, correctness, legal admissibility, reviewer independence or production readiness. The security audit, human assistive-technology review and deployment-specific privacy-owner approval remain open. The production decision therefore remains **NO-GO** until those gates are completed and retested.
