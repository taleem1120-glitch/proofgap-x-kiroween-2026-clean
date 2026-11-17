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

/** Merge caller overrides and reject malformed or accessor-backed budgets. */
export function normalizeCaseLimits(limits = DEFAULT_LIMITS) {
  if (limits === null || typeof limits !== 'object' || Array.isArray(limits)) throw new TypeError('limits must be a plain object');
  const proto = Object.getPrototypeOf(limits);
  if (proto !== Object.prototype && proto !== null) throw new TypeError('limits must be a plain object');
  const normalized = { ...DEFAULT_LIMITS };
  const allowed = new Set(Object.keys(DEFAULT_LIMITS));
  for (const key of Reflect.ownKeys(limits)) {
    if (typeof key !== 'string' || !allowed.has(key)) throw new TypeError('unknown case limit: ' + String(key));
    const descriptor = Object.getOwnPropertyDescriptor(limits, key);
    if (!descriptor || !Object.hasOwn(descriptor, 'value')) throw new TypeError('limits.' + key + ' must be a data property');
    normalized[key] = descriptor.value;
  }
  for (const [key, value] of Object.entries(normalized)) if (!Number.isSafeInteger(value) || value < 1) throw new TypeError('limits.' + key + ' must be a positive safe integer');
  return normalized;
}
