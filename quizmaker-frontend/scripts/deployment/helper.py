#!/usr/bin/env python3
"""Installed root-owned entry point. Uploaded bundles never supply executable host code."""
import fcntl
import json
import os
from pathlib import Path
import re
import shutil
import stat
import sys

# The installer owns this directory; -I ignores caller PYTHONPATH/user packages.
sys.path.insert(0, str(Path(__file__).resolve().parent))
from artifact import helper_digest, read_json, require, verify
from rollout import Host, ROOT, command, restore, run_locked, save

INCOMING = Path('/var/www/quizzence/incoming')


def instance(run, attempt):
    require(re.fullmatch(r'[1-9][0-9]{0,19}', run), 'Invalid producer run')
    require(re.fullmatch(r'[1-9][0-9]{0,5}', attempt), 'Invalid producer attempt')
    return run + '-' + attempt


def check_instance(value):
    parts = value.split('-')
    require(len(parts) == 2 and instance(*parts) == value, 'Invalid job identity')
    return value


def copy_input(source, destination, limit):
    # Open every component relative to a directory FD: no symlink traversal or
    # shell expansion, even if the unprivileged uploader changes its directory.
    source = Path(source)
    directory = os.open('/', os.O_RDONLY | os.O_DIRECTORY)
    try:
        for part in source.parts[1:-1]:
            require(part not in ['.', '..'], 'Invalid input path')
            child = os.open(part, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW, dir_fd=directory)
            os.close(directory)
            directory = child
        fd = os.open(source.name, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK, dir_fd=directory)
    finally:
        os.close(directory)
    with os.fdopen(fd, 'rb') as src:
        info = os.fstat(src.fileno())
        require(stat.S_ISREG(info.st_mode) and info.st_size <= limit, 'Input must be a bounded regular file')
        with Path(destination).open('xb') as dst:
            remaining = limit
            while chunk := src.read(min(1024 * 1024, remaining + 1)):
                remaining -= len(chunk)
                require(remaining >= 0, 'Input exceeded size limit while copying')
                dst.write(chunk)
            dst.flush()
            os.fsync(dst.fileno())


def submit(run, attempt, revision, expected_digest, artifact_id, root=ROOT, incoming=INCOMING):
    job_id = instance(run, attempt)
    require(re.fullmatch(r'[0-9a-f]{40}', revision), 'Invalid revision')
    require(re.fullmatch(r'[0-9a-f]{64}', expected_digest), 'Invalid provenance digest')
    require(re.fullmatch(r'[1-9][0-9]{0,19}', artifact_id), 'Invalid transport artifact ID')
    root = Path(root)
    release_id = f'{revision}-{job_id}'
    bundle = root / 'releases' / release_id
    job = root / 'jobs' / (job_id + '.json')
    with (root / 'submit.lock').open('a') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        require(not job.exists() and not bundle.exists(), 'Attempt already submitted; inspect status instead of replacing it')
        bundle.mkdir(mode=0o700)
        try:
            copy_input(Path(incoming) / job_id / 'provenance.json', bundle / 'provenance.json', 4 * 1024 * 1024)
            copy_input(Path(incoming) / job_id / 'image.tar', bundle / 'image.tar', 4 * 1024 * 1024 * 1024)
            manifest = verify(bundle, expected_digest)
            require((manifest['revision'], manifest['run_id'], manifest['run_attempt']) == (revision, run, attempt), 'Producer identity mismatch')
            require(manifest['helper_sha256'] == helper_digest(), 'Installed helper differs from the tested source')
        except BaseException:
            shutil.rmtree(bundle)
            raise
        # Durable provenance and transport identity survive release-image retention.
        save(root / 'provenance' / (release_id + '.json'), {
            'manifest': manifest, 'manifest_digest': expected_digest, 'artifact_id': artifact_id,
        })
        save(job, {'status': 'queued', 'release_id': release_id, 'manifest_digest': expected_digest,
                   'artifact_id': artifact_id, 'producer_run': run, 'producer_attempt': attempt})
        try:
            command('systemctl', 'start', '--no-block', f'quizzence-release@{job_id}.service')
        except BaseException:
            value = read_json(job)
            save(job, {**value, 'status': 'failed', 'reason': 'service-start-failed'})
            raise
    return {'job': job_id, 'status': 'queued'}


def recover(root=ROOT):
    root = Path(root)
    with (root / 'lock').open('a') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        path = root / 'state.json'
        if path.exists():
            state = read_json(path)
            if state.get('pending'):
                interrupted_id = state['pending']['candidate']['id']
                restore(Host(root), state)
                for job_path in (root / 'jobs').glob('*.json'):
                    job = read_json(job_path)
                    if job['release_id'] == interrupted_id and job['status'] != 'succeeded':
                        save(job_path, {**job, 'status': 'failed', 'reason': 'interrupted-and-restored'})


def run_job(job_id, root=ROOT):
    root = Path(root)
    job_path = root / 'jobs' / (check_instance(job_id) + '.json')
    job = read_json(job_path)
    require(job['status'] == 'queued', 'Job is not queued')
    save(job_path, {**job, 'status': 'running'})
    try:
        manifest = run_locked(Host(root), root / 'releases' / job['release_id'], job['manifest_digest'])
        require(manifest['release_id'] == job['release_id'], 'Consumer identity mismatch')
    except BaseException:
        state = read_json(root / 'state.json') if (root / 'state.json').exists() else {}
        save(job_path, {**job, 'status': 'recovery-required' if state.get('pending') else 'failed'})
        raise
    save(job_path, {**job, 'status': 'succeeded', 'consumer_completed': True,
                    'image_sha256': manifest['image_sha256'], 'revision': manifest['revision']})


def finish_job(job_id, root=ROOT):
    # ExecStopPost runs after normal exit, timeout, SIGKILL, or failed service
    # startup. Boot recovery handles a machine restart while a journal exists.
    root = Path(root)
    path = root / 'jobs' / (check_instance(job_id) + '.json')
    recover(root)
    if path.exists():
        job = read_json(path)
        if job['status'] in ['queued', 'running', 'recovery-required']:
            save(path, {**job, 'status': 'failed', 'reason': 'interrupted-or-recovered'})


def main():
    require(os.geteuid() == 0, 'Installed helper requires root')
    os.umask(0o077)
    args = sys.argv[1:]
    if len(args) == 6 and args[0] == 'submit':
        print(json.dumps(submit(*args[1:]), sort_keys=True))
    elif len(args) == 3 and args[0] == 'status':
        print(json.dumps(read_json(ROOT / 'jobs' / (instance(*args[1:]) + '.json')), sort_keys=True))
    elif len(args) == 2 and args[0] == 'run':
        run_job(args[1])
    elif len(args) == 2 and args[0] == 'finish':
        finish_job(args[1])
    elif args == ['recover']:
        recover()
    else:
        raise RuntimeError('Unsupported helper operation')


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        # Never include command output, HTTP bodies, or arbitrary input in logs.
        print(f'Release helper failed ({type(error).__name__}); inspect job status and recovery journal', file=sys.stderr)
        sys.exit(1)
