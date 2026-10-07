import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import http from 'node:http';
import net from 'node:net';
import path from 'node:path';
import { once } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { withPreparationDeadline } from './deadline.mjs';
import { launchBrowser, validateBrowserEndpoint } from './launch-browser.mjs';
import { restorePreparedImageCache, validateCacheSource } from './image-cache.mjs';

const appRoot = fileURLToPath(new URL('../../', import.meta.url));
const configuration = JSON.parse(await fs.readFile(new URL('./environment.json', import.meta.url), 'utf8'));
const resourcePrefix = 'quizzence-browser-';
const cacheTagFor = image => `quizzence-browser-cache:${configuration.playwright}-${image.split(':').at(-1)}`;

function docker(args, signal, { allowMissing = false } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn('docker', args, { signal, killSignal: 'SIGKILL', stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', value => { stdout = (stdout + value).slice(-2 * 1024 * 1024); });
    child.stderr.on('data', value => { stderr = (stderr + value).slice(-2 * 1024 * 1024); });
    child.once('error', reject);
    child.once('close', code => {
      if (code === 0) resolve(stdout);
      else if (allowMissing && code === 1 && /(?:No such (?:image|container|network)|network .* not found)/i.test(stderr)) resolve(null);
      else reject(new Error(`Browser environment Docker ${args[0]} failed (exit ${code})`));
    });
  });
}

export function validateEnvironmentConfiguration(config, lock, nodeVersion) {
  if (!/^mcr\.microsoft\.com\/playwright@sha256:[a-f0-9]{64}$/.test(config.image)) throw new Error('Browser environment requires a reviewed immutable Playwright image');
  if (config.playwright !== lock.packages['node_modules/playwright']?.version) throw new Error('Review the browser image pin for the changed Playwright lockfile');
  if (!/^24\.\d+\.\d+$/.test(nodeVersion)) throw new Error('Browser environment requires the project Node 24 pin');
}

export async function exportPreparedImageCache(stateFile, target, signal) {
  const state = JSON.parse(await fs.readFile(stateFile, 'utf8'));
  const metadata = JSON.parse(await fs.readFile(`${stateFile}.metrics.json`, 'utf8'));
  if (!Object.values(configuration.platformImages).includes(state.image) || metadata.image !== state.image || !metadata.fixtureRendered) {
    throw new Error('Only a verified immutable tooling environment may be cached');
  }
  if (!target || !path.isAbsolute(target)) throw new Error('Cache export requires an absolute task-owned target');
  const placeholder = await fs.open(target, 'wx', 0o600);
  await placeholder.close();
  const cacheTag = cacheTagFor(state.image);
  await docker(['tag', state.image, cacheTag], signal);
  await docker(['save', '--output', target, cacheTag], signal);
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(target, { signal })) hash.update(chunk);
  return hash.digest('hex');
}

export async function stopBrowserEnvironment(stateFile) {
  const state = JSON.parse(await fs.readFile(stateFile, 'utf8').catch(error => {
    if (error.code === 'ENOENT') return 'null';
    throw error;
  }));
  if (!state) return;
  if (!new RegExp(`^${resourcePrefix}[a-f0-9-]{36}$`).test(state.name)) throw new Error('Refusing cleanup of an unrelated browser resource');
  const signal = AbortSignal.timeout(10_000);
  if (state.controlPath) {
    if (state.controlPath !== `${stateFile}.sock`) throw new Error('Browser proxy ownership mismatch');
    await new Promise((resolve, reject) => {
      const socket = net.connect(state.controlPath);
      const stop = () => { socket.destroy(); reject(new Error('Browser proxy cleanup exceeded its deadline')); };
      signal.addEventListener('abort', stop, { once: true });
      const done = error => {
        signal.removeEventListener('abort', stop);
        socket.destroy();
        if (error && !['ENOENT', 'ECONNREFUSED'].includes(error.code)) reject(error);
        else resolve();
      };
      socket.once('connect', () => socket.write('stop\n'));
      socket.once('data', () => done());
      socket.once('error', done);
    });
  }
  const container = await docker(['container', 'inspect', state.name], signal, { allowMissing: true });
  if (container) {
    const labels = JSON.parse(container)[0].Config.Labels;
    if (labels?.['com.quizzence.browser-owner'] !== state.name) throw new Error('Browser container ownership mismatch');
    await docker(['rm', '--force', state.name], signal);
  }
  const network = await docker(['network', 'inspect', state.name], signal, { allowMissing: true });
  if (network) {
    if (JSON.parse(network)[0].Labels?.['com.quizzence.browser-owner'] !== state.name) throw new Error('Browser network ownership mismatch');
    await docker(['network', 'rm', state.name], signal);
  }
  await fs.unlink(stateFile);
}

export async function prepareBrowserEnvironment({ stateFile, nodeRuntime, architecture = process.arch === 'arm64' ? 'arm64' : 'amd64', signal, cacheSource } = {}) {
  if (!stateFile || !path.isAbsolute(stateFile)) throw new Error('An absolute task-owned browser state path is required');
  if (!['arm64', 'amd64'].includes(architecture)) throw new Error('Unsupported browser environment architecture');
  if (!nodeRuntime && process.platform !== 'linux') throw new Error('Non-Linux probes require a verified Linux Node runtime directory');
  const runtime = nodeRuntime ?? path.dirname(path.dirname(process.execPath));
  const lock = JSON.parse(await fs.readFile(path.join(appRoot, 'package-lock.json'), 'utf8'));
  const nodeVersion = (await fs.readFile(path.join(appRoot, '..', '.nvmrc'), 'utf8')).trim();
  validateEnvironmentConfiguration(configuration, lock, nodeVersion);
  const image = configuration.platformImages[architecture];
  if (!/^mcr\.microsoft\.com\/playwright@sha256:[a-f0-9]{64}$/.test(image ?? '')) throw new Error('Missing reviewed platform image digest');
  const cacheTag = cacheTagFor(image);
  if (cacheSource) validateCacheSource(cacheSource);
  const name = `${resourcePrefix}${randomUUID()}`;
  const state = { name, image };
  // Write before starting resources so cancellation can clean up partial setup.
  await fs.writeFile(stateFile, JSON.stringify(state), { flag: 'wx', mode: 0o600 });
  let endpoint;
  let compatibility;
  let browserVersion;
  let imageReferenceCache;
  let proxyProcess;
  try {
    const result = await withPreparationDeadline([
      { name: 'immutable-image-acquisition', run: async ({ signal }) => {
        if (cacheSource) await restorePreparedImageCache(cacheSource, { stateFile, signal,
          load: (image, active) => docker(['load', '--input', image], active) });
        const restored = cacheSource ? JSON.parse(await docker(['image', 'inspect', cacheTag], signal))[0].RootFS : null;
        imageReferenceCache = await docker(['image', 'inspect', image], signal, { allowMissing: true }) ? 'present' : 'absent';
        await docker(['pull', '--platform', `linux/${architecture}`, image], signal);
        if (restored) {
          const acquired = JSON.parse(await docker(['image', 'inspect', image], signal))[0].RootFS;
          if (JSON.stringify(restored) !== JSON.stringify(acquired)) throw new Error('Warm cache does not contain the selected immutable environment');
        }
      } },
      { name: 'isolated-service-startup-and-compatibility', run: async ({ signal, remainingMs }) => {
        await docker(['network', 'create', '--internal', '--label', `com.quizzence.browser-owner=${name}`, name], signal);
        const mounts = [
          [runtime, '/runtime'],
          [path.join(appRoot, '..', '.nvmrc'), '/probe/node-version'],
          [path.join(appRoot, 'package-lock.json'), '/probe/package-lock.json'],
          [path.join(appRoot, 'scripts/browser/service.mjs'), '/probe/service.mjs'],
          [path.join(appRoot, 'node_modules/playwright'), '/probe/node_modules/playwright'],
          [path.join(appRoot, 'node_modules/playwright-core'), '/probe/node_modules/playwright-core'],
        ].flatMap(([source, target]) => ['--mount', `type=bind,source=${source},target=${target},readonly`]);
        await docker(['run', '--detach', '--name', name, '--platform', `linux/${architecture}`,
          '--label', `com.quizzence.browser-owner=${name}`, '--network', name,
          '--read-only', '--cap-drop', 'ALL',
          '--security-opt', 'no-new-privileges', '--shm-size', '256m',
          '--tmpfs', '/tmp:rw,nosuid,nodev', '--env', 'PLAYWRIGHT_BROWSERS_PATH=/ms-playwright',
          ...mounts, '--entrypoint', '/runtime/bin/node', image, '/probe/service.mjs'], signal);
        const started = performance.now();
        while (performance.now() - started < remainingMs) {
          const logs = await docker(['logs', name], signal);
          const line = logs.split('\n').find(line => line.startsWith('{"node":'));
          const listening = logs.match(/^Listening on (ws:\/\/\S+)$/m);
          if (line && listening) { compatibility = { ...JSON.parse(line), endpoint: listening[1] }; break; }
          const inspect = JSON.parse(await docker(['container', 'inspect', name], signal))[0];
          if (!inspect.State.Running) throw new Error('Prepared browser service failed its startup/compatibility check');
          await delay(100, undefined, { signal });
        }
        if (!compatibility) throw new Error('Prepared browser service did not become ready');
        if (compatibility.node !== nodeVersion || compatibility.playwright !== configuration.playwright) throw new Error('Prepared service compatibility mismatch');
        const proxy = spawn(process.execPath, [path.join(appRoot, 'scripts/browser/proxy.mjs'), stateFile], {
          detached: true, stdio: 'ignore',
          env: Object.fromEntries(['PATH', 'HOME', 'DOCKER_HOST', 'DOCKER_CONTEXT', 'DOCKER_CONFIG', 'RUNNER_TRACKING_ID']
            .filter(key => process.env[key] !== undefined).map(key => [key, process.env[key]])),
        });
        proxyProcess = proxy;
        let proxyError;
        proxy.once('error', () => { proxyError = new Error('Browser loopback proxy could not start'); });
        proxy.unref();
        const proxyStarted = performance.now();
        let proxyState;
        while (performance.now() - proxyStarted < remainingMs) {
          signal.throwIfAborted();
          proxyState = JSON.parse(await fs.readFile(stateFile, 'utf8'));
          if (proxyState.proxyPort) break;
          if (proxyError) throw proxyError;
          if (proxy.exitCode !== null) throw new Error('Browser loopback proxy failed to start');
          await delay(100, undefined, { signal });
        }
        if (!proxyState?.proxyPort) throw new Error('Browser loopback proxy did not become ready');
        const url = new URL(compatibility.endpoint);
        url.host = `127.0.0.1:${proxyState.proxyPort}`;
        endpoint = validateBrowserEndpoint(url.href);
      } },
      { name: 'client-loopback-fixture-render', run: async ({ signal, remainingMs }) => {
        const fixture = http.createServer((_request, response) => {
          response.writeHead(200, { 'content-type': 'text/html' });
          response.end('<meta charset="utf-8"><title>Browser readiness</title><button>Local fixture ready</button><p>Проверка — café 中文</p>');
        });
        fixture.listen(0, '127.0.0.1');
        let browser;
        const cancel = () => { fixture.closeAllConnections(); void browser?.close(); };
        signal.addEventListener('abort', cancel, { once: true });
        try {
          await once(fixture, 'listening', { signal });
          browser = await launchBrowser({ endpoint, timeout: Math.max(1, remainingMs) });
          if (signal.aborted) throw signal.reason;
          browserVersion = browser.version();
          const page = await browser.newPage();
          const url = `http://127.0.0.1:${fixture.address().port}`;
          await page.route('**/*', route => new URL(route.request().url()).origin === url ? route.continue() : route.abort());
          await page.goto(url, { timeout: Math.max(1, remainingMs) });
          await page.getByRole('button', { name: 'Local fixture ready', exact: true }).waitFor({ timeout: Math.max(1, remainingMs) });
          await page.getByText('Проверка — café 中文', { exact: true }).waitFor({ timeout: Math.max(1, remainingMs) });
          if (!await page.evaluate(() => navigator.onLine)) throw new Error('Prepared browser does not preserve online semantics');
          await page.context().setOffline(true);
          if (await page.evaluate(() => navigator.onLine)) throw new Error('Prepared browser does not preserve offline emulation');
          await page.context().setOffline(false);
          if (!await page.evaluate(() => navigator.onLine)) throw new Error('Prepared browser does not preserve reconnect semantics');
        } finally {
          signal.removeEventListener('abort', cancel);
          await browser?.close();
          fixture.closeAllConnections();
          await new Promise(resolve => fixture.close(resolve));
        }
      } },
    ], { signal });
    const currentState = JSON.parse(await fs.readFile(stateFile, 'utf8'));
    await fs.writeFile(stateFile, JSON.stringify({ ...currentState, endpoint }), { mode: 0o600 });
    return { ...result, status: 'passed', architecture, browser: browserVersion, image, node: compatibility.node, playwright: compatibility.playwright,
      imageReferenceCache, verifiedImageCacheRestored: Boolean(cacheSource),
      dockerLayerCache: cacheSource ? 'verified-archive-restored' : 'shared-layer-state-not-measured', cacheCohort: 'not-classified',
      standaloneBrowserCache: 'not-applicable', fixtureRendered: true, networkIsolation: 'internal-owned-bridge', endpoint };
  } catch (error) {
    if (error.preparation) Object.assign(error.preparation, { image, node: nodeVersion, playwright: configuration.playwright, architecture, imageReferenceCache, verifiedImageCacheRestored: false });
    // An owned child reference also covers cancellation before it writes ready
    // state; never signal a PID recovered from an untrusted state file.
    if (proxyProcess && proxyProcess.exitCode === null) {
      proxyProcess.kill('SIGTERM');
      await Promise.race([once(proxyProcess, 'exit').catch(() => undefined), delay(2000)]);
      if (proxyProcess.exitCode === null) proxyProcess.kill('SIGKILL');
    }
    try { await stopBrowserEnvironment(stateFile); }
    catch (cleanupError) {
      const combined = new AggregateError([error, cleanupError], 'Browser preparation and task-owned cleanup failed');
      combined.preparation = error.preparation;
      throw combined;
    }
    throw error;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [, , command, stateFile, runtime] = process.argv;
  const cancellation = new AbortController();
  const cancel = () => cancellation.abort(new Error('Browser preparation cancelled'));
  process.once('SIGINT', cancel);
  process.once('SIGTERM', cancel);
  try {
    if (command === 'stop') await stopBrowserEnvironment(stateFile);
    else if (command === 'export-cache') {
      const digest = await exportPreparedImageCache(stateFile, runtime, cancellation.signal);
      if (process.env.GITHUB_OUTPUT) await fs.appendFile(process.env.GITHUB_OUTPUT, `archive_sha256=${digest}\n`);
      console.log(`Prepared tooling cache SHA256 ${digest}`);
    }
    else if (command === 'prepare') {
      const cacheSource = process.env.BROWSER_CACHE_ARTIFACT_ID ? {
        artifactId: process.env.BROWSER_CACHE_ARTIFACT_ID, sha256: process.env.BROWSER_CACHE_ARCHIVE_SHA256,
        repository: process.env.GITHUB_REPOSITORY,
      } : undefined;
      const result = await prepareBrowserEnvironment({ stateFile, nodeRuntime: runtime, signal: cancellation.signal, cacheSource });
      if (process.env.GITHUB_ENV) {
        console.log(`::add-mask::${result.endpoint}`);
        await fs.appendFile(process.env.GITHUB_ENV, `BROWSER_WS_ENDPOINT=${result.endpoint}\nREQUIRE_PREPARED_BROWSER=true\n`);
      }
      const { endpoint: _privateEndpoint, ...safeMetadata } = result;
      await fs.writeFile(`${stateFile}.metrics.json`, JSON.stringify(safeMetadata), { mode: 0o600 });
      console.log(JSON.stringify(safeMetadata, null, 2));
    } else throw new Error('Use prepare or stop with a task-owned state path');
  } catch (error) {
    if (command === 'prepare' && error.preparation) {
      await fs.writeFile(`${stateFile}.metrics.json`, JSON.stringify(error.preparation), { mode: 0o600 });
      console.error(`Browser preparation failed in ${error.preparation.phase ?? 'configuration'} after ${Math.round(error.preparation.milliseconds)} ms`);
    } else console.error(error.message);
    process.exitCode = 1;
  }
  finally { process.removeListener('SIGINT', cancel); process.removeListener('SIGTERM', cancel); }
}
