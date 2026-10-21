/* global CONFIG */
const CACHE_PREFIX = "scancart-shell-";
const CACHE_NAME = `${CACHE_PREFIX}${CONFIG.version}`;

function isPage(url) {
  return CONFIG.pages.includes(url.pathname) ||
    /^\/history\/[^/]+$/.test(url.pathname) ||
    /^\/products\/[^/]+\/prices$/.test(url.pathname);
}

function isAsset(url) {
  return url.pathname.startsWith("/_next/static/") ||
    /^\/icons\/[^/]+\.png$/.test(url.pathname) ||
    url.pathname === "/manifest.webmanifest" || url.pathname === "/offline.html";
}

async function cacheResponse(cache, request, response) {
  if (response.ok && response.type !== "opaque" && !response.redirected) {
    await cache.put(request, response.clone());
  }
}

function pageRequest(url) {
  return new Request(url, { headers: { Accept: "text/html" }, cache: "no-cache" });
}

async function savePage(cache, url) {
  const request = pageRequest(url);
  const response = await fetch(request);
  if (!response.ok || response.redirected || !response.headers.get("content-type")?.includes("text/html")) {
    throw new Error(`Offline page preparation failed: ${new URL(url).pathname}`);
  }
  const html = await response.clone().text();
  const assets = [...new Set([...html.matchAll(/(?:src|href)="([^"]+)"/g)]
    .map((match) => match[1].replaceAll("&amp;", "&"))
    .filter((asset) => asset.startsWith("/_next/static/") && !asset.includes("?")))];
  for (const asset of assets) {
    const assetUrl = new URL(asset, self.location.origin).href;
    if (!await cache.match(assetUrl)) await cache.add(assetUrl);
  }
  await cache.put(request, response);
}

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(CONFIG.assets);
    for (const page of CONFIG.pages) await savePage(cache, new URL(page, self.location.origin).href);
    // Updates wait for user approval (or for all old app tabs to close).
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    for (const name of await caches.keys()) {
      if (name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME) await caches.delete(name);
    }
    await self.clients.claim();
  })());
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    event.waitUntil(self.skipWaiting());
  } else if (event.data?.type === "CACHE_PAGE" && typeof event.data.path === "string") {
    const url = new URL(event.data.path, self.location.origin);
    if (url.origin !== self.location.origin || !isPage(url) || url.search) return;
    event.waitUntil((async () => {
      try {
        await savePage(await caches.open(CACHE_NAME), url.href);
        event.ports[0]?.postMessage({ ok: true });
      } catch (error) {
        console.error("ScanCart could not prepare this page offline.", error);
        const saved = await (await caches.open(CACHE_NAME)).match(pageRequest(url.href));
        event.ports[0]?.postMessage({ ok: !!saved, cached: !!saved });
      }
    })());
  }
});

async function reportCacheError(error) {
  console.error("ScanCart could not cache an application resource.", error);
  for (const client of await self.clients.matchAll({ type: "window" })) client.postMessage({ type: "CACHE_ERROR" });
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  if (request.mode === "navigate" && (isPage(url) || url.pathname === "/offline.html")) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        const response = await fetch(request, { signal: AbortSignal.timeout(5000) });
        if (response.ok) {
          const copy = response.clone();
          event.waitUntil(cacheResponse(cache, pageRequest(url.href), copy).catch(reportCacheError));
          return response;
        }
        if (response.status < 500) return response;
      } catch (error) {
        // Network loss is expected here; user-visible offline status/fallback explains it.
        if (!(error instanceof TypeError || error.name === "TimeoutError" || error.name === "AbortError")) throw error;
      }
      return await cache.match(pageRequest(url.href)) || await cache.match("/offline.html") || Response.error();
    })());
  } else if (isAsset(url)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const saved = await cache.match(request);
      if (saved) return saved;
      const response = await fetch(request);
      event.waitUntil(cacheResponse(cache, request, response).catch(reportCacheError));
      return response;
    })());
  }
  // Never cache App Router RSC/prefetch variants, APIs, mutations, or external URLs.
  // Next falls back to document navigation when an offline RSC request fails.
});
