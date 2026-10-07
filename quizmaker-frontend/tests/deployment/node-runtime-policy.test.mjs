import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { test } from 'node:test';

const repositoryRoot = new URL('../../../', import.meta.url);
const read = relative => fs.readFile(new URL(relative, repositoryRoot), 'utf8');
const [pin, packageText, lockText, npmrc] = await Promise.all([
  read('.nvmrc'),
  read('quizmaker-frontend/package.json'),
  read('quizmaker-frontend/package-lock.json'),
  read('quizmaker-frontend/.npmrc'),
]);
const metadata = JSON.parse(packageText);
const lock = JSON.parse(lockText);

function assertWorkflowRuntime(content) {
  const setups = [...content.matchAll(/uses: actions\/setup-node@[^\n]+\n([\s\S]*?)(?=\n\s*- name:|$)/g)];
  assert.equal(setups.length, 1, 'Every Node workflow must have one explicit runtime setup');
  assert.match(setups[0][1], /\bnode-version-file: \.nvmrc\s*\n/);
  assert.doesNotMatch(content, /\bnode-version:/);
  const install = content.search(/run: npm ci\s*(?:\n|$)/);
  assert.ok(install > setups[0].index, 'Locked install must follow runtime setup');
  assert.match(setups[0][1], /cache-dependency-path: quizmaker-frontend\/package-lock\.json/);
  assert.doesNotMatch(content, /engine-strict[=: ]+false|npm ci[^\n]*--force/);
}

test('development selects a reviewed Node 24 patch and enforces supported engines', () => {
  assert.match(pin.trim(), /^24\.\d+\.\d+$/);
  assert.equal(process.versions.node, pin.trim(), 'Run required checks on the pinned Node runtime');
  assert.equal(metadata.engines.node, `>=${pin.trim()} <25`);
  assert.equal(metadata.engines.npm, '>=11.19.0 <12');
  assert.equal(metadata.packageManager, 'npm@11.19.0');
  assert.match(npmrc, /^engine-strict=true$/m);
  assert.deepEqual(lock.packages[''].engines, metadata.engines);
});

for (const workflow of ['frontend-pr.yml', 'deploy.yml', 'dependency-maintenance.yml']) {
  test(`${workflow} selects the developer runtime pin before locked installation`, async () => {
    const content = await read(`.github/workflows/${workflow}`);
    assertWorkflowRuntime(content);
  });
}

test('workflow policy rejects missing setup, divergent versions, late setup and install bypasses', async () => {
  const content = await read('.github/workflows/frontend-pr.yml');
  const setup = content.match(/      - name: Setup Node\.js\n[\s\S]*?(?=      - name: Install dependencies)/)?.[0];
  assert.ok(setup, 'Expected an executable setup step in the PR workflow');
  for (const broken of [
    content.replace(setup, ''),
    content.replace('node-version-file: .nvmrc', "node-version: '20'"),
    content.replace('node-version-file: .nvmrc', 'node-version-file: missing-runtime'),
    content.replace(setup, '').replace('run: npm ci\n', `run: npm ci\n\n${setup}`),
    content.replace('run: npm ci', 'run: npm ci --force'),
    content.replace('run: npm ci', 'run: npm ci --engine-strict=false'),
  ]) assert.throws(() => assertWorkflowRuntime(broken));
});

test('Node types describe the supported major and match the locked dependency', () => {
  assert.match(metadata.devDependencies['@types/node'], /^\^24\./);
  assert.equal(lock.packages[''].devDependencies['@types/node'], metadata.devDependencies['@types/node']);
  assert.match(lock.packages['node_modules/@types/node'].version, /^24\./);
});

test('the runtime policy is required by the deployment gate and production remains Nginx', async () => {
  assert.match(metadata.scripts['test:deployment-policy'], /node --test[^&]*tests\/deployment\/node-runtime-policy\.test\.mjs/);
  const dockerfile = await read('quizmaker-frontend/Dockerfile');
  assert.match(dockerfile, /^FROM nginx:/m);
  assert.doesNotMatch(dockerfile, /^FROM node:|RUN npm |COPY.*node_modules/m);
});


test('every benchmark job selects the same runtime without production dependencies', async () => {
  const content = await read('.github/workflows/frontend-benchmark.yml');
  const jobs = content.split(/^  (?:prime|validate|summarize):/m).slice(1);
  assert.equal(jobs.length, 3);
  for (const job of jobs) {
    assert.equal((job.match(/uses: actions\/setup-node@/g) ?? []).length, 1);
    assert.match(job, /node-version-file: \.nvmrc/);
    assert.doesNotMatch(job, /node-version:|engine-strict[=: ]+false|--force/);
  }
});
