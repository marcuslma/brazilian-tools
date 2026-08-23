import assert from 'node:assert/strict';
import test from 'node:test';
import {
  BRAZILIAN_REGIONS,
  BRAZILIAN_STATES,
  getBrazilianState,
  getBrazilianStatesByRegion,
  isBrazilianState,
} from '../dist/esm/states.js';

test('exposes the 27 Brazilian states and regions', () => {
  assert.equal(BRAZILIAN_STATES.length, 27);
  assert.equal(Object.isFrozen(BRAZILIAN_STATES), true);
  assert.deepEqual(BRAZILIAN_REGIONS, ['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul']);
  assert.equal(getBrazilianState('SP')?.name, 'São Paulo');
  assert.equal(getBrazilianState('são paulo')?.code, 'SP');
  assert.equal(getBrazilianState(null), undefined);
  assert.equal(isBrazilianState('RJ'), true);
  assert.equal(isBrazilianState('XX'), false);
});

test('filters states by region', () => {
  assert.equal(getBrazilianStatesByRegion('Sudeste').length, 4);
  assert.deepEqual(
    getBrazilianStatesByRegion('Sul').map((state) => state.code),
    ['PR', 'RS', 'SC'],
  );
  assert.throws(() => getBrazilianStatesByRegion('Atlantis'), RangeError);
});
