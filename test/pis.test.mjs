import assert from 'node:assert/strict';
import test from 'node:test';
import { formatPIS, generatePIS, normalizePIS, validatePIS } from '../dist/esm/pis.js';

test('validates PIS/PASEP/NIT with or without a mask', () => {
  assert.equal(validatePIS('120.4456.890-1'), true);
  assert.equal(validatePIS('12044568901'), true);
  assert.equal(validatePIS('120.4456.890-2'), false);
  assert.equal(validatePIS(null), false);
  assert.equal(validatePIS('111.1111.111-1'), false);
});

test('normalizes and formats PIS/PASEP/NIT', () => {
  assert.equal(normalizePIS('120.4456.890-1'), '12044568901');
  assert.equal(formatPIS('12044568901'), '120.4456.890-1');
  assert.throws(() => normalizePIS('123'), TypeError);
});

test('rejects a non-boolean formatted option at runtime', () => {
  assert.throws(() => generatePIS({ formatted: 'false' }), RangeError);
  assert.throws(() => generatePIS({ formatted: null }), RangeError);
});

test('rejects malformed PIS generator option containers', () => {
  for (const options of [null, 'formatted', []]) {
    assert.throws(() => generatePIS(options), TypeError);
  }
});

test('generates a valid PIS/PASEP/NIT', () => {
  for (let index = 0; index < 20; index++) {
    const value = generatePIS({ formatted: index % 2 === 0 });
    assert.equal(validatePIS(value), true);
  }
});
