# ProofGap X: independent evidence evaluation and proof-gap analysis

**Who it is for:** an investigator or analyst who has a structured set of claims, evidence items and their declared sources.
**Question it answers:** "How many genuinely independent origins support each claim, which evidence is a copy, what has been verified, and what is the smallest additional evidence that would change the verdict?"

Built only on the ProofGap core interface (`src/core.js`). Input is a JSON case (`schemas/case.v1.schema.json`).

```sh
node apps/proofgap-x/cli.js examples/showcase/deceptive.json --evidence-dir examples/showcase/evidence --format text
npm run showcase     # rebuilds viewer/showcase.html (side-by-side deceptive vs independent case)
```
`node src/cli.js` is the same program, kept so that earlier commands and tests keep working.

Features: an independence graph with verified / declared / suspected / unknown relationships; proof-gap findings; a counterfactual evidence plan; local SHA-256 verification; abstention; and the offline viewer. See the repository README and `docs/DEMO.md`.
