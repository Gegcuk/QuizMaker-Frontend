import http.server
import io
import json
from pathlib import Path
import sys
import tarfile
import tempfile
import threading
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'scripts' / 'deployment'))
import artifact


class ArtifactTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.app = Path(self.temp.name)
        self.dist = self.app / 'dist'
        (self.dist / 'blog' / 'fixture').mkdir(parents=True)
        (self.dist / 'assets').mkdir()
        for filename, content in [('index.html', '<h1>Working release</h1>'), ('404.html', '<h1>Not found</h1>'),
                                  ('blog/fixture/index.html', '<h1>Article</h1>'), ('assets/app.js', '/* fixture */'),
                                  ('robots.txt', 'User-agent: *')]:
            (self.dist / filename).write_text(content)
        for filename, route in [('sitemap.xml', '/'), ('sitemap_articles.xml', '/blog/fixture/')]:
            (self.dist / filename).write_text(f'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://www.quizzence.com{route}</loc></url></urlset>')

    def prepare(self):
        return artifact.prepare(self.app, 'a' * 40, 'b' * 40, '1', '2')

    def archive(self, manifest, tag=None):
        bundle = self.app / 'bundle'
        bundle.mkdir()
        config = b'{"architecture":"amd64","rootfs":{"diff_ids":["fixture"]}}'
        config_sha = artifact.digest(config)
        entries = [{'Config': config_sha + '.json', 'RepoTags': [tag or 'quizzence-release:' + manifest['release_id']]}]
        with tarfile.open(bundle / 'image.tar', 'w') as archive:
            for name, data in [('manifest.json', json.dumps(entries).encode()), (config_sha + '.json', config)]:
                info = tarfile.TarInfo(name)
                info.size = len(data)
                archive.addfile(info, io.BytesIO(data))
        return bundle, 'sha256:' + config_sha

    def test_prepare_preserves_application_bytes_and_includes_every_required_probe_family(self):
        before = {path.relative_to(self.dist): path.read_bytes() for path in self.dist.rglob('*') if path.is_file()}
        manifest = self.prepare()
        for name, value in before.items():
            self.assertEqual((self.dist / name).read_bytes(), value)
        probes = {entry['path']: entry for entry in manifest['probes']}
        for route in ['/', '/assets/app.js', '/blog/fixture/', '/login', '/my-quizzes', '/oauth2/redirect', '/oauth/callback', '/this-route-should-not-exist', '/assets/this-asset-does-not-exist.js']:
            self.assertIn(route, probes)
        self.assertTrue(probes['/my-quizzes']['noindex'])
        self.assertTrue(probes['/oauth2/redirect']['callback'])
        self.assertEqual(probes['/this-route-should-not-exist']['status'], 404)
        identity = artifact.read_json(self.dist / '__release.json')
        self.assertEqual(set(identity), {'release_id', 'revision', 'content_sha256'})
        with self.assertRaisesRegex(RuntimeError, 'already prepared'):
            self.prepare()

    def test_empty_article_sitemap_cannot_be_packaged(self):
        (self.dist / 'sitemap_articles.xml').write_text('<urlset/>')
        with self.assertRaisesRegex(RuntimeError, 'at least one'):
            self.prepare()

    def test_seal_binds_source_producer_archive_and_portable_image_identity(self):
        manifest = self.prepare()
        bundle, image_id = self.archive(manifest)
        expected = artifact.seal(self.app, bundle, image_id)
        verified = artifact.verify(bundle, expected)
        self.assertEqual(verified['image_ids'], [image_id])
        self.assertEqual(verified['tree'], 'b' * 40)
        self.assertEqual(verified['producer'], 'https://github.com/Gegcuk/QuizMaker-Frontend/actions/runs/1/attempts/2')
        self.assertEqual(verified['image_sha256'], artifact.file_digest(bundle / 'image.tar'))

    def test_wrong_archive_tag_or_changed_dist_is_rejected(self):
        manifest = self.prepare()
        bundle, image_id = self.archive(manifest, tag='unrelated:latest')
        with self.assertRaisesRegex(RuntimeError, 'one tagged release'):
            artifact.seal(self.app, bundle, image_id)
        (self.dist / 'assets/app.js').write_text('changed after preparation')
        with self.assertRaisesRegex(RuntimeError, 'Build changed'):
            artifact.seal(self.app, bundle, image_id)

    def test_http_probe_rejects_wrong_bytes_even_when_status_is_healthy(self):
        body = b'correct bytes'
        class Handler(http.server.BaseHTTPRequestHandler):
            def do_GET(self):
                self.send_response(200)
                self.end_headers()
                self.wfile.write(body)
            def log_message(self, *_args):
                pass
        # HTTPServer otherwise performs a reverse-DNS lookup during binding;
        # this local fixture must not depend on the machine's DNS configuration.
        with patch('socket.getfqdn', return_value='localhost'):
            server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), Handler)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        self.addCleanup(server.server_close)
        self.addCleanup(server.shutdown)
        base = f'http://127.0.0.1:{server.server_port}'
        manifest = {'release_id': 'fixture', 'probes': [{'path': '/', 'status': 200, 'sha256': artifact.digest(body)}]}
        artifact.probe(manifest, base)
        body = b'wrong release still returning 200'
        with self.assertRaisesRegex(RuntimeError, 'bytes mismatch'):
            artifact.probe(manifest, base)


if __name__ == '__main__':
    unittest.main()
