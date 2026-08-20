import assert from 'node:assert/strict';
import test from 'node:test';
import {
  SUPPORTED_RG_STATES,
  formatRG,
  generateRG,
  normalizeRG,
  validateRG,
} from '../dist/esm/index.js';

test('valida a estrutura plausível de RGs sem exigir dígito verificador', () => {
  assert.equal(validateRG('12.345.678-9'), true);
  assert.equal(validateRG('MG-12.345.678'), true);
  assert.equal(validateRG('123456789'), true);
  assert.equal(validateRG('ABC'), false);
  assert.equal(validateRG('123'), false);
  assert.equal(validateRG('111111111'), false);
  assert.equal(validateRG(null), false);
});

test('validação estrutural não substitui a validação algorítmica', () => {
  assert.equal(validateRG('12.345.678-0'), true);
  assert.equal(validateRG('12.345.678-0', { state: 'SP' }), false);
});

test('rejeita UF não suportada quando informada na validação', () => {
  assert.throws(() => validateRG('12.345.678-2', { state: 'RJ' }), RangeError);
});
test('valida estrutura de RG com dígito X', () => {
  assert.equal(validateRG('12.345.678-X'), true);
});

test('valida RG de São Paulo com diferentes dígitos verificadores', () => {
  for (const value of [
    '000000012',
    '000000073',
    '000000024',
    '000000085',
    '000000036',
    '000000097',
    '000000048',
    '000000139',
  ]) {
    assert.equal(validateRG(value, { state: 'SP' }), true);
  }
});
test('valida RG de São Paulo com dígito numérico ou X', () => {
  assert.equal(validateRG('12.345.678-2', { state: 'SP' }), true);
  assert.equal(validateRG('10.354.222-X', { state: 'SP' }), true);
  assert.equal(validateRG('10.354.222-x', { state: 'SP' }), true);
  assert.equal(validateRG('31.011.111-0', { state: 'SP' }), true);
  assert.equal(validateRG('48.329.673-9', { state: 'SP' }), true);
  assert.equal(validateRG('49.057.085-2', { state: 'SP' }), false);
});

test('rejeita RGs inválidos e sequências repetidas', () => {
  for (const value of ['', '123', '11.004.249-A', '00.000.000-0', null]) {
    assert.equal(validateRG(value), false);
  }
});

test('gera e formata RGs de São Paulo válidos', () => {
  const raw = generateRG();
  const formatted = generateRG({ formatted: true });
  assert.match(raw, /^\d{8}[\dX]$/);
  assert.match(formatted, /^\d{2}\.\d{3}\.\d{3}-[\dX]$/);
  assert.equal(validateRG(raw), true);
  assert.equal(validateRG(formatted), true);
  assert.equal(formatRG('123456782'), '12.345.678-2');
});

test('rejeita UF ainda não suportada', () => {
  assert.throws(() => generateRG({ state: 'RJ' }), RangeError);
});

test('expõe as UFs com algoritmo verificável', () => {
  assert.deepEqual(SUPPORTED_RG_STATES, ['SP']);
  assert.equal(Object.isFrozen(SUPPORTED_RG_STATES), true);
});

test('sorteia uma UF suportada quando ela não é informada', () => {
  for (let index = 0; index < 100; index++) {
    const generated = generateRG({ includeState: true, formatted: index % 2 === 0 });
    assert.equal(SUPPORTED_RG_STATES.includes(generated.state), true);
    assert.equal(validateRG(generated.value, { state: generated.state }), true);
  }
});

test('retorna a UF solicitada junto ao RG gerado', () => {
  const generated = generateRG({ state: 'SP', formatted: true, includeState: true });
  assert.deepEqual(Object.keys(generated).sort(), ['state', 'value']);
  assert.equal(generated.state, 'SP');
  assert.equal(validateRG(generated.value, { state: 'SP' }), true);
});

test('normaliza RG de uma UF suportada sem validar o verificador', () => {
  assert.equal(normalizeRG('12.345.678-2', { state: 'SP' }), '123456782');
  assert.equal(normalizeRG('10.354.222-x'), '10354222X');
  assert.equal(normalizeRG('49.057.085-2'), '490570852');
  assert.throws(() => normalizeRG('123', { state: 'SP' }), TypeError);
  assert.throws(() => normalizeRG('12.345.678-A', { state: 'SP' }), TypeError);
});

test('normalização de RG não depende do gerador aleatório', () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'crypto');
  Object.defineProperty(globalThis, 'crypto', { configurable: true, value: undefined });
  try {
    assert.equal(normalizeRG('12.345.678-3'), '123456783');
  } finally {
    if (descriptor) Object.defineProperty(globalThis, 'crypto', descriptor);
  }
});
