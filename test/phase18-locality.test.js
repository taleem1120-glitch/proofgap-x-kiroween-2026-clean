import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveRoots, groupSources } from '../src/independence.js';

test('Phase 18: noncited external source cannot bridge cited origins', () => {
  const roots = resolveRoots([
    { id: 'a' },
    { id: 'b' },
    { id: 'outside' }
  ]);
  const groups = groupSources(
    roots,
    ['a', 'b'],
    [['a', 'outside'], ['outside', 'b']]
  );

  assert.notEqual(groups.get('a'), groups.get('b'));
  assert.equal(groups.get('a'), 'source:a');
  assert.equal(groups.get('b'), 'source:b');
});
