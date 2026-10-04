import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { prerender } from '../../scripts/prerender.mjs';

const mode = process.argv[2];
assert.ok(['success', 'failure'].includes(mode));
const distDir = await fs.mkdtemp(path.join(os.tmpdir(), 'quizzence-prerender-lifecycle-'));
let previewOrigin;

try {
  // A tiny local page exercises the real browser/server lifecycle without a
  // frontend build, API calls, or external resources.
  await fs.writeFile(path.join(distDir, 'index.html'), '<!doctype html><html><head><title>Lifecycle fixture</title></head><body><main><h1>Local fixture</h1></main></body></html>');
  const rendering = prerender({
    distDir,
    staticOnly: true,
    setupPage: async (page, origin) => {
      previewOrigin = origin;
      if (mode === 'failure') {
        // Fail after both server and browser have started, while a page is open.
        await page.goto(origin);
        throw new Error('Synthetic prerender failure');
      }
    },
  });

  if (mode === 'failure') await assert.rejects(rendering, /Synthetic prerender failure/);
  else await rendering;

  assert.ok(previewOrigin, 'The real preview server must have started');
  const stillServing = await fetch(previewOrigin, { signal: AbortSignal.timeout(2_000) })
    .then(() => true, () => false);
  assert.equal(stillServing, false, 'Preview server must stop accepting requests before prerender settles');
} finally {
  await fs.rm(distDir, { recursive: true, force: true });
}

console.log(`Prerender lifecycle completed: ${mode}`);
// Deliberately no process.exit(): the parent test checks natural process exit,
// including closed pipes and browser/server resources on success and failure.
