# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

## Local frontend checks

Use Node **24.21.0** and its bundled npm **11.19.0**. The repository-root
`.nvmrc` is the shared pin for development and all Node-based workflows.
With nvm installed, activate it from the repository root before installing:

```bash
nvm install
nvm use
node --version
npm --version
```

Other version managers should select the same versions. The app's engines
policy supports Node 24 from this patch and npm 11 from this version;
`.npmrc` makes unsupported installations fail rather than just warn.
`packageManager` records the npm baseline; it does not automatically install npm.
Do not use `--force` or disable engine checks to bypass a runtime mismatch.

For deliberate runtime updates, review an official Node 24 LTS patch, its bundled
npm and release notes. Update `.nvmrc`, the package engines/npm baseline and
lockfile metadata together, then rerun clean installation, all required checks
and exported-image validation. Keep `@types/node` on major 24. Playwright
environment updates must also preserve this declared runtime.
Node is used for development, builds and validation; production serves the
resulting static files through Nginx.

From the repository root:

```bash
cd quizmaker-frontend
npm ci
npm run lint
npm test
npm run build
```

Additional test commands:

```bash
npm run test:watch
npm run test:coverage
npm run test:smoke
npm run test:e2e
npm run audit:production
npm run browserslist:update
```

`npm run test:smoke` starts the frontend in a browser and checks that the
public home page renders with Tailwind styles applied, readable theme contrast
across light, dark, blue, purple, and green palettes, and no mobile horizontal
overflow.

`npm run test:e2e` starts an isolated local Vite server and runs critical
Playwright journeys against mocked API responses. It covers public routes,
authentication success and error paths, and a mobile quiz-attempt interaction.
It never calls production services or uses production credentials.

Vitest component and service tests live next to the source they cover as
`*.test.ts` or `*.test.tsx`, or under `src/test` for shared test infrastructure.
Use `src/test/render.tsx` when a component needs app providers such as router,
React Query, theme, auth, feature flags, or toast context. Use MSW handlers from
`src/test/msw` for API-dependent tests instead of calling the real backend.

For focused lint checks during development:

```bash
npx eslint path/to/changed-file.tsx
```

The pull request workflow runs lint, Vitest, browser smoke, critical E2E, and
build checks for every pull request to `main`.

## CI/CD

- `.github/workflows/frontend-pr.yml` runs lint, Vitest, browser smoke, critical E2E, and build on every pull request to `main`.
- `.github/workflows/deploy.yml` runs on pushes to `main` and can also be started manually.
- Both production jobs require `main`, including manual runs. The producer runs dependency audit, lint, unit, SEO fixture, and deployment-policy checks, then builds the complete production image once.
- Nginx, browser, privacy, and byte-identity checks consume that exported image. Only a passing image is uploaded; the deployment job downloads its exact artifact ID and verifies its provenance and archive digests.
- The host keeps the current container serving until the candidate passes. Public checks before and after stopping the old container are part of the rollback-protected transaction.

### Release artifact tooling

`scripts/deployment/build-release.sh` builds and prerenders the production
application once, stamps it, builds the amd64 runtime image, and exports that
image to `release-bundle/image.tar`. Run it from `quizmaker-frontend` with the
producer's `GITHUB_SHA`, `GITHUB_RUN_ID`, `GITHUB_RUN_ATTEMPT`,
`VITE_API_BASE_URL`, and `VITE_SITE_URL` available. Each run/attempt has a unique
release identity. It refuses an existing bundle or manifest so a validated
artifact cannot accidentally be replaced by a later build.

`release-bundle/provenance.json` records the repository, commit and source tree,
producer run/attempt, content digest, archive digest, image identities, helper version, and
expected HTTP probes. Keep its SHA-256 separate from the transferred files:
`artifact.py verify --digest <expected-provenance-sha256>` checks that trusted
value before checking the archive. A checksum shipped alongside an unchecked
replacement manifest is insufficient. The image's `/__release.json` contains
only the release ID, revision, and content digest.

`RELEASE_MANIFEST_DIGEST=<expected-provenance-sha256> npm run test:release`
loads the exported image and runs Nginx, browser smoke, critical E2E, analytics
privacy, and byte-identity checks against one local container. It does not build
another image. Browser provider requests are faked or blocked. The HTTP probes
check assets, public article HTML, canonical redirects, private SPA routes,
callbacks, and unknown routes; a different page returning HTTP 200 still fails.
Public probes identify themselves as `QuizzenceReleaseVerifier/1.0`. Host
preparation confirmed that the public edge rejects Python's default User-Agent;
the explicit service identity works without changing edge security rules.
Origin responses require exact body digests. Cloudflare's existing email
obfuscation rewrites public HTML, so public HTML instead requires the expected
title, headings, metadata, resource references, and inline-script hashes. Only
the observed Cloudflare email-decoder script may be added. Every managed frontend
response must also carry the image's `X-Quizzence-Release` identity; assets and
`/__release.json` still require exact public bytes. Legacy bootstrap checks use
the same HTML comparison without a release header, which the old image lacks.
These checks preserve the existing email protection; they do not assert that
Cloudflare delivers byte-identical HTML or disable its transformation rules.
Public probes add a non-sensitive `__release_probe=<release-id>` query parameter
so cached assets and redirects from earlier releases cannot supply stale headers.
This requires the edge to include query parameters in its cache key; an edge
rule that strips this parameter will fail verification rather than accept an
unverified release. Normal visitor URLs and cache policy are unchanged.
Image config and manifest identities are retained because Docker's classic and
containerd storage engines identify the same exported image differently.

`npm run test:deployment-policy` includes Python standard-library tests for
artifact corruption, startup/probe failures, traffic-switch failures,
post-switch failures, interrupted restoration, and release retention.
`tests/fixtures/prepare-release.mjs` completes an existing `npm run build`
output using local article/API/image fixtures for release tests. Production
artifact creation uses `npm run build:prerender` instead.

The rollout module journals the previous configuration before switching traffic.
It validates the candidate while the current container serves, checks public
delivery, stops the old container, and checks public delivery again before
committing release state. Failure restores the retained container and proxy
configuration. Failed restoration keeps the journal and both containers; an
operator must resolve host/proxy health before trying another release. Proxy
configuration drift fails closed and requires a fresh inspection. Only the two
inspected frontend targets change; backend routing and TLS remain intact.
After a proxy reload, up to five public checks one second apart allow Nginx's
new workers to accept traffic. The recovery container remains available until
verification succeeds; a persistent mismatch fails and restores the old release.

After success, cleanup preserves the current and previous successful managed
releases. The previous container stays stopped. Cleanup failures retain extra
stopped resources and remain recorded for another attempt. Legacy containers
and unrelated Docker resources are excluded from deletion. GitHub transport
artifact cleanup belongs to issue #228.

The producer exposes `artifact_id`, `artifact_digest`, `manifest_digest`,
`release_id`, `producer_run`, and `producer_attempt`. The consumer exposes
`consumer_completed=true` only after the host's successful receipt is verified,
plus `consumed_artifact_id`, `consumed_manifest_digest`, and the original producer
run/attempt. These identities remain correct when only a failed consumer job is
rerun. A missing receipt is not evidence of successful consumption. There is no
GitHub artifact-deletion step or Actions write permission in this workflow.

### Host preparation and recovery

The rollout service requires Linux amd64, Docker, host Nginx managed by systemd,
Python 3.11+, `flock`, and the existing deployment SSH account. Before enabling
the new workflow, an operator must install the helper from the reviewed revision
on the host, from the application's directory:

```bash
sudo bash scripts/deployment/install-helper.sh deploy
sudo nginx -t
sudo systemd-analyze verify /etc/systemd/system/quizzence-release@.service /etc/systemd/system/quizzence-release-recovery.service
sudo -u deploy sudo -n /usr/local/sbin/quizzence-release status 1 1
```

The last command should report a missing job without requesting a password;
run/attempt `1/1` is only an installation check, not a release submission.
The installer creates root-owned helper files and state, a systemd rollout unit,
a boot recovery unit, and a narrowly scoped sudo command for `submit` and
`status`. It does not switch routing or start a release. It refuses installation
while a job or recovery journal is active. Install an updated reviewed helper
before deploying changes to its three Python modules: a helper checksum mismatch
refuses submission. CI uploads image data and never installs host executable code.

The host configuration was inspected read-only on 2026-10-04. The helper is bound
to that inspected configuration's SHA-256 and changes exactly the two frontend
proxy destinations in `/etc/nginx/sites-available/quizzence.com`. Backend/API,
backend-owned sitemaps, OAuth provider endpoints, TLS, and redirects remain
host-owned. Any configuration change, including an unrelated edit, requires a
new read-only inspection and reviewed fingerprint update before rollout.
Candidate ports `127.0.0.1:3101` through `3103` must be available for this service;
they are never exposed on an external interface.

On first use, the service checks and adopts the running legacy frontend at
`127.0.0.1:3000` as the initial recovery release. There was no recorded second
known-good release at inspection time. The first candidate must not require
removing that container. The legacy resource remains excluded from automated
deletion even after it is no longer the previous release. For managed releases,
only the current container runs after success; one previous successful container
and its image/archive remain stopped on disk. A running candidate temporarily
requires additional memory and CPU, and transfer/loading temporarily requires
additional disk capacity.

Uploads use `/var/www/quizzence/incoming/<run>-<attempt>`. The helper copies only
the two bounded regular files through symlink-resistant descriptors into
`/var/lib/quizzence-releases/releases/<release-id>`, then verifies both digests
again before loading the image. Successful workflows remove their own incoming
copy. Interrupted transfers or failed candidates can retain diagnostic files or
stopped resources; inspect them separately, without broad Docker pruning.
Root-owned `provenance/` and `jobs/` records survive release-image retention.

An SSH disconnect does not stop the systemd job. Inspect it using the actual
producer run and attempt, for example:

```bash
sudo /usr/local/sbin/quizzence-release status 123456789 1
sudo systemctl status quizzence-release@123456789-1.service
sudo journalctl -u quizzence-release@123456789-1.service
```

The service has a 15-minute execution limit. Termination and `ExecStopPost`
restore an uncommitted switch; boot recovery handles an interrupted machine
restart. The exclusive host lock prevents competing switches. A
`recovery-required` receipt means restoration could not be verified. Keep the
pending journal and both releases, resolve Docker/Nginx/public-delivery health,
then run the root-only recovery command:

```bash
sudo /usr/bin/python3 -I /usr/local/lib/quizzence-release/helper.py recover
```

Recovery refuses to overwrite an independently modified proxy file. Reconcile
such edits manually before recovery; never delete the journal to force a new
rollout. A failed/restored attempt is immutable: submit a fresh producer attempt
after fixing the cause. A successful receipt records the release, archive digest,
manifest digest, and GitHub artifact ID; verify the public `/__release.json`
against that identity.

### Private application diagnostics

API failures cross one validated `ApplicationError` boundary. Services preserve
available HTTP status, allowlisted code/type, field associations, validated
`Retry-After` guidance, and an opaque correlation reference. UI messages use
fixed recovery guidance. Arbitrary backend detail, validation text, error causes,
transport objects, and original stacks are discarded. Field errors keep their
allowlisted field names with safe messages; unknown metadata is omitted.
The field-name list includes request properties verified in the live API groups.
Local media validation uses explicit reasons and validated size/type options,
so file-size, empty-file, format, and image-decoding guidance survives this
boundary without accepting arbitrary exception messages. Alert titles contain
only a short category label; recovery and support references appear once.

Diagnostics are memory-only in the current tab: at most 20 events, at most
30 minutes of retention, and one event per error category per 60 seconds.
Logout, login/account transitions, page exit, and disabling diagnostics clear
both events and suppression state. Records contain only category, source,
HTTP status, a known route template (or `unknown`), build revision (or `unknown`),
time, and a locally generated reference. They have no request/response bodies,
headers, content, identifiers from routes, backend correlation IDs, or stacks.

The reporter neither writes storage nor sends network requests. There is no
additional VPS process, database, queue, or telemetry endpoint. A local render
reference identifies an event in that tab only; it is not a remotely searchable
support record. Reloading or closing the tab loses the records.

Set `VITE_DIAGNOSTICS_ENABLED=false` when building to disable collection.
The reporter also provides `setEnabled(false)` for immediate in-memory disabling
and clearing. `read()` returns an immutable record snapshot for local consumers;
it is not connected to analytics or the bug-report submission flow.
GitHub builds embed `GITHUB_SHA`; other builds may supply a validated
`VITE_RELEASE_REVISION` commit SHA. Unknown or malformed values become `unknown`.
Changing the transport, event dimensions, or retention requires a separate
review. Auth refresh, query retry limits, mutation retry behavior, billing
reconciliation, and attempt progression retain their existing policies.

### Staged browser policies

Every frontend response family receives `Content-Security-Policy-Report-Only`.
The policy reports violations to the browser console without blocking resources.
There is deliberately no remote report collector or script sample reporting:
callback URLs and other sensitive context must not be transmitted in CSP reports.
This means observation requires deliberate browser checks and does not provide
aggregate production violation counts.

The source list is generated by `scripts/deployment/security-headers.mjs`:

| Directive | Allowed sources and purpose |
| --- | --- |
| Scripts | This site, Google Tag Manager, cdnjs for PDF tooling, and SHA-256 hashes of the final inline executable scripts, including early sensitive-URL scrubbing. No general inline-script or eval permission. |
| Connections | This site, the configured HTTPS API origin, cdnjs, and Google Analytics collection domains. |
| Styles | This site and inline styles required by the current UI. |
| Images | This site, HTTPS image sources, `data:` and `blob:` for current article/editor/preview behavior. |
| Fonts / workers | Same-site fonts and `data:` fonts; same-site, `blob:`, and cdnjs workers for PDF tooling. |
| Frames / objects / base URL / forms | No embedded frames or objects, no HTML base URL override, same-site form actions, and same-site framing. External OAuth and payment flows continue to use top-level navigation. |

`Permissions-Policy: camera=(), microphone=(), geolocation=()` immediately denies
those three unused browser capabilities. Existing HSTS, frame, MIME, and referrer
headers remain. Callback responses retain `no-store`, `no-referrer`, noindex, and
disabled container access logging. Header includes are repeated where Nginx
location-level headers would otherwise suppress inherited headers.

Move from observation to enforcement only after recording representative
desktop/mobile production checks for login, OAuth return, reset/verification
links, checkout return/recovery, analytics consent, quiz attempts, public articles,
uploads, and PDF preview. Every first-party violation must be explained and fixed;
real provider integrations must work in an enforcing staging environment using
the same artifact. Recheck callback URL scrubbing and absence of sensitive report
data. Enforcement is a separate reviewed policy change with a tested revert to
report-only; there is no automatic timer or activation flag in this release.

### Acceptance evidence and remaining operational verification

| Required outcome | Automated evidence |
| --- | --- |
| The validated bytes reach activation | `test_artifact.py` corruption and byte probes; workflow policy enforces one producer and exact-ID handoff; `test:release` loads the exported archive. |
| Candidate failure leaves the serving version available | `test_release.py` injects load, startup, health, image, and route-probe failures before the switch. |
| Switch or later checks fail safely | Switch reload, public checks, stopping the old release, failed restoration, interrupted recovery, concurrent jobs, stale producers, and independent proxy edits have focused failure tests. |
| Current and previous releases survive cleanup | Retention tests protect both identities and exercise cleanup failures and safe resumption after partial deletion. |
| Browser policies preserve supported behavior | Nginx checks cover headers on public/private/callback/asset/XML/error responses; real Chromium tests exercise report-only and test-only enforcement, URL scrubbing, and denied capabilities. Existing E2E/privacy tests run against the exported image with provider fakes. |
| Uploads do not supply privileged host code | Helper tests reject file/directory symlinks, modified archives, invalid arguments, and mismatched installed helper code; consumer receipts require successful rollout. |

Local fixtures and injected failures do not prove production systemd behavior,
CDN forwarding/cache behavior, host capacity, real provider compatibility, or
machine-reboot recovery. Before the first rollout, verify installation and host
preconditions; rehearse SSH loss, service termination, proxy reload failure, and
boot recovery on an equivalent isolated host. After an authorized deployment,
verify the deployed identity and public headers, API/TLS routing, one active plus
one stopped managed release, and a real rollback rehearsal. CSP production
observation and later enforcement remain separate operational validation.

### SEO production verification

After a successful deployment, run the following read-only checks against the public site:

```bash
curl --fail --silent --show-error https://www.quizzence.com/sitemap.xml
curl --fail --silent --show-error https://www.quizzence.com/sitemap_articles.xml
curl --fail --silent --show-error https://www.quizzence.com/blog/retrieval-practice-fastest-way-to-make-learning-stick/
curl --fail --silent --show-error --head https://www.quizzence.com/my-quizzes
```

- Both sitemap responses must be XML, and `sitemap_articles.xml` must contain an article `<loc>` entry.
- An article response must contain a title, meta description, canonical link, matching Open Graph title/description/URL, `og:type=article`, and Article JSON-LD.
- The `my-quizzes` response must include `X-Robots-Tag: noindex, nofollow`.
- Canonical article URLs must redirect from `/blog/<slug>` to `/blog/<slug>/`.

`npm run build:prerender` fails when the live article sitemap is unavailable, empty, malformed, or does not produce verified article metadata. The deployment workflow enforces the same sitemap and private-route header checks after rollout.

### Article images

Article pages use the public rendition returned by the live Articles API rather
than constructing media URLs from asset IDs. Known intrinsic dimensions reserve
space before the image loads; unknown dimensions are omitted.

Social previews and Article JSON-LD use an explicitly authored `ogImage`, then
the hero rendition, then the approved shared illustration:
`https://cdn.quizzence.com/library/aec804f3-e4b3-430a-ba3e-109e819b3c56.png`.
The fallback is a 1792 × 592 PNG with its own alt text and no article-specific
caption. It is also displayed when the hero is missing, unavailable, or fails to
load. If the fallback fails too, the article remains readable without an image;
only an independently authored social image is retained. Navigation clears
obsolete image metadata, including dimensions belonging to a previous image.
Display fallbacks and read-only rendition metadata are never saved as authoring
fields. Image selection lives in `src/features/blog/articleImages.ts`.

`npm run test:seo` builds into a temporary directory and verifies actual
prerendered article HTML using a local API and image fixtures. It covers image
selection, unavailable media, browser load failures, and mobile/desktop article
navigation without contacting production services. Static prerender checks alone
do not cover article output.

## Prepared browser environment and validation timing

PR checks and the release producer use the official Playwright 1.61.1 image,
with reviewed architecture-specific SHA256 digests in
`scripts/browser/environment.json`. Chromium, native libraries and fonts are
already inside that image. No workflow runs an APT/browser installer. Builds,
tests and the browser service all use the exact Node patch from `.nvmrc`; the
Linux runner's Node directory is mounted read-only into the browser container.
The image's own Node installation is not used.

Preparation starts its single **300-second** deadline before image inspection,
cache restoration or registry pull. Acquisition, service compatibility, actual
Chromium launch and rendering a local HTTP fixture share the remaining budget.
The six-minute Actions step allowance includes bounded cleanup after the
five-minute preparation deadline; it is not six minutes of provisioning.
Failure reports the phase and elapsed time and does not retry or fall back to a
host browser. Cleanup removes only UUID-named, ownership-labelled resources.
Services have a 25-minute watchdog in case their runner disappears. Exported-image
tests also label their own UUID container and clean it within a separate
10-second budget on failure/cancellation, without deleting transport archives.
Validation cancellation first allows this cleanup, then stops the remaining
command process group after 11 seconds.

The browser has a read-only filesystem, an internal task-owned Docker network,
no published ports, no production environment or token mounts, dropped Linux
capabilities and no new privileges. A private loopback proxy carries the
Playwright connection through Docker exec streams. Playwright's supported
`exposeNetwork: '<loopback>'` relay reaches the runner's local Vite and exact
exported Nginx image. External browser connections have no route. Production prerender relays image
bytes on the host only for `https://cdn.quizzence.com`, using anonymous GET
without browser cookies, authorization or referrer headers. Redirects and
unknown image origins fail the build, including forbidden heroes that would
otherwise become fallbacks and lazy images below the viewport. No host image
relay is installed in smoke/E2E/privacy browser tests; fixture prerender uses
provider fakes and never requests the production CDN. Changing the CDN boundary
requires an explicit security-policy review. The internal
interface preserves native online/offline behavior, including billing retry
behavior. The capability-bearing WebSocket URL stays in a mode-0600 state file,
is masked when exported to Actions and is excluded from metrics/cache uploads.

Both paths run `scripts/deployment/validate-frontend.mjs` with executable gates
listed in `validation-plan.json`. PR and producer jobs each have a 25-minute
limit. The producer builds once, seals and tests its exported image, then
uploads that same archive. Activation keeps the existing 22-minute SSH rollout
budget and has a separate 40-minute job allowance (10 minutes for SSH preparation
and 8 minutes for artifact/receipt overhead). Artifact identity, rollback and
consumer completion checks remain required.

The manually dispatched **Frontend Fixture Benchmark** workflow runs three cold
and three warm samples for each PR and complete fixture-producer path (12 jobs).
It cannot activate production: it has no activation job, production environment,
deployment secrets or write permissions. Fixture producer mode uses a fixed
local-fixture API and the same build/export/seal/release verification code as the
production producer. After successful producer validation, it uploads only the
fixture `image.tar` under a `benchmark-fixture-image-` name, with no provenance
or activation output. This measures exported-image transfer separately; it
cannot satisfy the production consumer handoff. Timing metadata and the immutable
tooling image have separate artifacts.

Cold samples use an empty task-owned npm cache and must observe the selected
prepared-image digest absent. Shared runner Docker layers may exist and are
reported as unmeasured; this is not a claim of zero cached bytes. Warm samples
require an exact npm cache hit with offline installation and restore the
captured tooling archive within the preparation deadline. The archive SHA256
comes from a separate producer output and is checked before Docker load; its
layers must match the immutable registry digest. A missing, late or invalid
cache fails the measurement rather than becoming a successful cold sample.
There is no separate browser cache. Cache priming is reported as a separate
setup job and is not one of the 12 validation samples.

The summary reconciles safe timing records with actual GitHub job start times,
including runtime setup, npm installation, acquisition, build and all gates.
`artifact_upload_seconds` measures the successful fixture-image upload after
validation; `timing_evidence_upload_seconds` measures JSON evidence separately.
PR samples have no exported-image upload and report that metric as null. Missing
or failed fixture-image uploads cannot satisfy producer benchmark acceptance.
Production handoff upload and activation timing still require deployed-run
evidence. All attempts, failures and cache misses stay in the evidence. Comparable runner image, architecture,
Node, Playwright, Chromium and tooling digest are required. Each cohort needs
three distinct successful samples: readiness must be at most two minutes and
the complete producer median at most eight minutes. Missing evidence or failed
targets fail the summary; local Docker timings do not prove hosted-runner targets.

Ordinary local commands still launch a locally installed Chromium when no
prepared environment is requested. CI validation explicitly points host browser
lookup to an empty cache so an accidental direct launch fails instead of being
masked by a runner installation. To use preparation on a Linux host:

```bash
node scripts/browser/environment.mjs prepare /tmp/quizmaker-browser-state.json
# Read the private state's endpoint into BROWSER_WS_ENDPOINT without logging it.
# REQUIRE_PREPARED_BROWSER=true makes a missing endpoint fail instead of falling back.
node scripts/deployment/validate-frontend.mjs pr
node scripts/browser/environment.mjs stop /tmp/quizmaker-browser-state.json
```

Non-Linux probes must pass a verified Linux Node runtime directory as a third
argument to `prepare`; no system runtime is changed. Browser image updates need
a lockfile/Chromium compatibility review, new architecture digests and focused
negative policy tests before rerunning both paths and hosted benchmarks.

## Dependency Maintenance

- Dependabot opens weekly npm dependency PRs for `quizmaker-frontend`.
- Dependabot opens monthly GitHub Actions update PRs.
- `.github/workflows/dependency-maintenance.yml` runs weekly and can be started manually.
- Production dependency vulnerabilities are checked with `npm run audit:production`.
- Browserslist data is checked by running `npm run browserslist:update` and failing if `package.json` or `package-lock.json` would change.
- Before merging dependency PRs, run `npm run lint`, `npm test`, `npm run test:smoke`, and `npm run build`.
- Dev-only audit findings are not part of normal PR or deploy gates unless intentionally promoted to production risk.

Production deployment requires these GitHub secrets:

- `VITE_API_BASE_URL`
- `VITE_SITE_URL`
- `SERVER_HOST`
- `SERVER_USER`
- `SERVER_SSH_KEY`

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```
