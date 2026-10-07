import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';

async function toFile(command, args, target, signal, owned) {
  const file = await fs.open(target, 'wx', 0o600);
  owned.add(target);
  try {
    await new Promise((resolve, reject) => {
      const child = spawn(command, args, { signal, killSignal: 'SIGKILL', stdio: ['ignore', file.fd, 'ignore'] });
      const sizeLimit = setInterval(async () => {
        try {
          if ((await file.stat()).size > 3_000_000_000) child.kill('SIGKILL');
        } catch { child.kill('SIGKILL'); }
      }, 1000);
      const finish = error => { clearInterval(sizeLimit); if (error) reject(error); else resolve(); };
      child.once('error', () => finish(new Error('Prepared image cache acquisition could not start')));
      child.once('close', code => finish(code === 0 ? null : new Error('Prepared image cache acquisition failed')));
    });
  } finally { await file.close(); }
}

export function validateCacheSource(source) {
  if (!/^\d+$/.test(source.artifactId ?? '') || !/^[a-f0-9]{64}$/.test(source.sha256 ?? '')
    || !/^[\w][\w.-]*\/[\w][\w.-]*$/.test(source.repository ?? '')) {
    throw new Error('Warm browser cache requires a captured artifact ID and trusted archive SHA256');
  }
}

export async function restorePreparedImageCache(source, { stateFile, signal, load }) {
  validateCacheSource(source);
  if (!process.env.GH_TOKEN) throw new Error('Warm cache download requires a read-only benchmark token');
  const zip = `${stateFile}.cache.zip`;
  const image = `${stateFile}.cache.tar`;
  const owned = new Set();
  // The archive and trusted digest come from separate outputs of the cache
  // producer. Only the immutable tooling image is cached, never test state.
  try {
    await toFile('gh', ['api', `repos/${source.repository}/actions/artifacts/${source.artifactId}/zip`], zip, signal, owned);
    const extract = `import sys,zipfile,shutil
with zipfile.ZipFile(sys.argv[1]) as z:
 names=z.namelist()
 assert names==['prepared-image.tar'], 'Unexpected cache members'
 assert z.getinfo(names[0]).file_size < 3000000000, 'Oversized prepared image'
 with z.open(names[0]) as source: shutil.copyfileobj(source,sys.stdout.buffer,1024*1024)
`;
    await toFile('python3', ['-c', extract, zip], image, signal, owned);
    const hash = createHash('sha256');
    for await (const chunk of createReadStream(image, { signal })) hash.update(chunk);
    if (hash.digest('hex') !== source.sha256) throw new Error('Prepared image cache archive digest mismatch');
    await load(image, signal);
  } finally {
    await Promise.all([...owned].map(file => fs.unlink(file).catch(error => { if (error.code !== 'ENOENT') throw error; })));
  }
}
