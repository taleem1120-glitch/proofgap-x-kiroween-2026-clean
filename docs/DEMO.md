# Demo (both applications; everything shown is working code; all data is synthetic and fictional)

## C. ProofGap Cite (application 2)
```sh
npm run cite                    # lint output for apps/proofgap-cite/examples/water-note.md with saved-file checks
# open apps/proofgap-cite/showcase.html (rebuild: rm it, then npm run showcase:cite)
```
Expected verdicts by line: 6 single_origin (6 citations → 1 origin), 7 independently_corroborated, 8 circular_reporting, 9 origin_unresolved, 10 abstain_suspected_shared_origin, 11 unsupported. Without `--sources`, line 6 becomes origin_unresolved: the tool does not guess what it cannot verify. These are checked by `test/cite.test.js`.


## A. Side-by-side showcase in the offline viewer (main demo)
```sh
npm run showcase            # builds viewer/showcase.html (refuses to overwrite; delete it first to rebuild)
# open viewer/showcase.html in a browser (file://, no server, no network)
```
A committed copy of `viewer/showcase.html` is already in the repo and is tested to be byte-identical to a fresh build.

| | Scenario A "Eight documents agree" (`examples/showcase/deceptive.json`) | Scenario B "Three independent systems" (`examples/showcase/independent.json`) |
|---|---|---|
| Claim `door-0214` | 8 supporting items → **1 independent origin** → INSUFFICIENT, flagged FALSE CORROBORATION | 4 items → **3 origins** (CCTV clip is a declared copy of the recorder) → SUPPORTED under declared assumptions |
| Why | screenshots, forum post, article, PDF all derive from the badge export; the "anonymous tip" image declares the same hash as screenshot 1, and the "shared drive" image declares **no hash at all**. The tool hashes both files itself and finds them byte-identical (**verified**, node label "HASHED LOCALLY"). Engine 0.3.0, which only checked declared hashes, called this claim SUPPORTED with 2 origins | badge system, CCTV recorder and HVAC log have no declared link (graph shows them as "unknown", i.e. assumed, not established) |
| Abstention | — | `alarm-off`: two "independent" contractor reports have the same name and identical text → hard status SUPPORTED, **decision ABSTAINS** |
| Counterfactual plan | smallest change: **1** item from an origin outside the badge lineage; if it supports → SUPPORTED, if it contradicts → CONFLICTING, if none → stays INSUFFICIENT | `door-0214` robustness: loses SUPPORTED only if **2** of 3 origins collapse |
| Export | "Export report JSON" downloads the exact embedded, reproducible report | same |

## B. Integrity demo (CLI, text)
```sh
npm run demo   # examples/demo: VERIFIED / MISMATCH (excluded) / MISSING / NOT_CHECKED, 4 items -> 1 origin
```

## Video storyboard: two applications, 2:50 (every shot uses committed, working features)
Before recording: open both showcase files in a desktop browser about 1400 px wide, and a terminal in the repository root. Do not say "open source" until the licence is committed and the repository is public.

| Time | Shot | Narration (factual) |
|---|---|---|
| 0:00–0:15 | Repository root: `src/`, `apps/proofgap-x`, `apps/proofgap-cite` | "Ten sources agree" is often one source repeated. ProofGap counts independent origins, not documents. One small core, two applications. |
| 0:15–0:55 | **App 1** `viewer/showcase.html`, left panel `door-0214`: "8 supporting items collapse to 1 independent origin"; hover the green arc into A8 | Eight documents, one badge export. Two images were byte-identical copies; A8 never declared a hash, and the tool found the match by hashing the local files. The verdict is insufficient support. |
| 0:55–1:15 | App 1 right panel: `door-0214` supported; `alarm-off` "Abstains"; open its counterfactual plan | Independent systems are supported, but only under declared assumptions. When two reports look like one, the engine abstains. The plan shows the smallest evidence that would change the verdict. |
| 1:15–1:55 | **App 2** `apps/proofgap-cite/showcase.html`, line 6 "Single origin": 6 citations → 1 origin; open "What is missing" | A writer's draft cites six outlets for one number. Four echo one press release, and the blog's saved page is byte-identical to the Daily Planet's. What is missing is a second primary source. |
| 1:55–2:20 | App 2 lines 8, 9 and 10: Circular reporting, Origin unresolved, Abstains | A forum and a wiki citing each other. Two different URLs that name no original source, which is not independence. Two "outlets" with the same wire URL, so it abstains. |
| 2:20–2:40 | Terminal: `npm run cite`, then `node apps/proofgap-cite/cli.js apps/proofgap-cite/examples/water-note.md --fail-on-gaps; echo $?` → 3 | The same engine as a lint tool with file:line output, so a writer can gate a draft. Everything runs offline; the pages have no network access. |
| 2:40–2:50 | README "Known limitations" | Re-encoded reposts and undeclared origins remain hard; the tool abstains or says what is missing. It never judges truth. |

## What the demo does NOT show
That any claim is true or false, that any file is authentic, or anyone's intent or guilt.

## Interactive provenance review (both applications)
In either offline showcase, select a source, evidence item or claim node in the graph (click, Enter or Space). The viewer highlights the node's direct relationships, dims unrelated visible links, and lists each relationship with its basis (verified, declared, suspected or unknown). The relationship table narrows to the selected node; choose "All relationship types" to clear the selection. This is a navigation aid over the report's existing graph, not a new verification step or an inference of authenticity. Unknown origin-pair links are kept textually inspectable and capped at 2,000 visual edges; omitted counts are reported.
