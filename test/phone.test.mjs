import assert from 'node:assert/strict';
import test from 'node:test';
import {
  SUPPORTED_PHONE_DDDS,
  formatPhoneBR,
  normalizePhoneBR,
  parsePhoneBR,
  validatePhoneBR,
} from '../dist/esm/index.js';

test('valida celulares e telefones fixos brasileiros com DDD', () => {
  assert.equal(validatePhoneBR('(11) 98765-4321'), true);
  assert.equal(validatePhoneBR('+55 (11) 98765-4321'), true);
  assert.equal(validatePhoneBR('(21) 2345-6789'), true);
  assert.equal(validatePhoneBR('552123456789'), true);
});

test('rejeita DDD, país, prefixo ou tamanho incompatível com o plano nacional', () => {
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

test('normaliza telefone nacional ou internacional para DDD e número', () => {
  assert.equal(normalizePhoneBR('(11) 98765-4321'), '11987654321');
  assert.equal(normalizePhoneBR('+55 21 2345-6789'), '2123456789');
  assert.equal(normalizePhoneBR('552123456789'), '2123456789');
  assert.throws(() => normalizePhoneBR('(20) 98765-4321'), TypeError);
});

test('formata celular ou fixo em formato nacional e internacional', () => {
  assert.equal(formatPhoneBR('11987654321'), '(11) 98765-4321');
  assert.equal(formatPhoneBR('2123456789'), '(21) 2345-6789');
  assert.equal(formatPhoneBR('11987654321', { international: true }), '+55 11 98765-4321');
  assert.throws(() => formatPhoneBR('1198765432'), TypeError);
});

test('decompõe telefone brasileiro e expõe sua representação E.164', () => {
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

test('expõe os 67 DDDs geográficos oficiais sem permitir mutação', () => {
  assert.equal(SUPPORTED_PHONE_DDDS.length, 67);
  assert.equal(SUPPORTED_PHONE_DDDS.includes('11'), true);
  assert.equal(SUPPORTED_PHONE_DDDS.includes('20'), false);
  assert.equal(Object.isFrozen(SUPPORTED_PHONE_DDDS), true);
});
