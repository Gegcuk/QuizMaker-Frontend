import assert from 'node:assert/strict';
import { test } from 'node:test';
import { verifyReleaseImage } from '../../scripts/deployment/test-release.mjs';

async function fixture({ cancelAt, wrongOwner = false } = {}) {
  const controller = new AbortController();
  const calls = []; let owner;
  const run = async (command, args, options) => {
    calls.push([command, args]);
    if (command === 'docker' && args[0] === 'run') owner = args[args.indexOf('--label') + 1].split('=')[1];
    if (command === 'docker' && args[0] === 'port') return { stdout: '127.0.0.1:43211' };
    if (command === 'docker' && args[0] === 'container') return { stdout: JSON.stringify([{ Config: { Labels: { 'com.quizzence.release-test-owner': wrongOwner ? 'unrelated' : owner } } }]) };
    if (command === 'npm' && args[1] === cancelAt) { controller.abort(new Error('cancelled')); options.signal.throwIfAborted(); }
    return { stdout: '', stderr: '' };
  };
  const validation = verifyReleaseImage({ run, manifest: { image_id: 'fixture-exported-image' }, expectedDigest: 'a'.repeat(64), signal: controller.signal,
    request: async url => { assert.equal(url, 'http://127.0.0.1:43211/__release.json'); return { ok: true }; } });
  return { validation, calls };
}
test('release verification consumes the exported image, runs all browser gates, and removes its owned container', async () => {
  const { validation, calls } = await fixture(); await validation;
  assert.ok(calls.some(([command, args]) => command === 'docker' && args.join(' ') === 'load --input release-bundle/image.tar'));
  assert.deepEqual(calls.filter(([command]) => command === 'npm').map(([, args]) => args[1]), ['test:nginx', 'test:smoke', 'test:e2e', 'test:privacy:production']);
  assert.equal(calls.filter(([command, args]) => command === 'python3' && args[1] === 'verify').length, 2);
  assert.equal(calls.at(-1)[1][0], 'rm');
});
test('cancelled release validation stops later gates and cleans up independently of the aborted test signal', async () => {
  const { validation, calls } = await fixture({ cancelAt: 'test:smoke' });
  await assert.rejects(validation, /test:smoke failed/);
  assert.ok(!calls.some(([command, args]) => command === 'npm' && args[1] === 'test:e2e'));
  assert.equal(calls.at(-1)[1][0], 'rm');
});
test('cleanup refuses a container whose ownership label differs', async () => {
  const { validation, calls } = await fixture({ wrongOwner: true });
  await assert.rejects(validation, /ownership mismatch/);
  assert.ok(!calls.some(([command, args]) => command === 'docker' && args[0] === 'rm'));
});
