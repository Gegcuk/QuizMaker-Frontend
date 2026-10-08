import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { build } from 'vite';
import { JSDOM } from 'jsdom';
import { createSecurityHeaders } from '../../scripts/deployment/security-headers.mjs';

// Verify delivered executable bytes rather than a hand-maintained bootstrap copy.
test('built startup script is standalone, before content, and allowed by exact CSP hashes', { timeout: 60_000 }, async t => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'theme-startup-'));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  await build({ root: process.cwd(), logLevel: 'error', build: { outDir: directory, emptyOutDir: true } });
  const html = await fs.readFile(path.join(directory, 'index.html'), 'utf8');
  const match = html.match(/<script id="theme-bootstrap">([\s\S]*?)<\/script>/);
  assert.ok(match, 'Production output must contain the synchronous startup script');
  const script = match[1];
  assert.ok(html.indexOf('charset="utf-8"') < 1024, 'Startup must not push charset outside its required early position');
  assert.ok(html.indexOf('id="theme-bootstrap"') < html.indexOf('<body'), 'Startup must precede prerendered content');
  assert.ok(html.indexOf('id="sensitive-url-bootstrap"') < html.indexOf('src="https://www.googletagmanager.com'), 'Callback cleanup must still precede third-party scripts');
  const policy = await createSecurityHeaders(directory);
  const hash = `'sha256-${createHash('sha256').update(script).digest('base64')}'`;
  assert.ok(policy.includes(hash), 'CSP must allow exactly the built startup bytes');
  assert.doesNotMatch(policy.split(';').find(part => part.trim().startsWith('script-src')), /unsafe-inline|unsafe-eval/);
  assert.doesNotMatch(policy, /report-uri|report-to|report-sample/);
  for (const saved of [
    { theme: 'auto', scheme: 'light', dark: true, expected: 'dark' },
    { theme: 'dark', scheme: 'green', dark: true, expected: 'green' },
    { theme: 'light', scheme: 'purple', dark: false, expected: 'purple' },
    { theme: '"dark"', scheme: 'constructor', dark: false, expected: 'light' },
    { denied: true, dark: true, expected: 'dark' },
  ]) {
    const dom = new JSDOM(html, { url: 'https://fixture.example.test/', runScripts: 'outside-only' });
    t.after(() => dom.window.close());
    dom.window.matchMedia = () => ({ matches: saved.dark });
    if (saved.denied) Object.defineProperty(dom.window, 'localStorage', { get() { throw new Error('denied'); } });
    else {
      dom.window.localStorage.setItem('quizmaker-theme', saved.theme);
      dom.window.localStorage.setItem('quizmaker-color-scheme', saved.scheme);
    }
    assert.doesNotThrow(() => dom.window.eval(script));
    const root = dom.window.document.documentElement;
    assert.ok(root.classList.contains(`theme-${saved.expected}`));
    assert.equal(root.style.colorScheme, ['purple', 'dark'].includes(saved.expected) ? 'dark' : 'light');
    assert.equal(dom.window.document.querySelector('meta[name="theme-color"]').content, root.style.getPropertyValue('--color-bg-primary'));
    // Nothing needs to leak onto Window for React or callback handling.
    assert.equal(dom.window.themeStartup, undefined);
  }
  const cssFiles = (await fs.readdir(path.join(directory, 'assets'))).filter(filename => filename.endsWith('.css'));
  const css = (await Promise.all(cssFiles.map(filename => fs.readFile(path.join(directory, 'assets', filename), 'utf8')))).join('\n');
  const variables = [...script.matchAll(/"(--color-[a-z0-9-]+)"/g)].map(match => match[1]);
  for (const variable of new Set(variables)) assert.ok(css.includes(`${variable}:`), `${variable} needs a startup fallback`);
});
