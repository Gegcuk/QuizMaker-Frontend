import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { verifyBrowserPolicies } from './browser-policies.mjs';
import { promisify } from 'node:util';
import { verifyPublicRouteDelivery } from '../../scripts/verify-public-route-delivery.mjs';

const execFileAsync = promisify(execFile);
const port = process.env.NGINX_TEST_PORT || '8085';
const imageName = `quizzence-nginx-route-policy-${process.pid}`;
const containerName = `quizzence-nginx-route-policy-${process.pid}`;
const baseUrl = process.env.RELEASE_BASE_URL || `http://127.0.0.1:${port}`;

const runDocker = async (args) => {
  try {
    return await execFileAsync('docker', args, { cwd: process.cwd() });
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
  assert.equal(response.headers.get('x-frame-options'), 'SAMEORIGIN');
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(response.headers.get('strict-transport-security'), 'max-age=2592000');
  assert.equal(response.headers.get('permissions-policy'), 'camera=(), microphone=(), geolocation=()');
  assert.ok(response.headers.get('content-security-policy-report-only'));
  assert.equal(response.headers.get('content-security-policy'), null);
  return response;
};

const main = async () => {
  let containerStarted = false;

  try {
    if (!process.env.RELEASE_BASE_URL) {
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
    }

    await waitForServer();

    const homepage = await expectStatus('/', 200);
    assert.match(homepage.headers.get('strict-transport-security') || '', /^max-age=2592000$/);
    assert.match(homepage.headers.get('cache-control') || '', /no-cache/);

    const homepageHtml = await homepage.text();
    const asset = homepageHtml.match(/(?:src|href)="(\/assets\/[^" ]+)"/)[1];
    for (const [route, status] of [[asset, 200], ['/sitemap.xml', 200], ['/robots.txt', 200], ['/terms', 301], ['/missing-document', 404], ['/assets/missing.js', 404]]) {
      await expectStatus(route, status);
    }
    await verifyBrowserPolicies(baseUrl);

    const appShell = await expectStatus('/index.html', 200);
    assert.match(appShell.headers.get('cache-control') || '', /no-cache/);

    const verifiedRoutes = await verifyPublicRouteDelivery({
      baseUrl,
      canonicalOrigin: 'https://www.quizzence.com',
      requireArticles: process.env.REQUIRE_ARTICLE_ROUTES === 'true',
    });

    const callbackCanary = 'oauth-secret-canary';
    for (const callbackPath of ['/oauth2/redirect', '/oauth/callback']) {
      const response = await expectStatus(`${callbackPath}?code=${callbackCanary}`, 200);
      assert.match(response.headers.get('cache-control') || '', /no-store/);
      assert.equal(response.headers.get('referrer-policy'), 'no-referrer');
      assert.match(response.headers.get('x-robots-tag') || '', /noindex, nofollow/);
    }

    if (containerStarted || process.env.RELEASE_CONTAINER) {
      const { stdout: accessLogs } = await runDocker(['logs', process.env.RELEASE_CONTAINER || containerName]);
      assert.doesNotMatch(accessLogs, new RegExp(callbackCanary));
    }

    for (const path of [
      '/quizzes/22222222-2222-4222-8222-222222222222/attempt?attemptId=33333333-3333-4333-8333-333333333333',
      '/my-quizzes',
      '/admin',
      '/documents',
    ]) {
      const response = await expectStatus(path, 200);
      assert.match(response.headers.get('x-robots-tag') || '', /noindex, nofollow/);
      assert.match(response.headers.get('strict-transport-security') || '', /^max-age=2592000$/);
    }

    const invalidPrivateRoute = await expectStatus(
      '/quizzes/22222222-2222-4222-8222-222222222222/not-a-real-route',
      404,
    );
    assert.match(invalidPrivateRoute.headers.get('x-robots-tag') || '', /noindex/);

    console.log(
      `Nginx route policy passed for ${verifiedRoutes.staticRouteCount} static public routes `
        + `and ${verifiedRoutes.articleRouteCount} article routes.`,
    );
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
