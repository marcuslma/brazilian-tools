import assert from 'node:assert/strict';
import test from 'node:test';
import {
  SUPPORTED_RG_STATES,
  formatRG,
  generateRG,
  normalizeRG,
  validateRG,
} from '../dist/esm/index.js';

test('validates plausible RG structure without requiring a check digit', () => {
  assert.equal(validateRG('12.345.678-9'), true);
  assert.equal(validateRG('MG-12.345.678'), true);
  assert.equal(validateRG('123456789'), true);
  assert.equal(validateRG('ABC'), false);
  assert.equal(validateRG('123'), false);
  assert.equal(validateRG('111111111'), false);
  assert.equal(validateRG(null), false);
});

test('structural validation does not replace algorithmic validation', () => {
  assert.equal(validateRG('12.345.678-0'), true);
  assert.equal(validateRG('12.345.678-0', { state: 'SP' }), false);
});

test('rejects an unsupported state when supplied for validation', () => {
  assert.throws(() => validateRG('12.345.678-2', { state: 'RJ' }), RangeError);
});
test('validates RG structure with an X check digit', () => {
  assert.equal(validateRG('12.345.678-X'), true);
});

test('validates São Paulo RGs with different check digits', () => {
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
test('validates São Paulo RGs with a numeric or X check digit', () => {
  assert.equal(validateRG('12.345.678-2', { state: 'SP' }), true);
  assert.equal(validateRG('10.354.222-X', { state: 'SP' }), true);
  assert.equal(validateRG('10.354.222-x', { state: 'SP' }), true);
  assert.equal(validateRG('31.011.111-0', { state: 'SP' }), true);
  assert.equal(validateRG('48.329.673-9', { state: 'SP' }), true);
  assert.equal(validateRG('49.057.085-2', { state: 'SP' }), false);
  assert.equal(validateRG('123', { state: 'SP' }), false);
});

test('rejects invalid RGs and repeated sequences', () => {
  for (const value of ['', '123', '11.004.249-A', '00.000.000-0', null]) {
    assert.equal(validateRG(value), false);
  }
});

test('generates and formats valid São Paulo RGs', () => {
  const raw = generateRG();
  const formatted = generateRG({ formatted: true });
  assert.match(raw, /^\d{8}[\dX]$/);
  assert.match(formatted, /^\d{2}\.\d{3}\.\d{3}-[\dX]$/);
  assert.equal(validateRG(raw), true);
  assert.equal(validateRG(formatted), true);
  assert.equal(formatRG('123456782'), '12.345.678-2');
});

test('rejects a state that is not yet supported', () => {
  assert.throws(() => generateRG({ state: 'RJ' }), RangeError);
});

test('rejects a null state at runtime', () => {
  assert.throws(() => generateRG({ state: null }), RangeError);
  assert.throws(() => validateRG('123456782', { state: null }), RangeError);
  assert.throws(() => normalizeRG('123456782', { state: null }), RangeError);
  assert.throws(() => formatRG('123456782', { state: null }), RangeError);
});

test('exposes states with a verifiable algorithm', () => {
  assert.deepEqual(SUPPORTED_RG_STATES, ['SP']);
  assert.equal(Object.isFrozen(SUPPORTED_RG_STATES), true);
});

test('selects a supported state randomly when omitted', () => {
  for (let index = 0; index < 100; index++) {
    const generated = generateRG({ includeState: true, formatted: index % 2 === 0 });
    assert.equal(SUPPORTED_RG_STATES.includes(generated.state), true);
    assert.equal(validateRG(generated.value, { state: generated.state }), true);
  }
});

test('returns the requested state with the generated RG', () => {
  const generated = generateRG({ state: 'SP', formatted: true, includeState: true });
  assert.deepEqual(Object.keys(generated).sort(), ['state', 'value']);
  assert.equal(generated.state, 'SP');
  assert.equal(validateRG(generated.value, { state: 'SP' }), true);
});

test('rejects a non-boolean includeState at runtime', () => {
  assert.throws(() => generateRG({ includeState: 'typo' }), RangeError);
  assert.throws(() => generateRG({ includeState: null }), RangeError);
  assert.throws(() => generateRG({ formatted: 'false' }), RangeError);
  assert.throws(() => generateRG({ formatted: null }), RangeError);
});

test('rejects malformed RG option containers', () => {
  for (const options of [null, 'state', []]) {
    assert.throws(() => generateRG(options), TypeError);
    assert.throws(() => validateRG('123456782', options), TypeError);
    assert.throws(() => normalizeRG('123456782', options), TypeError);
    assert.throws(() => formatRG('123456782', options), TypeError);
  }
});

test('normalizes an RG from a supported state without validating the check digit', () => {
  assert.equal(normalizeRG('12.345.678-2', { state: 'SP' }), '123456782');
  assert.equal(normalizeRG('10.354.222-x'), '10354222X');
  assert.equal(normalizeRG('49.057.085-2'), '490570852');
  assert.throws(() => normalizeRG('123', { state: 'SP' }), TypeError);
  assert.throws(() => normalizeRG('12.345.678-A', { state: 'SP' }), TypeError);
});

test('RG normalization does not depend on the random generator', () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'crypto');
  Object.defineProperty(globalThis, 'crypto', { configurable: true, value: undefined });
  try {
    assert.equal(normalizeRG('12.345.678-3'), '123456783');
  } finally {
    if (descriptor) Object.defineProperty(globalThis, 'crypto', descriptor);
  }
});
