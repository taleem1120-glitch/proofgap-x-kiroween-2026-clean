# Phase 1 Requirements (EARS-style)

Scope: bounded vertical slice. Not forensic software; no certainty claims.

- R1. WHEN a JSON case file is supplied, THE SYSTEM SHALL validate it against schema 1.0 and reject malformed input with path-specific issues.
- R2. THE SYSTEM SHALL track provenance: each evidence item references a source; sources may declare `derivedFrom` and/or `originGroup`.
- R3. THE SYSTEM SHALL compute source independence by resolving derivation chains to root origins; derived copies and shared origin groups SHALL NOT count as independent.
- R4. THE SYSTEM SHALL detect duplicate evidence (same sha256, or same source + normalized description) and exclude duplicates from scoring.
- R5. THE SYSTEM SHALL classify each claim: `no_evidence`, `insufficient_support` (<2 independent origins), `supported_by_independent_origins`, `contradicted`, `conflicting`.
- R6. THE SYSTEM SHALL explain each status in plain language and SHALL NOT declare guilt, intent, or forensic authenticity.
- R7. THE SYSTEM SHALL export reports as JSON that are byte-reproducible for identical input (no timestamps, sorted keys, input SHA-256 included).
- R8. THE SYSTEM SHALL enforce limits (bytes, item counts, string length, derivation depth, issue count), reject prototype-pollution keys and control characters, and reject derivation cycles.
- R9. THE SYSTEM SHALL make no network calls and SHALL NOT transmit case data. The CLI SHALL NOT overwrite existing output files.
- R10. Report output SHALL escape `< > & U+2028 U+2029`.

## Phase 2 additions
- R11. THE SYSTEM SHALL validate every case against a versioned JSON Schema (rejecting unsupported properties, unsafe ids, out-of-range values) before analysis.
- R12. THE SYSTEM SHALL report validation errors with `$`-style paths and SHALL NOT emit stack traces from the CLI.
- R13. THE CLI SHALL read at most the size limit, accept only regular files, and SHALL NOT overwrite any existing output path.
- R14. Text fields SHALL reject control characters, bidirectional control characters and unpaired surrogates.

## Phase 3 additions
- R15. Independence SHALL be computed from declared provenance as connected groups of shared roots/origin groups/artifacts, SHALL be explained per cluster, and SHALL always be labelled as declared, never verified.
- R16. Duplicate evidence SHALL be merged (links kept, counted once); a contradiction SHALL NOT be lost by deduplication; results SHALL NOT depend on id ordering.
- R17. Derived evidence SHALL NOT raise an origin's strength or add origins.
- R18. For each claim THE SYSTEM SHALL emit LOGICAL findings and ranked HEURISTIC recommendations, each stating what it would and would not show, referencing only identifiers that exist in the case.
- R19. WHEN `--evidence-dir` is given, THE SYSTEM SHALL verify declared SHA-256 values only against regular, non-symlink files inside that directory under file-count/size/total/time limits, reporting exactly one of VERIFIED, MISMATCH, MISSING, UNSAFE_PATH, NOT_CHECKED per evidence item; otherwise all declared hashes SHALL be shown as unverified.
- R20. Reports SHALL be available as machine-readable JSON and human-readable text, deterministic for identical input.

## Phase 5 additions
- R21. Independence SHALL be evaluated per claim over the sources that bear on it; adding evidence SHALL NOT lower a claim's independent-origin count; derived evidence SHALL NOT raise it or its score.
- R22. Every relationship in the graph SHALL carry exactly one basis: verified, declared, suspected or unknown.
- R23. THE SYSTEM SHALL report a hard classification (`status`) and a separate `decision` that abstains when a heuristic cue links two support origins.
- R24. For each claim THE SYSTEM SHALL produce a counterfactual plan whose outcomes are computed by the same classification rule, marked hypothetical, citing only existing identifiers.
- R25. The HTML viewer SHALL work offline, perform no network requests, and render untrusted text only as text.

## Phase 11 additions
- R26. Applications SHALL use only the versioned core interface `src/core.js`; the default profile SHALL keep application 1's outputs byte-identical.
- R27. ProofGap Cite SHALL parse the documented Markdown subset with line-numbered validation errors, ignore fenced code, and enforce size/count limits.
- R28. ProofGap Cite SHALL report citation cycles as findings, and SHALL call a claim independently corroborated only with ≥ 2 independent origins that each trace to a declared primary source, with no identifier or core cue linking them.
- R29. ProofGap Cite SHALL NOT fetch URLs and SHALL NOT infer independence from different URLs, outlets or citation counts; identical identifiers SHALL be a cue only.
