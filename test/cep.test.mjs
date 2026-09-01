import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CEPNotFoundError,
  CEPRequestError,
  formatCEP,
  lookupCEP,
  lookupCEPs,
  normalizeCEP,
  validateCEP,
} from '../dist/esm/index.js';

test('rejects an invalid provider before making a network request', async () => {
  await assert.rejects(lookupCEP('01001000', { provider: 'inexistente' }), RangeError);
});

test('validates public CEPRequestError options', () => {
  const cause = new Error('Network failure.');
  const error = new CEPRequestError('Request failed.', {
    cause,
    provider: 'viacep',
    status: 503,
    timedOut: true,
  });
  assert.equal(error.cause, cause);
  assert.equal(error.provider, 'viacep');
  assert.equal(error.status, 503);
  assert.equal(error.timedOut, true);

  for (const options of [null, 'options', []]) {
    assert.throws(() => new CEPRequestError('Request failed.', options), TypeError);
  }
  assert.throws(() => new CEPRequestError('Request failed.', { timedOut: null }), RangeError);
  assert.throws(() => new CEPRequestError('Request failed.', { provider: 'auto' }), RangeError);
  assert.throws(() => new CEPRequestError('Request failed.', { status: 99 }), RangeError);
  assert.throws(() => new CEPNotFoundError('01001000', 'auto'), RangeError);
});

test('rejects malformed lookup options before cache or network effects', async () => {
  for (const options of [null, 'lookup', []]) {
    await assert.rejects(lookupCEP('01001000', options), TypeError);
  }

  let calls = 0;
  const fetcher = async () => {
    calls++;
    return new Response(JSON.stringify({ cep: '01001000', state: 'SP', city: 'São Paulo' }));
  };

  await assert.rejects(lookupCEP('01001000', { includeRaw: 'yes', fetcher }), RangeError);
  await assert.rejects(lookupCEP('01001000', { fallbackOnNotFound: null, fetcher }), RangeError);
  await assert.rejects(lookupCEP('01001000', { fetcher: {} }), TypeError);
  await assert.rejects(lookupCEP('01001000', { cache: null, fetcher }), TypeError);
  await assert.rejects(
    lookupCEP('01001000', { cache: { get: () => undefined }, fetcher }),
    TypeError,
  );
  await assert.rejects(lookupCEP('01001000', { signal: null, fetcher }), TypeError);
  await assert.rejects(lookupCEP('01001000', { signal: {}, fetcher }), TypeError);
  assert.equal(calls, 0);
});

test('rejects malformed batch values and option containers', async () => {
  await assert.rejects(lookupCEPs(null), TypeError);

  for (const options of [null, 'lookup', []]) {
    await assert.rejects(lookupCEPs(['01001000'], options), TypeError);
  }
});

test('wraps an invalid JSON payload', async () => {
  await assert.rejects(
    lookupCEP('01001000', {
      provider: 'viacep',
      fetcher: async () => ({ ok: true, status: 200, json: async () => null }),
    }),
    (error) => error instanceof CEPRequestError && error.provider === 'viacep',
  );
});

test('wraps an unavailable global fetch implementation', async () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'fetch');
  Object.defineProperty(globalThis, 'fetch', { configurable: true, value: undefined });

  try {
    await assert.rejects(
      lookupCEP('01001000', { provider: 'viacep' }),
      (error) => error instanceof CEPRequestError && error.provider === 'viacep',
    );
  } finally {
    if (descriptor) Object.defineProperty(globalThis, 'fetch', descriptor);
    else delete globalThis.fetch;
  }
});

test('normalizes non-text BrasilAPI fields as empty', async () => {
  const address = await lookupCEP('01001000', {
    provider: 'brasilapi',
    fetcher: async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        cep: '01001000',
        street: 123,
        neighborhood: null,
        city: 'São Paulo',
        state: 'SP',
        service: 123,
        timezoneName: null,
      }),
    }),
  });
  assert.equal(address.street, '');
  assert.equal(address.neighborhood, '');
  assert.equal(address.service, undefined);
  assert.equal(address.timezone, undefined);
});

test('validates and formats CEP without checking existence', () => {
  assert.equal(validateCEP('01001-000'), true);
  assert.equal(validateCEP('01001000'), true);
  assert.equal(validateCEP('01001-00'), false);
  assert.equal(validateCEP('abcdefgh'), false);
  assert.equal(formatCEP('01001000'), '01001-000');
  assert.throws(() => formatCEP('123'), TypeError);
});

test('normalizes CEP without checking existence', () => {
  assert.equal(normalizeCEP('01001-000'), '01001000');
  assert.equal(normalizeCEP('99999-999'), '99999999');
  assert.throws(() => normalizeCEP('123'), TypeError);
  assert.throws(() => normalizeCEP('01001x000'), TypeError);
});

test('looks up CEP through ViaCEP and returns a typed result', async () => {
  let requestedUrl = '';
  const fetcher = async (url) => {
    requestedUrl = String(url);
    return new Response(
      JSON.stringify({
        cep: '01001-000',
        logradouro: 'Praça da Sé',
        complemento: 'lado ímpar',
        unidade: '',
        bairro: 'Sé',
        localidade: 'São Paulo',
        uf: 'SP',
        estado: 'São Paulo',
        regiao: 'Sudeste',
        ibge: '3550308',
        gia: '1004',
        ddd: '11',
        siafi: '7107',
      }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    );
  };

  const address = await lookupCEP('01001-000', { provider: 'viacep', fetcher });
  assert.equal(requestedUrl, 'https://viacep.com.br/ws/01001000/json/');
  assert.equal(address.cep, '01001-000');
  assert.equal(address.city, 'São Paulo');
  assert.equal(address.state, 'SP');
  assert.equal(address.street, 'Praça da Sé');
  assert.equal(address.provider, 'viacep');
});

test('normalizes CEP returned by ViaCEP even without a mask', async () => {
  const address = await lookupCEP('01001-000', {
    provider: 'viacep',
    fetcher: async () =>
      new Response(
        JSON.stringify({
          cep: '01001000',
          localidade: 'São Paulo',
          uf: 'SP',
        }),
      ),
  });
  assert.equal(address.cep, '01001-000');
});

test('looks up CEP explicitly through BrasilAPI and normalizes metadata', async () => {
  let requestedUrl = '';
  const address = await lookupCEP('06514-340', {
    provider: 'brasilapi',
    fetcher: async (url) => {
      requestedUrl = String(url);
      return new Response(
        JSON.stringify({
          cep: '06514340',
          state: 'SP',
          city: 'Santana de Parnaíba',
          neighborhood: 'Colinas de Parnaíba I',
          street: 'Rua Baquara',
          service: 'open-cep',
          timezoneName: 'America/Sao_Paulo',
          location: {
            type: 'Point',
            coordinates: { latitude: '-23.4501', longitude: '-46.9123' },
          },
        }),
        { status: 200 },
      );
    },
  });

  assert.equal(requestedUrl, 'https://brasilapi.com.br/api/cep/v2/06514340');
  assert.deepEqual(address, {
    cep: '06514-340',
    street: 'Rua Baquara',
    complement: '',
    neighborhood: 'Colinas de Parnaíba I',
    city: 'Santana de Parnaíba',
    state: 'SP',
    stateName: '',
    region: '',
    ibge: '',
    gia: '',
    areaCode: '',
    siafi: '',
    unit: '',
    provider: 'brasilapi',
    service: 'open-cep',
    timezone: 'America/Sao_Paulo',
    coordinates: { latitude: -23.4501, longitude: -46.9123 },
  });
});

test('ignores empty or out-of-range geographic coordinates', async () => {
  const empty = await lookupCEP('01001-000', {
    provider: 'brasilapi',
    fetcher: async () =>
      new Response(
        JSON.stringify({
          cep: '01001000',
          state: 'SP',
          city: 'São Paulo',
          location: { coordinates: { latitude: '', longitude: '' } },
        }),
      ),
  });
  const outOfRange = await lookupCEP('01001-000', {
    provider: 'brasilapi',
    fetcher: async () =>
      new Response(
        JSON.stringify({
          cep: '01001000',
          state: 'SP',
          city: 'São Paulo',
          location: { coordinates: { latitude: 91, longitude: 181 } },
        }),
      ),
  });
  assert.equal(empty.coordinates, undefined);
  assert.equal(outOfRange.coordinates, undefined);
});

test('preserves the original response only when requested', async () => {
  const payload = { cep: '01001000', state: 'SP', city: 'São Paulo', custom: 'valor' };
  const fetcher = async () => new Response(JSON.stringify(payload));
  const regular = await lookupCEP('01001-000', { provider: 'brasilapi', fetcher });
  const detailed = await lookupCEP('01001-000', {
    provider: 'brasilapi',
    fetcher,
    includeRaw: true,
  });

  assert.equal('raw' in regular, false);
  assert.deepEqual(detailed.raw, payload);
});

test('reuses injected cache without keeping global state', async () => {
  const cache = new Map();
  let calls = 0;
  const options = {
    cache,
    fetcher: async () => {
      calls++;
      return new Response(JSON.stringify({ cep: '01001000', state: 'SP', city: 'São Paulo' }));
    },
  };

  const first = await lookupCEP('01001-000', options);
  const second = await lookupCEP('01001000', options);

  assert.deepEqual(second, first);
  assert.equal(calls, 1);
  assert.equal(cache.size, 1);
});

test('wraps cache read and write failures without starting fallback', async () => {
  const getError = new Error('Falha de leitura.');
  await assert.rejects(
    lookupCEP('01001-000', {
      cache: {
        get: () => {
          throw getError;
        },
        set: () => undefined,
      },
    }),
    (error) => error instanceof CEPRequestError && error.cause === getError,
  );

  const setError = new Error('Falha de escrita.');
  let calls = 0;
  await assert.rejects(
    lookupCEP('01001-000', {
      cache: {
        get: () => undefined,
        set: () => {
          throw setError;
        },
      },
      fetcher: async () => {
        calls++;
        return new Response(JSON.stringify({ cep: '01001000', state: 'SP', city: 'São Paulo' }));
      },
    }),
    (error) => error instanceof CEPRequestError && error.cause === setError,
  );
  assert.equal(calls, 1);
});

test('looks up CEPs in batches while preserving order and concurrency limits', async () => {
  let active = 0;
  let maxActive = 0;
  const addresses = await lookupCEPs(['01001000', '20040002', '30140071'], {
    provider: 'viacep',
    concurrency: 2,
    fetcher: async (url) => {
      active++;
      maxActive = Math.max(maxActive, active);
      const cep = String(url).match(/\/ws\/(\d{8})\//)[1];
      await new Promise((resolve) => setTimeout(resolve, 5));
      active--;
      return new Response(JSON.stringify({ cep, localidade: cep, uf: 'SP' }));
    },
  });

  assert.deepEqual(
    addresses.map((address) => address.city),
    ['01001000', '20040002', '30140071'],
  );
  assert.equal(maxActive, 2);
});

test('rejects invalid batch concurrency before making a network request', async () => {
  let called = false;
  await assert.rejects(
    lookupCEPs(['01001000'], {
      concurrency: 0,
      fetcher: async () => {
        called = true;
        return new Response();
      },
    }),
    RangeError,
  );
  assert.equal(called, false);
});

test('batch processing does not start new items after the first failure', async () => {
  let calls = 0;
  await assert.rejects(
    lookupCEPs(['01001000', '20040002', '30140071', '80010000'], {
      provider: 'viacep',
      concurrency: 2,
      fetcher: async (url) => {
        calls++;
        const cep = String(url).match(/\/ws\/(\d{8})\//)[1];
        if (cep === '01001000') throw new Error('Falha simulada.');
        await new Promise((resolve) => setTimeout(resolve, 5));
        return new Response(JSON.stringify({ cep, localidade: cep, uf: 'SP' }));
      },
    }),
    CEPRequestError,
  );
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.equal(calls, 2);
});

test('distinguishes a missing CEP from an HTTP failure', async () => {
  await assert.rejects(
    lookupCEP('99999-999', {
      provider: 'viacep',
      fetcher: async () => new Response('{"erro":true}', { status: 200 }),
    }),
    CEPNotFoundError,
  );
  await assert.rejects(
    lookupCEP('01001-000', {
      provider: 'viacep',
      fetcher: async () => new Response('unavailable', { status: 503 }),
    }),
    CEPRequestError,
  );
});

test('uses BrasilAPI by default and falls back to ViaCEP', async () => {
  const urls = [];
  const address = await lookupCEP('06514340', {
    fetcher: async (url) => {
      urls.push(String(url));
      if (String(url).includes('brasilapi')) return new Response('unavailable', { status: 503 });
      return new Response(
        JSON.stringify({
          cep: '06514-340',
          logradouro: 'Rua Baquara',
          complemento: '',
          unidade: '',
          bairro: 'Colinas de Parnaíba I',
          localidade: 'Santana de Parnaíba',
          uf: 'SP',
        }),
        { status: 200 },
      );
    },
  });

  assert.deepEqual(urls, [
    'https://brasilapi.com.br/api/cep/v2/06514340',
    'https://viacep.com.br/ws/06514340/json/',
  ]);
  assert.equal(address.provider, 'viacep');
  assert.equal(address.street, 'Rua Baquara');
});

test('does not fall back for a definitive HTTP 4xx error', async () => {
  let calls = 0;
  await assert.rejects(
    lookupCEP('01001-000', {
      fetcher: async () => {
        calls++;
        return new Response('invalid request', { status: 400 });
      },
    }),
    (error) =>
      error instanceof CEPRequestError && error.provider === 'brasilapi' && error.status === 400,
  );
  assert.equal(calls, 1);
});

test('falls back for HTTP 408 and 429 while time remains', async () => {
  for (const status of [408, 429]) {
    let calls = 0;
    const address = await lookupCEP('01001-000', {
      fetcher: async () => {
        calls++;
        if (calls === 1) return new Response('', { status });
        return new Response(
          JSON.stringify({
            cep: '01001-000',
            localidade: 'São Paulo',
            uf: 'SP',
          }),
        );
      },
    });
    assert.equal(calls, 2);
    assert.equal(address.provider, 'viacep');
  }
});

test('falls back when the provider returns an object missing required fields', async () => {
  let calls = 0;
  const address = await lookupCEP('01001-000', {
    fetcher: async (url) => {
      calls++;
      if (String(url).includes('brasilapi')) return new Response('{}');
      return new Response(
        JSON.stringify({
          cep: '01001-000',
          localidade: 'São Paulo',
          uf: 'SP',
          logradouro: 'Praça da Sé',
        }),
      );
    },
  });

  assert.equal(calls, 2);
  assert.equal(address.provider, 'viacep');
});

test('allows fallback to be disabled when the first provider does not find the CEP', async () => {
  let calls = 0;
  await assert.rejects(
    lookupCEP('99999-999', {
      fallbackOnNotFound: false,
      fetcher: async () => {
        calls++;
        return new Response('{}', { status: 404 });
      },
    }),
    (error) => error instanceof CEPNotFoundError && error.provider === 'brasilapi',
  );
  assert.equal(calls, 1);
});

test('does not call ViaCEP when BrasilAPI responds in automatic mode', async () => {
  let calls = 0;
  const address = await lookupCEP('06514340', {
    provider: 'auto',
    fetcher: async () => {
      calls++;
      return new Response(
        JSON.stringify({
          cep: '06514340',
          state: 'SP',
          city: 'Santana de Parnaíba',
          neighborhood: 'Colinas de Parnaíba I',
          street: 'Rua Baquara',
          service: 'open-cep',
        }),
        { status: 200 },
      );
    },
  });
  assert.equal(calls, 1);
  assert.equal(address.provider, 'brasilapi');
});

test('shortcuts explicitly select each provider', async () => {
  const urls = [];
  const fetcher = async (url) => {
    urls.push(String(url));
    return String(url).includes('brasilapi')
      ? new Response(JSON.stringify({ cep: '06514340', state: 'SP', city: 'Santana de Parnaíba' }))
      : new Response(
          JSON.stringify({ cep: '06514-340', uf: 'SP', localidade: 'Santana de Parnaíba' }),
        );
  };
  assert.equal(
    (await lookupCEP('06514340', { provider: 'brasilapi', fetcher })).provider,
    'brasilapi',
  );
  assert.equal((await lookupCEP('06514340', { provider: 'viacep', fetcher })).provider, 'viacep');
  assert.equal(urls.length, 2);
});

test('does not call the network for a structurally invalid CEP', async () => {
  let called = false;
  await assert.rejects(
    lookupCEP('123', {
      fetcher: async () => {
        called = true;
        return new Response();
      },
    }),
    TypeError,
  );
  assert.equal(called, false);
});

test('does not fall back when the caller cancels the lookup', async () => {
  const controller = new AbortController();
  let calls = 0;
  const lookup = lookupCEP('01001-000', {
    signal: controller.signal,
    fetcher: async (_url, options) => {
      calls++;
      return new Promise((_resolve, reject) => {
        options.signal.addEventListener('abort', () => reject(options.signal.reason), {
          once: true,
        });
      });
    },
  });

  controller.abort(new Error('Lookup cancelled by the caller.'));

  await assert.rejects(lookup, CEPRequestError);
  assert.equal(calls, 1);
});

test('does not call the network when the signal is already aborted', async () => {
  const controller = new AbortController();
  controller.abort(new Error('Lookup cancelled before starting.'));
  let called = false;

  await assert.rejects(
    lookupCEP('01001-000', {
      signal: controller.signal,
      fetcher: async () => {
        called = true;
        return new Response(JSON.stringify({ cep: '01001000', state: 'SP', city: 'São Paulo' }));
      },
    }),
    CEPRequestError,
  );
  assert.equal(called, false);
});

test('ends a lookup that exceeds the timeout', async () => {
  await assert.rejects(
    lookupCEP('01001-000', {
      provider: 'brasilapi',
      timeoutMs: 5,
      fetcher: async (_url, options) =>
        new Promise((_resolve, reject) => {
          options.signal.addEventListener('abort', () => reject(options.signal.reason), {
            once: true,
          });
        }),
    }),
    (error) => error instanceof CEPRequestError && error.provider === 'brasilapi',
  );
});

test('applies the timeout to the complete operation without renewing it during fallback', async () => {
  let calls = 0;
  await assert.rejects(
    lookupCEP('01001-000', {
      timeoutMs: 5,
      fetcher: async (_url, options) => {
        calls++;
        await new Promise((resolve) => setTimeout(resolve, 20));
        if (options.signal.aborted) throw options.signal.reason;
        return new Response('{}');
      },
    }),
    CEPRequestError,
  );
  assert.equal(calls, 1);
});

test('a fast failure allows fallback to use only the remaining budget', async () => {
  let calls = 0;
  await assert.rejects(
    lookupCEP('01001-000', {
      timeoutMs: 20,
      fetcher: async (_url, options) => {
        calls++;
        if (calls === 1) return new Response('', { status: 503 });
        return new Promise((_resolve, reject) => {
          options.signal.addEventListener('abort', () => reject(options.signal.reason), {
            once: true,
          });
        });
      },
    }),
    (error) => error instanceof CEPRequestError && error.provider === 'viacep',
  );
  assert.equal(calls, 2);
});

test('rejects a fetcher response that ignores the timeout', async () => {
  await assert.rejects(
    lookupCEP('01001000', {
      provider: 'viacep',
      timeoutMs: 5,
      fetcher: async () => {
        await new Promise((resolve) => setTimeout(resolve, 20));
        return {
          ok: true,
          status: 200,
          json: async () => ({ cep: '01001000', localidade: 'São Paulo', uf: 'SP' }),
        };
      },
    }),
    (error) => error instanceof CEPRequestError && error.provider === 'viacep',
  );
});
test('does not remain pending when json ignores the timeout', async () => {
  await assert.rejects(
    lookupCEP('01001000', {
      provider: 'viacep',
      timeoutMs: 5,
      fetcher: async () => ({
        ok: true,
        status: 200,
        json: async () => new Promise(() => {}),
      }),
    }),
    (error) => error instanceof CEPRequestError && error.provider === 'viacep',
  );
});
test('rejects an invalid timeout before making a network request', async () => {
  let called = false;
  for (const timeoutMs of [0, 0.5, Number.POSITIVE_INFINITY, 2_147_483_648]) {
    await assert.rejects(
      lookupCEP('01001-000', {
        timeoutMs,
        fetcher: async () => {
          called = true;
          return new Response();
        },
      }),
      RangeError,
    );
  }
  assert.equal(called, false);
});

test('rejects invalid JSON returned by the provider', async () => {
  await assert.rejects(
    lookupCEP('01001-000', {
      provider: 'viacep',
      fetcher: async () => new Response('{', { status: 200 }),
    }),
    (error) => error instanceof CEPRequestError && error.provider === 'viacep',
  );
});

test('removes the caller signal listener after the lookup', async () => {
  let added = 0;
  let removed = 0;
  const signal = {
    aborted: false,
    addEventListener: () => {
      added++;
    },
    removeEventListener: () => {
      removed++;
    },
  };

  await lookupCEP('01001-000', {
    provider: 'brasilapi',
    signal,
    fetcher: async () =>
      new Response(
        JSON.stringify({
          cep: '01001000',
          state: 'SP',
          city: 'São Paulo',
        }),
        { status: 200 },
      ),
  });

  assert.equal(added, 1);
  assert.equal(removed, 1);
});
