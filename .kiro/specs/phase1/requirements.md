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
