import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repositoryRoot = path.resolve(__dirname, '..', '..', '..');

const main = async () => {
  const [workflow, prWorkflow, dockerignore, indexHtml] = await Promise.all([
    fs.readFile(path.join(repositoryRoot, '.github', 'workflows', 'deploy.yml'), 'utf8'),
    fs.readFile(path.join(repositoryRoot, '.github', 'workflows', 'frontend-pr.yml'), 'utf8'),
    fs.readFile(path.join(repositoryRoot, 'quizmaker-frontend', '.dockerignore'), 'utf8'),
    fs.readFile(path.join(repositoryRoot, 'quizmaker-frontend', 'index.html'), 'utf8'),
  ]);

  assert.match(dockerignore, /^\*$/m, 'Expected the Docker context to default-deny files');
  for (const allowedPath of ['!Dockerfile', '!nginx.conf', '!dist/', '!dist/**']) {
    assert.match(dockerignore, new RegExp(`^${allowedPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'm'));
  }

  assert.match(workflow, /cp quizmaker-frontend\/\.dockerignore deployment\//);
  assert.match(workflow, /for attempt in 1 2 3;/);
  assert.match(workflow, /compose up -d --no-build/);

  const buildIndex = workflow.indexOf('compose build --no-cache');
  const stopIndex = workflow.indexOf('compose down');
  assert.ok(buildIndex >= 0, 'Expected deployment to build the replacement image');
  assert.ok(stopIndex >= 0, 'Expected deployment to stop the previous container after a successful build');
  assert.ok(buildIndex < stopIndex, 'Expected the replacement image to build before the previous container stops');

  for (const [name, validationWorkflow] of [
    ['deployment', workflow],
    ['pull request', prWorkflow],
  ]) {
    const validationBuildIndex = validationWorkflow.indexOf('run: npm run build:prerender:static');
    const privacyTestIndex = validationWorkflow.indexOf('run: npm run test:privacy:production');
    assert.ok(validationBuildIndex >= 0, `Expected a production build in the ${name} workflow`);
    assert.ok(privacyTestIndex >= 0, `Expected the analytics privacy test in the ${name} workflow`);
    assert.ok(
      validationBuildIndex < privacyTestIndex,
      `Expected the ${name} workflow to test analytics privacy against built assets`,
    );
  }

  assert.match(workflow, /name: Verify public routes in production[\s\S]*run: npm run verify:public-routes/);
  assert.match(workflow, /PUBLIC_ROUTE_RETRY_ATTEMPTS: '5'/);
  assert.match(workflow, /REQUIRE_ARTICLE_ROUTES: 'true'/);

  const bootstrapMatch = indexHtml.match(
    /<script id="sensitive-url-bootstrap">([\s\S]*?)<\/script>/,
  );
  assert.ok(bootstrapMatch, 'Expected the sensitive URL bootstrap in index.html');
  assert.ok(
    indexHtml.indexOf('id="sensitive-url-bootstrap"')
      < indexHtml.indexOf('googletagmanager.com/gtag/js'),
    'Expected sensitive URL sanitization before the Google tag request',
  );
  assert.match(indexHtml, /<meta name="referrer" content="strict-origin" \/>/);
  assert.match(indexHtml, /page_location: window\.location\.origin \+ '\/'/);
  assert.match(indexHtml, /page_referrer: ''/);

  const executeBootstrap = (pathname, search, hash = '') => {
    const records = new Map();
    const storage = {
      setItem: (key, value) => records.set(key, value),
    };
    const history = {
      state: null,
      replacement: null,
      replaceState(_state, _title, replacement) {
        this.replacement = replacement;
      },
    };
    const windowValue = {
      location: { pathname, search, hash },
    };
    const bootstrap = new Function(
      'window',
      'sessionStorage',
      'history',
      'URLSearchParams',
      bootstrapMatch[1],
    );

    bootstrap(windowValue, storage, history, URLSearchParams);
    return { history, records };
  };

  const code = 'C'.repeat(43);
  const secureCallback = executeBootstrap(
    '/oauth2/redirect',
    `?code=${code}&error_description=secret-description-canary`,
  );
  const capturedCode = JSON.parse(
    secureCallback.records.get('quizzence:oauth:callback:v1'),
  );
  assert.deepEqual(
    { version: capturedCode.version, kind: capturedCode.kind, value: capturedCode.value },
    { version: 1, kind: 'code', value: code },
  );
  assert.ok(Number.isFinite(capturedCode.capturedAt));
  assert.equal(secureCallback.history.replacement, '/oauth2/redirect');
  assert.doesNotMatch(JSON.stringify([...secureCallback.records]), /secret-description-canary/);

  const tokenBearingCallback = executeBootstrap(
    '/oauth2/redirect',
    '?accessToken=credential.access.canary&refreshToken=credential.refresh.canary',
  );
  assert.equal(tokenBearingCallback.records.size, 0);
  assert.doesNotMatch(JSON.stringify([...tokenBearingCallback.records]), /credential\.(access|refresh)\.canary/);
  assert.equal(tokenBearingCallback.history.replacement, '/oauth2/redirect');

  const passwordReset = executeBootstrap(
    '/reset-password',
    '?token=reset-token-canary&email=private%40example.com',
    '#hash-canary',
  );
  assert.deepEqual(
    JSON.parse(passwordReset.records.get('quizzence:auth:password-reset:v1')).values,
    { token: 'reset-token-canary' },
  );
  assert.equal(passwordReset.history.replacement, '/reset-password');
  assert.doesNotMatch(JSON.stringify([...passwordReset.records]), /private@example\.com|hash-canary/);

  const emailVerification = executeBootstrap(
    '/verify-email',
    '?token=verification-token-canary&email=learner%40example.com&unknown=unknown-canary',
  );
  assert.deepEqual(
    JSON.parse(emailVerification.records.get('quizzence:auth:email-verification:v1')).values,
    { token: 'verification-token-canary', email: 'learner@example.com' },
  );
  assert.doesNotMatch(JSON.stringify([...emailVerification.records]), /unknown-canary/);
  assert.equal(emailVerification.history.replacement, '/verify-email');

  const billingReturn = executeBootstrap(
    '/billing/success',
    '?session_id=cs_test_canary&customer=customer-canary',
  );
  assert.deepEqual(
    JSON.parse(billingReturn.records.get('quizzence:billing:checkout-return:v1')).values,
    { sessionId: 'cs_test_canary' },
  );
  assert.doesNotMatch(JSON.stringify([...billingReturn.records]), /customer-canary/);
  assert.equal(billingReturn.history.replacement, '/billing/success');

  console.log('Deployment workflow policy passed.');
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
