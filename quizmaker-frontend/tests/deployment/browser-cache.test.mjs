import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { test } from 'node:test';
import { restorePreparedImageCache, validateCacheSource } from '../../scripts/browser/image-cache.mjs';

async function fixture(t, member = 'prepared-image.tar') {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'browser-cache-test-'));
  const previous = { PATH: process.env.PATH, GH_TOKEN: process.env.GH_TOKEN };
  t.after(async () => {
    process.env.PATH = previous.PATH;
    if (previous.GH_TOKEN === undefined) delete process.env.GH_TOKEN; else process.env.GH_TOKEN = previous.GH_TOKEN;
    await fs.rm(root, { recursive: true, force: true });
  });
  const archive = path.join(root, 'fixture.zip');
  execFileSync('python3', ['-c', 'import sys,zipfile\nwith zipfile.ZipFile(sys.argv[1],"w") as z: z.writestr(sys.argv[2], b"local immutable tooling fixture")', archive, member]);
  await fs.writeFile(path.join(root, 'gh'), `#!/bin/sh\ncat '${archive}'\n`, { mode: 0o700 });
  process.env.PATH = `${root}:${previous.PATH}`;
  process.env.GH_TOKEN = 'local-read-only-fake';
  const source = { artifactId: '123', repository: 'fixture/repository', sha256: createHash('sha256').update('local immutable tooling fixture').digest('hex') };
  return { root, source, stateFile: path.join(root, 'owned-state.json') };
}
test('cache coordinates must identify a captured artifact and independent digest', () => {
  for (const source of [{}, { artifactId: '../wrong', repository: 'fixture/repo', sha256: 'a'.repeat(64) },
    { artifactId: '123', repository: '../repo', sha256: 'a'.repeat(64) }, { artifactId: '123', repository: 'fixture/repo', sha256: 'latest' }]) assert.throws(() => validateCacheSource(source));
});
test('only verified tooling archive reaches Docker and temporary files are cleaned', async t => {
  const value = await fixture(t); let loads = 0;
  await restorePreparedImageCache(value.source, { stateFile: value.stateFile, load: async image => {
    loads += 1; assert.equal(await fs.readFile(image, 'utf8'), 'local immutable tooling fixture');
  } });
  assert.equal(loads, 1);
  assert.equal((await fs.readdir(value.root)).filter(name => name.includes('.cache.')).length, 0);
});
test('wrong digests and unexpected/traversing zip members fail before Docker load', async t => {
  const value = await fixture(t);
  await assert.rejects(restorePreparedImageCache({ ...value.source, sha256: '0'.repeat(64) }, {
    stateFile: value.stateFile, load: async () => assert.fail('Unverified cache must not load'),
  }), /digest mismatch/);
  execFileSync('python3', ['-c', 'import sys,zipfile\nwith zipfile.ZipFile(sys.argv[1],"w") as z: z.writestr("../prepared-image.tar", b"unsafe")', path.join(value.root, 'fixture.zip')]);
  await assert.rejects(restorePreparedImageCache(value.source, { stateFile: value.stateFile,
    load: async () => assert.fail('Unexpected archive must not load') }), /acquisition failed/);
});
test('cancellation and unavailable cache fail without fallback or unrelated file deletion', async t => {
  const value = await fixture(t);
  const unrelated = `${value.stateFile}.cache.tar`; await fs.writeFile(unrelated, 'preserved');
  await assert.rejects(restorePreparedImageCache(value.source, { stateFile: value.stateFile, load: async () => assert.fail('Existing target must not load') }), /EEXIST/);
  assert.equal(await fs.readFile(unrelated, 'utf8'), 'preserved');
  await fs.unlink(unrelated);
  await assert.rejects(restorePreparedImageCache(value.source, { stateFile: value.stateFile, signal: AbortSignal.abort(), load: async () => assert.fail('Cancelled cache must not load') }));
  await fs.writeFile(path.join(value.root, 'gh'), '#!/bin/sh\nexit 1\n', { mode: 0o700 });
  await assert.rejects(restorePreparedImageCache(value.source, { stateFile: value.stateFile, load: async () => assert.fail('Missing cache must not load') }), /acquisition failed/);
});
