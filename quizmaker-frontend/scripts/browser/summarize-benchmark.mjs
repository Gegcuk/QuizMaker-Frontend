import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function stepDuration(job, name) {
  const step = job.steps.find(step => step.name === name);
  if (step?.conclusion !== 'success') return null;
  const start = Date.parse(step.started_at);
  const end = Date.parse(step.completed_at);
  return Number.isFinite(start) && Number.isFinite(end) && end >= start ? (end - start) / 1000 : null;
}

export function reconcileMeasurements(records, jobs) {
  const rows = [];
  for (const { validation, preparation } of records) {
    const job = jobs.find(job => job.name === validation.job_name && String(job.run_attempt) === validation.attempt);
    if (!job) throw new Error('Missing actual GitHub job start for benchmark evidence');
    const start = Date.parse(job.started_at);
    const end = Date.parse(validation.validation_ended_at);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) throw new Error('Invalid benchmark wall-clock interval');
    const cache = validation.expected_cache;
    let cacheVerified = false;
    if (cache === 'warm') cacheVerified = validation.npm_cache_restored === 'true' && preparation.verifiedImageCacheRestored === true;
    if (cache === 'cold') cacheVerified = preparation.imageReferenceCache === 'absent' && preparation.verifiedImageCacheRestored === false;
    rows.push({ ...validation, preparation, actual_job_started_at: job.started_at,
      complete_validation_seconds: (end - start) / 1000,
      producer_validation_seconds: validation.mode === 'producer-fixture' ? (end - start) / 1000 : null,
      pr_validation_seconds: validation.mode === 'pr' ? (end - start) / 1000 : null,
      browser_preparation_seconds: preparation.milliseconds / 1000, cache_verified: cacheVerified,
      timing_evidence_upload_seconds: stepDuration(job, 'Upload timing evidence only'),
      artifact_upload_seconds: validation.mode === 'producer-fixture'
        ? stepDuration(job, 'Upload validated fixture image only') : null,
      job_conclusion: job.conclusion });
  }
  return rows;
}

export function assessCohorts(rows) {
  const failures = [];
  const cohorts = [];
  const classes = new Set(rows.map(row => `${row.platform}/${row.architecture}/${row.runner_class}/${row.runner_image}/${row.preparation.image}/${row.node}/${row.playwright}/${row.preparation.browser}/${row.lockfile_sha256}`));
  if (classes.size !== 1 || rows.some(row => !row.runner_image || row.runner_class !== 'github-hosted' || !row.preparation.browser || !row.preparation.image || !/^[a-f0-9]{64}$/.test(row.lockfile_sha256 ?? '') || !row.node || !row.playwright)) failures.push('Runner class/image/architecture is missing or not comparable');
  for (const mode of ['pr', 'producer-fixture']) for (const cache of ['cold', 'warm']) {
    const cohort = rows.filter(row => row.mode === mode && row.expected_cache === cache);
    const valid = cohort.filter(row => Number.isFinite(row.preparation.milliseconds) && row.preparation.fixtureRendered === true && row.validation_status === 'passed' && row.job_conclusion === 'success' && row.cache_verified);
    if (mode === 'producer-fixture' && valid.some(row => !Number.isFinite(row.artifact_upload_seconds) || row.artifact_upload_seconds < 0)) {
      failures.push(`${mode}/${cache} needs successful fixture-image upload timing separate from JSON evidence`);
    }
    const samples = new Set(valid.map(row => row.sample));
    if (valid.length !== 3 || samples.size !== 3) failures.push(`${mode}/${cache} needs three verified successful samples`);
    const durations = valid.map(row => row.complete_validation_seconds).sort((a, b) => a - b);
    const median = durations.length === 3 ? durations[1] : null;
    if (mode === 'producer-fixture' && median !== null && median > 480) failures.push(`${mode}/${cache} complete producer median exceeds eight minutes`);
    if (valid.some(row => row.preparation.milliseconds > 120_000)) failures.push(`${mode}/${cache} browser readiness target exceeds two minutes`);
    if (cohort.some(row => row.preparation.milliseconds >= 300_000)) failures.push(`${mode}/${cache} whole preparation deadline exceeded`);
    cohorts.push({ mode, cache, successful_samples: valid.length, median_complete_validation_seconds: median });
  }
  return { cohorts, failures, accepted: failures.length === 0 };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [directory, jobsFile] = process.argv.slice(2);
    const records = [];
    for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const root = path.join(directory, entry.name);
      try {
        records.push({ validation: JSON.parse(await fs.readFile(path.join(root, 'validation.json'), 'utf8')),
          preparation: JSON.parse(await fs.readFile(path.join(root, 'browser-state.json.metrics.json'), 'utf8')) });
      } catch (error) { if (error.code !== 'ENOENT') throw error; }
    }
    const pages = JSON.parse(await fs.readFile(jobsFile, 'utf8'));
    const jobs = (Array.isArray(pages) ? pages : [pages]).flatMap(page => page.jobs);
    const rows = reconcileMeasurements(records, jobs);
    const assessment = assessCohorts(rows);
    const failedJobs = jobs.filter(job => /^(pr|producer) (cold|warm) sample \d$/.test(job.name) && job.conclusion !== 'success');
    if (failedJobs.length) assessment.failures.push(`${failedJobs.length} failed/cancelled measurement jobs remain in the evidence`);
    assessment.accepted = assessment.failures.length === 0;
    const result = { rows, failed_jobs: failedJobs.map(job => ({ name: job.name, attempt: job.run_attempt, conclusion: job.conclusion })), ...assessment };
    const output = JSON.stringify(result, null, 2);
    console.log(output);
    if (process.env.GITHUB_STEP_SUMMARY) await fs.appendFile(process.env.GITHUB_STEP_SUMMARY, `\n\`\`\`json\n${output}\n\`\`\`\n`);
    if (!assessment.accepted) process.exitCode = 1;
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
