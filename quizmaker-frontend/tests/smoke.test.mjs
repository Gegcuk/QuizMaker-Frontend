import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { test } from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from 'playwright';

const HOST = '127.0.0.1';
const PORT = 4179;
const BASE_URL = `http://${HOST}:${PORT}`;

const waitForServer = async (url, timeoutMs = 30_000) => {
  const startedAt = Date.now();
  let lastError;

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
      lastError = new Error(`Server responded with ${response.status}`);
    } catch (error) {
      lastError = error;
    }

    await delay(500);
  }

  throw lastError ?? new Error(`Server did not start at ${url}`);
};

test('home page renders in a browser', { timeout: 45_000 }, async () => {
  const server = spawn(
    'npm',
    ['run', 'dev', '--', '--host', HOST, '--port', String(PORT), '--strictPort'],
    {
      cwd: process.cwd(),
      env: { ...process.env, BROWSER: 'none' },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );

  let browser;

  try {
    await waitForServer(BASE_URL);
    browser = await chromium.launch();

    const page = await browser.newPage();
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    await assert.doesNotReject(() =>
      page.getByRole('heading', { name: /welcome to quizzence/i }).waitFor(),
    );

    await assert.doesNotReject(() =>
      page.getByRole('button', { name: /login/i }).waitFor(),
    );
  } finally {
    await browser?.close();

    if (!server.killed) {
      server.kill('SIGTERM');
    }
  }
});
