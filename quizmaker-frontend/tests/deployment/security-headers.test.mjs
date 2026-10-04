import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { createSecurityHeaders } from '../../scripts/deployment/security-headers.mjs';

test('CSP hashes final inline executable bytes and excludes report collectors', async t => {
  const dist = await fs.mkdtemp(path.join(os.tmpdir(), 'release-csp-'));
  t.after(() => fs.rm(dist, { recursive: true, force: true }));
  const script = 'window.fixture = "safe";\n';
  await fs.writeFile(path.join(dist, 'index.html'), `<script>${script}</script><script type="application/ld+json">{"name":"Article"}</script>`);
  const policy = await createSecurityHeaders(dist, 'https://api.example.test/api');
  assert.ok(policy.includes(`'sha256-${createHash('sha256').update(script).digest('base64')}'`));
  assert.match(policy, /connect-src[^;]*https:\/\/api.example.test/);
  assert.doesNotMatch(policy, /report-uri|report-to|report-sample|unsafe-eval/);
  assert.doesNotMatch(policy.split(';').find(value => value.trim().startsWith('script-src')), /unsafe-inline/);
  const headers = await fs.readFile(path.join(dist, 'nginx/security-headers.conf'), 'utf8');
  assert.match(headers, /Content-Security-Policy-Report-Only/);
  assert.doesNotMatch(headers, /add_header Content-Security-Policy /);
  assert.match(headers, /camera=\(\), microphone=\(\), geolocation=\(\)/);
  for (const source of ['http://api.example.test', 'https://user:password@example.test', 'https://example.test/?secret=value', 'https://$host.example.test']) {
    await assert.rejects(createSecurityHeaders(dist, source));
  }
});
