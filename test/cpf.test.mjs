import assert from 'node:assert/strict';
import test from 'node:test';
import { formatCPF, generateCPF, normalizeCPF, validateCPF } from '../dist/esm/index.js';

test('validates CPF with or without a mask', () => {
  assert.equal(validateCPF('529.982.247-25'), true);
  assert.equal(validateCPF('52998224725'), true);
  assert.equal(validateCPF('529.982.247-24'), false);
});

test('rejects invalid inputs and repeated sequences', () => {
  for (const value of ['', 'abc', '123', '111.111.111-11', null, undefined]) {
    assert.equal(validateCPF(value), false);
  }
});

test('generates a valid CPF, optionally formatted', () => {
  const raw = generateCPF();
  const formatted = generateCPF({ formatted: true });
  assert.match(raw, /^\d{11}$/);
  assert.match(formatted, /^\d{3}\.\d{3}\.\d{3}-\d{2}$/);
  assert.equal(validateCPF(raw), true);
  assert.equal(validateCPF(formatted), true);
});

test('rejects a non-boolean formatted option at runtime', () => {
  assert.throws(() => generateCPF({ formatted: 'false' }), RangeError);
});

test('formats CPF and rejects structurally invalid values', () => {
  assert.equal(formatCPF('52998224725'), '529.982.247-25');
  assert.throws(() => formatCPF('123'), TypeError);
});

test('normalizes CPF without requiring a valid check digit', () => {
  assert.equal(normalizeCPF('529.982.247-25'), '52998224725');
  assert.equal(normalizeCPF('529.982.247-24'), '52998224724');
  assert.throws(() => normalizeCPF('123'), TypeError);
  assert.throws(() => normalizeCPF('529x982x247x25'), TypeError);
});
