# Security Policy

## Supported scope

Security reports are welcome for the current candidate branch and the published source tree. ProofGap is a research prototype, not production forensic software. Do not submit live case files, victim data, personal information, credentials or classified material.

## Reporting a vulnerability

If GitHub private vulnerability reporting is enabled for this repository, use the repository's **Security → Advisories → Report a vulnerability** flow. If it is not enabled, contact the repository owner through a private channel before sharing technical exploit details. Do not publish exploit details in public issues or pull requests until a coordinated disclosure decision is agreed.

No response-time SLA or staffed security-response team is currently represented by this project.

## Include

- Affected commit SHA, component and environment.
- Impact and realistic attacker prerequisites.
- Minimal synthetic reproduction steps and expected/actual behaviour.
- Suggested mitigation, if known.
- Whether the issue is already public or actively exploited.

## Handling

The maintainer will assess reproducibility and severity, coordinate a fix and determine whether a public advisory is appropriate. Do not include real evidence or confidential case data in a report. The project does not claim an independent security audit; see `docs/INDEPENDENT_SECURITY_REVIEW_PACKET.md` and `docs/THREAT_MODEL.md`.

## Scope limits

The current project does not provide a managed service, cloud case storage, signed forensic evidence, chain of custody, or a 24/7 incident response service. Host operating system, browser, Node.js distribution, npm registry, endpoint security and hosting-provider risks are outside the application's own control and require separate assessment.
