import assert from 'node:assert/strict';
import { test } from 'node:test';
import { launchBrowser } from '../../scripts/browser/launch-browser.mjs';
import { classifyPrerenderImage, setupPrerenderImages } from '../../scripts/browser/prerender-images.mjs';

const origin = 'http://127.0.0.1:43211';
const hero = 'https://cdn.quizzence.com/fixtures/approved.svg';
const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"></svg>';

test('prerender permits local/inline images and only the exact HTTPS Quizzence CDN', () => {
  assert.equal(classifyPrerenderImage('/logo.svg', origin), 'local');
  assert.equal(classifyPrerenderImage('data:image/svg+xml,fixture', origin), 'inline');
  assert.equal(classifyPrerenderImage(hero, origin), 'cdn');
  for (const url of ['https://images.example.test/hero', 'http://cdn.quizzence.com/hero',
    'https://cdn.quizzence.com.evil.test/hero', 'https://cdn.quizzence.com:8443/hero',
    'https://credential-canary@cdn.quizzence.com/hero', 'http://127.0.0.1:43212/private',
    'file:///private/image', 'javascript:alert(1)']) assert.equal(classifyPrerenderImage(url, origin), 'blocked');
});

test('CDN relay preserves image bytes and blocks unknown origins and redirects with provider fakes', async t => {
  const browser = await launchBrowser();
  t.after(() => browser.close());
  async function pageWithImage(url, options = {}) {
    const page = await browser.newPage();
    t.after(() => page.close());
    await page.route(`${origin}/**`, route => route.fulfill({ contentType: 'text/html', body: `<main><img src="${url}"></main>` }));
    const boundary = await setupPrerenderImages(page, origin, options);
    t.after(() => boundary.dispose().catch(() => undefined));
    return { page, boundary };
  }
  await t.test('anonymous host image fetch preserves natural dimensions and forwards no browser credentials', async () => {
    const calls = [];
    const { page, boundary } = await pageWithImage(hero, { fetchImage: async (url, options) => {
      calls.push({ url, options }); return new Response(svg, { headers: { 'content-type': 'image/svg+xml', 'set-cookie': 'cookie-canary=secret' } });
    } });
    await page.context().addCookies([{ name: 'private-cookie-canary', value: 'secret', url: 'https://cdn.quizzence.com' }]);
    await page.goto(origin);
    assert.equal(await page.locator('img').evaluate(image => image.naturalWidth), 1200);
    await boundary.assertAllowedImages();
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, hero);
    assert.equal(calls[0].options.redirect, 'manual');
    assert.equal(calls[0].options.credentials, 'omit');
    assert.deepEqual(calls[0].options.headers, { accept: 'image/*' });
    assert.ok(calls[0].options.signal instanceof AbortSignal);
    assert.ok(!(await page.context().cookies()).some(cookie => cookie.name === 'cookie-canary'));
  });
  await t.test('a forbidden hero cannot be hidden by an approved fallback or provider fake', async () => {
    const { page, boundary } = await pageWithImage('https://unknown.test/private-image-canary', {
      fetchImage: async () => assert.fail('Forbidden images must never reach host fetch'),
    });
    await page.route('https://unknown.test/**', route => route.fulfill({ contentType: 'image/svg+xml', body: svg }));
    await page.goto(origin);
    await page.locator('img').evaluate(image => { image.src = '/fallback.svg'; });
    await assert.rejects(boundary.assertAllowedImages(), error => {
      assert.match(error.message, /image origin rejected/);
      assert.doesNotMatch(error.message, /private-image-canary/); return true;
    });
  });
  await t.test('redirects cannot reach a different host and fail before the saved output', async () => {
    const calls = [];
    const { page, boundary } = await pageWithImage(hero, { fetchImage: async url => {
      calls.push(url); return new Response(null, { status: 302, headers: { location: 'http://127.0.0.1/private-canary' } });
    } });
    await page.goto(origin);
    await assert.rejects(boundary.assertAllowedImages(), /redirects are forbidden/);
    assert.deepEqual(calls, [hero]);
  });
  await t.test('lazy unrequested images still fail the DOM check', async () => {
    const { page, boundary } = await pageWithImage('/local.svg');
    await page.goto(origin);
    await page.locator('img').evaluate(image => { image.loading = 'lazy'; image.style.marginTop = '100000px'; image.src = 'https://unknown.test/lazy'; });
    await assert.rejects(boundary.assertAllowedImages(), /image origin rejected/);
  });
  await t.test('closing the renderer aborts an in-flight host image request', async () => {
    let started;
    const ready = new Promise(resolve => { started = resolve; });
    const { page, boundary } = await pageWithImage(hero, { fetchImage: async (_url, { signal }) => {
      started(signal);
      return new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(signal.reason), { once: true }));
    } });
    const navigation = page.goto(origin);
    const signal = await ready;
    await boundary.dispose();
    assert.equal(signal.aborted, true);
    await navigation;
  });
  await t.test('a missing approved CDN image retains the normal fallback behavior', async () => {
    const { page, boundary } = await pageWithImage(hero, { fetchImage: async () => new Response('missing', { status: 404 }) });
    await page.goto(origin);
    assert.equal(await page.locator('img').evaluate(image => image.naturalWidth), 0);
    await boundary.assertAllowedImages();
  });
});
