export const BRAZILIAN_REGIONS = Object.freeze([
  'Norte',
  'Nordeste',
  'Centro-Oeste',
  'Sudeste',
  'Sul',
] as const);

export type BrazilianRegion = (typeof BRAZILIAN_REGIONS)[number];

export interface BrazilianState {
  readonly code: string;
  readonly name: string;
  readonly region: BrazilianRegion;
  readonly capital: string;
  readonly ibgeCode: string;
}

const states = [
  ['AC', 'Acre', 'Norte', 'Rio Branco', '12'],
  ['AL', 'Alagoas', 'Nordeste', 'Maceió', '27'],
  ['AP', 'Amapá', 'Norte', 'Macapá', '16'],
  ['AM', 'Amazonas', 'Norte', 'Manaus', '13'],
  ['BA', 'Bahia', 'Nordeste', 'Salvador', '29'],
  ['CE', 'Ceará', 'Nordeste', 'Fortaleza', '23'],
  ['DF', 'Distrito Federal', 'Centro-Oeste', 'Brasília', '53'],
  ['ES', 'Espírito Santo', 'Sudeste', 'Vitória', '32'],
  ['GO', 'Goiás', 'Centro-Oeste', 'Goiânia', '52'],
  ['MA', 'Maranhão', 'Nordeste', 'São Luís', '21'],
  ['MT', 'Mato Grosso', 'Centro-Oeste', 'Cuiabá', '51'],
  ['MS', 'Mato Grosso do Sul', 'Centro-Oeste', 'Campo Grande', '50'],
  ['MG', 'Minas Gerais', 'Sudeste', 'Belo Horizonte', '31'],
  ['PA', 'Pará', 'Norte', 'Belém', '15'],
  ['PB', 'Paraíba', 'Nordeste', 'João Pessoa', '25'],
  ['PR', 'Paraná', 'Sul', 'Curitiba', '41'],
  ['PE', 'Pernambuco', 'Nordeste', 'Recife', '26'],
  ['PI', 'Piauí', 'Nordeste', 'Teresina', '22'],
  ['RJ', 'Rio de Janeiro', 'Sudeste', 'Rio de Janeiro', '33'],
  ['RN', 'Rio Grande do Norte', 'Nordeste', 'Natal', '24'],
  ['RS', 'Rio Grande do Sul', 'Sul', 'Porto Alegre', '43'],
  ['RO', 'Rondônia', 'Norte', 'Porto Velho', '11'],
  ['RR', 'Roraima', 'Norte', 'Boa Vista', '14'],
  ['SC', 'Santa Catarina', 'Sul', 'Florianópolis', '42'],
  ['SP', 'São Paulo', 'Sudeste', 'São Paulo', '35'],
  ['SE', 'Sergipe', 'Nordeste', 'Aracaju', '28'],
  ['TO', 'Tocantins', 'Norte', 'Palmas', '17'],
] as const;

export const BRAZILIAN_STATES: readonly BrazilianState[] = Object.freeze(
  states.map(([code, name, region, capital, ibgeCode]) =>
    Object.freeze({ code, name, region, capital, ibgeCode }),
  ),
);

function comparable(value: string): string {
  return value
    .trim()
    .toLocaleUpperCase('pt-BR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function getBrazilianState(value: unknown): BrazilianState | undefined {
  if (typeof value !== 'string') return undefined;
  const query = comparable(value);
  return BRAZILIAN_STATES.find(
    (state) => comparable(state.code) === query || comparable(state.name) === query,
  );
}

export function isBrazilianState(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    BRAZILIAN_STATES.some((state) => state.code === value.toUpperCase())
  );
}

export function getBrazilianStatesByRegion(region: string): readonly BrazilianState[] {
  if (!(BRAZILIAN_REGIONS as readonly string[]).includes(region)) {
    throw new RangeError(`Unsupported Brazilian region: ${region}.`);
  }
  return BRAZILIAN_STATES.filter((state) => state.region === region);
}
