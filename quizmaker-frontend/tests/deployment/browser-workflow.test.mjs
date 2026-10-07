import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { test } from 'node:test';
import { checkValidationWorkflow, checkValidationPlan, checkBenchmarkWorkflow } from './browser-policy.mjs';
const read = file => fs.readFile(new URL(file, import.meta.url), 'utf8');
const pr = await read('../../../.github/workflows/frontend-pr.yml');
const deployment = await read('../../../.github/workflows/deploy.yml');
const benchmark = await read('../../../.github/workflows/frontend-benchmark.yml');
const plans = JSON.parse(await read('../../scripts/deployment/validation-plan.json'));

test('PR and producer require the prepared browser, every gate, and validation before upload', () => {
  checkValidationWorkflow(pr, 'pr'); checkValidationWorkflow(deployment, 'producer'); checkValidationPlan(plans);
});
test('missing, renamed, no-op and reordered mandatory gates fail the policy', () => {
  for (const mode of ['pr', 'producer']) for (let i = 0; i < plans[mode].length; i++) {
    for (const mutate of [plan => plan.splice(i, 1), plan => { plan[i][0] = 'renamed'; },
      plan => { plan[i] = [plan[i][0], 'true']; }, plan => { plan.push(plan.splice(i, 1)[0]); plan.reverse(); }]) {
      const broken = structuredClone(plans); mutate(broken[mode]);
      assert.throws(() => checkValidationPlan(broken));
    }
  }
});
test('workflow bypasses, missing preparation and premature artifact upload are rejected', () => {
  for (const [source, mode] of [[pr, 'pr'], [deployment, 'producer']]) {
    for (const broken of [source.replace('environment.mjs prepare', 'environment.mjs no-op'),
      source.replace(`validate-frontend.mjs ${mode}`, 'validate-frontend.mjs skip'),
      source.replace(`run: node scripts/deployment/validate-frontend.mjs ${mode}`, `if: always()\n        run: node scripts/deployment/validate-frontend.mjs ${mode}`),
      source.replace('timeout-minutes: 25', 'timeout-minutes: 60'),
      source.replace('timeout-minutes: 6', 'timeout-minutes: 10'),
      source.replace('id: browser', 'continue-on-error: true\n        id: browser')]) {
      assert.throws(() => checkValidationWorkflow(broken, mode));
    }
  }
  const upload = deployment.match(/      - name: Upload the validated[\s\S]*?(?=\n  deploy:)/)[0];
  const premature = deployment.replace(upload, '').replace('      - name: Prepare immutable', `${upload}\n      - name: Prepare immutable`);
  assert.throws(() => checkValidationWorkflow(premature, 'producer'));
});
test('benchmark cannot activate production or upload application/private state', () => {
  checkBenchmarkWorkflow(benchmark);
  for (const addition of ['\n  deploy: {}', '\n  push: {}', '\n  schedule: []', '\n  workflow_run: {}', '\n  repository_dispatch: {}', '\n  actions: write',
    '\n  environment: production', '\n  run: ssh host', '\n  env: ${{ secrets.SECRET }}',
    '\n  run: python3 scripts/deployment/rollout.py']) assert.throws(() => checkBenchmarkWorkflow(benchmark + addition));
  for (const replacement of ['${{ runner.temp }}/*', 'quizmaker-frontend/release-bundle/', '${{ runner.temp }}/browser-state.json']) {
    assert.throws(() => checkBenchmarkWorkflow(benchmark.replace('${{ runner.temp }}/prepared-image.tar', replacement)));
  }
});
