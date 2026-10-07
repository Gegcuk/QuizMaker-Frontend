// Production prerender may obtain public image bytes from this reviewed CDN.
// The browser itself keeps its internal network and loopback-only relay.
const cdnOrigin = 'https://cdn.quizzence.com';
const policyMessage = 'Prerender image origin rejected: external images must use https://cdn.quizzence.com';

export function classifyPrerenderImage(value, previewOrigin) {
  let url;
  try { url = new URL(value, previewOrigin); } catch { return 'blocked'; }
  if (url.username || url.password) return 'blocked';
  if (url.origin === previewOrigin) return 'local';
  if (['data:', 'blob:'].includes(url.protocol)) return 'inline';
  return url.origin === cdnOrigin ? 'cdn' : 'blocked';
}

export async function setupPrerenderImages(page, previewOrigin, { fetchImage = fetch } = {}) {
  let violation;
  const activeRequests = new Set();
  const inspect = value => {
    const kind = classifyPrerenderImage(value, previewOrigin);
    if (kind === 'blocked') violation ??= new Error(policyMessage);
    return kind;
  };
  // Observe requests even when a provider fake fulfills them before our route.
  // A forbidden hero must not disappear behind its subsequently loaded fallback.
  const observe = request => { if (request.resourceType() === 'image') inspect(request.url()); };
  page.on('request', observe);
  const relay = async route => {
    const request = route.request();
    if (request.resourceType() !== 'image') return route.fallback();
    const kind = inspect(request.url());
    if (kind === 'blocked') return route.abort('blockedbyclient');
    if (kind !== 'cdn') return route.fallback();
    if (request.method() !== 'GET') {
      violation ??= new Error('Prerender CDN images require an anonymous GET');
      return route.abort('blockedbyclient');
    }
    const cancellation = new AbortController();
    activeRequests.add(cancellation);
    try {
      // Never forward browser cookies, authorization, referrers or environment
      // values. A redirect cannot expand the approved network boundary.
      const response = await fetchImage(request.url(), {
        method: 'GET', redirect: 'manual', credentials: 'omit',
        headers: { accept: 'image/*' }, signal: AbortSignal.any([cancellation.signal, AbortSignal.timeout(15_000)]),
      });
      if (response.status >= 300 && response.status < 400) {
        violation ??= new Error('Prerender CDN image redirects are forbidden');
        await response.body?.cancel().catch(() => undefined);
        return route.abort('blockedbyclient');
      }
      await route.fulfill({ status: response.status,
        contentType: response.headers.get('content-type') || 'application/octet-stream',
        body: Buffer.from(await response.arrayBuffer()),
      });
    } catch {
      // Preserve existing image/fallback failure semantics, without logging the
      // image URL, response body or headers. Policy violations still fail below.
      await route.abort('failed').catch(() => undefined);
    } finally { activeRequests.delete(cancellation); }
  };
  await page.route('**/*', relay);
  return {
    async assertAllowedImages() {
      // Lazy images outside the viewport may never make a request in prerender.
      // Check the saved DOM too, rather than accepting an unrequested origin.
      const sources = await page.locator('img').evaluateAll(images => images
        .flatMap(image => [image.src, image.currentSrc]).filter(Boolean));
      sources.forEach(inspect);
      if (violation) throw violation;
    },
    async dispose() {
      for (const cancellation of activeRequests) cancellation.abort(new Error('Prerender image relay closed'));
      page.off('request', observe);
      await page.unroute('**/*', relay);
    },
  };
}
