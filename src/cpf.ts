import { inputString, randomFrom } from './internal.js';

export interface GenerateCPFOptions {
  formatted?: boolean;
}

function normalizeInput(value: unknown): string | null {
  const input = inputString(value);
  if (input === null) return null;
  const text = input.trim();
  if (/^\d{11}$/.test(text)) return text;
  const match = /^(\d{3})\.(\d{3})\.(\d{3})-(\d{2})$/.exec(text);
  return match ? match.slice(1).join('') : null;
}

export function normalizeCPF(value: string | number): string {
  const cpf = normalizeInput(value);
  if (!cpf || !/^\d{11}$/.test(cpf)) throw new TypeError('CPF deve conter 11 dígitos.');
  return cpf;
}

function digit(base: string, factor: number): number {
  let total = 0;
  for (const character of base) total += Number(character) * factor--;
  const remainder = total % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}

export function validateCPF(value: unknown): boolean {
  const cpf = normalizeInput(value);
  if (!cpf || !/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
  const base = cpf.slice(0, 9);
  const first = digit(base, 10);
  const second = digit(`${base}${first}`, 11);
  return cpf === `${base}${first}${second}`;
}

export function formatCPF(value: string | number): string {
  const cpf = normalizeCPF(value);
  return cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
}

export function generateCPF(options: GenerateCPFOptions = {}): string {
  let base: string;
  do base = randomFrom('0123456789', 9);
  while (/^(\d)\1{8}$/.test(base));
  const first = digit(base, 10);
  const cpf = `${base}${first}${digit(`${base}${first}`, 11)}`;
  return options.formatted ? formatCPF(cpf) : cpf;
}
