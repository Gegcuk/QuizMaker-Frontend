import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validateFrontend } from '../../scripts/deployment/validate-frontend.mjs';

test('fixture producer executes the complete producer and verifies its exported provenance', async () => {
  const calls = [];
  await validateFrontend('producer-fixture', { metricsFile: '', manifestDigest: async () => 'trusted-digest',
    run: async (command, args, env) => calls.push({ command, args, fixture: env.RELEASE_FIXTURE_MODE, api: env.VITE_API_BASE_URL, digest: env.RELEASE_MANIFEST_DIGEST }) });
  assert.equal(calls.length, 7);
  assert.deepEqual(calls[0].args, ['run', 'audit:production']);
  assert.equal(calls.filter(call => call.command === 'bash').length, 1);
  assert.equal(calls.at(-2).args[0], 'scripts/deployment/build-release.sh');
  assert.deepEqual(calls.at(-1).args, ['run', 'test:release']);
  assert.equal(calls.at(-1).digest, 'trusted-digest');
  const build = calls.find(call => call.command === 'bash');
  assert.equal(build.fixture, 'true');
  assert.equal(build.api, 'https://api.fixture.test/api');
  assert.ok(calls.filter(call => call.command !== 'bash').every(call => call.fixture === undefined && call.api === undefined));
});
test('failed or cancelled validation never reaches build or artifact testing', async () => {
  const calls = [];
  await assert.rejects(validateFrontend('producer', { metricsFile: '', run: async (_command, args) => {
    calls.push(args); if (calls.length === 2) throw new Error('lint failure');
  } }), /Frontend lint failed/);
  assert.equal(calls.length, 2);
  const signal = AbortSignal.abort(new Error('cancelled'));
  await assert.rejects(validateFrontend('pr', { metricsFile: '', signal, run: async () => assert.fail('Cancelled run must not start') }), /cancelled/);
});
test('PR builds once with fixture API before production privacy validation', async () => {
  const calls = [];
  await validateFrontend('pr', { metricsFile: '', run: async (_command, args, env) => calls.push([args.join(' '), env.VITE_API_BASE_URL]) });
  assert.equal(calls.filter(([command]) => command.includes('build')).length, 1);
  const build = calls.findIndex(([command]) => command === 'run build:prerender:static');
  assert.equal(calls[build][1], 'https://api.fixture.test/api');
  assert.equal(calls[build + 1][0], 'run test:privacy:production');
});

test('production build settings are confined to build and exported-image verification uses the captured seal', async t => {
  const fs = await import('node:fs/promises');
  const os = await import('node:os');
  const path = await import('node:path');
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'validation-seal-test-'));
  const output = path.join(root, 'seal-output');
  await fs.writeFile(output, `manifest_digest=${'a'.repeat(64)}\n`);
  const keys = ['VITE_API_BASE_URL', 'VITE_SITE_URL', 'GITHUB_OUTPUT', 'RELEASE_FIXTURE_MODE'];
  const previous = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  t.after(async () => {
    for (const key of keys) if (previous[key] === undefined) delete process.env[key]; else process.env[key] = previous[key];
    await fs.rm(root, { recursive: true, force: true });
  });
  process.env.VITE_API_BASE_URL = 'https://production-build-setting.test/api';
  process.env.VITE_SITE_URL = 'https://www.quizzence.com';
  process.env.GITHUB_OUTPUT = output;
  process.env.RELEASE_FIXTURE_MODE = 'true';
  const calls = [];
  await validateFrontend('producer', { metricsFile: '', run: async (command, args, env) => calls.push({ command, args, env }) });
  assert.equal(calls.find(call => call.command === 'bash').env.VITE_API_BASE_URL, process.env.VITE_API_BASE_URL);
  assert.equal(calls.find(call => call.command === 'bash').env.RELEASE_FIXTURE_MODE, 'false', 'Production must reject an inherited fixture-mode override');
  assert.ok(calls.filter(call => call.command !== 'bash').every(call => call.env.VITE_API_BASE_URL === undefined && call.env.VITE_SITE_URL === undefined));
  assert.equal(calls.at(-1).env.RELEASE_MANIFEST_DIGEST, 'a'.repeat(64));
  await fs.writeFile(output, '');
  await assert.rejects(validateFrontend('producer', { metricsFile: '', run: async () => {} }), /sealed manifest digest/);
});
