// Keep the browser in an isolated internal network. Only its Playwright protocol
// travels over task-owned Docker exec streams to a runner-loopback listener.
import fs from 'node:fs/promises';
import net from 'node:net';
import { spawn } from 'node:child_process';
import { once } from 'node:events';

const stateFile = process.argv[2];
const state = JSON.parse(await fs.readFile(stateFile, 'utf8'));
if (!/^quizzence-browser-[a-f0-9-]{36}$/.test(state.name)) throw new Error('Invalid browser proxy owner');
const controlPath = `${stateFile}.sock`;
const connections = new Set();
const children = new Set();
let closing = false;
const remotePipe = `
  const socket = require('node:net').connect(43210, '127.0.0.1');
  socket.on('error', () => process.exit(1));
  process.stdin.pipe(socket); socket.pipe(process.stdout);
  process.stdin.on('end', () => socket.end());
  socket.on('close', () => process.exit(0));
`;

const server = net.createServer(socket => {
  connections.add(socket);
  const child = spawn('docker', ['exec', '-i', state.name, '/runtime/bin/node', '-e', remotePipe],
    { stdio: ['pipe', 'pipe', 'ignore'] });
  children.add(child);
  socket.pipe(child.stdin);
  child.stdout.pipe(socket);
  child.stdin.on('error', () => socket.destroy());
  child.once('error', () => socket.destroy());
  child.once('close', () => { children.delete(child); socket.destroy(); });
  socket.once('error', () => child.kill('SIGKILL'));
  socket.once('close', () => { connections.delete(socket); child.kill('SIGKILL'); });
});
const control = net.createServer(socket => {
  socket.once('data', async data => {
    if (data.toString() !== 'stop\n') { socket.destroy(); return; }
    socket.end('stopped\n');
    await close();
  });
  socket.on('error', () => socket.destroy());
});

async function close() {
  if (closing) return;
  closing = true;
  for (const socket of connections) socket.destroy();
  for (const child of children) child.kill('SIGKILL');
  await Promise.all([new Promise(resolve => server.close(resolve)), new Promise(resolve => control.close(resolve))]);
  await fs.unlink(controlPath).catch(error => { if (error.code !== 'ENOENT') throw error; });
  process.exit(0);
}

process.once('SIGTERM', close);
process.once('SIGINT', close);
setTimeout(close, 25 * 60_000).unref();
server.listen(0, '127.0.0.1');
await once(server, 'listening');
control.listen(controlPath);
await once(control, 'listening');
await fs.chmod(controlPath, 0o600);
const updated = { ...state, proxyPort: server.address().port, controlPath };
const temporary = `${stateFile}.proxy`;
await fs.writeFile(temporary, JSON.stringify(updated), { mode: 0o600, flag: 'wx' });
await fs.rename(temporary, stateFile);
