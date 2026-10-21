import "fake-indexeddb/auto";
import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";
import { ACTIVE_SESSION_KEY, DB_NAME, DB_VERSION, INDEXES, STORES, clearScanCartData, openScanCartDatabase, withTransaction } from "../src/lib/db/database.ts";
import * as products from "../src/lib/db/products.ts";
import * as basket from "../src/lib/db/basket.ts";
import * as sessions from "../src/lib/db/sessions.ts";
import * as prices from "../src/lib/db/price-history.ts";
import { commitShoppingAction, loadShoppingState } from "../src/lib/db/shopping.ts";
import { createProduct, normalizeBarcode, validateProduct } from "../src/lib/shopping/product.ts";
import { createSession } from "../src/lib/shopping/session.ts";
import { calculateBudget } from "../src/lib/shopping/budget.ts";
import { findScannedProduct } from "../src/lib/scanner/lookup.ts";

const timestamp = "2026-10-21T09:00:00.000Z";
const session = (id = "s1", budget = 300000) => createSession({ store: "SM Supermarket", budget }, id, timestamp);
function productAction(overrides = {}, id = "p1", basketId = "b1", time = timestamp) {
  const result = validateProduct({ name: "Fresh Milk", barcode: "4801234567890", brand: "", category: "Dairy", price: "95", quantity: "2", ...overrides });
  assert.equal(result.ok, true);
  return { type: "product", product: createProduct(result.value, id, time), quantity: result.value.quantity, basketId };
}
const start = (budget = 300000) => commitShoppingAction({ type: "start", session: session("s1", budget) }, null);
const add = (overrides, id, basketId, priceId = crypto.randomUUID()) => commitShoppingAction(productAction(overrides, id, basketId), "s1", priceId);
const change = (action, priceId) => commitShoppingAction({ type: "basket", action }, "s1", priceId);

beforeEach(async () => { await clearScanCartData(); });

test("v2 schema retains source stores and adds shopping history without unnecessary indexes", async () => {
  const db = await openScanCartDatabase();
  assert.equal(db.name, DB_NAME);
  assert.equal(db.version, DB_VERSION);
  assert.deepEqual([...db.objectStoreNames], ["basket", "priceHistory", "products", "sessions", "shoppingHistory"]);
  assert.equal(db.transaction(STORES.shoppingHistory).store.keyPath, "id");
  assert.deepEqual([...db.transaction(STORES.shoppingHistory).store.indexNames], []);
  await withTransaction("readonly", async (tx) => {
    assert.equal(tx.objectStore(STORES.products).index(INDEXES.barcode).unique, true);
    assert.deepEqual([...tx.objectStore(STORES.priceHistory).indexNames], ["productTime", "sessionProduct"]);
  });
  assert.equal(await openScanCartDatabase(), db, "one reusable connection");
});

test("empty database loads without an active session or misleading derived records", async () => {
  const state = await loadShoppingState();
  assert.equal(state.activeSession, null);
  assert.deepEqual(state.products, []);
  assert.deepEqual(await basket.getBasketItems(), []);
  assert.equal(await sessions.getActiveSession(), undefined);
});

test("normalization preserves leading zeros and QR content, and rejects blank lookups", async () => {
  assert.equal(normalizeBarcode(" 0123456789012 "), "0123456789012");
  assert.equal(normalizeBarcode(" QR:abc/001 "), "QR:abc/001");
  assert.equal(normalizeBarcode(" "), undefined);
  await assert.rejects(products.findProductByBarcode(" "), /barcode/);
});

test("product CRUD persists exact barcode strings, metadata and centavo values", async () => {
  const product = productAction({ barcode: " 0123456789012 " }).product;
  await products.createProduct(product);
  assert.deepEqual(await products.getProductById("p1"), product);
  assert.deepEqual(await products.getProductByBarcode(" 0123456789012 "), product);
  assert.equal(await products.getProductByBarcode("123456789012"), undefined);
  const updated = { ...product, lastPrice: 9900, brand: "New brand", updatedAt: "2026-10-21T10:00:00.000Z" };
  await products.updateProduct(updated);
  assert.deepEqual(await products.getAllProducts(), [updated]);
  await assert.rejects(products.createProduct({ ...product, id: "duplicate" }), /constraint/i);
  await products.deleteProduct("p1");
  assert.deepEqual(await products.getAllProducts(), []);
  await assert.rejects(products.updateProduct(product), /no longer exists/);
});

test("no-barcode products with identical names remain distinct", async () => {
  await start();
  await add({ name: "Fresh Pandesal", barcode: "", price: "5", quantity: "1" }, "p1", "b1");
  await add({ name: "Fresh Pandesal", barcode: " ", price: "5", quantity: "1" }, "p2", "b2");
  const state = await loadShoppingState();
  assert.equal(state.products.length, 2);
  assert.ok(state.products.every((product) => product.barcode === undefined));
  assert.equal(state.activeSession.items.length, 2);
});

test("session and basket restore source data and recalculate 265 total / 2735 remaining", async () => {
  await start();
  await add();
  await add({ name: "Bread", barcode: "bread-code", price: "75", quantity: "1" }, "p2", "b2");
  const restored = await loadShoppingState();
  assert.equal(restored.activeSession.store, "SM Supermarket");
  assert.equal(restored.activeSession.budget, 300000);
  assert.equal(restored.activeSession.items.length, 2);
  const summary = calculateBudget(restored.activeSession.budget, restored.activeSession.items);
  assert.equal(summary.total, 26500);
  assert.equal(summary.remaining, 273500);
  assert.equal(summary.itemCount, 3);
  const savedSession = await sessions.getActiveSession();
  assert.equal("items" in savedSession, false);
  for (const record of [savedSession, ...(await basket.getBasketItems()), ...(await products.getAllProducts())]) {
    for (const derived of ["total", "subtotal", "itemCount", "productCount", "remaining", "usagePercentage", "statusSummary"]) {
      assert.equal(derived in record, false, derived);
    }
  }
});

test("existing barcode updates ID and creation timestamp, merges quantity and reprices", async () => {
  await start();
  await add();
  const action = productAction({ price: "99", brand: "Updated", category: "New", quantity: "1" }, "p2", "b2", "2026-10-21T10:00:00.000Z");
  await commitShoppingAction(action, "s1", "r2");
  const saved = await products.getAllProducts();
  assert.equal(saved.length, 1);
  assert.equal(saved[0].id, "p1");
  assert.equal(saved[0].createdAt, timestamp);
  assert.equal(saved[0].updatedAt, "2026-10-21T10:00:00.000Z");
  assert.equal(saved[0].lastPrice, 9900);
  assert.equal(saved[0].brand, "Updated");
  assert.equal(saved[0].category, "New");
  const items = await basket.getBasketItems();
  assert.equal(items.length, 1);
  assert.equal(items[0].price, 9900);
  assert.equal(items[0].quantity, 3);
  assert.equal(items[0].productId, "p1");
});

test("concurrent additions of the same barcode cannot create duplicate products or price records", async () => {
  await start();
  await Promise.all([add({}, "p1", "b1"), add({}, "p2", "b2")]);
  assert.equal((await products.getAllProducts()).length, 1);
  const items = await basket.getBasketItems();
  assert.equal(items.length, 1);
  assert.equal(items[0].quantity, 4);
  assert.equal((await prices.getPriceHistoryForProduct(items[0].productId)).length, 1);
});

test("scanner lookup and cancel are read-only; confirming 95x1 then 99x2 persists one row at 297", async () => {
  await start();
  await add({ barcode: "0123456789012", quantity: "1" });
  const before = await loadShoppingState();
  const recordsBefore = await prices.getPriceHistoryForProduct("p1");
  for (let i = 0; i < 3; i++) {
    assert.equal((await products.findProductByBarcode(" 0123456789012 ")).id, "p1");
  }
  assert.equal(await products.findProductByBarcode("unknown-code"), undefined);
  assert.deepEqual(await loadShoppingState(), before);
  assert.deepEqual(await prices.getPriceHistoryForProduct("p1"), recordsBefore);
  await add({ barcode: "0123456789012", quantity: "2", price: "99" }, "new-id", "new-basket-id", "confirmed-price");
  const restored = await loadShoppingState();
  assert.equal(restored.products.length, 1);
  assert.equal(restored.products[0].id, "p1");
  assert.equal(restored.products[0].barcode, "0123456789012");
  assert.equal(restored.activeSession.items.length, 1);
  assert.equal(restored.activeSession.items[0].quantity, 3);
  assert.equal(calculateBudget(restored.activeSession.budget, restored.activeSession.items).total, 29700);
  assert.deepEqual((await prices.getPriceHistoryForProduct("p1")).map((record) => record.price), [9500, 9900]);
});

test("scanner matches UPC-A/EAN-13 equivalents without changing saved codes; exact matches win", async () => {
  await start();
  await add({ barcode: "0123456789012", quantity: "1" });
  const found = await findScannedProduct("123456789012");
  assert.equal(found.id, "p1");
  assert.equal(found.barcode, "0123456789012");
  const before = await loadShoppingState();
  assert.equal(await findScannedProduct("123456789013"), undefined);
  assert.deepEqual(await loadShoppingState(), before, "alias lookup is read-only");
  await add({ barcode: "123456789012", quantity: "1" }, "p2", "b2");
  assert.equal((await findScannedProduct("123456789012")).id, "p2");
  assert.equal((await findScannedProduct("0123456789012")).id, "p1");
});

test("rapid/concurrent quantities, direct quantity and price edit persist without lost updates", async () => {
  await start();
  await add({ quantity: "1" });
  await Promise.all(Array.from({ length: 10 }, () => change({ type: "increase", id: "b1" })));
  assert.equal((await basket.getBasketItems())[0].quantity, 11);
  await change({ type: "quantity", id: "b1", quantity: 3 });
  await change({ type: "price", id: "b1", price: 9900 }, "edited-price");
  let item = (await basket.getBasketItems())[0];
  assert.equal(item.quantity, 3);
  assert.equal(item.price, 9900);
  assert.equal((await products.getProductById("p1")).lastPrice, 9900);
  await change({ type: "decrease", id: "b1" });
  item = (await basket.getBasketItems())[0];
  assert.equal(item.quantity, 2);
  assert.equal(item.price, 9900);
});

test("remove and clear persist without deleting products or session", async () => {
  await start();
  await add();
  await add({ name: "Bread", barcode: "bread", price: "75", quantity: "1" }, "p2", "b2");
  await change({ type: "remove", id: "b2" });
  assert.deepEqual((await basket.getBasketItems()).map((item) => item.id), ["b1"]);
  await change({ type: "clear" });
  const state = await loadShoppingState();
  assert.deepEqual(state.activeSession.items, []);
  assert.equal(state.products.length, 2);
  assert.equal(state.activeSession.id, "s1");
});

test("basket row order survives hydration and later edits regardless of UUID sort order", async () => {
  await start();
  await add({}, "p1", "z-first");
  await add({ name: "Bread", barcode: "bread", price: "75" }, "p2", "a-second");
  assert.deepEqual((await basket.getBasketItems()).map((item) => item.id), ["z-first", "a-second"]);
  const state = await loadShoppingState();
  assert.deepEqual(state.activeSession.items.map((item) => item.id), ["z-first", "a-second"]);
  await change({ type: "increase", id: "z-first" });
  assert.deepEqual((await basket.getBasketItems()).map((item) => item.id), ["z-first", "a-second"]);
  assert.ok((await basket.getBasketItems()).every((item) => !("position" in item)), "storage-only metadata stays out of domain snapshots");
});

test("end shopping clears only session and basket, and next trip reuses saved product", async () => {
  await start();
  await add();
  await commitShoppingAction({ type: "end" }, "s1");
  let state = await loadShoppingState();
  assert.equal(state.activeSession, null);
  assert.deepEqual(await basket.getBasketItems(), []);
  assert.equal(state.products.length, 1);
  assert.equal((await prices.getPriceHistoryForProduct("p1")).length, 1);
  await commitShoppingAction({ type: "start", session: session("s2") }, null);
  await commitShoppingAction(productAction({ price: "99", quantity: "1" }, "new-product", "new-item"), "s2", "new-price");
  state = await loadShoppingState();
  assert.equal(state.products.length, 1);
  assert.equal(state.products[0].id, "p1");
  assert.equal(state.activeSession.items[0].productId, "p1");
  assert.equal((await prices.getPriceHistoryForProduct("p1")).length, 2);
});

test("price records append only for explicit confirmations, deduplicate unchanged same-session prices", async () => {
  await start();
  await add({}, "p1", "b1", "r1");
  await add({}, "p2", "b2", "r2");
  await loadShoppingState();
  await loadShoppingState();
  await change({ type: "increase", id: "b1" });
  let records = await prices.getPriceHistoryForProduct("p1");
  assert.equal(records.length, 1);
  assert.equal(records[0].store, "SM Supermarket");
  assert.equal(records[0].price, 9500);
  assert.equal(records[0].sessionId, "s1");
  assert.ok(Number.isFinite(Date.parse(records[0].recordedAt)));
  await change({ type: "price", id: "b1", price: 9900 }, "r3");
  await change({ type: "price", id: "b1", price: 9900 }, "r4");
  await change({ type: "price", id: "b1", price: 9500 }, "r5");
  records = await prices.getPriceHistoryForProduct("p1");
  assert.deepEqual(records.map((record) => record.price), [9500, 9900, 9500]);
  assert.equal((await prices.getLatestPriceForProduct("p1")).price, 9500);
  assert.equal(await prices.getLatestPriceForProduct("unknown"), undefined);
});

test("same-millisecond confirmations are ordered deterministically", async () => {
  await start();
  await add({}, "p1", "b1", "r1");
  await add({ price: "99" }, "p2", "b2", "r2");
  await add({ price: "95" }, "p3", "b3", "r3");
  const records = await prices.getPriceHistoryForProduct("p1");
  assert.deepEqual(records.map((record) => record.price), [9500, 9900, 9500]);
  assert.ok(records[0].recordedAt < records[1].recordedAt);
  assert.ok(records[1].recordedAt < records[2].recordedAt);
});

test("failed history write rolls back product, basket and session atomically", async () => {
  await start();
  await add({}, "p1", "b1", "collision");
  const before = await loadShoppingState();
  await assert.rejects(add({ name: "Bread", barcode: "bread", price: "75" }, "p2", "b2", "collision"));
  assert.deepEqual(await loadShoppingState(), before);
  assert.equal((await prices.getPriceHistoryForProduct("p1")).length, 1);
  assert.equal(await products.getProductById("p2"), undefined);
});

test("invalid or overflowing changes do not write partial products or prices", async () => {
  await start();
  await add();
  const before = await loadShoppingState();
  const rejected = await add({ barcode: "overflow", price: "90071992547409.91", quantity: "2" }, "p2", "b2");
  assert.ok(rejected.basketError);
  assert.deepEqual(await loadShoppingState(), before);
  assert.deepEqual(await prices.getPriceHistoryForProduct("p2"), []);
});

test("stale tabs cannot overwrite a different session or revive an ended trip", async () => {
  await start();
  await add();
  await commitShoppingAction({ type: "end" }, "s1");
  await assert.rejects(change({ type: "increase", id: "b1" }), /changed in another tab/);
  await commitShoppingAction({ type: "start", session: session("s2") }, null);
  await assert.rejects(commitShoppingAction({ type: "end" }, "s1"), /changed in another tab/);
  assert.equal((await sessions.getActiveSession()).id, "s2");
});

test("low-level basket/session repositories support source-record CRUD", async () => {
  const product = productAction().product;
  await products.createProduct(product);
  await sessions.saveActiveSession(session());
  const item = { id: "b1", productId: "p1", name: "Milk", brand: "", price: 9500, quantity: 1, store: "SM Supermarket" };
  await basket.saveBasketItem(item);
  await basket.updateBasketItem({ ...item, quantity: 3 });
  assert.equal((await basket.getBasketItems())[0].quantity, 3);
  await assert.rejects(products.deleteProduct("p1"), /active basket/);
  await assert.rejects(sessions.saveActiveSession(session("s2")), /before replacing/);
  await basket.deleteBasketItem("b1");
  assert.deepEqual(await basket.getBasketItems(), []);
  await basket.saveBasketItem(item);
  await basket.clearBasket();
  assert.deepEqual(await basket.getBasketItems(), []);
  await basket.saveBasketItem(item);
  await sessions.clearActiveSession();
  assert.equal(await sessions.getActiveSession(), undefined);
  assert.deepEqual(await basket.getBasketItems(), []);
  assert.equal((await products.getAllProducts()).length, 1);
});

test("explicit price repository appends immutable records and returns latest", async () => {
  await products.createProduct(productAction().product);
  const record = { id: "r1", productId: "p1", store: "Store", price: 9500, recordedAt: timestamp };
  await prices.addPriceRecord(record);
  await prices.addPriceRecord({ ...record, id: "r2", price: 9900, recordedAt: "2026-10-21T10:00:00.000Z" });
  assert.equal((await prices.getLatestPriceForProduct("p1")).price, 9900);
  assert.equal((await prices.getPriceHistoryForProduct("p1"))[0].price, 9500);
  await assert.rejects(prices.addPriceRecord(record));
});

test("hydration rejects corrupt or orphaned records without overwriting data", async () => {
  const db = await openScanCartDatabase();
  await db.put(STORES.basket, { id: "bad", name: "Corrupt", price: NaN, quantity: 0 });
  await assert.rejects(loadShoppingState());
  assert.equal(await db.count(STORES.basket), 1);
  await clearScanCartData();
  await db.put(STORES.basket, { id: "orphan", name: "Orphan", brand: "", price: 0, quantity: 1, store: "Store" });
  await assert.rejects(loadShoppingState(), /no active session/);
});

test("zero and no-budget sessions survive hydration with their distinct semantics", async () => {
  await start(0);
  await add({ price: "0", quantity: "2" });
  let state = await loadShoppingState();
  assert.equal(calculateBudget(state.activeSession.budget, state.activeSession.items).status, "within-budget");
  await change({ type: "price", id: "b1", price: 10 }, "r2");
  state = await loadShoppingState();
  assert.equal(calculateBudget(state.activeSession.budget, state.activeSession.items).overBudgetBy, 20);
  await commitShoppingAction({ type: "end" }, "s1");
  await start(null);
  state = await loadShoppingState();
  assert.equal(state.activeSession.budget, null);
  assert.equal(calculateBudget(state.activeSession.budget, []).status, "no-budget");
});

test("unsupported storage fails explicitly; internal reset clears only ScanCart stores", async () => {
  const saved = globalThis.indexedDB;
  try {
    globalThis.indexedDB = undefined;
    await assert.rejects(loadShoppingState(), /unavailable/);
  } finally { globalThis.indexedDB = saved; }
  await start();
  await add();
  await clearScanCartData();
  const db = await openScanCartDatabase();
  for (const store of Object.values(STORES)) assert.equal(await db.count(store), 0);
  assert.equal(await db.get(STORES.sessions, ACTIVE_SESSION_KEY), undefined);
});

test("database open failures reject and the next attempt can recover", async () => {
  const isolated = await import("../src/lib/db/database.ts?open-failure-test");
  const open = indexedDB.open;
  indexedDB.open = () => { throw new DOMException("Storage denied", "SecurityError"); };
  try {
    await assert.rejects(isolated.openScanCartDatabase(), /Storage denied/);
  } finally { indexedDB.open = open; }
  const db = await isolated.openScanCartDatabase();
  assert.equal(db.name, DB_NAME);
  db.close();
});
