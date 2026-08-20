import { inputString, onlyDigits } from './internal.js';

export type CEPProvider = 'auto' | 'brasilapi' | 'viacep';
export type CEPResolvedProvider = Exclude<CEPProvider, 'auto'>;

export interface CEPCoordinates {
  latitude: number;
  longitude: number;
}

export interface CEPAddress {
  cep: string;
  street: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  stateName: string;
  region: string;
  ibge: string;
  gia: string;
  areaCode: string;
  siafi: string;
  unit: string;
  provider: CEPResolvedProvider;
  service?: string;
  timezone?: string;
  coordinates?: CEPCoordinates;
  /** Resposta original do provedor, presente somente com `includeRaw: true`. */
  raw?: Readonly<Record<string, unknown>>;
}

export interface CEPCache {
  get(key: string): CEPAddress | undefined | Promise<CEPAddress | undefined>;
  set(key: string, address: CEPAddress): unknown | Promise<unknown>;
}

export interface CEPAbortSignal {
  readonly aborted: boolean;
  readonly reason?: unknown;
  addEventListener(type: 'abort', listener: () => void, options?: { once?: boolean }): void;
  removeEventListener(type: 'abort', listener: () => void): void;
}

export interface CEPFetchResponse {
  readonly ok: boolean;
  readonly status: number;
  json(): Promise<unknown>;
}

export type CEPFetcher = (
  url: string,
  options: { signal: CEPAbortSignal },
) => CEPFetchResponse | Promise<CEPFetchResponse>;

export interface LookupCEPOptions {
  /** `auto` tenta BrasilAPI e usa ViaCEP como fallback. Padrão: `auto`. */
  provider?: CEPProvider;
  /** Se `false`, CEP não encontrado na BrasilAPI não aciona o ViaCEP. Padrão: `true`. */
  fallbackOnNotFound?: boolean;
  /** Inclui a resposta original do provedor em `address.raw`. Padrão: `false`. */
  includeRaw?: boolean;
  /** Cache injetado pelo chamador; não há cache global. */
  cache?: CEPCache;
  fetcher?: CEPFetcher;
  /** Tempo limite total das chamadas aos provedores, incluindo fallback. Padrão: 5000 ms. */
  timeoutMs?: number;
  signal?: CEPAbortSignal;
}

export type ProviderLookupCEPOptions = Omit<LookupCEPOptions, 'provider'>;

export interface LookupCEPsOptions extends LookupCEPOptions {
  /** Máximo de consultas simultâneas. Padrão: 4. */
  concurrency?: number;
}

interface CEPErrorOptions {
  cause?: unknown;
  provider?: CEPResolvedProvider;
  status?: number;
}

export class CEPNotFoundError extends Error {
  override readonly name = 'CEPNotFoundError';
  readonly provider?: CEPResolvedProvider;

  constructor(cep: string, provider?: CEPResolvedProvider) {
    super(`CEP não encontrado: ${formatCEP(cep)}.`);
    if (provider !== undefined) this.provider = provider;
  }
}

export class CEPRequestError extends Error {
  override readonly name = 'CEPRequestError';
  readonly provider?: CEPResolvedProvider;
  readonly status?: number;

  constructor(message: string, options: CEPErrorOptions = {}) {
    super(message, options.cause === undefined ? undefined : { cause: options.cause });
    if (options.provider !== undefined) this.provider = options.provider;
    if (options.status !== undefined) this.status = options.status;
  }
}

function normalizeInput(value: unknown): string | null {
  const input = inputString(value);
  if (input === null) return null;
  const text = input.trim();
  if (/^\d{8}$/.test(text)) return text;
  const match = /^(\d{5})-(\d{3})$/.exec(text);
  return match ? `${match[1]}${match[2]}` : null;
}

export function validateCEP(value: unknown): boolean {
  const cep = normalizeInput(value);
  return cep !== null && /^\d{8}$/.test(cep);
}

export function normalizeCEP(value: string | number): string {
  const cep = normalizeInput(value);
  if (!cep || !/^\d{8}$/.test(cep)) throw new TypeError('CEP deve conter 8 dígitos.');
  return cep;
}

export function formatCEP(value: string | number): string {
  const cep = normalizeCEP(value);
  return cep.replace(/^(\d{5})(\d{3})$/, '$1-$2');
}

function field(data: Record<string, unknown>, key: string): string {
  const value = data[key];
  return typeof value === 'string' ? value : '';
}

function brasilAPIAddress(data: Record<string, unknown>, cep: string): CEPAddress {
  const address: CEPAddress = {
    cep: formatCEP(field(data, 'cep') || cep),
    street: field(data, 'street'),
    complement: '',
    neighborhood: field(data, 'neighborhood'),
    city: field(data, 'city'),
    state: field(data, 'state'),
    stateName: '',
    region: '',
    ibge: '',
    gia: '',
    areaCode: '',
    siafi: '',
    unit: '',
    provider: 'brasilapi',
  };

  const service = field(data, 'service');
  const timezone = field(data, 'timezoneName');
  if (service) address.service = service;
  if (timezone) address.timezone = timezone;

  const location = data.location;
  if (location && typeof location === 'object' && !Array.isArray(location)) {
    const coordinates = (location as Record<string, unknown>).coordinates;
    if (coordinates && typeof coordinates === 'object' && !Array.isArray(coordinates)) {
      const values = coordinates as Record<string, unknown>;
      const numericCoordinate = (value: unknown): number | null => {
        if (typeof value !== 'number' && typeof value !== 'string') return null;
        if (typeof value === 'string' && value.trim() === '') return null;
        const number = Number(value);
        return Number.isFinite(number) ? number : null;
      };
      const latitude = numericCoordinate(values.latitude);
      const longitude = numericCoordinate(values.longitude);
      if (
        latitude !== null &&
        latitude >= -90 &&
        latitude <= 90 &&
        longitude !== null &&
        longitude >= -180 &&
        longitude <= 180
      ) {
        address.coordinates = { latitude, longitude };
      }
    }
  }
  return address;
}

function viaCEPAddress(data: Record<string, unknown>, cep: string): CEPAddress {
  return {
    cep: formatCEP(field(data, 'cep') || cep),
    street: field(data, 'logradouro'),
    complement: field(data, 'complemento'),
    neighborhood: field(data, 'bairro'),
    city: field(data, 'localidade'),
    state: field(data, 'uf'),
    stateName: field(data, 'estado'),
    region: field(data, 'regiao'),
    ibge: field(data, 'ibge'),
    gia: field(data, 'gia'),
    areaCode: field(data, 'ddd'),
    siafi: field(data, 'siafi'),
    unit: field(data, 'unidade'),
    provider: 'viacep',
  };
}

function providerURL(provider: CEPResolvedProvider, cep: string): string {
  return provider === 'brasilapi'
    ? `https://brasilapi.com.br/api/cep/v2/${cep}`
    : `https://viacep.com.br/ws/${cep}/json/`;
}

function isValidProviderPayload(
  data: Record<string, unknown>,
  provider: CEPResolvedProvider,
  cep: string,
): boolean {
  const returnedCEP = onlyDigits(field(data, 'cep'));
  if (returnedCEP !== cep) return false;
  const city = field(data, provider === 'brasilapi' ? 'city' : 'localidade');
  const state = field(data, provider === 'brasilapi' ? 'state' : 'uf');
  return city.length > 0 && /^[A-Z]{2}$/i.test(state);
}

function abortReason(signal: AbortSignal): unknown {
  return signal.reason ?? new Error('Consulta de CEP cancelada.');
}

function awaitWithAbort<T>(operation: Promise<T>, signal: AbortSignal): Promise<T> {
  if (signal.aborted) return Promise.reject(abortReason(signal));
  return new Promise<T>((resolve, reject) => {
    const onAbort = (): void => {
      cleanup();
      reject(abortReason(signal));
    };
    const cleanup = (): void => signal.removeEventListener('abort', onAbort);
    signal.addEventListener('abort', onAbort, { once: true });
    operation.then(
      (value) => {
        cleanup();
        resolve(value);
      },
      (error: unknown) => {
        cleanup();
        reject(error);
      },
    );
  });
}

async function requestCEP(
  cep: string,
  provider: CEPResolvedProvider,
  options: ProviderLookupCEPOptions,
): Promise<CEPAddress> {
  const fetcher = options.fetcher ?? globalThis.fetch;
  if (typeof fetcher !== 'function') {
    throw new CEPRequestError('Fetch API não está disponível neste ambiente.', { provider });
  }

  const controller = new AbortController();
  const abort = (): void => controller.abort(options.signal?.reason);
  if (options.signal?.aborted) abort();
  else options.signal?.addEventListener('abort', abort, { once: true });
  const timeout = setTimeout(
    () => controller.abort(new Error('Tempo limite da consulta de CEP excedido.')),
    options.timeoutMs ?? 5_000,
  );

  try {
    const response = await awaitWithAbort(
      Promise.resolve().then(() =>
        fetcher(providerURL(provider, cep), { signal: controller.signal }),
      ),
      controller.signal,
    );
    if (controller.signal.aborted)
      throw controller.signal.reason ?? new Error('Consulta de CEP cancelada.');
    if (response.status === 404) throw new CEPNotFoundError(cep, provider);
    if (!response.ok) {
      throw new CEPRequestError(
        `Consulta ao ${provider === 'brasilapi' ? 'BrasilAPI' : 'ViaCEP'} falhou com HTTP ${response.status}.`,
        { provider, status: response.status },
      );
    }

    const unknownData: unknown = await awaitWithAbort(
      Promise.resolve().then(() => response.json()),
      controller.signal,
    );
    if (controller.signal.aborted)
      throw controller.signal.reason ?? new Error('Consulta de CEP cancelada.');
    if (!unknownData || typeof unknownData !== 'object' || Array.isArray(unknownData)) {
      throw new CEPRequestError('O provedor de CEP retornou uma resposta inválida.', { provider });
    }
    const data = unknownData as Record<string, unknown>;
    if (data.erro === true || data.erro === 'true') throw new CEPNotFoundError(cep, provider);
    if (!isValidProviderPayload(data, provider, cep)) {
      throw new CEPRequestError('O provedor de CEP retornou uma resposta inválida.', { provider });
    }
    const address =
      provider === 'brasilapi' ? brasilAPIAddress(data, cep) : viaCEPAddress(data, cep);
    if (options.includeRaw) address.raw = data;
    return address;
  } catch (error) {
    if (error instanceof CEPNotFoundError || error instanceof CEPRequestError) throw error;
    throw new CEPRequestError('Não foi possível consultar o CEP.', { cause: error, provider });
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener('abort', abort);
  }
}

export async function lookupCEP(
  value: string | number,
  options: LookupCEPOptions = {},
): Promise<CEPAddress> {
  const cep = normalizeCEP(value);
  const timeoutMs = options.timeoutMs ?? 5_000;
  if (!Number.isInteger(timeoutMs) || timeoutMs <= 0 || timeoutMs > 2_147_483_647) {
    throw new RangeError('timeoutMs deve estar entre 1 e 2147483647 milissegundos.');
  }

  const provider = options.provider ?? 'auto';
  if (provider !== 'auto' && provider !== 'brasilapi' && provider !== 'viacep') {
    throw new RangeError(`Provedor de CEP não suportado: ${String(provider)}.`);
  }
  const throwIfAborted = (): void => {
    if (options.signal?.aborted) {
      throw new CEPRequestError('Consulta de CEP cancelada pelo chamador.', {
        cause: options.signal.reason,
      });
    }
  };
  throwIfAborted();
  const cacheKey = `${provider}:${options.includeRaw ? 'raw' : 'normalized'}:${cep}`;
  let cached: CEPAddress | undefined;
  try {
    cached = options.cache === undefined ? undefined : await options.cache.get(cacheKey);
  } catch (error) {
    throw new CEPRequestError('Não foi possível ler o cache de CEP.', { cause: error });
  }
  throwIfAborted();
  if (cached !== undefined) return cached;
  const store = async (address: CEPAddress): Promise<CEPAddress> => {
    try {
      await options.cache?.set(cacheKey, address);
    } catch (error) {
      throw new CEPRequestError('Não foi possível gravar o cache de CEP.', { cause: error });
    }
    return address;
  };
  const deadline = Date.now() + timeoutMs;

  if (provider !== 'auto') {
    return store(await requestCEP(cep, provider, { ...options, timeoutMs }));
  }

  let address: CEPAddress;
  try {
    address = await requestCEP(cep, 'brasilapi', { ...options, timeoutMs });
  } catch (error) {
    if (!(error instanceof CEPNotFoundError) && !(error instanceof CEPRequestError)) throw error;
    if (options.signal?.aborted) throw error;
    if (error instanceof CEPNotFoundError && options.fallbackOnNotFound === false) throw error;
    if (
      error instanceof CEPRequestError &&
      error.status !== undefined &&
      error.status !== 408 &&
      error.status !== 429 &&
      error.status < 500
    ) {
      throw error;
    }
    const remainingMs = deadline - Date.now();
    if (remainingMs <= 0) throw error;
    address = await requestCEP(cep, 'viacep', { ...options, timeoutMs: remainingMs });
  }
  return store(address);
}

export async function lookupCEPs(
  values: readonly (string | number)[],
  options: LookupCEPsOptions = {},
): Promise<CEPAddress[]> {
  const { concurrency = 4, ...lookupOptions } = options;
  if (!Number.isInteger(concurrency) || concurrency < 1) {
    throw new RangeError('concurrency deve ser um inteiro positivo.');
  }

  const results = new Array<CEPAddress>(values.length);
  let nextIndex = 0;
  let stopped = false;
  const worker = async (): Promise<void> => {
    while (!stopped && nextIndex < values.length) {
      const index = nextIndex++;
      try {
        results[index] = await lookupCEP(values[index]!, lookupOptions);
      } catch (error) {
        stopped = true;
        throw error;
      }
    }
  };
  const workerCount = Math.min(concurrency, values.length);
  await Promise.all(Array.from({ length: workerCount }, worker));
  return results;
}
