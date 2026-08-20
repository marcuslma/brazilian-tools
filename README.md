# brazilian-tools

Utilitários brasileiros em TypeScript 7, ESM e **sem dependências de produção**.

## Recursos

- normalização, validação, geração e formatação de CPF, CNPJ e RG;
- validação, geração e formatação de CNPJ numérico;
- suporte ao novo CNPJ alfanumérico (12 posições alfanuméricas + 2 verificadores numéricos);
- validação algorítmica de RG de São Paulo;
- validação estrutural de RGs de outros formatos, sem confirmar dígitos verificadores;
- validação, normalização, formatação e parsing de telefones fixos e celulares brasileiros;
- validação, normalização e formatação estrutural de CEP;
- consulta de endereço pela BrasilAPI e pelo ViaCEP usando a `fetch` nativa;
- modo automático: BrasilAPI como fonte principal e ViaCEP como fallback;
- cache de CEP injetável e consultas em lote com limite de concorrência.

## Requisitos

- Node.js 20 ou superior;
- projeto consumidor ESM ou bundler compatível.

O pacote é **ESM-only**: use `import`/`import()`; a condição CommonJS `require('brazilian-tools')` não é publicada.

## Instalação

```bash
npm install brazilian-tools
```

## Uso

```ts
import {
  formatCNPJ,
  formatPhoneBR,
  generateCNPJ,
  generateCPF,
  generateRG,
  lookupCEP,
  normalizeCPF,
  parsePhoneBR,
  validateCEP,
  validateCNPJ,
  validateCPF,
  validateRG,
  validatePhoneBR,
} from 'brazilian-tools';

validateCPF('529.982.247-25'); // true
normalizeCPF('529.982.247-25'); // 52998224725
generateCPF({ formatted: true }); // ex.: 123.456.789-09

validateCNPJ('04.252.011/0001-10'); // true
validateCNPJ('12.ABC.345/01DE-35'); // true
formatCNPJ('12ABC34501DE35'); // 12.ABC.345/01DE-35
generateCNPJ({ kind: 'alphanumeric', formatted: true });

validateRG('12.345.678-2', { state: 'SP' }); // true
generateRG({ state: 'SP', formatted: true });
const generatedRG = generateRG({ includeState: true }); // { state: 'SP', value: '...' }
console.log(generatedRG.state, generatedRG.value);

validatePhoneBR('+55 (11) 98765-4321'); // true
formatPhoneBR('11987654321'); // (11) 98765-4321
parsePhoneBR('11987654321').e164; // +5511987654321

validateCEP('01001-000'); // true: valida somente a estrutura
const address = await lookupCEP('01001-000'); // BrasilAPI → fallback ViaCEP
console.log(address.city, address.state); // São Paulo SP
console.log(address.provider); // brasilapi ou viacep
```

## API

### CPF

- `validateCPF(value: unknown): boolean`
- `normalizeCPF(value: string | number): string`
- `formatCPF(value: string | number): string`
- `generateCPF(options?: { formatted?: boolean }): string`

### CNPJ

- `validateCNPJ(value: unknown): boolean`
- `normalizeCNPJ(value: string | number): string`
- `formatCNPJ(value: string | number): string`
- `generateCNPJ(options?: { kind?: 'numeric' | 'alphanumeric'; formatted?: boolean }): string`

O algoritmo alfanumérico converte cada caractere pelo valor ASCII menos 48 e aplica módulo 11 com os pesos oficiais. Os dois últimos caracteres permanecem numéricos.

### RG

- `SUPPORTED_RG_STATES: readonly RGState[]`
- `validateRG(value: unknown, options?: { state?: string }): boolean`
- `normalizeRG(value: string | number, options?: { state?: RGState }): string`
- `formatRG(value: string | number, options?: { state?: RGState }): string`
- `generateRG(options?: { state?: RGState; formatted?: boolean; includeState?: boolean }): string | { state: RGState; value: string }`

O RG não possui um algoritmo nacional único. Por isso, somente UFs com algoritmo verificável entram em `SUPPORTED_RG_STATES`; atualmente, **São Paulo**. Se `state` for omitida na geração, uma UF suportada é sorteada. O retorno padrão de `generateRG` é uma string; use `includeState: true` para receber `{ state, value }`. UFs sem algoritmo verificável lançam `RangeError` na geração.

```ts
generateRG({ state: 'SP', formatted: true }); // string
generateRG({ formatted: true, includeState: true }); // { state: 'SP', value: '...' }
```

As funções `normalizeCPF`, `normalizeCNPJ` e `normalizeRG` validam a estrutura e devolvem a representação canônica sem máscara. Elas não confirmam existência oficial e não exigem que o dígito verificador seja válido; para isso, use a função `validate*` correspondente.

`validateRG` faz uma verificação estrutural conservadora quando a UF é omitida. Quando `state` é informada, exige um algoritmo estadual suportado; atualmente, somente `SP`. Para validar apenas a estrutura de um RG de outro estado, omita `state`.

Entradas numéricas são aceitas somente quando são inteiros seguros e não negativos. Prefira `string`, especialmente para documentos que possam começar com zero; números negativos e decimais são rejeitados em vez de terem sinal ou separador removidos silenciosamente.

### Telefone brasileiro

- `SUPPORTED_PHONE_DDDS: readonly PhoneBRDDD[]`
- `validatePhoneBR(value: unknown): boolean`
- `normalizePhoneBR(value: string | number): string`
- `formatPhoneBR(value, options?: { international?: boolean }): string`
- `parsePhoneBR(value): ParsedPhoneBR`

```ts
normalizePhoneBR('+55 (11) 98765-4321'); // 11987654321
formatPhoneBR('2123456789'); // (21) 2345-6789
formatPhoneBR('11987654321', { international: true }); // +55 11 98765-4321

parsePhoneBR('(11) 98765-4321');
// {
//   countryCode: '55', ddd: '11', number: '987654321', type: 'mobile',
//   national: '11987654321', e164: '+5511987654321', formatted: '(11) 98765-4321'
// }
```

O módulo cobre números geográficos com DDD: fixos de oito dígitos iniciados por 2–5 e celulares no formato `9XXXX-XXXX`. Números não geográficos, códigos de operadora e ramais não são aceitos. A validação é estrutural e não confirma que a linha exista ou esteja ativa. As regras seguem o [Plano de Numeração Brasileiro](https://www.gov.br/anatel/pt-br/regulado/numeracao/plano-de-numeracao-brasileiro) e a relação oficial de [Códigos Nacionais](https://www.gov.br/anatel/pt-br/regulado/numeracao/codigos-nacionais) da Anatel.

### CEP

- `validateCEP(value: unknown): boolean` — valida somente os 8 dígitos;
- `normalizeCEP(value: string | number): string`;
- `formatCEP(value: string | number): string`;
- `lookupCEP(value, options?): Promise<CEPAddress>`;
- `lookupCEPs(values, options?): Promise<CEPAddress[]>`.
  Opções da consulta:

```ts
interface LookupCEPOptions {
  provider?: 'auto' | 'brasilapi' | 'viacep'; // padrão: auto
  fallbackOnNotFound?: boolean; // padrão: true
  includeRaw?: boolean; // inclui address.raw; padrão: false
  cache?: CEPCache; // Map também é compatível
  fetcher?: CEPFetcher; // compatível com fetch; tipo autocontido
  timeoutMs?: number; // inteiro entre 1–2147483647; padrão: 5000
  signal?: CEPAbortSignal; // compatível com AbortSignal
}
```

No modo `auto`, a BrasilAPI é consultada primeiro. Falha rápida de rede, HTTP 408/429/5xx, resposta inválida ou CEP não encontrado aciona uma nova tentativa no ViaCEP enquanto ainda houver tempo disponível. O orçamento de `timeoutMs` é compartilhado entre os provedores: se a primeira chamada consumir todo o prazo, a operação termina sem iniciar fallback. Operações do cache injetado não são limitadas por esse orçamento. Erros HTTP 4xx definitivos e cancelamento pelo sinal encerram a operação sem fallback. Use `fallbackOnNotFound: false` para tratar o primeiro “não encontrado” como definitivo, ou selecione um provedor explicitamente:

```ts
const brasil = await lookupCEP('06514340', { provider: 'brasilapi' });
const viaCEP = await lookupCEP('06514340', { provider: 'viacep' });
```

O resultado normalizado informa o provedor efetivo em `address.provider`. Quando disponibilizados pela BrasilAPI V2, também inclui `service`, `timezone` e `coordinates`. Esses campos são opcionais porque nem todo CEP possui geolocalização. Com `includeRaw: true`, `address.raw` preserva o objeto original retornado pelo provedor.

O cache é sempre fornecido pelo chamador e não existe estado global oculto:

```ts
const cache = new Map();
await lookupCEP('01001-000', { cache });
await lookupCEP('01001000', { cache }); // reutiliza o resultado
```

Consultas em lote preservam a ordem de entrada e limitam a concorrência. A primeira falha rejeita a operação e impede o início de novos itens; chamadas que já estiverem em andamento podem terminar:

```ts
const addresses = await lookupCEPs(['01001000', '20040002'], {
  concurrency: 2, // padrão: 4
  timeoutMs: 5_000, // aplicado individualmente a cada CEP
});
```

`lookupCEP` lança:

- `TypeError` para CEP estruturalmente inválido;
- `RangeError` para provedor ou timeout inválido; `lookupCEPs` também usa essa classe para concorrência inválida;
- `CEPNotFoundError` quando o provedor informa que o CEP não existe;
- `CEPRequestError` para falhas de rede, timeout, HTTP, resposta inválida ou cache injetado.

Os erros de consulta expõem `provider` e, quando aplicável, `status` HTTP. Falhas de cache preservam o erro original em `cause`. As consultas usam somente APIs públicas e não exigem chave de acesso, mas não possuem SLA. Endereços críticos devem continuar editáveis e confirmáveis pelo usuário.

## Desenvolvimento

```bash
npm install --include=dev
npm run lint
npm run format:check
npm run typecheck
npm test
npm run test:coverage
npm run check
npm run smoke:package
```

`npm run smoke:package` gera o tarball, instala o pacote em um consumidor temporário e verifica o import ESM, o runtime e as declarações TypeScript.

`npm run test:coverage` executa a suíte com a cobertura nativa do Node e exige 100% de linhas, 100% de funções e 95% de branches; a saída também reporta a métrica de branches, que atualmente fica abaixo de 100% por combinações defensivas e de curto-circuito.

## Licença

MIT
