import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const plans = JSON.parse(await fs.readFile(new URL('./validation-plan.json', import.meta.url), 'utf8'));

export function validationPlan(mode) {
  if (!['pr', 'producer', 'producer-fixture'].includes(mode)) throw new Error('Unknown frontend validation mode');
  return structuredClone(plans[mode === 'producer-fixture' ? 'producer' : mode]);
}

function execute(command, args, env, signal) {
  return new Promise((resolve, reject) => {
    const grouped = process.platform !== 'win32';
    const child = spawn(command, args, { env, detached: grouped, stdio: 'inherit' });
    let cancelled = false;
    const terminate = kind => {
      try {
        if (grouped && child.pid) process.kill(-child.pid, kind);
        else child.kill(kind);
      } catch (error) { if (error.code !== 'ESRCH') throw error; }
    };
    const cancel = () => {
      if (cancelled) return;
      cancelled = true;
      terminate('SIGTERM');
      // Keep this timer referenced until the whole npm/build process group is
      // stopped, even when its immediate parent exits first.
      setTimeout(() => terminate('SIGKILL'), 11_000);
    };
    signal?.addEventListener('abort', cancel, { once: true });
    if (signal?.aborted) cancel();
    const finish = error => {
      signal?.removeEventListener('abort', cancel);
      if (error) reject(error); else resolve();
    };
    child.once('error', () => finish(new Error('Validation command could not start')));
    child.once('close', code => finish(code === 0 && !cancelled ? null : new Error('Validation command failed or was cancelled')));
  });
}

export async function validateFrontend(mode, { run = execute, signal,
  manifestDigest = async () => {
    if (!process.env.GITHUB_OUTPUT) throw new Error('Producer requires its captured seal output');
    const outputs = await fs.readFile(process.env.GITHUB_OUTPUT, 'utf8');
    const digest = [...outputs.matchAll(/^manifest_digest=([a-f0-9]{64})$/gm)].at(-1)?.[1];
    if (!digest) throw new Error('Producer did not capture a sealed manifest digest');
    return digest;
  },
  metricsFile = process.env.VALIDATION_METRICS_FILE } = {}) {
  const stages = [];
  const started = performance.now();
  const env = { ...process.env };
  if (mode === 'producer-fixture') Object.assign(env, {
    RELEASE_FIXTURE_MODE: 'true', VITE_API_BASE_URL: 'https://api.fixture.test/api', VITE_SITE_URL: 'https://www.quizzence.com',
  });
  const buildEnvironment = { VITE_API_BASE_URL: env.VITE_API_BASE_URL, VITE_SITE_URL: env.VITE_SITE_URL, RELEASE_FIXTURE_MODE: mode === 'producer-fixture' ? 'true' : 'false' };
  // Production build settings never enter source/browser test subprocesses.
  if (mode !== 'pr') for (const key of Object.keys(buildEnvironment)) delete env[key];
  let validationStatus = 'failed';
  try {
    for (const [gate, command, ...args] of validationPlan(mode)) {
      signal?.throwIfAborted();
      const gateStart = performance.now();
      const stepEnv = { ...env };
      if (mode !== 'pr' && gate === 'build') Object.assign(stepEnv, buildEnvironment);
      if (mode === 'pr' && gate === 'build') stepEnv.VITE_API_BASE_URL = 'https://api.fixture.test/api';
      if (gate === 'release') stepEnv.RELEASE_MANIFEST_DIGEST = await manifestDigest();
      console.log(`::group::Frontend ${gate}`);
      try {
        await run(command, args, stepEnv, signal);
        stages.push({ gate, milliseconds: performance.now() - gateStart, status: 'passed' });
      } catch (error) {
        stages.push({ gate, milliseconds: performance.now() - gateStart, status: 'failed' });
        throw new Error(`Frontend ${gate} failed`, { cause: error });
      } finally { console.log('::endgroup::'); }
    }
    validationStatus = 'passed';
  } finally {
    if (metricsFile) {
      const lockText = await fs.readFile('package-lock.json', 'utf8');
      const lock = JSON.parse(lockText);
      await fs.writeFile(metricsFile, JSON.stringify({
        mode, validation_status: validationStatus, validation_ended_at: new Date().toISOString(),
        validation_commands_milliseconds: performance.now() - started, stages,
        revision: process.env.GITHUB_SHA, run: process.env.GITHUB_RUN_ID, attempt: process.env.GITHUB_RUN_ATTEMPT,
        job_name: process.env.BENCHMARK_JOB_NAME, expected_cache: process.env.BENCHMARK_CACHE,
        sample: process.env.BENCHMARK_SAMPLE, npm_cache_restored: process.env.BENCHMARK_NPM_CACHE_RESTORED,
        node: process.versions.node, architecture: process.arch, platform: process.platform,
        runner_class: process.env.RUNNER_ENVIRONMENT, runner_image: process.env.ImageVersion,
        lockfile_sha256: createHash('sha256').update(lockText).digest('hex'), lockfile_version: lock.lockfileVersion,
        playwright: lock.packages['node_modules/playwright'].version,
      }, null, 2), { mode: 0o600 });
    }
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const controller = new AbortController();
  const cancel = () => controller.abort(new Error('Frontend validation cancelled'));
  process.once('SIGINT', cancel);
  process.once('SIGTERM', cancel);
  try { await validateFrontend(process.argv[2], { signal: controller.signal }); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
  finally { process.removeListener('SIGINT', cancel); process.removeListener('SIGTERM', cancel); }
}
