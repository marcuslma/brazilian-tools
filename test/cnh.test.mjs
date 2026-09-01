import assert from 'node:assert/strict';
import test from 'node:test';
import { formatCNH, generateCNH, normalizeCNH, validateCNH } from '../dist/esm/cnh.js';

test('validates CNH check digits', () => {
  assert.equal(validateCNH('12345678900'), true);
  assert.equal(validateCNH('123456789-00'), true);
  assert.equal(validateCNH('12345678901'), false);
  assert.equal(validateCNH(null), false);
  assert.equal(validateCNH('11111111111'), false);
});

test('normalizes and formats CNH', () => {
  assert.equal(normalizeCNH('123456789-00'), '12345678900');
  assert.equal(formatCNH('12345678900'), '123456789-00');
  assert.throws(() => normalizeCNH('123'), TypeError);
});

test('rejects a non-boolean formatted option at runtime', () => {
  assert.throws(() => generateCNH({ formatted: 'false' }), RangeError);
  assert.throws(() => generateCNH({ formatted: null }), RangeError);
});

test('rejects malformed CNH generator option containers', () => {
  for (const options of [null, 'formatted', []]) {
    assert.throws(() => generateCNH(options), TypeError);
  }
});

test('generates a valid CNH', () => {
  for (let index = 0; index < 20; index++) {
    const value = generateCNH({ formatted: index % 2 === 0 });
    assert.equal(validateCNH(value), true);
  }
});
