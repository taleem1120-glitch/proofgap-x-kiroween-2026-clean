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

Both files must report OK, followed by VERIFIED commit .... A checksum mismatch, missing file, malformed manifest, or unsupported schema fails closed.

## Independent reviewer procedure

1. Verify SHA256SUMS before extracting or reviewing.
2. Extract source.tar in an isolated directory.
3. Confirm the source commit in manifest.json against the public repository and PR #44.
4. Re-run the documented tests in docs/INDEPENDENT_SECURITY_REVIEW_PACKET.md using the exact source commit.
5. Record reviewer identity, qualifications, independence/conflict disclosure, exact SHA, environment, scope, findings, severity, reproduction steps, limitations and retest results.
6. Return an attributed or signed report. Do not edit the manifest to imply reviewer approval.

## Evidence boundary

The manifest labels the available workflow runs as evidence for their own validated SHA (dff236fb0c92207ba648357331ae4a8ce06d721b). Those runs are historical evidence and do not validate a later source commit. The builder does not query GitHub dynamically. Re-check the run pages and obtain fresh successful exact-SHA runs for the source commit before treating it as release-validated.

The checksum proves byte integrity only. It does not prove authorship, authenticity, chain of custody, correctness, legal admissibility, reviewer independence or production readiness. The security audit, human assistive-technology review and deployment-specific privacy-owner approval remain open. The production decision therefore remains **NO-GO** until those gates are completed and retested.
