import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const fixture = fileURLToPath(new URL('../fixtures/prerender-lifecycle.mjs', import.meta.url));
const appDir = fileURLToPath(new URL('../../', import.meta.url));

for (const mode of ['success', 'failure']) {
  test(`prerender releases its server and exits naturally after ${mode}`, { timeout: 45_000 }, async () => {
    const hasProcessGroups = process.platform !== 'win32';
    const child = spawn(process.execPath, [fixture, mode], {
      cwd: appDir,
      // Isolate the test's own process tree so a regression can be stopped
      // without leaving the same orphan npm/Vite processes that stalled CI.
      detached: hasProcessGroups,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, CI: 'true', BROWSER: 'none' },
    });
    let output = '';
    let timedOut = false;
    const collect = chunk => { output += chunk.toString(); };
    child.stdout.on('data', collect);
    child.stderr.on('data', collect);

    const stopOwnedProcesses = () => {
      if (!child.pid) return;
      try {
        if (hasProcessGroups) process.kill(-child.pid, 'SIGKILL');
        else child.kill('SIGKILL');
      } catch (error) {
        if (error.code !== 'ESRCH') throw error;
      }
    };
    const deadline = setTimeout(() => {
      timedOut = true;
      stopOwnedProcesses();
    }, 30_000);

    try {
      const code = await new Promise((resolve, reject) => {
        child.once('error', reject);
        // 'exit' alone misses descendants keeping inherited stdout/stderr open.
        child.once('close', resolve);
      });
      assert.equal(timedOut, false, `Prerender process or its inherited pipes stayed open.\n${output}`);
      assert.equal(code, 0, output);
      assert.ok(output.includes(`Prerender lifecycle completed: ${mode}`), output);
    } finally {
      clearTimeout(deadline);
      stopOwnedProcesses();
    }
  });
}
