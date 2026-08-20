import assert from 'node:assert/strict';
import { mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const temporaryDirectory = mkdtempSync(join(tmpdir(), 'brazilian-tools-smoke-'));
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8' });
  if (result.status !== 0) {
    process.stderr.write(result.stdout);
    process.stderr.write(result.stderr);
    throw new Error(`${command} ${args.join(' ')} falhou com código ${String(result.status)}.`);
  }
}

try {
  run(npm, ['pack', '--silent', '--pack-destination', temporaryDirectory], root);
  const tarball = readdirSync(temporaryDirectory).find((file) => file.endsWith('.tgz'));
  assert.ok(tarball, 'npm pack não gerou um tarball.');

  writeFileSync(join(temporaryDirectory, 'package.json'), '{"private":true}\n');
  run(
    npm,
    ['install', '--ignore-scripts', '--no-audit', '--no-fund', join(temporaryDirectory, tarball)],
    temporaryDirectory,
  );

  writeFileSync(
    join(temporaryDirectory, 'consumer.ts'),
    `
import {
  CEPNotFoundError,
  formatBRL,
  formatCPF,
  formatPhoneBR,
  generateCNPJ,
  normalizeCNPJ,
  parsePhoneBR,
  validateCNH,
  validateCPF,
  validatePIS,
  type CEPAddress,
  type CEPCache,
} from 'brazilian-tools';

const valid: boolean = validateCPF('52998224725');
const cnhValid: boolean = validateCNH('12345678900');
const pisValid: boolean = validatePIS('12044568901');
const brl: string = formatBRL(1234.56);
const formatted: string = formatCPF('52998224725');
const generated: string = generateCNPJ({ kind: 'alphanumeric' });
const normalized: string = normalizeCNPJ('04.252.011/0001-10');
const phone: string = formatPhoneBR('11987654321');
const e164: string = parsePhoneBR(phone).e164;
const address: CEPAddress | undefined = undefined;
const cache: CEPCache = new Map<string, CEPAddress>();
const error: Error = new CEPNotFoundError('01001000');
void [valid, cnhValid, pisValid, brl, formatted, generated, normalized, phone, e164, address, cache, error];
`,
  );
  writeFileSync(
    join(temporaryDirectory, 'tsconfig.json'),
    JSON.stringify({
      compilerOptions: {
        target: 'ES2022',
        lib: ['ES2022'],
        types: [],
        module: 'NodeNext',
        moduleResolution: 'NodeNext',
        strict: true,
        skipLibCheck: false,
        noEmit: true,
      },
      include: ['consumer.ts'],
    }),
  );

  const tsc = join(root, 'node_modules', 'typescript', 'bin', 'tsc');
  run(
    process.execPath,
    [tsc, '--project', join(temporaryDirectory, 'tsconfig.json')],
    temporaryDirectory,
  );

  writeFileSync(
    join(temporaryDirectory, 'consumer.mjs'),
    `
import assert from 'node:assert/strict';
import {
  formatCPF,
  normalizeCEP,
  normalizeCPF,
  parsePhoneBR,
  validateCNPJ,
  validateCPF,
  validatePhoneBR,
  validateRG,
} from 'brazilian-tools';
import { validateCPF as validateCPFDirect } from 'brazilian-tools/cpf';
import { validateCNH } from 'brazilian-tools/cnh';
import { formatBRL } from 'brazilian-tools/currency';
import { validateLicensePlate } from 'brazilian-tools/license-plate';
import { validatePIS } from 'brazilian-tools/pis';
import { getBrazilianState } from 'brazilian-tools/states';
assert.equal(validateCPF('52998224725'), true);
assert.equal(validateCPFDirect('52998224725'), true);
assert.equal(validateCNH('12345678900'), true);
assert.equal(formatBRL(1234.56), 'R$ 1.234,56');
assert.equal(validateLicensePlate('ABC1D23'), true);
assert.equal(validatePIS('12044568901'), true);
assert.equal(getBrazilianState('SP')?.name, 'São Paulo');
assert.equal(formatCPF('52998224725'), '529.982.247-25');
assert.equal(normalizeCPF('529.982.247-25'), '52998224725');
assert.equal(validateCNPJ('04252011000110'), true);
assert.equal(validateRG('123456782'), true);
assert.equal(validatePhoneBR('+55 (11) 98765-4321'), true);
assert.equal(parsePhoneBR('11987654321').e164, '+5511987654321');
assert.equal(normalizeCEP('01001-000'), '01001000');
`,
  );
  run(process.execPath, [join(temporaryDirectory, 'consumer.mjs')], temporaryDirectory);

  writeFileSync(
    join(temporaryDirectory, 'consumer.cjs'),
    `
const assert = require('node:assert/strict');
const { formatCPF, validateCPF, validateRG, validateCNH, formatBRL, validateLicensePlate } = require('brazilian-tools');
const { validateCPF: validateCPFDirect } = require('brazilian-tools/cpf');
const { validatePIS } = require('brazilian-tools/pis');
assert.equal(validateCPF('52998224725'), true);
assert.equal(validateCPFDirect('52998224725'), true);
assert.equal(validateCNH('12345678900'), true);
assert.equal(formatBRL(1234.56), 'R$ 1.234,56');
assert.equal(validateLicensePlate('ABC1D23'), true);
assert.equal(validatePIS('12044568901'), true);
assert.equal(formatCPF('52998224725'), '529.982.247-25');
assert.equal(validateRG('123456782'), true);
`,
  );
  run(process.execPath, [join(temporaryDirectory, 'consumer.cjs')], temporaryDirectory);
  process.stdout.write(
    'Tarball instalado: import ESM, require CJS, runtime e tipos TypeScript OK.\n',
  );
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true });
}
