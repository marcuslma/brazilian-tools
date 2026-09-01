import { readdir, readFile, writeFile } from 'node:fs/promises';

const directory = new URL('../dist/types/', import.meta.url);
const declarations = (await readdir(directory)).filter((file) => file.endsWith('.d.ts'));

if (declarations.length === 0) {
  throw new Error('No ESM declarations were generated.');
}

for (const file of declarations) {
  const esmDeclaration = await readFile(new URL(file, directory), 'utf8');
  const cjsDeclaration = esmDeclaration.replaceAll(
    /(['"])(\.\/[^'"]+)\.js\1/g,
    (_match, quote, modulePath) => `${quote}${modulePath}.cjs${quote}`,
  );
  await writeFile(new URL(file.replace(/\.d\.ts$/, '.d.cts'), directory), cjsDeclaration);
}
