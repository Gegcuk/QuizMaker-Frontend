import assert from 'node:assert/strict';

// This policy deliberately recognises only the reviewed workflows' small,
// regular step format; unfamiliar structural changes must be reviewed.
export function checkValidationWorkflow(source, mode) {
  const producer = mode === 'producer' ? source.split('\n  deploy:')[0] : source;
  assert.match(producer, /timeout-minutes: 25\b/);
  assert.doesNotMatch(producer, /playwright install|continue-on-error|\|\| true/);
  const steps = producer.split(/^      - /m).slice(1);
  const prepare = steps.findIndex(step => step.includes('run: node scripts/browser/environment.mjs prepare "$RUNNER_TEMP/browser-state.json"'));
  const validate = steps.findIndex(step => step.includes(`run: node scripts/deployment/validate-frontend.mjs ${mode}\n`));
  assert.ok(prepare >= 0 && validate > prepare, 'Preparation and shared gates must exist in order');
  assert.match(steps[prepare], /id: browser\n/);
  assert.match(steps[prepare], /timeout-minutes: 6\n/);
  assert.doesNotMatch(steps[prepare], /\bif:/);
  assert.doesNotMatch(steps[validate], /\bif:|continue-on-error/);
  assert.match(steps[validate], /PLAYWRIGHT_BROWSERS_PATH: \$\{\{ runner.temp \}\}\/host-browser-cache-empty/);
  assert.equal(steps.filter(step => step.includes('validate-frontend.mjs')).length, 1);
  const cleanup = steps.findIndex(step => step.includes('run: node scripts/browser/environment.mjs stop'));
  assert.ok(cleanup > validate, 'Cleanup must run after validation');
  assert.match(steps[cleanup], /always\(\)/);
  if (mode === 'producer') {
    const upload = steps.findIndex(step => step.includes('uses: actions/upload-artifact@'));
    assert.ok(upload > cleanup, 'Only passed, cleaned-up validation may publish the sealed artifact');
    assert.doesNotMatch(steps[upload], /\bif:|continue-on-error/);
    assert.match(steps[validate], /id: build\n/);
  } else assert.doesNotMatch(source, /secrets\.|ssh-action|rsync|environment: production|(?:contents|actions|id-token): write/);
}

export function checkValidationPlan(plans) {
  const required = {
    pr: [
      ['audit', 'npm', 'run', 'audit:production'], ['lint', 'npm', 'run', 'lint'], ['unit', 'npm', 'test'],
      ['seo', 'npm', 'run', 'test:seo'], ['smoke', 'npm', 'run', 'test:smoke'], ['e2e', 'npm', 'run', 'test:e2e'],
      ['build', 'npm', 'run', 'build:prerender:static'], ['privacy', 'npm', 'run', 'test:privacy:production'],
      ['deployment-policy', 'npm', 'run', 'test:deployment-policy'], ['nginx', 'npm', 'run', 'test:nginx'],
    ],
    producer: [
      ['audit', 'npm', 'run', 'audit:production'], ['lint', 'npm', 'run', 'lint', '--', '--quiet'], ['unit', 'npm', 'test'],
      ['seo', 'npm', 'run', 'test:seo'], ['deployment-policy', 'npm', 'run', 'test:deployment-policy'],
      ['build', 'bash', 'scripts/deployment/build-release.sh'], ['release', 'npm', 'run', 'test:release'],
    ],
  };
  // These are the acceptance contract, independent of the runner's data.
  assert.deepEqual(plans, required, 'All existing executable gates must stay present and ordered');
}

export function checkBenchmarkWorkflow(source) {
  assert.match(source, /on:\n  workflow_dispatch:\n/);
  assert.doesNotMatch(source, /workflow_run:|workflow_call:|repository_dispatch:|pull_request_target:|pull_request:|push:|schedule:|secrets\.|environment: production|ssh|rsync|rollout\.py|deploy:|(?:actions|contents|id-token): write/);
  assert.match(source, /path: \[pr, producer\]/);
  assert.match(source, /cache: \[cold, warm\]/);
  assert.match(source, /sample: \[1, 2, 3\]/);
  assert.match(source, /fail-fast: false/);
  assert.match(source, /npm ci --offline/);
  assert.match(source, /test "\$BENCHMARK_NPM_CACHE_RESTORED" = true/);
  assert.match(source, /producer-fixture/);
  assert.match(source, /filter=all/);
  assert.doesNotMatch(source, /provenance\.json|continue-on-error|\|\| true/);
  const steps = source.split(/^      - /m).slice(1);
  const validate = steps.findIndex(step => step.startsWith('name: Run the shared validation path against fixtures\n'));
  const upload = steps.findIndex(step => step.startsWith('name: Upload validated fixture image only\n'));
  const evidence = steps.findIndex(step => step.startsWith('name: Upload timing evidence only\n'));
  assert.ok(validate >= 0 && upload > validate && evidence > upload, 'Fixture image upload must follow passed validation and precede evidence');
  assert.match(steps[validate], /PLAYWRIGHT_BROWSERS_PATH: \$\{\{ runner.temp \}\}\/host-browser-cache-empty/);
  assert.match(steps[upload], /\n        if: matrix.path == 'producer'\n/);
  assert.match(steps[upload], /\n          name: benchmark-fixture-image-/);
  assert.match(steps[upload], /\n          compression-level: 0\n/);
  assert.match(steps[upload], /\n          retention-days: 1\n/);
  assert.match(steps[upload], /\n          if-no-files-found: error\n/);
  for (const step of source.split(/^      - /m).filter(step => step.includes('uses: actions/upload-artifact@'))) {
    const paths = step.match(/\n          path: ([\s\S]*?)(?=\n          [a-z-]+:|$)/)?.[1];
    assert.ok(paths, 'Each benchmark upload must declare safe explicit files');
    assert.doesNotMatch(paths, /\*|provenance|browser-state\.json(?:\s|$)/);
    if (step.startsWith('name: Upload validated fixture image only\n')) {
      assert.equal(paths.trim(), 'quizmaker-frontend/release-bundle/image.tar');
      continue;
    }
    assert.ok(paths.trim() === '${{ runner.temp }}/prepared-image.tar' || paths.trim() === '|\n            ${{ runner.temp }}/validation.json\n            ${{ runner.temp }}/browser-state.json.metrics.json');
  }
}
