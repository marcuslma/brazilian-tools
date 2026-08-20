import assert from 'node:assert/strict';
import test from 'node:test';
import { formatBRL, normalizeBRL, parseBRL } from '../dist/esm/currency.js';

test('formata valores em reais', () => {
  assert.equal(formatBRL(1234.56), 'R$ 1.234,56');
  assert.equal(formatBRL(0), 'R$ 0,00');
  assert.equal(formatBRL(-12.3), '-R$ 12,30');
  assert.throws(() => formatBRL(Number.NaN), TypeError);
});

test('normaliza e interpreta valores em reais', () => {
  assert.equal(parseBRL('R$ 1.234,56'), 1234.56);
  assert.equal(parseBRL('-R$ 12,30'), -12.3);
  assert.equal(parseBRL('1234,56'), 1234.56);
  assert.equal(normalizeBRL(12.3), 12.3);
  assert.equal(normalizeBRL('R$ 12,30'), 12.3);
  assert.throws(() => normalizeBRL(Number.NaN), TypeError);
  assert.throws(() => parseBRL('R$ inválido'), TypeError);
});
