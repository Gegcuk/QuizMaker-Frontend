import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { launchBrowser, validateBrowserEndpoint } from '../../scripts/browser/launch-browser.mjs';
import { stopBrowserEnvironment, validateEnvironmentConfiguration } from '../../scripts/browser/environment.mjs';

test('ordinary local browser startup retains the existing launch behavior', async () => {
  let launches = 0;
  const browser = {};
  assert.equal(await launchBrowser({ endpoint: '', required: false }, { launch: async () => { launches += 1; return browser; } }), browser);
  assert.equal(launches, 1);
});

test('a required prepared browser cannot silently fall back to a host installation', async () => {
  await assert.rejects(launchBrowser({ endpoint: '', required: true }, {}), /endpoint is missing/);
});

test('prepared browser exposes only client loopback and keeps a bounded connection', async () => {
  const calls = [];
  await launchBrowser({ endpoint: 'ws://127.0.0.1:43211/task-owned', timeout: 500 }, {
    connect: async (...args) => { calls.push(args); return {}; },
  });
  assert.deepEqual(calls, [['ws://127.0.0.1:43211/task-owned', { exposeNetwork: '<loopback>', timeout: 500 }]]);
});

test('external, credential-bearing, ambiguous and unbounded browser connections are rejected', async () => {
  for (const endpoint of ['bad', 'https://example.com/path', 'ws://example.com:123/path',
    'ws://user:password@127.0.0.1:123/path', 'ws://127.0.0.1:123/path?secret=value',
    'ws://127.0.0.1:123/path#secret', 'ws://127.0.0.1/path', 'ws://127.0.0.1:123/']) {
    assert.throws(() => validateBrowserEndpoint(endpoint));
  }
  for (const timeout of [0, -1, Infinity, NaN]) {
    await assert.rejects(launchBrowser({ endpoint: 'ws://127.0.0.1:123/local', timeout }, {}), /finite positive timeout/);
  }
});

test('connection diagnostics do not reveal browser capabilities or headers', async () => {
  await assert.rejects(launchBrowser({ endpoint: 'ws://127.0.0.1:123/capability-canary' }, {
    connect: async () => { throw new Error('capability-canary authorization-canary'); },
  }), error => {
    assert.match(error.message, /check local service readiness/);
    assert.doesNotMatch(error.stack, /capability-canary|authorization-canary/);
    return true;
  });
});

test('a changed lockfile, mutable image or unsupported runtime cannot proceed to acquisition', () => {
  const config = { image: `mcr.microsoft.com/playwright@sha256:${'a'.repeat(64)}`, playwright: '1.61.1' };
  const lock = { packages: { 'node_modules/playwright': { version: '1.61.1' } } };
  assert.doesNotThrow(() => validateEnvironmentConfiguration(config, lock, '24.21.0'));
  assert.throws(() => validateEnvironmentConfiguration({ ...config, image: 'mcr.microsoft.com/playwright:latest' }, lock, '24.21.0'), /immutable/);
  assert.throws(() => validateEnvironmentConfiguration({ ...config, playwright: '1.60.0' }, lock, '24.21.0'), /changed Playwright lockfile/);
  assert.throws(() => validateEnvironmentConfiguration(config, lock, '20.19.5'), /Node 24/);
});

test('cleanup is idempotent for missing state and refuses unrelated container names', async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'browser-cleanup-policy-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const state = path.join(root, 'state.json');
  await stopBrowserEnvironment(state);
  await fs.writeFile(state, JSON.stringify({ name: 'production-container' }));
  await assert.rejects(stopBrowserEnvironment(state), /unrelated browser resource/);
});
