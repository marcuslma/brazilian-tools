import assert from 'node:assert/strict';
import { mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const temporaryDirectory = mkdtempSync(join(tmpdir(), 'brazilian-tools-smoke-'));
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function run(command, args, cwd, { dryRun } = {}) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    env:
      dryRun === undefined ? process.env : { ...process.env, npm_config_dry_run: String(dryRun) },
  });
  if (result.status !== 0) {
    process.stderr.write(result.stdout);
    process.stderr.write(result.stderr);
    throw new Error(`${command} ${args.join(' ')} failed with exit code ${String(result.status)}.`);
  }
  return result.stdout;
}

try {
  const packed = JSON.parse(
    run(npm, ['pack', '--json', '--dry-run', '--silent'], root, { dryRun: true }),
  );
  assert.equal(packed.length, 1, 'npm pack did not report exactly one package.');
  for (const { path } of packed[0].files) {
    assert.equal(path.startsWith('src/'), false, `Tarball must not include source file ${path}.`);
    assert.equal(path.endsWith('.map'), false, `Tarball must not include source map ${path}.`);
  }

  run(
    npm,
    ['pack', '--dry-run=false', '--silent', '--pack-destination', temporaryDirectory],
    root,
    { dryRun: false },
  );
  const tarball = readdirSync(temporaryDirectory).find((file) => file.endsWith('.tgz'));
  assert.ok(tarball, 'npm pack did not generate a tarball.');

  writeFileSync(join(temporaryDirectory, 'package.json'), '{"private":true}\n');
  run(
    npm,
    ['install', '--ignore-scripts', '--no-audit', '--no-fund', join(temporaryDirectory, tarball)],
    temporaryDirectory,
    { dryRun: false },
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
    join(temporaryDirectory, 'consumer.cts'),
    `
import BrazilianTools = require('brazilian-tools');
import CEP = require('brazilian-tools/cep');
import CNH = require('brazilian-tools/cnh');
import CNPJ = require('brazilian-tools/cnpj');
import CPF = require('brazilian-tools/cpf');
import Currency = require('brazilian-tools/currency');
import LicensePlate = require('brazilian-tools/license-plate');
import Phone = require('brazilian-tools/phone');
import PIS = require('brazilian-tools/pis');
import RG = require('brazilian-tools/rg');
import States = require('brazilian-tools/states');

const rootValid: boolean = BrazilianTools.validateCPF('52998224725');
const cpfValid: boolean = CPF.validateCPF('52998224725');
const cnpjValid: boolean = CNPJ.validateCNPJ('04252011000110');
const rgValid: boolean = RG.validateRG('123456782');
const phoneValid: boolean = Phone.validatePhoneBR('11987654321');
const address: CEP.CEPAddress | undefined = undefined;
const cnhValid: boolean = CNH.validateCNH('12345678900');
const brl: string = Currency.formatBRL(1234.56);
const plateValid: boolean = LicensePlate.validateLicensePlate('ABC1D23');
const pisValid: boolean = PIS.validatePIS('12044568901');
const stateName: string | undefined = States.getBrazilianState('SP')?.name;
void [rootValid, cpfValid, cnpjValid, rgValid, phoneValid, address, cnhValid, brl, plateValid, pisValid, stateName];
`,
  );
  writeFileSync(
    join(temporaryDirectory, 'tsconfig.cjs.json'),
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
      include: ['consumer.cts'],
    }),
  );
  run(
    process.execPath,
    [tsc, '--project', join(temporaryDirectory, 'tsconfig.cjs.json')],
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
import { normalizeCEP as normalizeCEPDirect } from 'brazilian-tools/cep';
import { validateCPF as validateCPFDirect } from 'brazilian-tools/cpf';
import { validateCNH } from 'brazilian-tools/cnh';
import { validateCNPJ as validateCNPJDirect } from 'brazilian-tools/cnpj';
import { formatBRL } from 'brazilian-tools/currency';
import { validateLicensePlate } from 'brazilian-tools/license-plate';
import { validatePhoneBR as validatePhoneBRDirect } from 'brazilian-tools/phone';
import { validatePIS } from 'brazilian-tools/pis';
import { validateRG as validateRGDirect } from 'brazilian-tools/rg';
import { getBrazilianState } from 'brazilian-tools/states';
assert.equal(validateCPF('52998224725'), true);
assert.equal(validateCPFDirect('52998224725'), true);
assert.equal(validateCNPJDirect('04252011000110'), true);
assert.equal(normalizeCEPDirect('01001-000'), '01001000');
assert.equal(validateCNH('12345678900'), true);
assert.equal(formatBRL(1234.56), 'R$ 1.234,56');
assert.equal(validateLicensePlate('ABC1D23'), true);
assert.equal(validatePIS('12044568901'), true);
assert.equal(getBrazilianState('SP')?.name, 'São Paulo');
assert.equal(formatCPF('52998224725'), '529.982.247-25');
assert.equal(normalizeCPF('529.982.247-25'), '52998224725');
assert.equal(validateCNPJ('04252011000110'), true);
assert.equal(validateRG('123456782'), true);
assert.equal(validateRGDirect('123456782'), true);
assert.equal(validatePhoneBR('+55 (11) 98765-4321'), true);
assert.equal(validatePhoneBRDirect('11987654321'), true);
assert.equal(parsePhoneBR('11987654321').e164, '+5511987654321');
assert.equal(normalizeCEP('01001-000'), '01001000');
`,
  );
  run(process.execPath, [join(temporaryDirectory, 'consumer.mjs')], temporaryDirectory);

  writeFileSync(
    join(temporaryDirectory, 'consumer.cjs'),
    `
const assert = require('node:assert/strict');
const { formatCPF, normalizeCEP, validateCPF, validateRG, validateCNH, formatBRL, validateLicensePlate, validatePhoneBR, validateCNPJ } = require('brazilian-tools');
const { normalizeCEP: normalizeCEPDirect } = require('brazilian-tools/cep');
const { validateCPF: validateCPFDirect } = require('brazilian-tools/cpf');
const { validateCNH: validateCNHDirect } = require('brazilian-tools/cnh');
const { validateCNPJ: validateCNPJDirect } = require('brazilian-tools/cnpj');
const { formatBRL: formatBRLDirect } = require('brazilian-tools/currency');
const { validateLicensePlate: validateLicensePlateDirect } = require('brazilian-tools/license-plate');
const { validatePhoneBR: validatePhoneBRDirect } = require('brazilian-tools/phone');
const { validatePIS } = require('brazilian-tools/pis');
const { validateRG: validateRGDirect } = require('brazilian-tools/rg');
const { getBrazilianState } = require('brazilian-tools/states');
assert.equal(validateCPF('52998224725'), true);
assert.equal(validateCPFDirect('52998224725'), true);
assert.equal(validateCNPJ('04252011000110'), true);
assert.equal(validateCNPJDirect('04252011000110'), true);
assert.equal(normalizeCEP('01001-000'), '01001000');
assert.equal(normalizeCEPDirect('01001-000'), '01001000');
assert.equal(validateCNH('12345678900'), true);
assert.equal(validateCNHDirect('12345678900'), true);
assert.equal(formatBRL(1234.56), 'R$ 1.234,56');
assert.equal(formatBRLDirect(1234.56), 'R$ 1.234,56');
assert.equal(validateLicensePlate('ABC1D23'), true);
assert.equal(validateLicensePlateDirect('ABC1D23'), true);
assert.equal(validatePIS('12044568901'), true);
assert.equal(formatCPF('52998224725'), '529.982.247-25');
assert.equal(validateRG('123456782'), true);
assert.equal(validateRGDirect('123456782'), true);
assert.equal(validatePhoneBR('11987654321'), true);
assert.equal(validatePhoneBRDirect('11987654321'), true);
assert.equal(getBrazilianState('SP').name, 'São Paulo');
`,
  );
  run(process.execPath, [join(temporaryDirectory, 'consumer.cjs')], temporaryDirectory);
  process.stdout.write(
    'Tarball installed: ESM/CJS imports, all subpaths, runtime, and TypeScript types OK.\n',
  );
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true });
}
