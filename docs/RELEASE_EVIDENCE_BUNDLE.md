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
2. Extract source.tar in an isolated directory for source inspection. The archive intentionally contains no `.git` directory.
3. Read `source.commit` from manifest.json and compare it with the intended PR #44 head before starting.
4. **For the full test suite, use a clean Git checkout of that exact commit.** The release-bundle tests invoke Git commands and therefore cannot run from the extracted `source.tar` directory alone. Example:

       SHA="$(node -p "require('./bundle/manifest.json').source.commit")"
       git clone --no-checkout https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean reviewer-checkout
       git -C reviewer-checkout fetch origin "$SHA"
       git -C reviewer-checkout checkout --detach "$SHA"
       test -z "$(git -C reviewer-checkout status --porcelain)"
       git -C reviewer-checkout archive --format=tar --prefix=source/ "$SHA" > source-from-checkout.tar
       sha256sum source-from-checkout.tar

   Compare the resulting archive digest with `sourceArchiveSha256` in the manifest. Then run:

       cd reviewer-checkout
       npm ci --ignore-scripts
       npm test

   If the repository is unavailable, the exact commit cannot be fetched, or the archive digest differs, stop and record the limitation rather than treating a partial archive-only test run as complete.
5. Record reviewer identity, qualifications, independence/conflict disclosure, exact SHA, environment, scope, findings, severity, reproduction steps, limitations and retest results.
6. Return an attributed or signed report. Do not edit the manifest to imply reviewer approval.

## Evidence boundary

The GitHub Actions workflow runs on a push to the candidate branch when release-bundle source, tests, or documentation files change, and also supports manual dispatch. It waits for successful CI, cross-browser/security, and showcase runs for the exact checked-out SHA, requires all three workflow types to have succeeded on that same SHA, and passes those records to the builder. Both the builder and standalone verifier reject any evidence record with a different SHA or non-success result. The standalone verifier also rejects a manifest with missing or duplicate required evidence even if an attacker recomputes the manifest checksum. In detached CI checkouts, the branch name is taken from `GITHUB_REF_NAME`. A locally generated bundle without `PROOFGAP_AUTOMATED_EVIDENCE_JSON` explicitly contains no automated workflow evidence. Never distribute a bundle with missing or mismatched exact-SHA evidence as a validated candidate.

The checksum proves byte integrity only. It does not prove authorship, authenticity, chain of custody, correctness, legal admissibility, reviewer independence or production readiness. The security audit, human assistive-technology review and deployment-specific privacy-owner approval remain open. The production decision therefore remains **NO-GO** until those gates are completed and retested.


## Candidate identity for reviewers

The `manifest.json` included in each bundle is the sole authoritative record of the bundle's source commit (`source.commit`) and exact-SHA automated workflow evidence (`automatedEvidence[].validatedCommit`). Reviewer packets and outreach notes must not hard-code a commit SHA or run IDs, because documentation-only commits can advance the PR head and make those references stale. Before kickoff, compare `source.commit` with the intended PR candidate and verify that every automated evidence record is successful and bound to that same commit. If the PR head differs, generate a new bundle for the new exact head.

## Candidate-triggered bundle generation

The release-evidence workflow is intentionally generated by a push to this candidate branch when one of its watched inputs changes. This avoids relying on the GitHub UI's manual-dispatch availability, which depends on the workflow being present on the repository's default branch. A qualifying documentation or builder change creates a new candidate SHA; CI, cross-browser/security, and showcase workflows must then all complete successfully for that exact SHA before the bundle job proceeds. Do not reuse an artifact from an earlier SHA, and do not treat a queued or skipped bundle run as a completed artifact. The artifact name includes the full candidate SHA so reviewers can distinguish candidates.
