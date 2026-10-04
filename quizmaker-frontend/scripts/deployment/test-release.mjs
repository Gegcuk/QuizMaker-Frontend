import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs/promises';

const run = promisify(execFile);
const manifest = JSON.parse(await fs.readFile('release-bundle/provenance.json', 'utf8'));
const expectedDigest = process.env.RELEASE_MANIFEST_DIGEST;
if (!expectedDigest) throw new Error('RELEASE_MANIFEST_DIGEST is required');
const container = `quizzence-release-test-${process.pid}`;
const pythonArgs = ['scripts/deployment/artifact.py', 'verify', '--digest', expectedDigest];
await run('python3', pythonArgs);
try {
  // Load exactly the exported transport image. Never build a replacement here.
  await run('docker', ['load', '--input', 'release-bundle/image.tar'], { maxBuffer: 4 * 1024 * 1024 });
  await run('docker', ['run', '--detach', '--name', container, '--publish', '127.0.0.1::80', manifest.image_id]);
  const { stdout } = await run('docker', ['port', container, '80/tcp']);
  const base = `http://${stdout.trim()}`;
  let ready = false;
  for (let attempt = 0; attempt < 30; attempt++) {
    const result = await fetch(`${base}/__release.json`).catch(() => null);
    if (result?.ok) { ready = true; break; }
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  if (!ready) throw new Error('Release image failed to start');
  const env = { ...process.env, RELEASE_BASE_URL: base, RELEASE_CONTAINER: container, REQUIRE_ARTICLE_ROUTES: 'true' };
  for (const script of ['test:nginx', 'test:smoke', 'test:e2e', 'test:privacy:production']) {
    try {
      const result = await run('npm', ['run', script], { env, timeout: 240_000, maxBuffer: 8 * 1024 * 1024 });
      process.stdout.write(result.stdout);
      process.stderr.write(result.stderr);
    } catch (error) {
      process.stdout.write(error.stdout ?? '');
      process.stderr.write(error.stderr ?? '');
      throw new Error(`${script} failed against the exported release image`, { cause: error });
    }
  }
  const result = await run('python3', ['scripts/deployment/artifact.py', 'probe', '--digest', expectedDigest, '--base', base, '--policies']);
  process.stdout.write(result.stdout);
  // Detect accidental mutation by any validation step before upload.
  await run('python3', pythonArgs);
} finally {
  await run('docker', ['rm', '--force', container]).catch(() => undefined);
}
