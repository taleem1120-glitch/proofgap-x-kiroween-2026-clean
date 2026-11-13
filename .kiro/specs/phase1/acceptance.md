# Phase 1 Acceptance Criteria

Each is checked by `npm test` unless noted.

| Req | Criterion | Test |
|---|---|---|
| R1 | Malformed JSON, non-objects, bad fields rejected with paths | "malformed inputs are rejected", "duplicate ids, bad ids..." |
| R3 | Derived/transitive/shared-group sources collapse to one origin | "derived source...", "transitive derivation..." |
| R4 | Duplicate hash or source+description flagged and excluded | "duplicate evidence by hash...", "duplicate by source+description..." |
| R5 | All five statuses reachable | single/two-source, conflict, contradicted/no-evidence tests |
| R6 | Disclaimer present; no verdict words | "explanations avoid guilt..." |
| R7 | Identical bytes for repeat runs and reordered keys | "report is deterministic..." |
| R8 | Byte, count, string, depth, cycle, issue-cap, `__proto__` limits | limit/forbidden/cycle tests |
| R9 | No network APIs imported | manual: `grep -rnE "node:(http|https|net|dns|tls|dgram)|fetch\(" src` returns nothing |
| R10 | Markup chars escaped, round-trips | "output encoding..." |
