import assert from 'node:assert/strict';
import test from 'node:test';
import { inputString, onlyDigits, randomInteger } from '../dist/esm/internal.js';

test('funções internas rejeitam entradas inválidas', () => {
  assert.equal(inputString(null), null);
  assert.equal(inputString(1), '1');
  assert.equal(inputString(-1), null);
  assert.equal(inputString(1.5), null);
  assert.equal(onlyDigits('abc'), null);
  assert.equal(onlyDigits(null), null);
  assert.equal(onlyDigits('---'), '');
  assert.throws(() => randomInteger(0), RangeError);
  assert.throws(() => randomInteger(1.5), RangeError);
});
