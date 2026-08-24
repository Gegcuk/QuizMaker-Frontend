import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderPublicRouteNginx } from './public-route-nginx.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const outputPath = path.join(rootDir, 'dist', 'nginx', 'public-routes.conf');

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, renderPublicRouteNginx(), 'utf8');
console.log(`Generated public route delivery rules -> ${path.relative(rootDir, outputPath)}`);
