import assert from 'node:assert/strict';
import test from 'node:test';
import { formatCNPJ, generateCNPJ, normalizeCNPJ, validateCNPJ } from '../dist/esm/index.js';

test('validates a traditional numeric CNPJ', () => {
  assert.equal(validateCNPJ('04.252.011/0001-10'), true);
  assert.equal(validateCNPJ('04.252.011/0001-11'), false);
  assert.equal(validateCNPJ('00.000.000/0000-00'), false);
});

test('validates a new alphanumeric CNPJ while keeping numeric check digits', () => {
  assert.equal(validateCNPJ('12.ABC.345/01DE-35'), true);
  assert.equal(validateCNPJ('12.abc.345/01de-35'), true);
  assert.equal(validateCNPJ('12.ABC.345/01DE-34'), false);
  assert.equal(validateCNPJ('12.ABC.345/01DE-XY'), false);
});

test('generates valid traditional and alphanumeric CNPJs', () => {
  for (const kind of ['numeric', 'alphanumeric']) {
    const raw = generateCNPJ({ kind });
    assert.match(raw, kind === 'numeric' ? /^\d{14}$/ : /^[A-Z0-9]{12}\d{2}$/);
    assert.equal(validateCNPJ(raw), true);
  }
});

test('formats both CNPJ formats', () => {
  assert.equal(formatCNPJ('04252011000110'), '04.252.011/0001-10');
  assert.equal(formatCNPJ('12ABC34501DE35'), '12.ABC.345/01DE-35');
  assert.throws(() => formatCNPJ('123'), TypeError);
});

test('generates a formatted CNPJ when requested', () => {
  const value = generateCNPJ({ kind: 'alphanumeric', formatted: true });
  assert.match(value, /^[A-Z0-9]{2}\.[A-Z0-9]{3}\.[A-Z0-9]{3}\/[A-Z0-9]{4}-\d{2}$/);
  assert.equal(validateCNPJ(value), true);
  assert.equal(validateCNPJ(generateCNPJ({ kind: null })), true);
});

test('rejects an unknown CNPJ kind at runtime', () => {
  assert.throws(() => generateCNPJ({ kind: 'typo' }), RangeError);
  assert.throws(() => generateCNPJ({ formatted: 'false' }), RangeError);
});

test('normalizes numeric or alphanumeric CNPJ without validating check digits', () => {
  assert.equal(normalizeCNPJ('04.252.011/0001-10'), '04252011000110');
  assert.equal(normalizeCNPJ('12.abc.345/01de-34'), '12ABC34501DE34');
  assert.throws(() => normalizeCNPJ('123'), TypeError);
  assert.throws(() => normalizeCNPJ('12_ABC_345_01DE_35'), TypeError);
});
