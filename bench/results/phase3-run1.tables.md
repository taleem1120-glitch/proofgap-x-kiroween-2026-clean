
### dev: 200 cases, 887 claims, 285 truly corroborated (seeds 1..200)

**Declared-provenance scenarios**

| Detector | Precision (95% Wilson CI) | Recall | False-positive rate |
|---|---|---|---|
| B0_item_count | 42.0% (38.4–45.8) 285/678 | 100.0% (98.7–100.0) 285/285 | 76.8% (72.9–80.2) 393/512 |
| B1_distinct_sources | 45.5% (41.7–49.4) 285/626 | 100.0% (98.7–100.0) 285/285 | 66.6% (62.4–70.5) 341/512 |
| B2_dedupe_hash_then_sources | 52.0% (47.8–56.2) 285/548 | 100.0% (98.7–100.0) 285/285 | 51.4% (47.0–55.7) 263/512 |
| B3_originals_only | 82.8% (77.9–86.9) 222/268 | 77.9% (72.7–82.3) 222/285 | 9.0% (6.8–11.8) 46/512 |
| P_proofgap_0_1_0 | 77.0% (72.5–81.0) 285/370 | 100.0% (98.7–100.0) 285/285 | 16.6% (13.6–20.1) 85/512 |
| P_proofgap_current | 100.0% (98.7–100.0) 285/285 | 100.0% (98.7–100.0) 285/285 | 0.0% (0.0–0.7) 0/512 |

**Undeclared-copy scenarios (hidden dependence)**

| Detector | Precision (95% Wilson CI) | Recall | False-positive rate |
|---|---|---|---|
| B0_item_count | 0.0% (0.0–4.1) 0/90 | n/a | 100.0% (95.9–100.0) 90/90 |
| B1_distinct_sources | 0.0% (0.0–4.1) 0/90 | n/a | 100.0% (95.9–100.0) 90/90 |
| B2_dedupe_hash_then_sources | 0.0% (0.0–4.1) 0/90 | n/a | 100.0% (95.9–100.0) 90/90 |
| B3_originals_only | 0.0% (0.0–4.1) 0/90 | n/a | 100.0% (95.9–100.0) 90/90 |
| P_proofgap_0_1_0 | 0.0% (0.0–4.1) 0/90 | n/a | 100.0% (95.9–100.0) 90/90 |
| P_proofgap_current | 0.0% (0.0–4.1) 0/90 | n/a | 100.0% (95.9–100.0) 90/90 |

**All scenarios**

| Detector | Precision (95% Wilson CI) | Recall | False-positive rate |
|---|---|---|---|
| B0_item_count | 37.1% (33.8–40.6) 285/768 | 100.0% (98.7–100.0) 285/285 | 80.2% (76.9–83.2) 483/602 |
| B1_distinct_sources | 39.8% (36.3–43.4) 285/716 | 100.0% (98.7–100.0) 285/285 | 71.6% (67.9–75.1) 431/602 |
| B2_dedupe_hash_then_sources | 44.7% (40.9–48.5) 285/638 | 100.0% (98.7–100.0) 285/285 | 58.6% (54.7–62.5) 353/602 |
| B3_originals_only | 62.0% (56.9–66.9) 222/358 | 77.9% (72.7–82.3) 222/285 | 22.6% (19.4–26.1) 136/602 |
| P_proofgap_0_1_0 | 62.0% (57.4–66.3) 285/460 | 100.0% (98.7–100.0) 285/285 | 29.1% (25.6–32.8) 175/602 |
| P_proofgap_current | 76.0% (71.4–80.0) 285/375 | 100.0% (98.7–100.0) 285/285 | 15.0% (12.3–18.0) 90/602 |

**Per-scenario accuracy of ProofGap current vs 0.1.0**

| Scenario | kind | truth | claims | 0.1.0 correct | current correct |
|---|---|---|---|---|---|
| bridge_three_roots | declared | not | 46 | 0 | 46 |
| declared_copies | declared | not | 105 | 105 | 105 |
| derived_from_distinct_roots | declared | corroborated | 63 | 63 | 63 |
| genuine_independent | declared | corroborated | 126 | 126 | 126 |
| genuine_with_copy | declared | corroborated | 96 | 96 | 96 |
| group_plus_derivation | declared | not | 39 | 0 | 39 |
| hash_laundering | declared | not | 78 | 78 | 78 |
| no_support | declared | not | 54 | 54 | 54 |
| same_source_duplicates | declared | not | 52 | 52 | 52 |
| shared_origin_group | declared | not | 73 | 73 | 73 |
| single_item | declared | not | 65 | 65 | 65 |
| undeclared_copy | undeclared | not | 59 | 0 | 0 |
| undeclared_copy_with_cues | undeclared | not | 31 | 0 | 0 |

Latency per case (analyzeCase, ms): median 0.271, p95 0.571, max 3.109.

### heldout: 200 cases, 887 claims, 263 truly corroborated (seeds 100001..100200)

**Declared-provenance scenarios**

| Detector | Precision (95% Wilson CI) | Recall | False-positive rate |
|---|---|---|---|
| B0_item_count | 38.3% (34.8–42.0) 263/686 | 100.0% (98.6–100.0) 263/263 | 79.1% (75.4–82.3) 423/535 |
| B1_distinct_sources | 42.2% (38.4–46.1) 263/623 | 100.0% (98.6–100.0) 263/263 | 67.3% (63.2–71.1) 360/535 |
| B2_dedupe_hash_then_sources | 49.3% (45.1–53.6) 263/533 | 100.0% (98.6–100.0) 263/263 | 50.5% (46.2–54.7) 270/535 |
| B3_originals_only | 88.1% (83.3–91.6) 207/235 | 78.7% (73.4–83.2) 207/263 | 5.2% (3.6–7.5) 28/535 |
| P_proofgap_0_1_0 | 78.7% (74.0–82.8) 263/334 | 100.0% (98.6–100.0) 263/263 | 13.3% (10.7–16.4) 71/535 |
| P_proofgap_current | 100.0% (98.6–100.0) 263/263 | 100.0% (98.6–100.0) 263/263 | 0.0% (0.0–0.7) 0/535 |

**Undeclared-copy scenarios (hidden dependence)**

| Detector | Precision (95% Wilson CI) | Recall | False-positive rate |
|---|---|---|---|
| B0_item_count | 0.0% (0.0–4.1) 0/89 | n/a | 100.0% (95.9–100.0) 89/89 |
| B1_distinct_sources | 0.0% (0.0–4.1) 0/89 | n/a | 100.0% (95.9–100.0) 89/89 |
| B2_dedupe_hash_then_sources | 0.0% (0.0–4.1) 0/89 | n/a | 100.0% (95.9–100.0) 89/89 |
| B3_originals_only | 0.0% (0.0–4.1) 0/89 | n/a | 100.0% (95.9–100.0) 89/89 |
| P_proofgap_0_1_0 | 0.0% (0.0–4.1) 0/89 | n/a | 100.0% (95.9–100.0) 89/89 |
| P_proofgap_current | 0.0% (0.0–4.1) 0/89 | n/a | 100.0% (95.9–100.0) 89/89 |

**All scenarios**

| Detector | Precision (95% Wilson CI) | Recall | False-positive rate |
|---|---|---|---|
| B0_item_count | 33.9% (30.7–37.3) 263/775 | 100.0% (98.6–100.0) 263/263 | 82.1% (78.8–84.9) 512/624 |
| B1_distinct_sources | 36.9% (33.5–40.5) 263/712 | 100.0% (98.6–100.0) 263/263 | 72.0% (68.3–75.3) 449/624 |
| B2_dedupe_hash_then_sources | 42.3% (38.5–46.2) 263/622 | 100.0% (98.6–100.0) 263/263 | 57.5% (53.6–61.4) 359/624 |
| B3_originals_only | 63.9% (58.5–68.9) 207/324 | 78.7% (73.4–83.2) 207/263 | 18.8% (15.9–22.0) 117/624 |
| P_proofgap_0_1_0 | 62.2% (57.5–66.7) 263/423 | 100.0% (98.6–100.0) 263/263 | 25.6% (22.4–29.2) 160/624 |
| P_proofgap_current | 74.7% (69.9–79.0) 263/352 | 100.0% (98.6–100.0) 263/263 | 14.3% (11.7–17.2) 89/624 |

**Per-scenario accuracy of ProofGap current vs 0.1.0**

| Scenario | kind | truth | claims | 0.1.0 correct | current correct |
|---|---|---|---|---|---|
| bridge_three_roots | declared | not | 28 | 0 | 28 |
| declared_copies | declared | not | 121 | 121 | 121 |
| derived_from_distinct_roots | declared | corroborated | 56 | 56 | 56 |
| genuine_independent | declared | corroborated | 123 | 123 | 123 |
| genuine_with_copy | declared | corroborated | 84 | 84 | 84 |
| group_plus_derivation | declared | not | 43 | 0 | 43 |
| hash_laundering | declared | not | 90 | 90 | 90 |
| no_support | declared | not | 53 | 53 | 53 |
| same_source_duplicates | declared | not | 63 | 63 | 63 |
| shared_origin_group | declared | not | 78 | 78 | 78 |
| single_item | declared | not | 59 | 59 | 59 |
| undeclared_copy | undeclared | not | 44 | 0 | 0 |
| undeclared_copy_with_cues | undeclared | not | 45 | 0 | 0 |

Latency per case (analyzeCase, ms): median 0.239, p95 0.547, max 2.212.

### Scaling (single run, max-size input)

input 1000 sources / 5000 evidence / 500 claims (651671 bytes) → report 5177246 bytes; wall 251 ms; heapUsed Δ 32.7 MB; RSS 137 MB (gc exposed: true).

Environment: Node v22.23.4, linux/x64, 8× Intel(R) Xeon(R) Platinum 8488C, 31560 MB RAM.
