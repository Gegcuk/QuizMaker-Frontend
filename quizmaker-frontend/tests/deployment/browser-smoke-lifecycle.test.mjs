import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { test } from 'node:test';
import { registerSmokeCleanup } from '../fixtures/smoke-cleanup.mjs';

const childTest = async source => {
  const child = spawn(process.execPath, ['--input-type=module', '--eval', source], { stdio: ['ignore', 'pipe', 'pipe'] });
  let output = '';
  child.stdout.on('data', chunk => { output += chunk; });
  child.stderr.on('data', chunk => { output += chunk; });
  const [code] = await once(child, 'close');
  return { code, output };
};

test('a timed-out smoke test finishes cleanup before the next test reuses its server', { timeout: 10_000 }, async t => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'smoke-cancellation-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const fixture = path.join(directory, 'timeout.mjs');
  const helper = new URL('../fixtures/smoke-cleanup.mjs', import.meta.url).href;
  await writeFile(fixture, `
    import assert from 'node:assert/strict';
    import { test, before } from 'node:test';
    import { createServer } from 'node:http';
    import { once } from 'node:events';
    import { setImmediate } from 'node:timers/promises';
    import { registerSmokeCleanup } from ${JSON.stringify(helper)};
    const server = createServer();
    let port;
    before(async () => {
      server.listen(0, '127.0.0.1');
      await once(server, 'listening');
      port = server.address().port;
    });
    let cleanupCount = 0;
    test('deliberately stalled browser action', { timeout: 100 }, async t => {
      const finish = registerSmokeCleanup(t, async () => {
        ++cleanupCount;
        await setImmediate();
        await new Promise(resolve => server.close(resolve));
      });
      try { await new Promise(() => {}); }
      finally { await finish(); }
    });
    test('following test sees completed cleanup', async t => {
      const replacement = createServer();
      t.after(() => new Promise(resolve => replacement.close(resolve)));
      replacement.listen(port, '127.0.0.1');
      await once(replacement, 'listening');
      assert.equal(cleanupCount, 1);
    });
  `);
  const result = await childTest(`import ${JSON.stringify(pathToFileURL(fixture).href)};`);
  assert.equal(result.code, 1, 'The original timeout must still fail; it is not retried or suppressed');
  assert.match(result.output, /test timed out after 100ms/);
  assert.match(result.output, /following test sees completed cleanup/);
  assert.match(result.output, /pass 1/);
  assert.match(result.output, /cancelled 1/);
});

test('smoke cleanup runs once across cancellation, finally and the after hook', async () => {
  const controller = new AbortController();
  let after;
  let calls = 0;
  const finish = registerSmokeCleanup({ signal: controller.signal, after: callback => { after = callback; } }, async () => { ++calls; });
  controller.abort();
  await finish();
  await after();
  assert.equal(calls, 1);
});

test('cleanup failures remain observable to the runner after hook', async () => {
  const controller = new AbortController();
  let after;
  const finish = registerSmokeCleanup({ signal: controller.signal, after: callback => { after = callback; } }, async () => { throw new Error('cleanup failed'); });
  controller.abort();
  await assert.rejects(finish(), /cleanup failed/);
  await assert.rejects(after(), /cleanup failed/);
});
