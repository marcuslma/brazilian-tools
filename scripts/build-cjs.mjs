import { mkdir, writeFile } from 'node:fs/promises';
import { build } from 'esbuild';

await build({
  bundle: false,
  entryPoints: [
    'src/cep.ts',
    'src/cnh.ts',
    'src/cnpj.ts',
    'src/cpf.ts',
    'src/currency.ts',
    'src/index.ts',
    'src/internal.ts',
    'src/license-plate.ts',
    'src/phone.ts',
    'src/pis.ts',
    'src/rg.ts',
    'src/states.ts',
  ],
  format: 'cjs',
  outbase: 'src',
  outdir: 'dist/cjs',
  platform: 'node',
  sourcemap: true,
  target: 'es2022',
});

await mkdir(new URL('../dist/cjs/', import.meta.url), { recursive: true });
await writeFile(
  new URL('../dist/cjs/package.json', import.meta.url),
  '{\n  "type": "commonjs"\n}\n',
);
