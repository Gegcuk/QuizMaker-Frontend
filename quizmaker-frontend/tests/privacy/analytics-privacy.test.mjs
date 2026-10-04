import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { test } from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from 'playwright';

const HOST = '127.0.0.1';
const PORT = 4184;
const BASE_URL = `http://${HOST}:${PORT}`;

const createPreviewServer = () =>
  spawn(
    process.execPath,
    ['node_modules/vite/bin/vite.js', 'preview', '--host', HOST, '--port', String(PORT), '--strictPort'],
    {
      cwd: process.cwd(),
      env: { ...process.env, BROWSER: 'none' },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );

const stopPreviewServer = async (server) => {
  if (server.exitCode !== null || server.signalCode !== null) return;
  server.kill('SIGKILL');
  await Promise.race([once(server, 'exit'), delay(2_000)]);
};

const waitForServer = async (url, timeoutMs = 30_000) => {
  const startedAt = Date.now();
  let lastError;

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
      lastError = new Error(`Preview responded with ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await delay(250);
  }

  throw lastError ?? new Error(`Preview did not start at ${url}`);
};

const interceptGoogleTag = async (context) => {
  await context.route('https://www.googletagmanager.com/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
};

const readPrivacyState = (page) =>
  page.evaluate(() => ({
    pathname: window.location.pathname,
    search: window.location.search,
    hash: window.location.hash,
    dataLayer: JSON.stringify(
      (window.dataLayer ?? []).map((entry) => Array.from(entry)),
    ),
    storage: Object.fromEntries(
      Array.from({ length: sessionStorage.length }, (_, index) => {
        const key = sessionStorage.key(index);
        return key ? [key, sessionStorage.getItem(key)] : ['', null];
      }),
    ),
  }));

test('production analytics never receives URL canaries', { timeout: 60_000 }, async () => {
  const server = createPreviewServer();
  let browser;

  try {
    await waitForServer(BASE_URL);
    browser = await chromium.launch();

    const sensitiveReturns = [
      {
        url: '/reset-password?token=reset-token-canary&unknown=unknown-canary#hash-canary',
        pathname: '/reset-password',
        storageKey: 'quizzence:auth:password-reset:v1',
        storedValue: 'reset-token-canary',
      },
      {
        url: '/verify-email?token=verify-token-canary&email=email-canary%40example.com',
        pathname: '/verify-email',
        storageKey: 'quizzence:auth:email-verification:v1',
        storedValue: 'verify-token-canary',
      },
      {
        url: '/billing/success?session_id=session-id-canary&customer=customer-canary',
        pathname: '/billing/success',
        storageKey: 'quizzence:billing:checkout-return:v1',
        storedValue: 'session-id-canary',
      },
      {
        url: `/oauth2/redirect?code=${'C'.repeat(43)}&error_description=oauth-canary`,
        pathname: '/oauth2/redirect',
        storageKey: 'quizzence:oauth:callback:v1',
        storedValue: 'C'.repeat(43),
      },
    ];

    for (const sensitiveReturn of sensitiveReturns) {
      const context = await browser.newContext();
      await interceptGoogleTag(context);
      await context.route(`${BASE_URL}/assets/*.js`, (route) =>
        route.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
      const page = await context.newPage();
      const subresourceReferrers = [];
      page.on('request', (request) => {
        if (request.resourceType() !== 'document') {
          subresourceReferrers.push(request.headers().referer ?? '');
        }
      });

      await page.goto(`${BASE_URL}${sensitiveReturn.url}`, { waitUntil: 'domcontentloaded' });
      const state = await readPrivacyState(page);

      assert.equal(state.pathname, sensitiveReturn.pathname);
      assert.equal(state.search, '');
      assert.equal(state.hash, '');
      assert.match(state.storage[sensitiveReturn.storageKey] ?? '', new RegExp(sensitiveReturn.storedValue));
      assert.doesNotMatch(state.dataLayer, /canary|example\.com|session-id/);
      assert.ok(
        subresourceReferrers.every((referrer) => !/canary|example\.com|session-id/.test(referrer)),
        `Expected sanitized subresource referrers for ${sensitiveReturn.pathname}`,
      );

      await context.close();
    }

    const resetContext = await browser.newContext();
    await interceptGoogleTag(resetContext);
    const resetPage = await resetContext.newPage();
    await resetPage.goto(
      `${BASE_URL}/reset-password?token=consumed-reset-canary&unknown=unknown-canary#hash-canary`,
      { waitUntil: 'domcontentloaded' },
    );
    await resetPage.getByLabel('New Password', { exact: true }).waitFor();
    const consumedResetState = await readPrivacyState(resetPage);
    assert.equal(consumedResetState.pathname, '/reset-password');
    assert.equal(consumedResetState.search, '');
    assert.equal(consumedResetState.hash, '');
    assert.equal(consumedResetState.storage['quizzence:auth:password-reset:v1'], undefined);
    assert.doesNotMatch(consumedResetState.dataLayer, /consumed-reset-canary|unknown-canary|hash-canary/);
    await resetContext.close();

    const context = await browser.newContext();
    await interceptGoogleTag(context);
    const page = await context.newPage();
    await page.goto(
      `${BASE_URL}/blog/article-slug-canary?token=query-canary&email=email-canary#hash-canary`,
      { waitUntil: 'domcontentloaded' },
    );
    await page.waitForFunction(() =>
      (window.dataLayer ?? []).some((entry) => entry[0] === 'event' && entry[1] === 'page_view'));

    const dynamicRouteState = await readPrivacyState(page);
    assert.match(dynamicRouteState.dataLayer, /\/blog\/:slug/);
    assert.doesNotMatch(dynamicRouteState.dataLayer, /article-slug-canary|query-canary|email-canary|hash-canary/);

    await page.goto(
      `${BASE_URL}/unknown/path-canary?token=query-canary&session_id=session-canary#hash-canary`,
      { waitUntil: 'domcontentloaded' },
    );
    await delay(100);
    const unknownRouteState = await readPrivacyState(page);
    assert.doesNotMatch(unknownRouteState.dataLayer, /path-canary|query-canary|session-canary|hash-canary/);

    await context.close();
  } finally {
    await browser?.close();
    await stopPreviewServer(server);
  }
});


test('production checkout recovery preserves privacy and backend authority on desktop and mobile', { timeout: 60_000 }, async () => {
  const server = createPreviewServer();
  let browser;
  const accountId = '11111111-1111-4111-8111-111111111111';
  const recoveryKey = 'quizzence:billing:checkout-recovery:v1';
  const sessionId = 'cs_test_recovery_canary';
  try {
    await waitForServer(BASE_URL);
    browser = await chromium.launch();
    for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
      const context = await browser.newContext({ viewport });
      const unexpected = [];
      let credited = false;
      let statusReads = 0;
      let balanceReads = 0;
      // Every API/provider request is handled locally. No Stripe or live API calls.
      await context.route('**/*', async route => {
        const request = route.request();
        const url = new URL(request.url());
        if (url.origin !== BASE_URL) {
          if (!url.hostname.includes('googletagmanager') && !url.hostname.includes('google-analytics')) unexpected.push(url.origin);
          return route.fulfill({ status: 200, contentType: 'application/javascript', body: '' });
        }
        if (!url.pathname.startsWith('/api/')) return route.continue();
        const json = value => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(value) });
        if (url.pathname === '/api/v1/auth/me') return json({
          id: accountId, username: 'checkout-test', email: 'checkout@example.test', roles: ['ROLE_USER'], isActive: true,
          createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
        });
        if (request.method() === 'GET' && url.pathname === `/api/v1/billing/checkout-sessions/${sessionId}`) {
          statusReads += 1;
          return json({ sessionId, status: 'SUCCEEDED', credited, creditedTokens: credited ? 1500 : null });
        }
        if (request.method() === 'GET' && url.pathname === '/api/v1/billing/balance') {
          balanceReads += 1;
          return json({ userId: accountId, availableTokens: credited ? 3500 : 2000, reservedTokens: 100, updatedAt: '2026-10-04T12:00:00Z' });
        }
        unexpected.push(`${request.method()} ${url.pathname}`);
        return route.fulfill({ status: 500, contentType: 'application/json', body: '{}' });
      });
      await context.addInitScript(() => {
        localStorage.setItem('accessToken', 'test-access-token');
        localStorage.setItem('refreshToken', 'test-refresh-token');
      });
      const page = await context.newPage();
      const referrers = [];
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('request', request => {
        if (request.resourceType() !== 'document') referrers.push(request.headers().referer ?? '');
      });
      await page.goto(`${BASE_URL}/billing/success?session_id=${sessionId}&unknown=private-canary#hash-canary`);
      await page.getByText('Payment succeeded. Tokens are still awaiting credit.', { exact: true }).waitFor();
      const original = await page.evaluate(key => JSON.parse(sessionStorage.getItem(key)), recoveryKey);
      assert.equal(original.accountId, accountId);
      assert.equal(original.sessionId, sessionId);
      await page.locator('a[aria-label="Profile - 2000 tokens available"]').waitFor({ state: 'attached' });
      assert.equal(await page.getByText('Updated balance', { exact: true }).count(), 0);
      assert.equal(page.url(), `${BASE_URL}/billing/success`);
      assert.doesNotMatch(await page.locator('body').innerText(), /canary/);
      await page.reload();
      await page.getByText('Payment succeeded. Tokens are still awaiting credit.', { exact: true }).waitFor();
      const recovered = await page.evaluate(key => JSON.parse(sessionStorage.getItem(key)), recoveryKey);
      assert.equal(recovered.capturedAt, original.capturedAt);
      assert.ok(statusReads >= 2);
      await page.locator('a[aria-label="Profile - 2000 tokens available"]').waitFor({ state: 'attached' });
      assert.equal(await page.getByText('Updated balance', { exact: true }).count(), 0);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
      if (process.env.CHECKOUT_SCREENSHOT_DIR) await page.screenshot({ path: `${process.env.CHECKOUT_SCREENSHOT_DIR}/checkout-${viewport.width}-waiting.png`, fullPage: true });
      const readsBeforeCredit = balanceReads;
      credited = true;
      await page.getByRole('button', { name: 'Check again', exact: true }).click();
      await page.getByText('3,500 tokens', { exact: true }).waitFor();
      assert.equal(balanceReads, readsBeforeCredit + 1);
      assert.equal(await page.evaluate(key => sessionStorage.getItem(key), recoveryKey), null);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
      const state = await readPrivacyState(page);
      assert.doesNotMatch(state.dataLayer, /canary|checkout@example|11111111/);
      assert.ok(referrers.every(referrer => !/canary/.test(referrer)));
      assert.deepEqual(unexpected, []);
      assert.deepEqual(errors, []);
      if (process.env.CHECKOUT_SCREENSHOT_DIR) await page.screenshot({ path: `${process.env.CHECKOUT_SCREENSHOT_DIR}/checkout-${viewport.width}-credited.png`, fullPage: true });
      const readsBeforeReload = statusReads;
      await page.reload();
      await page.getByRole('heading', { name: 'Checkout recovery unavailable' }).waitFor();
      assert.equal(statusReads, readsBeforeReload);
      await page.locator('a[aria-label="Profile - 3500 tokens available"]').waitFor({ state: 'attached' });
      // Reload also refreshes the existing navigation badge, independently of reconciliation.
      assert.equal(balanceReads, readsBeforeCredit + 2);
      await context.close();
    }
  } finally {
    await browser?.close();
    await stopPreviewServer(server);
  }
});
