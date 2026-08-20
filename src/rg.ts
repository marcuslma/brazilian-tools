import { inputString, randomFrom, randomInteger } from './internal.js';

/** UFs cujo algoritmo de dígito verificador está implementado e testado. */
export const SUPPORTED_RG_STATES = Object.freeze(['SP'] as const);
export type RGState = (typeof SUPPORTED_RG_STATES)[number];

export interface RGOptions {
  /** Se omitida na geração, uma UF suportada é sorteada. */
  state?: RGState;
}

export interface GenerateRGOptions extends RGOptions {
  formatted?: boolean;
  includeState?: boolean;
}

export interface GeneratedRG {
  value: string;
  state: RGState;
}

function normalizeInput(value: unknown): string | null {
  const input = inputString(value);
  if (input === null) return null;
  const text = input.trim().toUpperCase();
  if (/^\d{8}[\dX]$/.test(text)) return text;
  const match = /^(\d{2})\.(\d{3})\.(\d{3})-([\dX])$/.exec(text);
  return match ? match.slice(1).join('') : null;
}

function structuralInput(value: unknown): string | null {
  const input = inputString(value);
  if (input === null) return null;
  const text = input.trim().toUpperCase();
  const isCommonMaskedFormat =
    /^\d{2}\.\d{3}\.\d{3}[-/][\dX]$/.test(text) || /^[A-Z]{2}[-\s]?\d{2}\.\d{3}\.\d{3}$/.test(text);
  const isUnmaskedFormat = /^[A-Z\d]{5,14}$/.test(text);
  if (!isCommonMaskedFormat && !isUnmaskedFormat) return null;

  const compact = text.replace(/[.\-/\s]/g, '');
  const digits = compact.replace(/\D/g, '');
  const letters = compact.replace(/\d/g, '');
  if (
    compact.length < 5 ||
    compact.length > 14 ||
    digits.length < 5 ||
    digits.length > 12 ||
    letters.length > 3 ||
    /^(.)\1+$/.test(compact)
  )
    return null;
  return compact;
}

function ensureSupportedState(state: string): asserts state is RGState {
  if (!(SUPPORTED_RG_STATES as readonly string[]).includes(state)) {
    throw new RangeError(
      `UF não suportada: ${state}. UFs com algoritmo verificável: ${SUPPORTED_RG_STATES.join(', ')}.`,
    );
  }
}

function selectState(state?: string): RGState {
  if (state !== undefined) {
    ensureSupportedState(state);
    return state;
  }
  return SUPPORTED_RG_STATES[randomInteger(SUPPORTED_RG_STATES.length)]!;
}

function stateForNormalization(state?: string): RGState {
  if (state !== undefined) {
    ensureSupportedState(state);
    return state;
  }
  return SUPPORTED_RG_STATES[0]!;
}

export function normalizeRG(value: string | number, options: RGOptions = {}): string {
  const state = stateForNormalization(options.state);
  const rg = normalizeInput(value);
  if (state === 'SP' && (!rg || !/^\d{8}[\dX]$/.test(rg))) {
    throw new TypeError('RG de SP deve conter 8 dígitos e um verificador numérico ou X.');
  }
  return rg!;
}

function spDigit(base: string): string {
  let total = 0;
  for (let index = 0; index < 8; index++) total += Number(base[index]) * (index + 2);
  const complement = 11 - (total % 11);
  if (complement === 11) return '0';
  if (complement === 10) return 'X';
  return String(complement);
}

function validateSP(value: unknown): boolean {
  const rg = normalizeInput(value);
  if (!rg || !/^\d{8}[\dX]$/.test(rg) || /^(\d)\1{8}$/.test(rg)) return false;
  return spDigit(rg.slice(0, 8)) === rg.at(-1);
}

/**
 * Valida um RG. Sem UF, verifica uma estrutura plausível.
 * Com uma UF informada, exige um algoritmo estadual suportado.
 */
export function validateRG(value: unknown, options: { state?: string } = {}): boolean {
  if (options.state !== undefined) {
    ensureSupportedState(options.state);
    return validateSP(value);
  }
  return structuralInput(value) !== null;
}

export function formatRG(value: string | number, options: RGOptions = {}): string {
  const rg = normalizeRG(value, options);
  return rg.replace(/^(\d{2})(\d{3})(\d{3})([\dX])$/, '$1.$2.$3-$4');
}

function generateSP(formatted: boolean): string {
  let base: string;
  do base = randomFrom('0123456789', 8);
  while (/^(\d)\1{7}$/.test(base));
  const rg = `${base}${spDigit(base)}`;
  return formatted ? formatRG(rg, { state: 'SP' }) : rg;
}

function generateRGResult(options: GenerateRGOptions = {}): GeneratedRG {
  const state = selectState(options.state);
  return {
    value: generateSP(options.formatted ?? false),
    state,
  };
}

export function generateRG(options: GenerateRGOptions & { includeState: true }): GeneratedRG;
export function generateRG(options?: GenerateRGOptions & { includeState?: false }): string;
export function generateRG(options: GenerateRGOptions = {}): string | GeneratedRG {
  const generated = generateRGResult(options);
  return options.includeState ? generated : generated.value;
}
