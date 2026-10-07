import assert from 'node:assert/strict';
import { test } from 'node:test';
import { reconcileMeasurements, assessCohorts } from '../../scripts/browser/summarize-benchmark.mjs';
const record = { validation: { mode: 'producer-fixture', job_name: 'producer warm sample 1', attempt: '1', expected_cache: 'warm', npm_cache_restored: 'true', validation_ended_at: '2026-10-07T12:08:00Z' }, preparation: { verifiedImageCacheRestored: true } };
const job = { name: record.validation.job_name, run_attempt: 1, started_at: '2026-10-07T12:00:00Z', conclusion: 'success', steps: [{ name: 'Upload validated fixture image only', conclusion: 'success', started_at: '2026-10-07T12:08:01Z', completed_at: '2026-10-07T12:08:21Z' },
  { name: 'Upload timing evidence only', conclusion: 'success', started_at: '2026-10-07T12:08:22Z', completed_at: '2026-10-07T12:08:30Z' }] };
test('complete timing includes setup/install and measures upload separately', () => {
  const [row] = reconcileMeasurements([record], [job]);
  assert.equal(row.complete_validation_seconds, 480);
  assert.equal(row.producer_validation_seconds, 480);
  assert.equal(row.artifact_upload_seconds, 20);
  assert.equal(row.timing_evidence_upload_seconds, 8);
  assert.equal(row.cache_verified, true);
  assert.throws(() => reconcileMeasurements([record], []), /actual GitHub job start/);
});
test('warm cache misses and reused cold images are not successful cache experiments', () => {
  assert.equal(reconcileMeasurements([{ ...record, preparation: { verifiedImageCacheRestored: false } }], [job])[0].cache_verified, false);
  assert.equal(reconcileMeasurements([{ ...record, validation: { ...record.validation, expected_cache: 'cold' }, preparation: { imageReferenceCache: 'present', verifiedImageCacheRestored: false } }], [job])[0].cache_verified, false);
});
function evidence() {
  return ['pr', 'producer-fixture'].flatMap(mode => ['cold', 'warm'].flatMap(expected_cache => [1, 2, 3].map(sample => ({
    mode, expected_cache, sample, platform: 'linux', architecture: 'x64', runner_class: 'github-hosted', runner_image: '20261007', node: '24.21.0', playwright: '1.61.1', lockfile_sha256: 'a'.repeat(64),
    artifact_upload_seconds: mode === 'producer-fixture' ? 20 : null, timing_evidence_upload_seconds: 8,
    validation_status: 'passed', job_conclusion: 'success', cache_verified: true, complete_validation_seconds: [460, 470, 479][sample - 1],
    preparation: { image: 'immutable-image', browser: 'reviewed-chromium', fixtureRendered: true, milliseconds: 119000 },
  }))));
}
test('twelve comparable successful samples meet the stated targets', () => assert.equal(assessCohorts(evidence()).accepted, true));
test('failures, mixed runners, duplicate samples and slow preparation cannot be hidden by medians', () => {
  for (const mutate of [rows => rows.pop(), rows => { rows[0].sample = 2; }, rows => { rows[0].job_conclusion = 'failure'; },
    rows => { rows[0].runner_image = 'other'; }, rows => { rows[0].cache_verified = false; },
    rows => { rows[0].preparation.milliseconds = 300001; }, rows => { rows[0].preparation.fixtureRendered = false; },
    rows => { rows[6].artifact_upload_seconds = null; }, rows => { rows[6].artifact_upload_seconds = -1; },
    rows => { rows[6].complete_validation_seconds = 600; rows[7].complete_validation_seconds = 601; }]) {
    const rows = evidence(); mutate(rows); assert.equal(assessCohorts(rows).accepted, false);
  }
});

test('JSON upload cannot supply missing, skipped, failed or invalid fixture image timings', () => {
  for (const steps of [job.steps.slice(1),
    [{ ...job.steps[0], conclusion: 'skipped' }, job.steps[1]],
    [{ ...job.steps[0], conclusion: 'failure' }, job.steps[1]],
    [{ ...job.steps[0], completed_at: 'invalid' }, job.steps[1]],
    [{ ...job.steps[0], completed_at: '2026-10-07T12:08:00Z' }, job.steps[1]],
  ]) {
    const [row] = reconcileMeasurements([record], [{ ...job, steps }]);
    assert.equal(row.artifact_upload_seconds, null);
    assert.equal(row.timing_evidence_upload_seconds, 8);
  }
  const [pr] = reconcileMeasurements([{ ...record, validation: { ...record.validation, mode: 'pr' } }], [job]);
  assert.equal(pr.artifact_upload_seconds, null);
  assert.equal(pr.pr_validation_seconds, 480);
});

test('successful uploads within one timestamp second remain measured as zero, not missing', () => {
  const [row] = reconcileMeasurements([record], [{ ...job, steps: [
    { ...job.steps[0], completed_at: job.steps[0].started_at }, job.steps[1],
  ] }]);
  assert.equal(row.artifact_upload_seconds, 0);
  const rows = evidence(); rows[6].artifact_upload_seconds = 0;
  assert.equal(assessCohorts(rows).accepted, true);
});
