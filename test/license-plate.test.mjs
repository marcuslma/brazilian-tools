import assert from 'node:assert/strict';
import test from 'node:test';
import {
  formatLicensePlate,
  generateLicensePlate,
  normalizeLicensePlate,
  parseLicensePlate,
  validateLicensePlate,
} from '../dist/esm/license-plate.js';

test('valida placas antigas e Mercosul', () => {
  assert.equal(validateLicensePlate('ABC-1234'), true);
  assert.equal(validateLicensePlate('ABC1234'), true);
  assert.equal(validateLicensePlate('ABC1D23'), true);
  assert.equal(validateLicensePlate('abc1d23'), true);
  assert.equal(validateLicensePlate('ABC-123'), false);
  assert.equal(validateLicensePlate('ABC1-23'), false);
  assert.equal(validateLicensePlate(null), false);
});

test('gera placas antigas e Mercosul válidas com formatação opcional', () => {
  const oldPlate = generateLicensePlate({ kind: 'old', formatted: true });
  assert.match(oldPlate, /^[A-Z]{3}-\d{4}$/);
  assert.equal(validateLicensePlate(oldPlate), true);

  const mercosul = generateLicensePlate({ kind: 'mercosul', formatted: true });
  assert.match(mercosul, /^[A-Z]{3}\d[A-Z]\d{2}$/);
  assert.equal(validateLicensePlate(mercosul), true);

  const normalized = generateLicensePlate({ kind: 'old' });
  assert.match(normalized, /^[A-Z]{3}\d{4}$/);
});
test('normaliza, formata e identifica placas', () => {
  assert.equal(normalizeLicensePlate('abc-1234'), 'ABC1234');
  assert.equal(normalizeLicensePlate('abc1d23'), 'ABC1D23');
  assert.equal(formatLicensePlate('ABC1234'), 'ABC-1234');
  assert.equal(formatLicensePlate('ABC1D23'), 'ABC1D23');
  assert.deepEqual(parseLicensePlate('ABC-1234'), {
    value: 'ABC1234',
    kind: 'old',
    formatted: 'ABC-1234',
  });
  assert.deepEqual(parseLicensePlate('ABC1D23'), {
    value: 'ABC1D23',
    kind: 'mercosul',
    formatted: 'ABC1D23',
  });
  assert.throws(() => normalizeLicensePlate('ABC-123'), TypeError);
});
