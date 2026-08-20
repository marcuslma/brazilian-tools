import { inputString } from './internal.js';

export type LicensePlateKind = 'old' | 'mercosul';

export interface ParsedLicensePlate {
  value: string;
  kind: LicensePlateKind;
  formatted: string;
}

function normalizeInput(value: unknown): string | null {
  const input = inputString(value);
  if (input === null) return null;
  const text = input.trim().toUpperCase();
  if (/^[A-Z]{3}-\d{4}$/.test(text)) return text.replace('-', '');
  if (/^[A-Z]{3}\d{4}$/.test(text)) return text;
  if (/^[A-Z]{3}\d[A-Z]\d{2}$/.test(text)) return text;
  return null;
}

function kindOf(value: string): LicensePlateKind {
  return /^[A-Z]{3}\d{4}$/.test(value) ? 'old' : 'mercosul';
}

export function normalizeLicensePlate(value: string): string {
  const plate = normalizeInput(value);
  if (!plate) throw new TypeError('Placa deve seguir o formato antigo ou Mercosul.');
  return plate;
}

export function validateLicensePlate(value: unknown): boolean {
  return normalizeInput(value) !== null;
}

export function formatLicensePlate(value: string): string {
  const plate = normalizeLicensePlate(value);
  return kindOf(plate) === 'old' ? plate.replace(/^(\w{3})(\d{4})$/, '$1-$2') : plate;
}

export function parseLicensePlate(value: string): ParsedLicensePlate {
  const normalized = normalizeLicensePlate(value);
  const kind = kindOf(normalized);
  return { value: normalized, kind, formatted: formatLicensePlate(normalized) };
}
