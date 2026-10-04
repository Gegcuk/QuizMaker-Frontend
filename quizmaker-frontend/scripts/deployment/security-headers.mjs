import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = fileURLToPath(new URL('../../', import.meta.url));

export const createSecurityHeaders = async (dist, apiBase = '/api') => {
  const api = new URL(apiBase, 'https://www.quizzence.com');
  if (!/^https:\/\/[a-z0-9.-]+(?::[0-9]+)?$/i.test(api.origin) || api.username || api.password || api.search || api.hash) {
    throw new Error('CSP requires an HTTPS API URL without credentials, query, or fragment');
  }
  const hashes = new Set();
  const scan = async directory => {
    for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
      const filename = path.join(directory, entry.name);
      if (entry.isDirectory()) await scan(filename);
      else if (entry.name.endsWith('.html')) {
        const html = await fs.readFile(filename, 'utf8');
        for (const [, attributes, body] of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)) {
          if (/\bsrc\s*=/i.test(attributes) || /\btype=["']application\/(?:ld\+)?json["']/i.test(attributes)) continue;
          hashes.add(`'sha256-${createHash('sha256').update(body).digest('base64')}'`);
        }
      }
    }
  };
  await scan(dist);
  const policy = [
    "default-src 'self'",
    `script-src 'self' https://www.googletagmanager.com https://cdnjs.cloudflare.com ${[...hashes].sort().join(' ')}`,
    `connect-src 'self' ${api.origin} https://cdnjs.cloudflare.com https://*.google-analytics.com https://*.analytics.google.com`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' https: data: blob:",
    "font-src 'self' data:",
    "worker-src 'self' blob: https://cdnjs.cloudflare.com",
    "frame-src 'none'", "object-src 'none'", "base-uri 'none'",
    "form-action 'self'", "frame-ancestors 'self'",
  ].join('; ');
  if (policy.length > 6000) throw new Error('CSP exceeds the reviewed header size; inspect unexpected inline scripts');
  // No report-uri/report-to/report-sample: callback URLs and script samples must
  // not be transmitted to a collector. Enforcement is a separate reviewed change.
  const headers = [
    'add_header X-Frame-Options "SAMEORIGIN" always;',
    'add_header X-Content-Type-Options "nosniff" always;',
    'add_header X-XSS-Protection "1; mode=block" always;',
    'add_header Strict-Transport-Security "max-age=2592000" always;',
    `add_header Content-Security-Policy-Report-Only "${policy}" always;`,
    'add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;',
  ].join('\n') + '\n';
  await fs.mkdir(path.join(dist, 'nginx'), { recursive: true });
  await fs.writeFile(path.join(dist, 'nginx/security-headers.conf'), headers);
  return policy;
};

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await createSecurityHeaders(path.join(app, 'dist'), process.env.VITE_API_BASE_URL);
}
