import fs from 'node:fs';
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import packageMetadata from 'playwright/package.json' with { type: 'json' };

const expectedNode = fs.readFileSync('/probe/node-version', 'utf8').trim();
const lock = JSON.parse(fs.readFileSync('/probe/package-lock.json', 'utf8'));
if (process.versions.node !== expectedNode) throw new Error('Prepared browser Node version differs from the project pin');
if (packageMetadata.version !== lock.packages['node_modules/playwright'].version) throw new Error('Prepared browser library differs from the lockfile');
if (!fs.existsSync(chromium.executablePath())) throw new Error('Prepared image does not contain the required Chromium revision');

// The supported CLI server creates a fresh browser per client and enables the
// connect() loopback relay. launchServer() prelaunches a browser without it.
console.log(JSON.stringify({ node: process.versions.node,
  playwright: packageMetadata.version, executable: chromium.executablePath() }));
const server = spawn(process.execPath, ['/probe/node_modules/playwright/cli.js', 'run-server',
  '--host', '0.0.0.0', '--port', '43210', '--path', `/${randomUUID()}`], { stdio: 'inherit' });
const close = () => { server.kill('SIGTERM'); setTimeout(() => server.kill('SIGKILL'), 3000).unref(); };
process.once('SIGTERM', close);
process.once('SIGINT', close);
// A lost runner/cleanup must not leave a browser service running indefinitely.
setTimeout(close, 25 * 60_000).unref();
server.once('error', () => { console.error('Prepared browser CLI could not start'); process.exit(1); });
server.once('exit', code => process.exit(code ?? 1));
