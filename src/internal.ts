export function inputString(value: unknown): string | null {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0) return String(value);
  return null;
}

export function onlyDigits(value: unknown): string | null {
  const text = inputString(value);
  if (text === null) return null;
  if (!/^[\d.\-/\s]+$/.test(text)) return null;
  return text.replace(/\D/g, '');
}

export function booleanOption(value: unknown, name: string, defaultValue = false): boolean {
  const option = value ?? defaultValue;
  if (typeof option !== 'boolean') {
    throw new RangeError(`${name} must be boolean: ${String(option)}.`);
  }
  return option;
}

export function randomFrom(alphabet: string, length: number): string {
  let result = '';
  const values = new Uint32Array(length);
  globalThis.crypto.getRandomValues(values);
  for (const value of values) result += alphabet[value % alphabet.length];
  return result;
}

export function randomInteger(maxExclusive: number): number {
  if (!Number.isInteger(maxExclusive) || maxExclusive < 1) {
    throw new RangeError('maxExclusive must be a positive integer.');
  }
  const value = new Uint32Array(1);
  globalThis.crypto.getRandomValues(value);
  return value[0]! % maxExclusive;
}
