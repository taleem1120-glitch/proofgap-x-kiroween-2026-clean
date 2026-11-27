# ProofGap X — Deployment Architecture Decision

**Decision status:** proposed architecture for review; no deployment has been created or authorized.
**Candidate branch:** `release/proofgap-final-gate-2026-11-24`
**Decision scope:** competition demonstration and commercial evaluation only. This document does not approve production use.

## Decision

Use a split deployment model:

1. **Public competition and product demonstration:** a static Netlify site containing only a curated product landing page and the two synthetic, offline-capable HTML showcases.
2. **Customer evaluation and operational use:** a downloadable, versioned package run locally by the customer, or deployed inside the customer's controlled environment after a separate security, privacy, support and licensing review.
3. **Source and release governance:** GitHub remains the source-of-truth for code, pull-request review, CI, exact-SHA validation and review artifacts. A hosted demo must never be treated as a substitute for the reviewed source bundle.

Do not deploy the current candidate as a production service. PR #44 is Draft and the candidate is not independently security-reviewed, human-accessibility-approved, or privacy-owner-approved.

## Why this split

ProofGap's inspected product architecture is local-first:
- The CLI reads case/note inputs and optional evidence files from paths selected by the operator.
- The browser tools process user-selected files in the browser and create downloads; the inspected application code does not send case content to an application API.
- The language preference is stored in browser localStorage.
- A remotely hosted static page still causes ordinary HTTP requests. The hosting/CDN provider may process IP address, user agent, timestamps and access logs under its own terms and configuration.

A public static demo is useful for judges, buyers and evaluators, but it is not an appropriate place to upload real investigation files or sensitive customer evidence.

## Public demo contents

Allow-list only:
- A short, accurate product overview and explicit prototype/research limitations.
- Synthetic and fictional examples only.
- `viewer/showcase.html` (ProofGap X showcase).
- `apps/proofgap-cite/showcase.html` (ProofGap Cite showcase).
- Links to the public source repository, the competition submission, documentation and a contact channel supplied by the maintainer.

Do not publish:
- Real case files, victim or suspect information, customer data, private evidence, credentials, API keys, access tokens, internal support correspondence or reviewer-only material.
- CI artifacts or review bundles as public demo downloads unless the maintainer separately approves their disclosure.
- Claims of independent certification, forensic acquisition, verified authenticity, chain of custody, legal admissibility, guilt/intent detection, enterprise readiness or measured real-world accuracy.

## Netlify configuration requirements

When the maintainer connects the site:
1. Create a dedicated Netlify site for the public demo; do not repoint or overwrite any existing project without checking its current purpose and domain.
2. Use a dedicated public-demo directory as the publish root. Never publish the repository root: it contains source, tests, internal review documents and workflows.
3. Populate the publish directory from an explicit allow-list during a reproducible build. Fail the build if an expected showcase is missing or if a forbidden path is included.
4. Use a stable custom domain only after ownership and DNS are confirmed. Until then, the Netlify-provided URL is sufficient for competition evaluation.
5. Configure production deploys to come only from a specifically approved branch/commit. Do not make the current release branch or PR #44 a production deploy source while the release gate is open.
6. Treat Deploy Previews as public unless access controls are explicitly enabled and tested. Do not include secrets in preview variables or build output. Disable analytics and third-party scripts unless separately justified and privacy-reviewed.
7. Preserve deploy permalinks and record the source commit and deploy identifier for each public release.
8. Verify the published pages, response headers, CSP, links, asset inventory, mobile/RTL behavior and that no case content is transmitted to any application endpoint.

Netlify supports separate production, branch and Deploy Preview contexts, and per-context configuration. Preview URLs are distinct from production URLs; previews may be shared by link, so they must not be assumed private. See the official references below.

## Customer delivery model

The first commercial delivery should be a signed-off, versioned offline package, not a multi-tenant cloud service:
- Reproducible source/package tied to an exact commit and release manifest.
- Supported Node.js version and install/run instructions.
- SBOM/dependency inventory and licence notices.
- Customer-side installation and update procedure.
- Explicit supported-platform matrix; do not claim Windows/macOS support without tests.
- Data-flow, retention, deletion, backup, access-control and incident-response responsibilities.
- A customer acceptance checklist and a support/maintenance boundary.

A managed or multi-tenant SaaS architecture is a separate product decision. It would require a server-side threat model, tenant isolation, authentication/authorization, encryption/key management, audit logging, backup/restore, incident response, data residency and privacy/legal review. None of those controls is implied by the current local-first prototype.

## Privacy approval required before public deployment

The privacy owner must review and record:
- Actual Netlify site, DNS, CDN, access-log, analytics and third-party integration settings.
- Published asset inventory and whether any external requests occur.
- Applicable privacy notice and lawful basis for visitor metadata under the intended jurisdictions.
- Log retention, access, deletion and incident contact process.
- Whether any form/contact widget collects personal data and where it is sent.
- Separation between public synthetic demo data and customer case data.

For customer installations, the customer's privacy/legal owner must approve the local endpoint, backups, operating-system telemetry, retention/deletion and legal basis. The project maintainer cannot sign on behalf of a customer organisation.

## Acceptance gates

### Public demo can go live only when
- The demo allow-list is built and inspected from a clean checkout.
- CI, cross-browser/security and showcase regeneration pass on the exact source SHA.
- The published deploy is verified against that SHA and its files are inspected.
- The hosting-specific privacy review is complete and signed by the responsible owner.
- The public copy accurately states product limitations.

### Customer production use can be approved only when
- Independent security review and remediation/retest are complete.
- Human keyboard and screen-reader evaluation is complete.
- Platform support is tested for every platform claimed.
- Privacy/legal and operational controls are approved for the customer's environment.
- A named release owner approves the exact final SHA and package.

## Official platform references

- Netlify deploy contexts and production/preview separation: https://docs.netlify.com/deploy/deploy-overview/
- Netlify Deploy Preview behavior and access controls: https://docs.netlify.com/deploy/deploy-types/deploy-previews/
- Netlify production deploy behavior: https://docs.netlify.com/deploy/deploy-types/production-deploy/
- Netlify environment variables and deploy contexts: https://docs.netlify.com/build/environment-variables/overview/

## Current disposition

**NO DEPLOYMENT / NO PRODUCTION APPROVAL.** This is an architecture decision record to guide the next implementation step. No Netlify account, site, DNS, custom domain, build hook, environment variable, or production deployment has been changed by this document.
