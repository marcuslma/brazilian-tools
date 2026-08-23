import { inputString } from './internal.js';

export function formatBRL(value: number): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new TypeError('BRL value must be a finite number.');
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
    .format(value)
    .replace(/\u00a0/g, ' ');
}

export function parseBRL(value: string): number {
  const input = inputString(value);
  if (input === null) throw new TypeError('BRL value must be text.');

  const text = input
    .trim()
    .replace(/\s/g, '')
    .replace(/^-R\$/i, '-')
    .replace(/^R\$/i, '')
    .replace(/^R\$-/i, '-');
  if (!/^-?(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/.test(text)) {
    throw new TypeError('Invalid BRL value.');
  }

  const parsed = Number(text.replace(/\./g, '').replace(',', '.'));
  if (!Number.isFinite(parsed)) throw new TypeError('Invalid BRL value.');
  return parsed;
}

export function normalizeBRL(value: string | number): number {
  return typeof value === 'number'
    ? Number.isFinite(value)
      ? value
      : invalidValue()
    : parseBRL(value);
}

function invalidValue(): never {
  throw new TypeError('BRL value must be a finite number or valid text.');
}
