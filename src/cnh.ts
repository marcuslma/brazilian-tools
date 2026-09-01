import { booleanOption, inputString, optionsObject, randomFrom } from './internal.js';

export interface GenerateCNHOptions {
  formatted?: boolean;
}

function normalizeInput(value: unknown): string | null {
  const input = inputString(value);
  if (input === null) return null;
  const text = input.trim();
  if (/^\d{11}$/.test(text)) return text;
  const match = /^(\d{9})-(\d{2})$/.exec(text);
  return match ? match.slice(1).join('') : null;
}

export function normalizeCNH(value: string | number): string {
  const cnh = normalizeInput(value);
  if (!cnh) throw new TypeError('CNH must contain 11 digits.');
  return cnh;
}

function checkDigits(base: string): readonly [string, string] {
  const firstTotal = base
    .split('')
    .reduce((sum, digit, index) => sum + Number(digit) * (9 - index), 0);
  const firstRemainder = firstTotal % 11;
  const first = firstRemainder >= 10 ? 0 : firstRemainder;
  const offset = firstRemainder >= 10 ? 2 : 0;

  const secondTotal = base
    .split('')
    .reduce((sum, digit, index) => sum + Number(digit) * (index + 1), 0);
  const secondRemainder = secondTotal % 11;
  const second = secondRemainder >= 10 ? 0 : secondRemainder - offset;
  return [String(first), String(second)];
}

function appendCheckDigits(base: string): string {
  const [first, second] = checkDigits(base);
  return `${base}${first}${second}`;
}

export function validateCNH(value: unknown): boolean {
  const cnh = normalizeInput(value);
  if (!cnh || /^(\d)\1{10}$/.test(cnh)) return false;
  return appendCheckDigits(cnh.slice(0, 9)) === cnh;
}

export function formatCNH(value: string | number): string {
  const cnh = normalizeCNH(value);
  return cnh.replace(/^(\d{9})(\d{2})$/, '$1-$2');
}

export function generateCNH(options: GenerateCNHOptions = {}): string {
  const parsedOptions = optionsObject(options, 'GenerateCNHOptions');
  const formatted = booleanOption(parsedOptions.formatted, 'formatted');
  let base: string;
  let cnh: string;
  do {
    base = randomFrom('0123456789', 9);
    cnh = appendCheckDigits(base);
  } while (/^(\d)\1{8}$/.test(base) || cnh.includes('-'));
  return formatted ? formatCNH(cnh) : cnh;
}
