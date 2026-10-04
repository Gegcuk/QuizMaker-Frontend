#!/usr/bin/env python3
"""Transactional frontend rollout. Never run this module against production in tests."""
import fcntl
import json
import os
from pathlib import Path
import re
import shutil
import signal
import subprocess
import time

from artifact import digest, probe, read_json, request, require, verify

ROOT = Path('/var/lib/quizzence-releases')
PROXY = Path('/etc/nginx/sites-available/quizzence.com')
# Read-only inspection on 2026-10-04. Normalize only the two frontend ports.
INSPECTED_PROXY_SHA = 'b62a7f9f5edd40071094a9acb1ab414c9a43844ca73db659b30c66ea4417e5ed'
TARGET = re.compile(rb'proxy_pass http://127\.0\.0\.1:(3000|310[123])(/robots\.txt)?;')


def atomic(path, data):
    path = Path(path)
    temporary = path.with_suffix(path.suffix + '.next')
    with temporary.open('wb') as output:
        output.write(data)
        output.flush()
        os.fsync(output.fileno())
    os.replace(temporary, path)
    descriptor = os.open(path.parent, os.O_RDONLY)
    try:
        os.fsync(descriptor)
    finally:
        os.close(descriptor)


def save(path, value):
    atomic(path, (json.dumps(value, sort_keys=True, indent=2) + '\n').encode())


def proxy_for(config, old_port, new_port):
    matches = list(TARGET.finditer(config))
    require(len(matches) == 2, 'Expected exactly two inspected frontend proxy targets')
    require({match[2] for match in matches} == {None, b'/robots.txt'}, 'Frontend targets changed')
    require(all(int(match[1]) == old_port for match in matches), 'Frontend target disagrees with release state')
    normalized = TARGET.sub(lambda match: b'proxy_pass http://127.0.0.1:3000' + (match[2] or b'') + b';', config)
    require(digest(normalized) == INSPECTED_PROXY_SHA, 'Host proxy drift: inspect and approve updated configuration before rollout')
    return TARGET.sub(lambda match: f'proxy_pass http://127.0.0.1:{new_port}'.encode() + (match[2] or b'') + b';', config)


def command(*args, timeout=120):
    result = subprocess.run(args, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=timeout, check=False)
    require(result.returncode == 0, f'Command failed: {args[0]} {args[1]} (exit {result.returncode})')
    return result.stdout.decode().strip()


class Host:
    def __init__(self, root=ROOT, proxy=PROXY):
        self.root, self.proxy = Path(root), Path(proxy)

    def inspect(self, container):
        return json.loads(command('docker', 'inspect', container))[0]

    def baseline(self):
        name = 'quizzence-quizzence-frontend-1'
        info = self.inspect(name)
        require(info['State']['Running'], 'Existing frontend must be running')
        require(info['NetworkSettings']['Ports']['80/tcp'] == [{'HostIp': '127.0.0.1', 'HostPort': '3000'}], 'Unexpected legacy binding')
        routes = ['/', '/login', '/my-quizzes', '/oauth2/redirect', '/oauth/callback', '/robots.txt', '/this-route-should-not-exist']
        _, _, sitemap = request('http://127.0.0.1:3000', '/sitemap_articles.xml')
        from urllib.parse import urlparse
        import xml.etree.ElementTree as ET
        routes.extend(urlparse(node.text).path for node in ET.fromstring(sitemap).iter() if node.tag.endswith('}loc'))
        _, _, html = request('http://127.0.0.1:3000', '/')
        routes.extend(match.decode() for match in re.findall(rb'(?:src|href)="(/assets/[^" ]+)"', html))
        probes = []
        for route in dict.fromkeys(routes):
            status, headers, body = request('http://127.0.0.1:3000', route)
            expected = 404 if route == '/this-route-should-not-exist' else 200
            require(status == expected, 'Existing release failed baseline health')
            probes.append({'path': route, 'status': status, 'sha256': digest(body),
                           'noindex': route in ['/login', '/my-quizzes', '/oauth2/redirect', '/oauth/callback'],
                           'callback': route in ['/oauth2/redirect', '/oauth/callback']})
        manifest = {'release_id': 'legacy-' + info['Image'].split(':')[1][:12], 'site_url': 'https://www.quizzence.com', 'probes': probes}
        release = {'id': manifest['release_id'], 'container': name, 'port': 3000, 'image': info['Image'], 'legacy': True, 'manifest': manifest}
        self.check(release, public=False)
        return release

    def load(self, bundle, manifest):
        command('docker', 'load', '--input', str(Path(bundle) / 'image.tar'), timeout=300)
        info = json.loads(command('docker', 'image', 'inspect', manifest['image_ref']))[0]
        require(info['Id'] in manifest['image_ids'], 'Loaded image identity mismatch')
        require(info['Config']['Labels']['org.opencontainers.image.revision'] == manifest['revision'], 'Image revision mismatch')
        require(info['Config']['Labels']['com.quizzence.release'] == manifest['release_id'], 'Image release mismatch')
        require(info['Config']['Labels']['com.quizzence.managed'] == 'issue-201', 'Image ownership mismatch')
        return info['Id']

    def start(self, release):
        if release.get('existing') or release.get('legacy'):
            command('docker', 'start', release['container'])
        else:
            command('docker', 'run', '--detach', '--name', release['container'],
                    '--label', 'com.quizzence.managed=issue-201', '--label', f"com.quizzence.release={release['id']}",
                    '--restart', 'unless-stopped', '--publish', f"127.0.0.1:{release['port']}:80", release['image'])
        for _ in range(30):
            info = self.inspect(release['container'])
            health = info['State'].get('Health', {}).get('Status')
            require(info['State']['Running'] and health != 'unhealthy', 'Candidate stopped or unhealthy')
            require(info['Image'] == release['image'], 'Container image mismatch')
            if health == 'healthy':
                return
            time.sleep(2)
        raise RuntimeError('Candidate health deadline exceeded')

    def check(self, release, public=False):
        base = release['manifest']['site_url'] if public else f"http://127.0.0.1:{release['port']}"
        probe(release['manifest'], base, public=public, policies=not release.get('legacy', False))

    def reload(self):
        command('nginx', '-t')
        command('systemctl', 'reload', 'nginx')

    def stop(self, release):
        command('docker', 'stop', '--time', '30', release['container'])

    def remove(self, release):
        if release.get('legacy'):
            return  # Legacy resources were never created/labelled by this mechanism.
        require(re.fullmatch(r'[0-9a-f]{40}-[1-9][0-9]*-[1-9][0-9]*', release['id']), 'Invalid cleanup identity')
        require(release['container'] == 'quizzence-release-' + release['id'], 'Invalid cleanup container')
        # Resume safely when an earlier cleanup removed the container but failed
        # while removing the image. A Docker daemon error must not mean "absent".
        containers = command('docker', 'container', 'ls', '--all', '--format', '{{.Names}}').splitlines()
        if release['container'] in containers:
            info = self.inspect(release['container'])
            require(info['Config']['Labels'].get('com.quizzence.managed') == 'issue-201', 'Refusing unrelated container cleanup')
            require(info['Config']['Labels'].get('com.quizzence.release') == release['id'], 'Cleanup release mismatch')
            require(info['Image'] == release['image'], 'Cleanup image mismatch')
            require(not info['State']['Running'], 'Refusing running release cleanup')
            command('docker', 'rm', release['container'])
        images = command('docker', 'image', 'ls', '--all', '--quiet', '--no-trunc').splitlines()
        if release['image'] in images:
            info = json.loads(command('docker', 'image', 'inspect', release['image']))[0]
            require(info['Config']['Labels'].get('com.quizzence.managed') == 'issue-201', 'Refusing unrelated image cleanup')
            require(info['Config']['Labels'].get('com.quizzence.release') == release['id'], 'Cleanup image release mismatch')
            command('docker', 'image', 'rm', release['image'])
        directory = self.root / 'releases' / release['id']
        if directory.exists():
            shutil.rmtree(directory)


def restore(host, state):
    pending = state['pending']
    old, candidate = state['active'], pending['candidate']
    # Keep both containers available until the old routing and public bytes are verified.
    host.start({**old, 'existing': True})
    if pending['switch_started']:
        current = host.proxy.read_bytes()
        original = bytes.fromhex(pending['proxy_before'])
        proposed = bytes.fromhex(pending['proxy_after'])
        require(current in [original, proposed], 'Proxy changed during rollout; refusing to overwrite external changes')
        atomic(host.proxy, original)
        host.reload()
    host.check(old)
    host.check(old, public=True)
    # A failed docker run may not have created a container. Cleanup is best effort;
    # routing restoration is the mandatory guarantee, never container deletion.
    try:
        host.stop(candidate)
    except Exception:
        pass
    state.pop('pending')
    save(host.root / 'state.json', state)


def rollout(host, bundle, expected_digest):
    manifest = verify(bundle, expected_digest)  # No activation on transport mismatch.
    state_path = host.root / 'state.json'
    state = read_json(state_path) if state_path.exists() else {'active': host.baseline(), 'previous': None}
    if state.get('pending'):
        restore(host, state)
        raise RuntimeError('Recovered interrupted rollout; submit a fresh workflow attempt')
    require(state['active']['id'] != manifest['release_id'], 'Release already active')
    old = state['active']
    if not old.get('legacy') and 'manifest' in old:
        producer = old['manifest']
        require((int(manifest['run_id']), int(manifest['run_attempt'])) >
                (int(producer['run_id']), int(producer['run_attempt'])), 'Refusing stale producer attempt')
    occupied = {release['port'] for release in [old, state['previous']] if release}
    port = next(port for port in [3101, 3102, 3103] if port not in occupied)
    candidate = {'id': manifest['release_id'], 'container': 'quizzence-release-' + manifest['release_id'],
                 'port': port, 'image': manifest['image_id'], 'manifest': manifest}
    before = host.proxy.read_bytes()
    after = proxy_for(before, old['port'], port)
    host.check(old)
    host.check(old, public=True)
    candidate['image'] = host.load(bundle, manifest)
    state['pending'] = {'candidate': candidate, 'proxy_before': before.hex(), 'proxy_after': after.hex(), 'switch_started': False}
    save(state_path, state)
    try:
        host.start(candidate)
        host.check(candidate)
        state['pending']['switch_started'] = True
        save(state_path, state)  # Durable recovery point before touching traffic.
        require(host.proxy.read_bytes() == before, 'Proxy drift before switch')
        atomic(host.proxy, after)
        host.reload()
        host.check(candidate, public=True)
        host.stop(old)
        # Confirm traffic still serves the tested candidate after the old container stops.
        host.check(candidate, public=True)
        retired = state.get('retired', []) + ([state['previous']] if state['previous'] else [])
        committed = {'active': candidate, 'previous': old, 'retired': retired}
        save(state_path, committed)
    except BaseException:
        restore(host, state)
        raise
    # Retention begins only after commit; never remove active/required recovery resources.
    remaining = []
    for release in retired:
        try:
            require(release['id'] not in [candidate['id'], old['id']], 'Retention cannot remove protected releases')
            host.remove(release)
        except Exception:
            remaining.append(release)
            print('Retention incomplete: old stopped release retained for operator inspection', flush=True)
    committed['retired'] = remaining
    save(state_path, committed)
    return manifest


def interrupted(_signum, _frame):
    raise RuntimeError('Rollout interrupted; restoring serving release')


def run_locked(host, bundle, expected_digest):
    host.root.mkdir(parents=True, exist_ok=True)
    with (host.root / 'lock').open('a') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        for signum in [signal.SIGTERM, signal.SIGINT, signal.SIGHUP]:
            signal.signal(signum, interrupted)
        return rollout(host, bundle, expected_digest)
