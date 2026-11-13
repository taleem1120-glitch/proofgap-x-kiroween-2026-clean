# Demo (everything shown is working code; all data is synthetic and fictional)

## A. Side-by-side showcase in the offline viewer (main demo)
```sh
npm run showcase            # builds viewer/showcase.html (refuses to overwrite; delete it first to rebuild)
# open viewer/showcase.html in a browser (file://, no server, no network)
```
A committed copy of `viewer/showcase.html` is already in the repo and is tested to be byte-identical to a fresh build.

| | Scenario A "Eight documents agree" (`examples/showcase/deceptive.json`) | Scenario B "Three independent systems" (`examples/showcase/independent.json`) |
|---|---|---|
| Claim `door-0214` | 8 supporting items → **1 independent origin** → INSUFFICIENT, flagged FALSE CORROBORATION | 4 items → **3 origins** (CCTV clip is a declared copy of the recorder) → SUPPORTED under declared assumptions |
| Why | screenshots, forum post, article, PDF all derive from the badge export; the "anonymous tip" and "shared drive" images are byte-identical to screenshot 1 (**verified** against local files) | badge system, CCTV recorder and HVAC log have no declared link (graph shows them as "unknown", i.e. assumed, not established) |
| Abstention | — | `alarm-off`: two "independent" contractor reports have the same name and identical text → hard status SUPPORTED, **decision ABSTAINS** |
| Counterfactual plan | smallest change: **1** item from an origin outside the badge lineage; if it supports → SUPPORTED, if it contradicts → CONFLICTING, if none → stays INSUFFICIENT | `door-0214` robustness: loses SUPPORTED only if **2** of 3 origins collapse |
| Export | "Export report JSON" downloads the exact embedded, reproducible report | same |

## B. Integrity demo (CLI, text)
```sh
npm run demo   # examples/demo: VERIFIED / MISMATCH (excluded) / MISSING / NOT_CHECKED, 4 items -> 1 origin
```

## Sub-three-minute presentation outline (only working features)
1. **0:00–0:20 Problem.** "Eight documents agree" is often one document echoed eight times. Counting documents creates false corroboration.
2. **0:20–1:05 Scenario A (left panel).** Show "8 supporting items collapse to 1 independent origin", the reasons list, the graph: derivation chain, green **verified** byte-identity arcs between the tip image, the shared-drive image and screenshot 1.
3. **1:05–1:45 Scenario B (right panel).** Same claim, genuinely independent systems → SUPPORTED, with "unknown" independence stated honestly. Then `alarm-off`: the engine **abstains** because two "independent" reports look like one.
4. **1:45–2:20 Counterfactual plan.** Open the plan table: the smallest additional evidence and how the verdict would change under each hypothetical outcome; note "hypothetical only, nothing is claimed to exist".
5. **2:20–2:45 Trust.** Offline (CSP blocks all network), escaped untrusted labels, reproducible export, local SHA-256 verification with symlink/traversal protection; `npm test`.
6. **2:45–3:00 Limits.** Declared provenance can be hidden; the tool abstains only when cues exist. Not forensic software.

## What the demo does NOT show
That any claim is true or false, that any file is authentic, or anyone's intent or guilt.
