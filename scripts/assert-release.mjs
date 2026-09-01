import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

export function assertReleaseVersion({ version, tag, requestedVersion }) {
  const expectedTag = `v${version}`;

  if (tag !== undefined) {
    if (tag !== expectedTag) {
      throw new Error(`Expected tag ${expectedTag}, received ${tag}.`);
    }
    return;
  }

  if (requestedVersion !== version) {
    throw new Error(`Expected manual version ${version}, received ${String(requestedVersion)}.`);
  }
}

export function assertUnpublishedPackage({ name, version, result }) {
  if (result.status === 0) {
    throw new Error(`${name}@${version} is already published.`);
  }

  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;
  if (!output.includes('E404')) {
    throw new Error(result.stderr || result.stdout || `Unable to query ${name}@${version}.`);
  }
}

export async function assertRelease({ environment = process.env } = {}) {
  const packageJson = JSON.parse(
    await readFile(new URL('../package.json', import.meta.url), 'utf8'),
  );
  const tag = environment.GITHUB_REF_TYPE === 'tag' ? environment.GITHUB_REF_NAME : undefined;
  assertReleaseVersion({
    version: packageJson.version,
    tag,
    requestedVersion: environment.RELEASE_VERSION,
  });

  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const result = spawnSync(
    npm,
    ['view', `${packageJson.name}@${packageJson.version}`, 'version', '--json'],
    { encoding: 'utf8' },
  );
  assertUnpublishedPackage({ name: packageJson.name, version: packageJson.version, result });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await assertRelease();
}
