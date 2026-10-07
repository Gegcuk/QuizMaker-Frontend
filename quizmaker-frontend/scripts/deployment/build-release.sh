#!/usr/bin/env bash
set -euo pipefail

# Run from quizmaker-frontend. The one application build precedes stamping and
# export; all subsequent gates consume image.tar and must never rebuild it.
: "${GITHUB_SHA:?}" "${GITHUB_RUN_ID:?}" "${GITHUB_RUN_ATTEMPT:?}"
: "${VITE_API_BASE_URL:?}" "${VITE_SITE_URL:?}"
test "$GITHUB_SHA" = "$(git rev-parse HEAD)"
test -z "$(git status --porcelain)"
test "$VITE_SITE_URL" = 'https://www.quizzence.com'
test ! -e release-bundle
test ! -e release-manifest.json
case "${RELEASE_FIXTURE_MODE:-false}" in
  true)
    test "$VITE_API_BASE_URL" = 'https://api.fixture.test/api'
    npm run build
    node tests/fixtures/prepare-release.mjs
    REQUIRE_ARTICLE_ROUTES=true npm run verify:prerender
    ;;
  false) npm run build:prerender ;;
  *) echo 'Invalid release fixture mode'; exit 1 ;;
esac
node scripts/deployment/security-headers.mjs
python3 scripts/deployment/artifact.py prepare
release_id="${GITHUB_SHA}-${GITHUB_RUN_ID}-${GITHUB_RUN_ATTEMPT}"
image="quizzence-release:${release_id}"
docker build --platform linux/amd64 \
  --build-arg "REVISION=${GITHUB_SHA}" --build-arg "RELEASE_ID=${release_id}" \
  --tag "$image" .
mkdir release-bundle
docker save --output release-bundle/image.tar "$image"
image_id="$(docker image inspect --format '{{.Id}}' "$image")"
manifest_digest="$(python3 scripts/deployment/artifact.py seal --image "$image_id")"
if [ -n "${GITHUB_OUTPUT:-}" ]; then
  printf 'producer_run=%s\nproducer_attempt=%s\n' "$GITHUB_RUN_ID" "$GITHUB_RUN_ATTEMPT" >> "$GITHUB_OUTPUT"
  printf 'manifest_digest=%s\nrelease_id=%s\nimage_id=%s\n' "$manifest_digest" "$release_id" "$image_id" >> "$GITHUB_OUTPUT"
fi
printf 'Prepared release %s; provenance SHA256 %s\n' "$release_id" "$manifest_digest"
