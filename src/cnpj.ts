import { booleanOption, inputString, randomFrom } from './internal.js';

export type CNPJKind = 'numeric' | 'alphanumeric';

export interface GenerateCNPJOptions {
  kind?: CNPJKind;
  formatted?: boolean;
}

const BASE_WEIGHTS = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] as const;

function normalizeInput(value: unknown): string | null {
  const input = inputString(value);
  if (input === null) return null;
  const text = input.trim().toUpperCase();
  if (/^[A-Z\d]{12}\d{2}$/.test(text)) return text;
  const match = /^([A-Z\d]{2})\.([A-Z\d]{3})\.([A-Z\d]{3})\/([A-Z\d]{4})-(\d{2})$/.exec(text);
  return match ? match.slice(1).join('') : null;
}

export function normalizeCNPJ(value: string | number): string {
  const cnpj = normalizeInput(value);
  if (!cnpj || !/^[A-Z\d]{12}\d{2}$/.test(cnpj)) {
    throw new TypeError('CNPJ must contain 12 alphanumeric characters and 2 check digits.');
  }
  return cnpj;
}

function characterValue(character: string): number {
  return character.charCodeAt(0) - 48;
}

function checkDigit(base: string, weights: readonly number[]): number {
  let total = 0;
  for (let index = 0; index < base.length; index++) {
    total += characterValue(base[index]!) * weights[index]!;
  }
  const remainder = total % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}

function appendCheckDigits(base: string): string {
  const first = checkDigit(base, BASE_WEIGHTS);
  const second = checkDigit(`${base}${first}`, [6, ...BASE_WEIGHTS]);
  return `${base}${first}${second}`;
}

export function validateCNPJ(value: unknown): boolean {
  const cnpj = normalizeInput(value);
  if (!cnpj || !/^[A-Z\d]{12}\d{2}$/.test(cnpj) || /^(.)\1{13}$/.test(cnpj)) return false;
  return appendCheckDigits(cnpj.slice(0, 12)) === cnpj;
}

export function formatCNPJ(value: string | number): string {
  const cnpj = normalizeCNPJ(value);
  return cnpj.replace(/^(.{2})(.{3})(.{3})(.{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

export function generateCNPJ(options: GenerateCNPJOptions = {}): string {
  const formatted = booleanOption(options.formatted, 'formatted');
  const kind = options.kind ?? 'numeric';
  if (kind !== 'numeric' && kind !== 'alphanumeric') {
    throw new RangeError(`Unsupported CNPJ kind: ${String(kind)}.`);
  }
  const alphabet = kind === 'alphanumeric' ? '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ' : '0123456789';
  let base: string;
  do base = randomFrom(alphabet, 12);
  while (/^(.)\1{11}$/.test(base));
  const cnpj = appendCheckDigits(base);
  return formatted ? formatCNPJ(cnpj) : cnpj;
}
