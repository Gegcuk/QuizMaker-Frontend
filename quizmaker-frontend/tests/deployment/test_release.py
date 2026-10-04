import fcntl
import hashlib
import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'scripts' / 'deployment'))
import artifact
import rollout

# Synthetic topology: no live host configuration or credentials are stored here.
PROXY = b'''server {
    listen 443 ssl;
    ssl_certificate /fixture/cert.pem;
    location /api/ { proxy_pass http://127.0.0.1:8080/api/; }
    location = /sitemap.xml { proxy_pass http://127.0.0.1:8080/sitemap.xml; }
    location = /robots.txt { proxy_pass http://127.0.0.1:3000/robots.txt; }
    location / { proxy_pass http://127.0.0.1:3000; }
}
'''


def bundle_at(root, suffix='1'):
    bundle = root / 'bundle'
    bundle.mkdir(exist_ok=True)
    (bundle / 'image.tar').write_bytes(b'fixture image bytes')
    manifest = {'format': 1, 'repository': 'Gegcuk/QuizMaker-Frontend',
                'revision': 'a' * 40, 'tree': 'b' * 40, 'run_id': suffix, 'run_attempt': '1',
                'release_id': 'a' * 40 + '-' + suffix + '-1', 'site_url': 'https://www.quizzence.com',
                'content_sha256': 'c' * 64, 'image_id': 'sha256:' + 'd' * 64,
                'image_sha256': artifact.file_digest(bundle / 'image.tar'), 'probes': []}
    artifact.write_json(bundle / 'provenance.json', manifest)
    return bundle, artifact.file_digest(bundle / 'provenance.json')


class FakeHost:
    def __init__(self, root, fail=None):
        self.root = root
        self.proxy = root / 'proxy.conf'
        self.proxy.write_bytes(PROXY)
        self.fail = fail
        self.events = []
        self.running = {'old'}
        self.old = {'id': 'old', 'container': 'old', 'port': 3000, 'image': 'old-image'}

    def event(self, name):
        self.events.append(name)
        if self.fail == name:
            self.fail = None
            raise RuntimeError('Injected ' + name)

    def baseline(self):
        return self.old

    def load(self, _bundle, manifest):
        self.event('load')
        return manifest['image_id']

    def start(self, release):
        self.running.add(release['id'])
        self.event('start-old' if release['id'] == 'old' else 'start-candidate')

    def check(self, release, public=False):
        kind = 'old' if release['id'] == 'old' else 'candidate'
        self.event(('public-' if public else 'probe-') + kind)
        if kind == 'candidate' and not public:
            assert 'old' in self.running, 'Old release must remain live during candidate validation'
            assert self.proxy.read_bytes() == PROXY, 'Candidate must not receive traffic before probes pass'

    def reload(self):
        self.event('reload-old' if self.proxy.read_bytes() == PROXY else 'reload-candidate')

    def stop(self, release):
        self.running.discard(release['id'])
        self.event('stop-old' if release['id'] == 'old' else 'stop-candidate')

    def remove(self, release):
        state = artifact.read_json(self.root / 'state.json')
        assert release['id'] not in [state['active']['id'], state['previous']['id']]
        assert release['id'] not in self.running
        self.event('remove-' + release['id'])


class ReleaseTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.proxy_hash = patch.object(rollout, 'INSPECTED_PROXY_SHA', hashlib.sha256(PROXY).hexdigest())
        self.proxy_hash.start()
        self.addCleanup(self.proxy_hash.stop)
        self.bundle, self.digest = bundle_at(self.root)

    def test_archive_mismatch_prevents_all_host_actions(self):
        host = FakeHost(self.root)
        (self.bundle / 'image.tar').write_bytes(b'wrong bytes')
        with self.assertRaisesRegex(RuntimeError, 'archive digest mismatch'):
            rollout.rollout(host, self.bundle, self.digest)
        self.assertEqual(host.events, [])
        self.assertEqual(host.running, {'old'})
        self.assertEqual(host.proxy.read_bytes(), PROXY)

    def test_provenance_mismatch_prevents_all_host_actions(self):
        host = FakeHost(self.root)
        with self.assertRaisesRegex(RuntimeError, 'Provenance digest mismatch'):
            rollout.rollout(host, self.bundle, '0' * 64)
        self.assertEqual(host.events, [])

    def test_success_stops_old_only_after_public_verification_and_retains_it(self):
        host = FakeHost(self.root)
        state = {'active': host.old, 'previous': {'id': 'older', 'port': 3102}}
        rollout.save(self.root / 'state.json', state)
        result = rollout.rollout(host, self.bundle, self.digest)
        self.assertEqual(host.running, {result['release_id']})
        self.assertLess(host.events.index('public-candidate'), host.events.index('stop-old'))
        self.assertEqual(host.events[-2:], ['public-candidate', 'remove-older'])
        saved = artifact.read_json(self.root / 'state.json')
        self.assertEqual(saved['previous']['id'], 'old')
        self.assertEqual(saved['active']['id'], result['release_id'])

    def test_start_probe_switch_and_post_switch_failure_restore_old(self):
        for failure in ['load', 'start-candidate', 'probe-candidate', 'reload-candidate', 'public-candidate', 'stop-old']:
            with self.subTest(failure=failure):
                (self.root / 'state.json').unlink(missing_ok=True)
                host = FakeHost(self.root, fail=failure)
                with self.assertRaisesRegex(RuntimeError, 'Injected'):
                    rollout.rollout(host, self.bundle, self.digest)
                self.assertEqual(host.proxy.read_bytes(), PROXY)
                self.assertEqual(host.running, {'old'})
                self.assertFalse(any(e.startswith('remove-') for e in host.events))
                if failure != 'load':
                    self.assertIn('public-old', host.events)
                    self.assertNotIn('pending', artifact.read_json(self.root / 'state.json'))

    def test_probe_failure_never_switches_or_stops_old(self):
        host = FakeHost(self.root, fail='probe-candidate')
        with self.assertRaises(RuntimeError):
            rollout.rollout(host, self.bundle, self.digest)
        self.assertNotIn('reload-candidate', host.events)
        self.assertNotIn('stop-old', host.events)

    def test_proxy_transform_changes_only_two_frontend_targets(self):
        changed = rollout.proxy_for(PROXY, 3000, 3101)
        self.assertEqual(changed, PROXY.replace(b':3000', b':3101'))
        self.assertEqual(rollout.proxy_for(changed, 3101, 3102), PROXY.replace(b':3000', b':3102'))
        for bad in [PROXY + b'# drift', PROXY.replace(b':3000/robots', b':8080/robots')]:
            with self.assertRaises(RuntimeError):
                rollout.proxy_for(bad, 3000, 3101)

    def test_failed_restore_keeps_journal_and_both_containers(self):
        host = FakeHost(self.root, fail='public-candidate')
        original_reload = host.reload
        def fail_restore():
            if host.proxy.read_bytes() == PROXY:
                raise RuntimeError('Restore reload failed')
            original_reload()
        host.reload = fail_restore
        with self.assertRaisesRegex(RuntimeError, 'Restore reload failed'):
            rollout.rollout(host, self.bundle, self.digest)
        self.assertEqual(len(host.running), 2)
        self.assertIn('pending', artifact.read_json(self.root / 'state.json'))
        self.assertNotIn('stop-candidate', host.events)
        # A later invocation restores the journal first; never starts a second rollout.
        host.reload = original_reload
        with self.assertRaisesRegex(RuntimeError, 'Recovered interrupted'):
            rollout.rollout(host, self.bundle, self.digest)
        self.assertEqual(host.running, {'old'})
        self.assertNotIn('pending', artifact.read_json(self.root / 'state.json'))

    def test_retention_failure_does_not_destroy_verified_active_or_rollback(self):
        host = FakeHost(self.root, fail='remove-older')
        rollout.save(self.root / 'state.json', {'active': host.old, 'previous': {'id': 'older', 'port': 3102}})
        result = rollout.rollout(host, self.bundle, self.digest)
        self.assertEqual(host.running, {result['release_id']})
        self.assertEqual(artifact.read_json(self.root / 'state.json')['previous']['id'], 'old')
        self.assertEqual(artifact.read_json(self.root / 'state.json')['retired'][0]['id'], 'older')

    def test_failure_after_old_stops_restarts_it_before_restoring_traffic(self):
        host = FakeHost(self.root)
        original_check = host.check
        public_checks = 0
        def check(release, public=False):
            nonlocal public_checks
            if release['id'] != 'old' and public:
                public_checks += 1
                if public_checks == 2:
                    raise RuntimeError('Final public check failed')
            return original_check(release, public)
        host.check = check
        with self.assertRaisesRegex(RuntimeError, 'Final public check failed'):
            rollout.rollout(host, self.bundle, self.digest)
        self.assertEqual(host.running, {'old'})
        self.assertLess(host.events.index('start-old'), host.events.index('reload-old'))
        self.assertEqual(host.proxy.read_bytes(), PROXY)

    def test_concurrent_rollout_cannot_touch_host(self):
        host = FakeHost(self.root)
        with (self.root / 'lock').open('a') as lock:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
            with self.assertRaises(BlockingIOError):
                rollout.run_locked(host, self.bundle, self.digest)
        self.assertEqual(host.events, [])
        self.assertEqual(host.running, {'old'})

    def test_stale_producer_cannot_replace_newer_release(self):
        host = FakeHost(self.root)
        host.old['manifest'] = {'run_id': '2', 'run_attempt': '1'}
        rollout.save(self.root / 'state.json', {'active': host.old, 'previous': None})
        with self.assertRaisesRegex(RuntimeError, 'stale producer'):
            rollout.rollout(host, self.bundle, self.digest)
        self.assertEqual(host.events, [])

    def test_external_proxy_edit_is_preserved_when_restoration_is_unsafe(self):
        host = FakeHost(self.root)
        original_check = host.check
        external = PROXY + b'# independent operator change\n'
        def check(release, public=False):
            if release['id'] != 'old' and public:
                host.proxy.write_bytes(external)
                raise RuntimeError('Public probe failed during unrelated proxy edit')
            return original_check(release, public)
        host.check = check
        with self.assertRaisesRegex(RuntimeError, 'refusing to overwrite'):
            rollout.rollout(host, self.bundle, self.digest)
        self.assertEqual(host.proxy.read_bytes(), external)
        self.assertEqual(len(host.running), 2)
        self.assertIn('pending', artifact.read_json(self.root / 'state.json'))

    def test_partial_retention_can_resume_without_deleting_unrelated_resources(self):
        manifest = artifact.read_json(self.bundle / 'provenance.json')
        release = {'id': manifest['release_id'], 'container': 'quizzence-release-' + manifest['release_id'], 'image': manifest['image_id']}
        directory = self.root / 'releases' / release['id']
        directory.mkdir(parents=True)
        host = rollout.Host(self.root)
        labels = {'com.quizzence.managed': 'issue-201', 'com.quizzence.release': release['id']}
        remaining = True
        def command(*args):
            nonlocal remaining
            if args[1:3] == ('container', 'ls'):
                return 'unrelated-container'  # Ours was already removed.
            if args[1:3] == ('image', 'ls'):
                return release['image'] if remaining else ''
            if args[1:3] == ('image', 'inspect'):
                return json.dumps([{'Config': {'Labels': labels}}])
            if args[1:3] == ('image', 'rm'):
                self.assertEqual(args[3], release['image'])
                remaining = False
                return ''
            self.fail('Unexpected Docker mutation')
        with patch.object(rollout, 'command', side_effect=command):
            host.remove(release)
            host.remove(release)
            self.assertFalse(directory.exists())
            remaining = True
            labels['com.quizzence.managed'] = 'someone-else'
            with self.assertRaisesRegex(RuntimeError, 'unrelated image'):
                host.remove(release)

    def test_candidate_health_failure_and_image_mismatch_fail_before_probes(self):
        release = {'id': 'candidate', 'container': 'candidate', 'port': 3101, 'image': 'expected'}
        host = rollout.Host(self.root)
        for state in [
            {'State': {'Running': False}, 'Image': 'expected'},
            {'State': {'Running': True, 'Health': {'Status': 'unhealthy'}}, 'Image': 'expected'},
            {'State': {'Running': True, 'Health': {'Status': 'healthy'}}, 'Image': 'wrong'},
            {'State': {'Running': True, 'Health': {'Status': 'starting'}}, 'Image': 'expected'},
        ]:
            with self.subTest(state=state), patch.object(rollout, 'command'), patch.object(host, 'inspect', return_value=state), patch.object(rollout.time, 'sleep'):
                with self.assertRaises(RuntimeError):
                    host.start(release)


if __name__ == '__main__':
    unittest.main()
