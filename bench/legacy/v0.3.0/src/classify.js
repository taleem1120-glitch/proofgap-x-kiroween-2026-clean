/**
 * The single classification rule, shared by the engine and the counterfactual planner
 * so planner predictions cannot drift from what the engine would actually decide.
 * Inputs are counts of independent origins (per claim).
 */
export function classify(supportOrigins, contradictOrigins, threshold) {
  if (supportOrigins === 0 && contradictOrigins === 0) return 'no_evidence';
  if (supportOrigins > 0 && contradictOrigins > 0) return 'conflicting';
  if (contradictOrigins > 0) return 'contradicted';
  if (supportOrigins < threshold) return 'insufficient_support';
  return 'supported_by_independent_origins';
}
