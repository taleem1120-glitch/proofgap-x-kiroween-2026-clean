// Resource limits: secure defaults. Overridable only programmatically.
export const DEFAULT_LIMITS = Object.freeze({
  maxBytes: 1_000_000,
  maxSources: 1000,
  maxEvidence: 5000,
  maxClaims: 500,
  maxLinksPerEvidence: 50,
  maxStringLength: 2000,
  maxDerivationDepth: 50,
  maxIssues: 100,
});
