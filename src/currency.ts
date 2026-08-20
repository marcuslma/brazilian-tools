import { inputString } from './internal.js';

export function formatBRL(value: number): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new TypeError('Valor em reais deve ser um número finito.');
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
  if (input === null) throw new TypeError('Valor em reais deve ser um texto.');

  const text = input
    .trim()
    .replace(/\s/g, '')
    .replace(/^-R\$/i, '-')
    .replace(/^R\$/i, '')
    .replace(/^R\$-/i, '-');
  if (!/^-?(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/.test(text)) {
    throw new TypeError('Valor em reais inválido.');
  }

  const parsed = Number(text.replace(/\./g, '').replace(',', '.'));
  if (!Number.isFinite(parsed)) throw new TypeError('Valor em reais inválido.');
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
  throw new TypeError('Valor em reais deve ser um número finito ou texto válido.');
}
