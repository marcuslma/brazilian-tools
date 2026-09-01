import assert from 'node:assert/strict';
import test from 'node:test';
import { assertReleaseVersion, assertUnpublishedPackage } from '../scripts/assert-release.mjs';

test('accepts a matching release tag or manual version', () => {
  assert.doesNotThrow(() => assertReleaseVersion({ version: '1.2.3', tag: 'v1.2.3' }));
  assert.doesNotThrow(() => assertReleaseVersion({ version: '1.2.3', requestedVersion: '1.2.3' }));
});

test('rejects a mismatched tag or manual version', () => {
  assert.throws(() => assertReleaseVersion({ version: '1.2.3', tag: 'v1.2.4' }));
  assert.throws(() => assertReleaseVersion({ version: '1.2.3', requestedVersion: '1.2.4' }));
  assert.throws(() => assertReleaseVersion({ version: '1.2.3' }));
});

test('accepts only an npm E404 for an unpublished version', () => {
  assert.doesNotThrow(() =>
    assertUnpublishedPackage({
      name: 'brazilian-tools',
      version: '1.2.3',
      result: { status: 1, stdout: '', stderr: 'npm error code E404' },
    }),
  );
  assert.throws(() =>
    assertUnpublishedPackage({
      name: 'brazilian-tools',
      version: '1.2.3',
      result: { status: 0, stdout: '"1.2.3"', stderr: '' },
    }),
  );
  assert.throws(() =>
    assertUnpublishedPackage({
      name: 'brazilian-tools',
      version: '1.2.3',
      result: { status: 1, stdout: '', stderr: 'npm error code E401' },
    }),
  );
});
