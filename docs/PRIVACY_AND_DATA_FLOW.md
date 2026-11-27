# ProofGap X / ProofGap Cite — Privacy and Data-Flow Review

**Status:** implementation-level review prepared from source on 24 November 2026; not a legal opinion, organisational privacy assessment, or independent privacy audit. Revalidate against the exact release commit before use.

## Product and deployment boundary

The repository contains two different operating surfaces:

1. **Local CLI:** Node.js reads the user-selected case/note and optional evidence/source directory from the local filesystem. It writes reports only when the operator explicitly supplies an output path; the shared writer uses exclusive-create semantics and refuses to overwrite an existing path. Otherwise results are written to stdout.
2. **Browser interface:** static HTML/CSS/JavaScript performs case construction and report viewing in the browser. CSP in the checked-in pages disallows network connections, remote images, frames, forms and object embedding. The report viewer imports files selected by the user through a file picker and parses them in the browser. The case builder creates JSON downloads using Blob/object URLs. It does not send case content to an application API.

The application is designed for local/offline analysis. This is not a guarantee about every possible deployment environment, browser extension, host operating system, endpoint security product, or third-party hosting provider.

## Data inventory and flows

| Data | Entry point | Processing | Persistence / destination |
|---|---|---|---|
| Case JSON and claim/source/evidence text | CLI argument path or browser form | Local validation and deterministic analysis | CLI stdout or operator-selected new report file; browser memory until page closes or user downloads JSON |
| Optional evidence files | Explicit `--evidence-dir` CLI option | Bounded local reads and SHA-256 byte comparison | No upload by application; hashes and statuses appear in report |
| Markdown note and saved text copies | ProofGap Cite CLI paths | Local parsing, lineage analysis, optional bounded text-copy review | stdout or operator-selected new report file |
| Report JSON | CLI output or browser-generated report | Serialization and display | User-selected download or output file |
| Interface language | Case-builder language selector | UI localization only | `localStorage` key `proofgap-lang`; not case content |
| Static page request metadata | Browser loads hosted static pages, if deployed remotely | Hosting/CDN infrastructure handles the HTTP request | Hosting provider may retain IP address, user agent, request time and access logs under its own policy; not controlled by the application |

## Observed source-level controls

- Static pages set a Content Security Policy with `connect-src 'none'`; the report viewer CSP also disallows external images, forms, frames and objects.
- The viewer source is covered by regression tests against network APIs, dynamic code execution, HTML-string insertion APIs, browser storage, and unsafe style imports. This is a static regression check, not proof of absence.
- The case-builder writes only a language preference to localStorage. Case content and reports are not written to browser storage by the inspected UI code.
- File exports use Blob/object URLs and revoke those URLs after download.
- CLI evidence verification is opt-in, bounded by file count, size, total bytes and time, rejects unsafe paths/symlinks and does not alter source evidence files.
- CLI report creation refuses overwrite and uses owner-only file mode where supported; filesystem semantics vary by platform.
- The package declares zero runtime dependencies. CI installs isolated Playwright tooling only for test execution; that test dependency is not part of the application runtime package.

## Data minimisation and operator controls

1. Use synthetic or properly de-identified examples during demonstrations and review.
2. Do not use live case files, personal data, credentials, classified information, or sensitive victim data in public issues, pull requests, screenshots, demo videos or shared validation artifacts.
3. Store source evidence read-only and use a separate working copy. Supply only files necessary for the specific check.
4. Do not put case content in filenames, branch names, commit messages, logs or support requests.
5. Protect the endpoint, browser profile, downloaded reports and backups using the organisation's retention, encryption, access-control and deletion policy.
6. When hosting the static demo, publish only synthetic examples and provide the hosting provider's privacy notice separately. The application CSP does not prevent the host from recording ordinary web access logs.
7. Clear the case-builder's language preference only if the operator wishes to remove that non-case preference; browser storage controls are managed by the browser.

## Retention, deletion and sharing

The application has no central case-data account, server-side case database, telemetry endpoint or in-product cloud sync in the inspected source. CLI files and browser downloads are under operator control. The app cannot delete files outside its own explicitly selected output workflow, and it cannot control OS backups, browser downloads history, host/CDN logs, screen captures or endpoint telemetry.

A privacy owner must define retention periods, access control, secure deletion, backup handling, incident response and jurisdiction-specific lawful basis before organisational deployment. Those controls are not implemented by ProofGap.

## Review findings and unresolved questions

- [x] Static CSP and no-network design reviewed at source level for the listed pages.
- [x] Local CLI read/write boundaries and opt-in evidence directory reviewed.
- [x] Browser localStorage use identified: language preference only.
- [ ] Independent verification of all shipped assets and transitive build/deployment pipeline.
- [ ] Hosting provider, CDN, DNS, analytics and access-log configuration review for the actual deployment.
- [ ] Legal/privacy-owner approval for each jurisdiction and data classification.
- [ ] Endpoint, browser extension, backup and organisational telemetry assessment.
- [ ] Representative analyst walkthrough to validate that users understand what is stored and where.

**Disposition:** privacy-by-design controls are visible in the inspected source, but organisational privacy approval and hosting/endpoint review remain OPEN. Do not claim a completed legal or independent privacy audit.
