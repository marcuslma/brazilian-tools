import { booleanOption, inputString, randomFrom } from './internal.js';

export interface GeneratePISOptions {
  formatted?: boolean;
}

function normalizeInput(value: unknown): string | null {
  const input = inputString(value);
  if (input === null) return null;
  const text = input.trim();
  if (/^\d{11}$/.test(text)) return text;
  const match = /^(\d{3})\.(\d{4})\.(\d{3})-(\d)$/.exec(text);
  return match ? match.slice(1).join('') : null;
}

export function normalizePIS(value: string | number): string {
  const pis = normalizeInput(value);
  if (!pis) throw new TypeError('PIS/PASEP/NIT must contain 11 digits.');
  return pis;
}

function checkDigit(base: string): string {
  const weights = [3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const total = base
    .split('')
    .reduce((sum, digit, index) => sum + Number(digit) * weights[index]!, 0);
  const remainder = 11 - (total % 11);
  return String(remainder === 10 || remainder === 11 ? 0 : remainder);
}

export function validatePIS(value: unknown): boolean {
  const pis = normalizeInput(value);
  if (!pis || /^(\d)\1{10}$/.test(pis)) return false;
  return checkDigit(pis.slice(0, 10)) === pis.at(-1);
}

export function formatPIS(value: string | number): string {
  const pis = normalizePIS(value);
  return pis.replace(/^(\d{3})(\d{4})(\d{3})(\d)$/, '$1.$2.$3-$4');
}

export function generatePIS(options: GeneratePISOptions = {}): string {
  const formatted = booleanOption(options.formatted, 'formatted');
  let base: string;
  do base = randomFrom('0123456789', 10);
  while (/^(\d)\1{9}$/.test(base));
  const pis = `${base}${checkDigit(base)}`;
  return formatted ? formatPIS(pis) : pis;
}
