import { booleanOption, inputString, randomFrom, randomInteger } from './internal.js';

/** Geographic area codes currently in use in Brazil's numbering plan. */
export const SUPPORTED_PHONE_DDDS = Object.freeze([
  '11',
  '12',
  '13',
  '14',
  '15',
  '16',
  '17',
  '18',
  '19',
  '21',
  '22',
  '24',
  '27',
  '28',
  '31',
  '32',
  '33',
  '34',
  '35',
  '37',
  '38',
  '41',
  '42',
  '43',
  '44',
  '45',
  '46',
  '47',
  '48',
  '49',
  '51',
  '53',
  '54',
  '55',
  '61',
  '62',
  '63',
  '64',
  '65',
  '66',
  '67',
  '68',
  '69',
  '71',
  '73',
  '74',
  '75',
  '77',
  '79',
  '81',
  '82',
  '83',
  '84',
  '85',
  '86',
  '87',
  '88',
  '89',
  '91',
  '92',
  '93',
  '94',
  '95',
  '96',
  '97',
  '98',
  '99',
] as const);

export type PhoneBRDDD = (typeof SUPPORTED_PHONE_DDDS)[number];
export type PhoneBRType = 'mobile' | 'landline';

export interface GeneratePhoneBROptions {
  ddd?: PhoneBRDDD;
  type?: PhoneBRType;
  formatted?: boolean;
  international?: boolean;
}

export interface FormatPhoneBROptions {
  international?: boolean;
}

export interface ParsedPhoneBR {
  countryCode: '55';
  ddd: PhoneBRDDD;
  number: string;
  type: PhoneBRType;
  national: string;
  e164: string;
  formatted: string;
}

interface NormalizedPhoneBR {
  national: string;
  ddd: PhoneBRDDD;
  number: string;
  type: PhoneBRType;
}

function normalizeInput(value: unknown): NormalizedPhoneBR | null {
  const input = inputString(value);
  if (input === null) return null;
  const text = input.trim();
  const acceptedFormat =
    /^\d{10,13}$/.test(text) ||
    /^\+55\d{10,11}$/.test(text) ||
    /^\(\d{2}\)\s?\d{4,5}-\d{4}$/.test(text) ||
    /^\d{2}\s\d{4,5}-\d{4}$/.test(text) ||
    /^\+55\s(?:\(\d{2}\)|\d{2})\s?\d{4,5}-\d{4}$/.test(text);
  if (!acceptedFormat) return null;

  const digits = text.replace(/\D/g, '');
  if (digits.length === 12 || digits.length === 13) {
    if (!digits.startsWith('55')) return null;
    return normalizeDigits(digits.slice(2));
  }
  return normalizeDigits(digits);
}

function normalizeDigits(digits: string): NormalizedPhoneBR | null {
  const ddd = digits.slice(0, 2);
  if (!(SUPPORTED_PHONE_DDDS as readonly string[]).includes(ddd)) return null;

  const number = digits.slice(2);
  if (number.length === 9 && number.startsWith('9')) {
    return { national: digits, ddd: ddd as PhoneBRDDD, number, type: 'mobile' };
  }
  if (number.length === 8 && /^[2-5]/.test(number)) {
    return { national: digits, ddd: ddd as PhoneBRDDD, number, type: 'landline' };
  }
  return null;
}

export function generatePhoneBR(options: GeneratePhoneBROptions = {}): string {
  const formatted = booleanOption(options.formatted, 'formatted');
  const international = booleanOption(options.international, 'international');
  const ddd = options.ddd ?? SUPPORTED_PHONE_DDDS[randomInteger(SUPPORTED_PHONE_DDDS.length)]!;
  if (!(SUPPORTED_PHONE_DDDS as readonly string[]).includes(ddd)) {
    throw new RangeError('DDD must belong to the list of supported area codes.');
  }
  const type = options.type ?? (randomInteger(2) === 0 ? 'mobile' : 'landline');
  if (type !== 'mobile' && type !== 'landline') {
    throw new RangeError(`Unsupported phone type: ${String(type)}.`);
  }
  const number =
    type === 'mobile'
      ? `9${randomFrom('0123456789', 8)}`
      : `${randomFrom('2345', 1)}${randomFrom('0123456789', 7)}`;
  const national = `${ddd}${number}`;
  return formatted
    ? formatPhoneBR(national, international ? { international: true } : {})
    : national;
}

export function validatePhoneBR(value: unknown): boolean {
  return normalizeInput(value) !== null;
}

export function normalizePhoneBR(value: string | number): string {
  const phone = normalizeInput(value);
  if (!phone) {
    throw new TypeError(
      'Phone must contain a valid DDD and a Brazilian landline or mobile number.',
    );
  }
  return phone.national;
}

export function formatPhoneBR(value: string | number, options: FormatPhoneBROptions = {}): string {
  const phone = normalizeInput(value);
  if (!phone) {
    throw new TypeError(
      'Phone must contain a valid DDD and a Brazilian landline or mobile number.',
    );
  }
  const split = phone.type === 'mobile' ? 5 : 4;
  const number = `${phone.number.slice(0, split)}-${phone.number.slice(split)}`;
  return options.international ? `+55 ${phone.ddd} ${number}` : `(${phone.ddd}) ${number}`;
}

export function parsePhoneBR(value: string | number): ParsedPhoneBR {
  const phone = normalizeInput(value);
  if (!phone) {
    throw new TypeError(
      'Phone must contain a valid DDD and a Brazilian landline or mobile number.',
    );
  }
  return {
    countryCode: '55',
    ddd: phone.ddd,
    number: phone.number,
    type: phone.type,
    national: phone.national,
    e164: `+55${phone.national}`,
    formatted: formatPhoneBR(phone.national),
  };
}
