#!/usr/bin/env bash
set -euo pipefail
# Operator-run, from a reviewed checkout. CI never invokes this installer.
test "$(id -u)" = 0
deployment_user="${1:-deploy}"
[[ "$deployment_user" =~ ^[a-z_][a-z0-9_-]*$ ]]
id "$deployment_user" >/dev/null
for executable in python3 docker nginx systemctl visudo flock; do command -v "$executable" >/dev/null; done
python3 -c 'import sys; assert sys.version_info >= (3, 11)'
install -d -o root -g root -m 700 /var/lib/quizzence-releases
exec 8>/var/lib/quizzence-releases/submit.lock
exec 9>/var/lib/quizzence-releases/lock
flock -n 8
flock -n 9
python3 - <<'PY'
import json
from pathlib import Path
root = Path('/var/lib/quizzence-releases')
state = root / 'state.json'
assert not state.exists() or not json.loads(state.read_text()).get('pending'), 'Recover pending rollout before installing'
for job in (root / 'jobs').glob('*.json'):
    assert json.loads(job.read_text())['status'] not in ['queued', 'running', 'recovery-required'], 'Resolve active jobs before installing'
PY
source_dir="$(cd -- "$(dirname -- "$0")" && pwd)"
install -d -o root -g root -m 755 /usr/local/lib/quizzence-release
for filename in artifact.py rollout.py helper.py; do
  install -o root -g root -m 644 "$source_dir/$filename" "/usr/local/lib/quizzence-release/$filename"
done
install -o root -g root -m 755 "$source_dir/quizzence-release" /usr/local/sbin/quizzence-release
for directory in releases jobs provenance; do
  install -d -o root -g root -m 700 "/var/lib/quizzence-releases/$directory"
done
install -d -o "$deployment_user" -m 700 /var/www/quizzence/incoming
install -o root -g root -m 644 "$source_dir/quizzence-release@.service" /etc/systemd/system/quizzence-release@.service
install -o root -g root -m 644 "$source_dir/quizzence-release-recovery.service" /etc/systemd/system/quizzence-release-recovery.service
sudoers_file="$(mktemp)"
trap 'rm -f "$sudoers_file"' EXIT
printf '%s ALL=(root) NOPASSWD: /usr/local/sbin/quizzence-release\n' "$deployment_user" > "$sudoers_file"
visudo -cf "$sudoers_file"
install -o root -g root -m 440 "$sudoers_file" /etc/sudoers.d/quizzence-release
systemctl daemon-reload
systemctl enable quizzence-release-recovery.service
printf 'Helper installed; frontend routing and containers have not been changed.\n'
