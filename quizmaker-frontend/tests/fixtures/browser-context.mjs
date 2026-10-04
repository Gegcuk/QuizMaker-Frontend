// Provider fakes apply below each test's more specific page routes. No automated
// browser gate may contact production APIs, analytics, payment or OAuth services.
export const createTestContext = async (browser, options = {}) => {
  const context = await browser.newContext(options);
  await context.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.hostname === 'www.googletagmanager.com') {
      return route.fulfill({ contentType: 'application/javascript', body: '' });
    }
    if (url.pathname.startsWith('/api/')) return route.abort('blockedbyclient');
    if (['127.0.0.1', 'localhost'].includes(url.hostname)) return route.continue();
    return route.abort('blockedbyclient');
  });
  return context;
};
