import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { createTestContext } from '../fixtures/browser-context.mjs';

export const verifyBrowserPolicies = async base => {
  const browser = await chromium.launch();
  try {
    // The shipped image is report-only. A test-only response override checks the
    // future enforcement boundary without changing application or image bytes.
    for (const enforce of [false, true]) {
      const context = await createTestContext(browser);
      if (enforce) {
        await context.route(`${base}/**`, async route => {
          if (route.request().resourceType() !== 'document') return route.fallback();
          const response = await route.fetch();
          const headers = response.headers();
          headers['content-security-policy'] = headers['content-security-policy-report-only'];
          delete headers['content-security-policy-report-only'];
          await route.fulfill({ response, headers });
        });
      }
      await context.addInitScript(() => {
        window.policyViolations = [];
        document.addEventListener('securitypolicyviolation', event => {
          // Do not store documentURI, blockedURI, sourceFile, or script samples.
          window.policyViolations.push({ directive: event.effectiveDirective, disposition: event.disposition });
        });
      });
      const page = await context.newPage();
      await page.goto(`${base}/login`);
      await page.getByRole('button', { name: 'Sign in', exact: true }).waitFor();
      assert.deepEqual(await page.evaluate(() => window.policyViolations), []);
      assert.deepEqual(await page.evaluate(() => ['camera', 'microphone', 'geolocation'].map(name => document.featurePolicy.allowsFeature(name))), [false, false, false]);
      await page.evaluate(() => {
        const script = document.createElement('script');
        script.textContent = 'window.unapprovedInlineScriptRan = true';
        document.body.append(script);
      });
      await page.waitForFunction(() => window.policyViolations.length > 0);
      assert.equal(await page.evaluate(() => window.unapprovedInlineScriptRan === true), !enforce);
      const violations = await page.evaluate(() => window.policyViolations);
      assert.ok(violations.some(value => value.directive === 'script-src-elem' && value.disposition === (enforce ? 'enforce' : 'report')));
      // The real sensitive-URL bootstrap must remain executable with its hash.
      await context.route(`${base}/assets/*.js`, route => route.fulfill({ contentType: 'application/javascript', body: '' }));
      await page.goto(`${base}/oauth2/redirect?code=${'C'.repeat(43)}&error_description=private-canary#private-canary`);
      assert.equal(new URL(page.url()).search, '');
      assert.equal(new URL(page.url()).hash, '');
      assert.deepEqual(await page.evaluate(() => window.policyViolations), []);
      await context.close();
    }
  } finally {
    await browser.close();
  }
};
