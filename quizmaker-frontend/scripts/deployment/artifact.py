#!/usr/bin/env python3
"""Build identity and read-only probes; Python standard library only on the host."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import tarfile
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET


def require(condition, message):
    if not condition:
        raise RuntimeError(message)


def digest(data):
    return hashlib.sha256(data).hexdigest()


def file_digest(path):
    with open(path, 'rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


def write_json(path, value):
    Path(path).write_text(json.dumps(value, sort_keys=True, indent=2) + '\n')


def read_json(path):
    return json.loads(Path(path).read_text())


def helper_digest():
    directory = Path(__file__).resolve().parent
    return digest(b''.join((directory / name).read_bytes() for name in ['artifact.py', 'rollout.py', 'helper.py']))


def validate(manifest):
    require(manifest['format'] == 1, 'Unsupported release format')
    require(manifest['repository'] == 'Gegcuk/QuizMaker-Frontend', 'Wrong repository')
    for key in ['revision', 'tree']:
        require(re.fullmatch(r'[0-9a-f]{40}', manifest[key]), 'Invalid source identity')
    for key in ['run_id', 'run_attempt']:
        require(re.fullmatch(r'[1-9][0-9]*', manifest[key]), 'Invalid producer identity')
    expected_id = f"{manifest['revision']}-{manifest['run_id']}-{manifest['run_attempt']}"
    require(manifest['release_id'] == expected_id, 'Invalid release identity')
    require(manifest['site_url'] == 'https://www.quizzence.com', 'Unexpected production site')
    require(re.fullmatch(r'[0-9a-f]{64}', manifest['content_sha256']), 'Invalid content digest')
    for probe in manifest['probes']:
        require(re.fullmatch(r'/[A-Za-z0-9_./-]*', probe['path']), 'Invalid probe path')
        require('..' not in probe['path'], 'Invalid probe traversal')
    return manifest


def prepare(app, revision, tree, run_id, run_attempt):
    app = Path(app)
    dist = app / 'dist'
    # Called only after the complete production prerender. Never alters application bytes.
    files = {str(p.relative_to(dist)): file_digest(p) for p in sorted(dist.rglob('*')) if p.is_file()}
    require('index.html' in files and '404.html' in files, 'Incomplete production output')
    require('__release.json' not in files, 'Release already prepared; do not rebuild or reseal')
    content_sha = digest(json.dumps(files, sort_keys=True).encode())
    release_id = f'{revision}-{run_id}-{run_attempt}'
    identity = {'release_id': release_id, 'revision': revision, 'content_sha256': content_sha}
    write_json(dist / '__release.json', identity)
    probes = []

    def add(route, filename=None, status=200, **extra):
        probe = {'path': route, 'status': status, **extra}
        if filename:
            probe['sha256'] = file_digest(dist / filename)
        probes.append(probe)

    add('/__release.json', '__release.json', identity=True)
    add('/', 'index.html')
    add('/index.html', 'index.html')
    for sitemap in ['sitemap.xml', 'sitemap_articles.xml']:
        tree_xml = ET.parse(dist / sitemap)
        routes = [urllib.parse.urlparse(node.text).path for node in tree_xml.iter() if node.tag.endswith('}loc')]
        if sitemap == 'sitemap_articles.xml':
            require(routes, 'Production requires at least one prerendered article')
        for route in routes:
            if route == '/':
                continue
            require(route.startswith('/') and '..' not in route, 'Unsafe sitemap route')
            add(route, route.strip('/') + '/index.html')
            if route.endswith('/'):
                add(route[:-1], status=301, location=route)
        add('/' + sitemap, sitemap, backend_owned=True)
    add('/robots.txt', 'robots.txt')
    for name in files:
        if name.startswith('assets/'):
            add('/' + name, name, asset=True)
    for route in ['/login', '/my-quizzes', '/admin', '/documents', '/quizzes/22222222-2222-4222-8222-222222222222/attempt', '/billing/success', '/billing/cancel', '/reset-password', '/verify-email']:
        add(route, 'index.html', noindex=True)
    for route in ['/oauth/callback', '/oauth2/redirect']:
        for suffix in ['', '/']:
            add(route + suffix, 'index.html', noindex=True, callback=True)
    add('/this-route-should-not-exist', '404.html', 404, noindex=True)
    add('/assets/this-asset-does-not-exist.js', status=404)
    manifest = validate({
        'format': 1, 'repository': 'Gegcuk/QuizMaker-Frontend', 'revision': revision,
        'tree': tree, 'run_id': run_id, 'run_attempt': run_attempt,
        'release_id': release_id, 'content_sha256': content_sha,
        'helper_sha256': helper_digest(),
        'site_url': 'https://www.quizzence.com', 'files': files, 'probes': probes,
    })
    write_json(app / 'release-manifest.json', manifest)
    return manifest


def seal(app, bundle, image):
    app, bundle = Path(app), Path(bundle)
    manifest = validate(read_json(app / 'release-manifest.json'))
    for filename, expected in manifest['files'].items():
        require(file_digest(app / 'dist' / filename) == expected, 'Build changed after preparation')
    manifest['image_id'] = image
    require(re.fullmatch(r'sha256:[0-9a-f]{64}', image), 'Invalid image ID')
    manifest['image_ref'] = 'quizzence-release:' + manifest['release_id']
    # Classic Docker identifies an image by its config digest; containerd-backed
    # engines use the manifest/index digest. All accepted identities come from
    # the very same checksum-verified archive, never a registry lookup.
    with tarfile.open(bundle / 'image.tar') as archive:
        entries = json.load(archive.extractfile('manifest.json'))
        tagged = [entry for entry in entries if manifest['image_ref'] in (entry.get('RepoTags') or [])]
        require(len(tagged) == 1, 'Archive must contain exactly one tagged release image')
        config = archive.extractfile(tagged[0]['Config']).read()
        config_sha = 'sha256:' + digest(config)
        image_ids = {config_sha}
        if 'index.json' in archive.getnames():
            index = json.load(archive.extractfile('index.json'))
            image_ids.update(entry['digest'] for entry in index['manifests'])
        require(image in image_ids, 'Producer identity is not bound to the exported archive')
        manifest['image_config_sha256'] = config_sha
        manifest['image_ids'] = sorted(image_ids)
    manifest['image_sha256'] = file_digest(bundle / 'image.tar')
    manifest['producer'] = f"https://github.com/{manifest['repository']}/actions/runs/{manifest['run_id']}/attempts/{manifest['run_attempt']}"
    write_json(bundle / 'provenance.json', manifest)
    return file_digest(bundle / 'provenance.json')


def verify(bundle, expected_digest):
    bundle = Path(bundle)
    require(re.fullmatch(r'[0-9a-f]{64}', expected_digest), 'Invalid expected provenance digest')
    require(file_digest(bundle / 'provenance.json') == expected_digest, 'Provenance digest mismatch')
    manifest = validate(read_json(bundle / 'provenance.json'))
    require(file_digest(bundle / 'image.tar') == manifest['image_sha256'], 'Image archive digest mismatch')
    require(re.fullmatch(r'sha256:[0-9a-f]{64}', manifest['image_id']), 'Invalid image ID')
    return manifest


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args):
        return None


def request(base, route):
    # Do not print backend bodies, callback URLs or provider response content.
    req = urllib.request.Request(base.rstrip('/') + route, headers={
        'Cache-Control': 'no-cache', 'Accept-Encoding': 'identity', 'Host': 'www.quizzence.com',
    })
    try:
        response = urllib.request.build_opener(NoRedirect).open(req, timeout=20)
    except urllib.error.HTTPError as error:
        response = error
    with response:
        return response.status, response.headers, response.read()


def probe(manifest, base, public=False, policies=False):
    for item in manifest['probes']:
        status, headers, body = request(base, item['path'])
        require(status == item['status'], f"Probe status failed: {item['path']}")
        if public and item.get('backend_owned'):
            require(b'<loc>' in body and 'xml' in headers.get('Content-Type', ''), 'Backend sitemap check failed')
            continue
        if 'sha256' in item:
            require(digest(body) == item['sha256'], f"Probe bytes mismatch: {item['path']}")
        if item.get('location'):
            require(headers.get('Location') == manifest['site_url'] + item['location'], 'Canonical redirect mismatch')
        if item.get('noindex'):
            require(headers.get('X-Robots-Tag') == 'noindex, nofollow', 'Missing noindex')
        if item.get('callback'):
            require('no-store' in headers.get('Cache-Control', ''), 'Callback must not be cached')
            require(headers.get('Referrer-Policy') == 'no-referrer', 'Callback referrer policy changed')
        if policies:
            for name, value in [('X-Frame-Options', 'SAMEORIGIN'), ('X-Content-Type-Options', 'nosniff'), ('Strict-Transport-Security', 'max-age=2592000')]:
                require(headers.get(name) == value, f'Missing security header: {name}')
            require(headers.get('Content-Security-Policy-Report-Only'), 'Missing report-only CSP')
            require(not headers.get('Content-Security-Policy'), 'Unexpected CSP enforcement before observation is complete')
            require(headers.get('Permissions-Policy') == 'camera=(), microphone=(), geolocation=()', 'Permissions policy mismatch')
            require(headers.get('Referrer-Policy') == ('no-referrer' if item.get('callback') else 'strict-origin-when-cross-origin'), 'Referrer policy mismatch')
    print(f"Verified release {manifest['release_id']} ({len(manifest['probes'])} probes)", flush=True)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('operation', choices=['prepare', 'seal', 'verify', 'probe'])
    parser.add_argument('--app', default='.')
    parser.add_argument('--bundle', default='release-bundle')
    parser.add_argument('--digest')
    parser.add_argument('--image')
    parser.add_argument('--base')
    parser.add_argument('--public', action='store_true')
    parser.add_argument('--policies', action='store_true')
    args = parser.parse_args()
    if args.operation == 'prepare':
        prepare(args.app, os.environ['GITHUB_SHA'], subprocess.check_output(['git', 'rev-parse', 'HEAD^{tree}'], text=True).strip(), os.environ['GITHUB_RUN_ID'], os.environ['GITHUB_RUN_ATTEMPT'])
    elif args.operation == 'seal':
        print(seal(args.app, args.bundle, args.image))
    else:
        manifest = verify(args.bundle, args.digest)
        if args.operation == 'probe':
            probe(manifest, args.base, args.public, args.policies)


if __name__ == '__main__':
    main()
