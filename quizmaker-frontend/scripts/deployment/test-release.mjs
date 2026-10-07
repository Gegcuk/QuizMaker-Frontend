import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export async function verifyReleaseImage({ run = promisify(execFile), manifest, expectedDigest = process.env.RELEASE_MANIFEST_DIGEST, signal, request = fetch } = {}) {
  manifest ??= JSON.parse(await fs.readFile('release-bundle/provenance.json', 'utf8'));
  const owner = randomUUID();
  const container = `quizzence-release-test-${owner}`;
  let created = false;
  const invoke = (command, args, options = {}) => {
    signal?.throwIfAborted();
    return run(command, args, { ...options, signal });
  };
  if (!expectedDigest) throw new Error('RELEASE_MANIFEST_DIGEST is required');
  const pythonArgs = ['scripts/deployment/artifact.py', 'verify', '--digest', expectedDigest];
  await invoke('python3', pythonArgs);
  try {
    // Load exactly the exported transport image. Never build a replacement here.
    await invoke('docker', ['load', '--input', 'release-bundle/image.tar'], { maxBuffer: 4 * 1024 * 1024 });
    created = true;
    await invoke('docker', ['run', '--detach', '--name', container, '--label', `com.quizzence.release-test-owner=${owner}`, '--publish', '127.0.0.1::80', manifest.image_id]);
    const { stdout } = await invoke('docker', ['port', container, '80/tcp']);
    const base = `http://${stdout.trim()}`;
    let ready = false;
    for (let attempt = 0; attempt < 30; attempt++) {
      signal?.throwIfAborted();
      const requestSignal = signal ? AbortSignal.any([signal, AbortSignal.timeout(2000)]) : AbortSignal.timeout(2000);
      const result = await request(`${base}/__release.json`, { signal: requestSignal }).catch(() => null);
      signal?.throwIfAborted();
      if (result?.ok) { ready = true; break; }
      await new Promise(resolve => setTimeout(resolve, 250));
    }
    if (!ready) throw new Error('Release image failed to start');
    const env = { ...process.env, RELEASE_BASE_URL: base, RELEASE_CONTAINER: container, REQUIRE_ARTICLE_ROUTES: 'true' };
    for (const script of ['test:nginx', 'test:smoke', 'test:e2e', 'test:privacy:production']) {
      try {
        const result = await invoke('npm', ['run', script], { env, timeout: 240_000, maxBuffer: 8 * 1024 * 1024 });
        process.stdout.write(result.stdout);
        process.stderr.write(result.stderr);
      } catch (error) {
        process.stdout.write(error.stdout ?? '');
        process.stderr.write(error.stderr ?? '');
        throw new Error(`${script} failed against the exported release image`, { cause: error });
      }
    }
    for (const mode of [[], ['--public']]) {
      const result = await invoke('python3', ['scripts/deployment/artifact.py', 'probe', '--digest', expectedDigest, '--base', base, '--policies', ...mode]);
      process.stdout.write(result.stdout);
    }
    // Detect accidental mutation by any validation step before upload.
    await invoke('python3', pythonArgs);
  } finally {
    if (created) {
      const cleanupSignal = AbortSignal.timeout(10_000);
      const options = { signal: cleanupSignal, killSignal: 'SIGKILL', maxBuffer: 4 * 1024 * 1024 };
      let inspected;
      try { inspected = await run('docker', ['container', 'inspect', container], options); }
      catch (error) {
        if (error.code !== 1 || !/No such (?:object|container)/i.test(error.stderr ?? '')) throw new Error('Release test container cleanup failed');
      }
      if (inspected) {
        const labels = JSON.parse(inspected.stdout)[0].Config.Labels;
        if (labels?.['com.quizzence.release-test-owner'] !== owner) throw new Error('Release test container ownership mismatch');
        await run('docker', ['rm', '--force', container], options);
      }
    }
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const controller = new AbortController();
  const cancel = () => controller.abort(new Error('Release image validation cancelled'));
  process.once('SIGINT', cancel);
  process.once('SIGTERM', cancel);
  try { await verifyReleaseImage({ signal: controller.signal }); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
  finally { process.removeListener('SIGINT', cancel); process.removeListener('SIGTERM', cancel); }
}
