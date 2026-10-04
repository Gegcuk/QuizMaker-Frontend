import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'scripts/deployment'))
import artifact
import helper
from test_release import bundle_at


class HelperTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name).resolve()
        self.incoming = self.root / 'incoming'
        self.incoming.mkdir()
        for name in ['releases', 'jobs', 'provenance']:
            (self.root / name).mkdir()
        bundle, _ = bundle_at(self.root)
        bundle.rename(self.incoming / '1-1')
        self.bundle = self.incoming / '1-1'
        self.update_manifest(helper_sha256=artifact.helper_digest())

    def update_manifest(self, **values):
        path = self.bundle / 'provenance.json'
        artifact.write_json(path, {**artifact.read_json(path), **values})
        self.digest = artifact.file_digest(path)

    def submit(self):
        return helper.submit('1', '1', 'a' * 40, self.digest, '123', root=self.root, incoming=self.incoming)

    def test_verified_input_is_copied_before_detached_service_start_and_cannot_be_replaced(self):
        with patch.object(helper, 'command') as command:
            result = self.submit()
            command.assert_called_once_with('systemctl', 'start', '--no-block', 'quizzence-release@1-1.service')
            self.assertEqual(result['status'], 'queued')
            with self.assertRaisesRegex(RuntimeError, 'already submitted'):
                self.submit()
        job = artifact.read_json(self.root / 'jobs/1-1.json')
        self.assertEqual(job['artifact_id'], '123')
        copied = self.root / 'releases' / job['release_id'] / 'image.tar'
        before = copied.read_bytes()
        (self.bundle / 'image.tar').write_bytes(b'uploader changes its file')
        self.assertEqual(copied.read_bytes(), before)
        self.assertTrue((self.root / 'provenance' / (job['release_id'] + '.json')).exists())

    def test_corruption_and_helper_version_mismatch_never_start_service(self):
        with patch.object(helper, 'command') as command:
            self.update_manifest(helper_sha256='0' * 64)
            with self.assertRaisesRegex(RuntimeError, 'Installed helper differs'):
                self.submit()
            self.update_manifest(helper_sha256=artifact.helper_digest())
            (self.bundle / 'image.tar').write_bytes(b'corrupt transport')
            with self.assertRaisesRegex(RuntimeError, 'archive digest mismatch'):
                self.submit()
            command.assert_not_called()
        self.assertEqual(list((self.root / 'releases').iterdir()), [])

    def test_symlinked_files_and_parent_directories_are_rejected(self):
        original = self.bundle / 'image.tar'
        target = self.root / 'different-file'
        original.rename(target)
        original.symlink_to(target)
        with patch.object(helper, 'command') as command:
            with self.assertRaises(OSError):
                self.submit()
            command.assert_not_called()
        original.unlink()
        target.rename(original)
        relocated = self.root / 'relocated'
        self.bundle.rename(relocated)
        self.bundle.symlink_to(relocated, target_is_directory=True)
        with self.assertRaises(OSError):
            self.submit()

    def test_invalid_arguments_cannot_select_commands_or_paths(self):
        for value in ['../1', '1;touch', '1\n', '-1', '0', '1/2']:
            with self.assertRaises(RuntimeError):
                helper.instance(value, '1')
        with self.assertRaises(RuntimeError):
            helper.check_instance('1-1-extra')

    def test_receipt_requires_successful_rollout_and_keeps_the_consumed_identity(self):
        with patch.object(helper, 'command'):
            self.submit()
        manifest = artifact.read_json(self.bundle / 'provenance.json')
        with patch.object(helper, 'run_locked', return_value=manifest):
            helper.run_job('1-1', self.root)
        receipt = artifact.read_json(self.root / 'jobs/1-1.json')
        self.assertEqual(receipt['status'], 'succeeded')
        self.assertTrue(receipt['consumer_completed'])
        self.assertEqual(receipt['manifest_digest'], self.digest)
        self.assertEqual(receipt['artifact_id'], '123')

    def test_interrupted_job_is_failed_after_journal_recovery(self):
        with patch.object(helper, 'command'):
            self.submit()
        path = self.root / 'jobs/1-1.json'
        artifact.write_json(path, {**artifact.read_json(path), 'status': 'running'})
        with patch.object(helper, 'recover') as recover:
            helper.finish_job('1-1', self.root)
            recover.assert_called_once_with(self.root)
        receipt = artifact.read_json(path)
        self.assertEqual(receipt['status'], 'failed')
        self.assertNotIn('consumer_completed', receipt)

    def test_boot_recovery_restores_pending_release_before_closing_job(self):
        with patch.object(helper, 'command'):
            self.submit()
        path = self.root / 'jobs/1-1.json'
        job = artifact.read_json(path)
        state_path = self.root / 'state.json'
        artifact.write_json(state_path, {'pending': {'candidate': {'id': job['release_id']}}})
        def restored(host, state):
            self.assertEqual(artifact.read_json(path)['status'], 'queued')
            state.pop('pending')
            artifact.write_json(state_path, state)
        with patch.object(helper, 'restore', side_effect=restored) as restore:
            helper.recover(self.root)
            restore.assert_called_once()
        self.assertEqual(artifact.read_json(path)['status'], 'failed')
        self.assertNotIn('pending', artifact.read_json(state_path))

    def test_failed_restoration_remains_visible_and_never_claims_success(self):
        with patch.object(helper, 'command'):
            self.submit()
        artifact.write_json(self.root / 'state.json', {'pending': {'candidate': {'id': 'fixture'}}})
        with patch.object(helper, 'run_locked', side_effect=RuntimeError('recovery blocked')):
            with self.assertRaises(RuntimeError):
                helper.run_job('1-1', self.root)
        receipt = artifact.read_json(self.root / 'jobs/1-1.json')
        self.assertEqual(receipt['status'], 'recovery-required')
        self.assertNotIn('consumer_completed', receipt)


if __name__ == '__main__':
    unittest.main()
