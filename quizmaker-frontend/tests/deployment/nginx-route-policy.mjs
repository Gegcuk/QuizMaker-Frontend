import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { once } from 'node:events';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const port = process.env.NGINX_TEST_PORT || '8085';
const imageName = `quizzence-nginx-route-policy-${process.pid}`;
const containerName = `quizzence-nginx-route-policy-${process.pid}`;
const baseUrl = `http://127.0.0.1:${port}`;

const runDocker = async (args) => {
  try {
    await execFileAsync('docker', args, { cwd: process.cwd() });
  } catch (error) {
    if (error && typeof error === 'object' && error.code === 'ENOENT') {
      throw new Error('Docker is required to run the Nginx route policy test.');
    }

    throw error;
  }
};

const waitForServer = async () => {
  let lastError;

  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/`);
      if (response.status === 200) {
        return;
      }
      lastError = new Error(`Nginx returned ${response.status} while starting`);
    } catch (error) {
      lastError = error;
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw lastError ?? new Error('Nginx did not start in time.');
};

const expectStatus = async (path, expectedStatus) => {
  const response = await fetch(`${baseUrl}${path}`, { redirect: 'manual' });
  assert.equal(response.status, expectedStatus, `Expected ${path} to return ${expectedStatus}, got ${response.status}`);
  return response;
};

const main = async () => {
  let containerStarted = false;

  try {
    await runDocker(['build', '--tag', imageName, '.']);
    await runDocker([
      'run',
      '--detach',
      '--rm',
      '--name',
      containerName,
      '--publish',
      `127.0.0.1:${port}:80`,
      imageName,
    ]);
    containerStarted = true;

    await waitForServer();

    const homepage = await expectStatus('/', 200);
    assert.match(homepage.headers.get('strict-transport-security') || '', /^max-age=2592000$/);

    for (const path of [
      '/login',
      '/quizzes/22222222-2222-4222-8222-222222222222/attempt?attemptId=33333333-3333-4333-8333-333333333333',
      '/blog/retrieval-practice-template/',
    ]) {
      await expectStatus(path, 200);
    }

    const canonicalArticle = await expectStatus('/blog/retrieval-practice-template', 301);
    assert.match(canonicalArticle.headers.get('location') || '', /\/blog\/retrieval-practice-template\/$/);

    for (const path of [
      '/this-route-should-not-exist',
      '/quizzes/22222222-2222-4222-8222-222222222222/not-a-real-route',
    ]) {
      const response = await expectStatus(path, 404);
      assert.match(response.headers.get('x-robots-tag') || '', /noindex/);
      assert.match(response.headers.get('strict-transport-security') || '', /^max-age=2592000$/);
      assert.match(response.headers.get('content-type') || '', /^text\/html/);
      const body = await response.text();
      assert.match(body, /<div id="root"><\/div>/);
      assert.match(body, /src="\/assets\/[^\"]+\.js"/);
    }

    const missingAsset = await expectStatus('/assets/this-asset-does-not-exist.js', 404);
    assert.doesNotMatch(await missingAsset.text(), /<div id="root"><\/div>/);

    console.log('Nginx route policy passed.');
  } finally {
    if (containerStarted) {
      await runDocker(['rm', '--force', containerName]).catch(() => undefined);
    }
  }
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
