import assert from "node:assert/strict";
import test from "node:test";
import vm from "node:vm";
import { readFile } from "node:fs/promises";
import { applicationAssets, corePages } from "../scripts/build-pwa.mjs";
import manifest from "../src/app/manifest.ts";

const workerSource = await readFile(new URL("../src/lib/pwa/service-worker.js", import.meta.url), "utf8");
const origin = "https://scancart.test";
const cacheName = "scancart-shell-test-build";
const html = '<html><script src="/_next/static/chunks/app.js"></script><link href="/_next/static/chunks/app.css" rel="stylesheet"></html>';
function harness() {
  const handlers = new Map();
  const stores = new Map();
  const messages = [];
  const deleted = [];
  let network = true, status = 200, claimed = 0, skipped = 0;
  const fetched = [];
  const key = (request) => new URL(typeof request === "string" ? request : request.url, origin).href;
  const fetcher = async (request) => {
    if (!network) throw new TypeError("Network unavailable");
    const url = key(request);
    fetched.push(url);
    return new Response(url.endsWith(".js") ? "script" : html, {
      status, headers: { "content-type": url.endsWith(".js") ? "application/javascript" : "text/html" },
    });
  };
  const cache = () => {
    const values = new Map();
    return {
      async put(request, response) { values.set(key(request), response.clone()); },
      async match(request) { return values.get(key(request))?.clone(); },
      async add(request) {
        const response = await fetcher(request);
        if (!response.ok) throw Error("Bad resource");
        values.set(key(request), response);
      },
      async addAll(requests) { for (const request of requests) await this.add(request); },
      values,
    };
  };
  const caches = {
    async open(name) { if (!stores.has(name)) stores.set(name, cache()); return stores.get(name); },
    async keys() { return [...stores.keys()]; },
    async delete(name) { deleted.push(name); return stores.delete(name); },
  };
  const self = {
    location: { origin }, addEventListener: (name, listener) => handlers.set(name, listener),
    clients: { claim: async () => { claimed++; }, matchAll: async () => [{ postMessage: (message) => messages.push(message) }] },
    skipWaiting: async () => { skipped++; },
  };
  vm.runInNewContext(workerSource, {
    CONFIG: { version: "test-build", pages: corePages, assets: ["/offline.html", "/icons/icon-192.png"] },
    self, caches, fetch: fetcher, Request, Response, URL, TypeError, AbortSignal,
    console: { error() {} },
  });
  async function dispatch(type, input = {}) {
    const pending = [];
    let response;
    handlers.get(type)({ ...input, waitUntil: (promise) => pending.push(promise), respondWith: (promise) => { response = promise; } });
    const result = await response;
    for (const promise of pending) await promise;
    return result;
  }
  return {
    dispatch, caches, stores, messages, deleted, fetched,
    offline: () => { network = false; }, status: (value) => { status = value; },
    claimed: () => claimed, skipped: () => skipped,
  };
}

test("manifest is branded, scoped, standalone and references correctly sized local PNG icons", async () => {
  const data = manifest();
  assert.equal(data.name, "ScanCart");
  assert.equal(data.short_name, "ScanCart");
  assert.equal(data.id, "/");
  assert.equal(data.start_url, "/");
  assert.equal(data.scope, "/");
  assert.equal(data.display, "standalone");
  assert.equal(data.orientation, undefined);
  assert.equal(data.theme_color, "#173f32");
  assert.equal(data.background_color, "#f8f9f5");
  for (const icon of data.icons) {
    const png = await readFile(new URL(`../public${icon.src}`, import.meta.url));
    assert.equal(png.subarray(1, 4).toString(), "PNG");
    assert.equal(`${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`, icon.sizes);
  }
  const apple = await readFile(new URL("../public/icons/apple-touch-icon.png", import.meta.url));
  assert.equal(apple.readUInt32BE(16), 180);
  const favicon = await readFile(new URL("../src/app/favicon.ico", import.meta.url));
  assert.equal(favicon.readUInt16LE(2), 1);
  assert.equal(favicon.readUInt16LE(4), 1);
  assert.equal(favicon[6], 192);
  const brandedPng = await readFile(new URL("../public/icons/icon-192.png", import.meta.url));
  assert.deepEqual(favicon.subarray(favicon.readUInt32LE(18)), brandedPng);
  assert.ok(data.icons.some(icon => icon.purpose === "maskable"));
});

test("production and Vercel builds include service-worker generation", async () => {
  const pkg = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
  const vercel = JSON.parse(await readFile(new URL("../vercel.json", import.meta.url), "utf8"));
  assert.equal(pkg.scripts.build, "next build && node scripts/build-pwa.mjs");
  assert.equal(vercel.buildCommand, "npm run build");
});

test("asset discovery includes only local Next static scripts/styles and deduplicates", () => {
  assert.deepEqual(applicationAssets(`${html}<script src="/_next/static/chunks/app.js"></script><a href="/basket">Basket</a><script src="https://other.test/js"></script>`),
    ["/_next/static/chunks/app.js", "/_next/static/chunks/app.css"]);
});

test("worker installs the core shell without forcing updates or reading IndexedDB", async () => {
  const h = harness();
  await h.dispatch("install");
  const cache = await h.caches.open(cacheName);
  for (const page of corePages) assert.ok(await cache.match(page));
  assert.ok(await cache.match("/_next/static/chunks/app.js"));
  assert.equal(h.skipped(), 0);
  assert.doesNotMatch(workerSource, /indexedDB|deleteDatabase|localStorage/);
});

test("activation removes only obsolete ScanCart shell caches and claims clients", async () => {
  const h = harness();
  await h.caches.open("unrelated-application");
  await h.caches.open("scancart-shell-previous");
  await h.caches.open(cacheName);
  await h.dispatch("activate");
  assert.deepEqual(h.deleted, ["scancart-shell-previous"]);
  assert.equal(h.claimed(), 1);
  assert.ok(h.stores.has("unrelated-application"));
});

test("only explicit SKIP_WAITING activates a pending update", async () => {
  const h = harness();
  await h.dispatch("message", { data: { type: "OTHER" } });
  assert.equal(h.skipped(), 0);
  await h.dispatch("message", { data: { type: "SKIP_WAITING" } });
  assert.equal(h.skipped(), 1);
});

test("online document is cached and offline reload returns it; uncached details use offline fallback", async () => {
  const h = harness();
  await h.dispatch("install");
  const nav = (path) => ({ url: origin + path, method: "GET", mode: "navigate" });
  // Use a real Request for online fetch-cache behavior.
  const response = await h.dispatch("fetch", { request: Object.defineProperty(new Request(origin + "/basket"), "mode", { value: "navigate" }) });
  assert.equal(response.status, 200);
  h.offline();
  const cached = await h.dispatch("fetch", { request: nav("/basket") });
  assert.equal(await cached.text(), html);
  const fallback = await h.dispatch("fetch", { request: nav("/history/unvisited") });
  assert.equal(await fallback.text(), html);
});

test("asset requests are cache-first and RSC, API, external and mutation requests are excluded", async () => {
  const h = harness();
  await h.dispatch("install");
  h.offline();
  const cached = await h.dispatch("fetch", { request: new Request(origin + "/_next/static/chunks/app.js") });
  assert.equal(await cached.text(), "script");
  for (const request of [
    new Request(origin + "/basket?_rsc=123", { headers: { RSC: "1" } }),
    new Request(origin + "/api/future"),
    new Request("https://qr-url.test/script.js"),
    new Request(origin + "/basket", { method: "POST" }),
  ]) assert.equal(await h.dispatch("fetch", { request }), undefined);
});

test("only allowed same-origin pages are prepared and cache failures are explicitly reported", async () => {
  const h = harness();
  const replies = [];
  const port = { postMessage: (reply) => replies.push(reply) };
  for (const path of ["https://unrelated.test/basket", "/api/future", "/basket?arbitrary=1"]) {
    await h.dispatch("message", { data: { type: "CACHE_PAGE", path }, ports: [port] });
  }
  assert.equal(h.fetched.length, 0);
  await h.dispatch("message", { data: { type: "CACHE_PAGE", path: "/products/milk/prices" }, ports: [port] });
  assert.equal(replies[0].ok, true);
  assert.ok(await (await h.caches.open(cacheName)).match("/products/milk/prices"));
  h.offline();
  await h.dispatch("message", { data: { type: "CACHE_PAGE", path: "/history/trip" }, ports: [port] });
  assert.equal(replies[1].ok, false);
});

test("install fails explicitly when required shell cannot be fetched", async () => {
  const h = harness();
  h.status(500);
  await assert.rejects(h.dispatch("install"), /Bad resource/);
  assert.equal(h.skipped(), 0);
});

test("a failed refresh acknowledges a previously cached page instead of claiming its offline copy is missing", async () => {
  const h = harness();
  await h.dispatch("install");
  h.offline();
  const replies = [];
  await h.dispatch("message", { data: { type: "CACHE_PAGE", path: "/basket" }, ports: [{ postMessage: (reply) => replies.push(reply) }] });
  assert.equal(replies[0].ok, true);
  assert.equal(replies[0].cached, true);
});
