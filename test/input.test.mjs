import assert from 'node:assert/strict';
import test from 'node:test';
import {
  generateCNH,
  generateCNPJ,
  generateCPF,
  generateLicensePlate,
  generatePIS,
  normalizeCEP,
  normalizeCNPJ,
  normalizeCPF,
  normalizePhoneBR,
  normalizeRG,
  validateCEP,
  validateCNPJ,
  validateCPF,
  validatePhoneBR,
  validateRG,
} from '../dist/esm/index.js';

const cases = [
  {
    normalize: normalizeCPF,
    validate: validateCPF,
    values: [-52998224725, 52998224725.5, '-52998224725', '529-98224725'],
  },
  {
    normalize: normalizeCNPJ,
    validate: validateCNPJ,
    values: [-4252011000110, 4252011000110.5, '-04252011000110', '04-252011000110'],
  },
  {
    normalize: normalizeRG,
    validate: validateRG,
    values: [-123456782, 12345678.2, '-123456782', '12-3456782'],
  },
  {
    normalize: normalizePhoneBR,
    validate: validatePhoneBR,
    values: [-11987654321, 1198765432.1, '-11987654321', '11-987654321'],
  },
  {
    normalize: normalizeCEP,
    validate: validateCEP,
    values: [-1001000, 1001000.5, '-01001000', '01-001000'],
  },
];

test('rejects invalid numbers and misplaced masks across all documents', () => {
  for (const { normalize, validate, values } of cases) {
    for (const value of values) {
      assert.equal(validate(value), false);
      assert.throws(() => normalize(value), TypeError);
    }
  }
});

test('all document generators reject malformed option containers', () => {
  const generators = [generateCPF, generateCNPJ, generatePIS, generateCNH, generateLicensePlate];

  for (const generate of generators) {
    for (const options of [null, 'invalid', []]) {
      assert.throws(() => generate(options), TypeError);
    }
  }
});
