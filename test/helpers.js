export const base = () => ({
  schemaVersion: '1.0', caseId: 'T1', title: 'Test',
  sources: [{ id: 's1', name: 'S1' }, { id: 's2', name: 'S2' }],
  claims: [{ id: 'c1', statement: 'Claim' }],
  evidence: [],
});
export const ev = (id, sourceId, stance = 'supports', strength = 0.5, extra = {}) => ({
  id, sourceId, description: `d-${id}`, links: [{ claimId: 'c1', stance, strength }], ...extra,
});
