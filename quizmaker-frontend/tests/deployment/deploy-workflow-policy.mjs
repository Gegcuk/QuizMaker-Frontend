import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repositoryRoot = path.resolve(__dirname, '..', '..', '..');

const main = async () => {
  const [workflow, dockerignore] = await Promise.all([
    fs.readFile(path.join(repositoryRoot, '.github', 'workflows', 'deploy.yml'), 'utf8'),
    fs.readFile(path.join(repositoryRoot, 'quizmaker-frontend', '.dockerignore'), 'utf8'),
  ]);

  assert.match(dockerignore, /^\*$/m, 'Expected the Docker context to default-deny files');
  for (const allowedPath of ['!Dockerfile', '!nginx.conf', '!dist/', '!dist/**']) {
    assert.match(dockerignore, new RegExp(`^${allowedPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'm'));
  }

  assert.match(workflow, /cp quizmaker-frontend\/\.dockerignore deployment\//);
  assert.match(workflow, /for attempt in 1 2 3;/);
  assert.match(workflow, /compose up -d --no-build/);

  const buildIndex = workflow.indexOf('compose build --no-cache');
  const stopIndex = workflow.indexOf('compose down');
  assert.ok(buildIndex >= 0, 'Expected deployment to build the replacement image');
  assert.ok(stopIndex >= 0, 'Expected deployment to stop the previous container after a successful build');
  assert.ok(buildIndex < stopIndex, 'Expected the replacement image to build before the previous container stops');

  console.log('Deployment workflow policy passed.');
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
