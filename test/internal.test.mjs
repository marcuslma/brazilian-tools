import assert from 'node:assert/strict';
import test from 'node:test';
import {
  booleanOption,
  inputString,
  onlyDigits,
  optionsObject,
  randomInteger,
} from '../dist/esm/internal.js';

test('internal functions reject invalid inputs', () => {
  assert.equal(inputString(null), null);
  assert.equal(inputString(1), '1');
  assert.equal(inputString(-1), null);
  assert.equal(inputString(1.5), null);
  assert.equal(onlyDigits('abc'), null);
  assert.equal(onlyDigits(null), null);
  assert.equal(onlyDigits('---'), '');
  assert.equal(booleanOption(undefined), false);
  assert.throws(() => booleanOption(null, 'formatted', true), RangeError);
  assert.throws(() => booleanOption('false', 'formatted'), RangeError);
  assert.throws(() => randomInteger(0), RangeError);
  assert.throws(() => randomInteger(1.5), RangeError);
});

test('optionsObject accepts only omitted or plain-object options', () => {
  assert.deepEqual(optionsObject(undefined, 'options'), {});
  assert.deepEqual(optionsObject({ formatted: true }, 'options'), { formatted: true });

  for (const value of [null, 'invalid', 1, [], new Date()]) {
    assert.throws(() => optionsObject(value, 'options'), TypeError);
  }
});
