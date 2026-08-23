import assert from 'node:assert/strict';
import test from 'node:test';
import {
  SUPPORTED_PHONE_DDDS,
  formatPhoneBR,
  generatePhoneBR,
  normalizePhoneBR,
  parsePhoneBR,
  validatePhoneBR,
} from '../dist/esm/index.js';

test('validates Brazilian mobile and landline numbers with DDD', () => {
  assert.equal(validatePhoneBR('(11) 98765-4321'), true);
  assert.equal(validatePhoneBR('+55 (11) 98765-4321'), true);
  assert.equal(validatePhoneBR('(21) 2345-6789'), true);
  assert.equal(validatePhoneBR('552123456789'), true);
});

test('rejects incompatible DDD, country code, prefix, or length', () => {
  for (const value of [
    '(20) 98765-4321',
    '+1 11 98765-4321',
    '(11) 88765-4321',
    '(11) 6345-6789',
    '(11) 9876-5432',
    '991234567890',
    'abc',
    null,
  ]) {
    assert.equal(validatePhoneBR(value), false);
  }
});

test('normalizes national or international phone numbers to DDD and number', () => {
  assert.equal(normalizePhoneBR('(11) 98765-4321'), '11987654321');
  assert.equal(normalizePhoneBR('+55 21 2345-6789'), '2123456789');
  assert.equal(normalizePhoneBR('552123456789'), '2123456789');
  assert.throws(() => normalizePhoneBR('(20) 98765-4321'), TypeError);
});

test('formats mobile or landline numbers nationally and internationally', () => {
  assert.equal(formatPhoneBR('11987654321'), '(11) 98765-4321');
  assert.equal(formatPhoneBR('2123456789'), '(21) 2345-6789');
  assert.equal(formatPhoneBR('11987654321', { international: true }), '+55 11 98765-4321');
  assert.throws(() => formatPhoneBR('1198765432'), TypeError);
});

test('parses a Brazilian phone number and exposes its E.164 representation', () => {
  assert.deepEqual(parsePhoneBR('+55 (11) 98765-4321'), {
    countryCode: '55',
    ddd: '11',
    number: '987654321',
    type: 'mobile',
    national: '11987654321',
    e164: '+5511987654321',
    formatted: '(11) 98765-4321',
  });
  assert.equal(parsePhoneBR('(21) 2345-6789').type, 'landline');
  assert.throws(() => parsePhoneBR('abc'), TypeError);
});

test('generates valid mobile and landline numbers with DDD and formatting options', () => {
  const mobile = generatePhoneBR({ ddd: '11', type: 'mobile', formatted: true });
  assert.match(mobile, /^\(11\) 9\d{4}-\d{4}$/);
  assert.equal(validatePhoneBR(mobile), true);

  const landline = generatePhoneBR({
    ddd: '21',
    type: 'landline',
    formatted: true,
    international: true,
  });
  assert.match(landline, /^\+55 21 [2-5]\d{3}-\d{4}$/);
  assert.equal(validatePhoneBR(landline), true);

  const normalized = generatePhoneBR({ ddd: '31', type: 'mobile' });
  assert.match(normalized, /^31\d{9}$/);
  assert.equal(validatePhoneBR(normalized), true);
  assert.throws(() => generatePhoneBR({ ddd: '20' }), RangeError);
});

test('rejects an unknown phone type at runtime', () => {
  assert.throws(() => generatePhoneBR({ type: 'typo' }), RangeError);
  assert.throws(() => generatePhoneBR({ formatted: 'false' }), RangeError);
  assert.throws(() => generatePhoneBR({ international: 'false' }), RangeError);
});

test('exposes the 67 official geographic DDDs without allowing mutation', () => {
  assert.equal(SUPPORTED_PHONE_DDDS.length, 67);
  assert.equal(SUPPORTED_PHONE_DDDS.includes('11'), true);
  assert.equal(SUPPORTED_PHONE_DDDS.includes('20'), false);
  assert.equal(Object.isFrozen(SUPPORTED_PHONE_DDDS), true);
});
