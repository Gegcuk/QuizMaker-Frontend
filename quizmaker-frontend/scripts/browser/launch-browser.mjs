import { chromium } from 'playwright';

export function validateBrowserEndpoint(value) {
  let url;
  try { url = new URL(value); } catch { throw new Error('Invalid prepared-browser endpoint'); }
  if (url.protocol !== 'ws:' || url.hostname !== '127.0.0.1' || !url.port
    || url.username || url.password || url.search || url.hash || url.pathname === '/') {
    throw new Error('Prepared-browser endpoint must be a private loopback WebSocket');
  }
  return url.href;
}

// Only client loopback traffic is relayed into the isolated browser container.
// Existing provider fakes still own API/OAuth/billing/analytics interception.
export async function launchBrowser({ endpoint = process.env.BROWSER_WS_ENDPOINT, timeout = 30_000,
  required = process.env.REQUIRE_PREPARED_BROWSER === 'true' } = {}, browserType = chromium) {
  if (!endpoint) {
    if (required) throw new Error('Required prepared browser endpoint is missing');
    return browserType.launch();
  }
  const validated = validateBrowserEndpoint(endpoint);
  if (!Number.isFinite(timeout) || timeout <= 0) throw new Error('Browser connection must have a finite positive timeout');
  try {
    return await browserType.connect(validated, { exposeNetwork: '<loopback>', timeout });
  } catch {
    // Do not print the private browser-service capability or connection headers.
    throw new Error('Prepared browser connection failed; check local service readiness');
  }
}
