# Demo: a strong-looking claim that rests on one email

Everything in `examples/demo/` is **synthetic**. Run:

```sh
npm run demo        # = node src/cli.js examples/demo/case.json --evidence-dir examples/demo/evidence --format text
node src/cli.js examples/demo/case.json --format text     # without file verification
```

## The scenario
Claim **c1**: "Invoice 4471 was approved before payment was released." Four items appear to support it: the original email, a screenshot of it, a colleague's forward of it, and a ticket note quoting it. A naive counter says "4 supporting items, 4 sources".

## What ProofGap X reports
- **Independence:** the screenshot, forward and ticket note are all declared as derived from the one mail archive. Result: **4 items → 1 independent origin**, flagged as `FALSE_CORROBORATION`, with the derivation reasons spelled out.
- **Conflict:** an independent audit trail contradicts the timing → status `conflicting`, not "strongly supported".
- **Integrity (with `--evidence-dir`):** `e1`,`e3` VERIFIED; `e2` (screenshot) MISMATCH → excluded from scoring; `e4` MISSING → stays unverified; `e8` NOT_CHECKED (no hash). Without `--evidence-dir` every declared hash is shown as unverified.
- **Contrast c2:** payment log + bank statement are declared independent → `supported_by_independent_origins`, but still flagged as resting on declared provenance.
- **Ranked suggestions** say what each next step would show and would **not** show.

## What this demo does NOT show
That c1 is false (it may well be true), that the audit log is right, or that any file is authentic. ProofGap X reports structure of support under declared assumptions; it never certifies truth, authenticity or guilt.
