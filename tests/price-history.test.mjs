import "fake-indexeddb/auto";
import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";
import { clearScanCartData, DB_VERSION, openScanCartDatabase, STORES } from "../src/lib/db/database.ts";
import { addPriceRecord, getLatestPriceForProduct, getPriceHistoryForProduct } from "../src/lib/db/price-history.ts";
import { createProduct, deleteProduct, getProductById } from "../src/lib/db/products.ts";
import { commitShoppingAction, loadShoppingState } from "../src/lib/db/shopping.ts";
import { getShoppingHistory } from "../src/lib/db/shopping-history.ts";
import { createSession } from "../src/lib/shopping/session.ts";
import { calculateProductPriceAnalytics, getComparisonPrice, calculatePriceDifference } from "../src/lib/shopping/price-analytics.ts";

const timestamp = "2026-10-01T09:00:00.000Z";
const product = { id: "milk", barcode: "0123456789012", name: "Fresh Milk", brand: "Brand A", category: "Dairy", lastPrice: 9500, createdAt: timestamp, updatedAt: timestamp };
const record = (id, price, recordedAt, store = "SM") => ({ id, productId: "milk", store, price, recordedAt });
const start = (id = "trip", store = "SM") => commitShoppingAction({ type: "start", session: createSession({ store, budget: 300000 }, id, timestamp) }, null);
const add = (price = 9500, trip = "trip", id = "r1") => commitShoppingAction({
  type: "product", product: { ...product, lastPrice: price, updatedAt: new Date().toISOString() }, quantity: 1, basketId: "row",
}, trip, id);
beforeEach(async () => { await clearScanCartData(); });

test("Phase 10 retains schema v2 and existing productTime index", async () => {
  const db = await openScanCartDatabase();
  assert.equal(DB_VERSION, 2);
  assert.equal(db.version, 2);
  assert.deepEqual([...db.objectStoreNames], ["basket", "priceHistory", "products", "sessions", "shoppingHistory"]);
  assert.deepEqual(db.transaction(STORES.priceHistory).store.index("productTime").keyPath, ["productId", "recordedAt"]);
});

test("repository latest price uses timestamps not insertion order with deterministic ties", async () => {
  await createProduct(product);
  await addPriceRecord(record("z", 9900, "2026-10-15T00:00:00.000Z"));
  await addPriceRecord(record("old", 9200, "2026-10-01T00:00:00.000Z"));
  await addPriceRecord(record("a", 9700, "2026-10-15T00:00:00.000Z", "Puregold"));
  assert.equal((await getLatestPriceForProduct("milk")).id, "a");
  assert.equal(await getLatestPriceForProduct("missing"), undefined);
});

test("viewing and recalculating history never writes products, prices, baskets or receipts", async () => {
  await start();
  await add();
  const db = await openScanCartDatabase();
  const readAll = async () => Object.fromEntries(await Promise.all(Object.values(STORES).map(async s => [s, await db.getAll(s)])));
  const before = await readAll();
  for (let index = 0; index < 4; index++) {
    await getProductById("milk");
    calculateProductPriceAnalytics(await getPriceHistoryForProduct("milk"));
    await getLatestPriceForProduct("milk");
  }
  assert.deepEqual(await readAll(), before);
});

test("manual and known-product confirmations share records, baseline predates new price, duplicates are suppressed", async () => {
  await start();
  await add();
  const before = await getPriceHistoryForProduct("milk");
  const baseline = getComparisonPrice(before, "SM");
  assert.equal(calculatePriceDifference(9900, baseline.price), 400);
  await Promise.all([add(9900, "trip", "r2"), add(9900, "trip", "r3")]);
  const after = await getPriceHistoryForProduct("milk");
  assert.equal(after.length, 2);
  assert.equal(calculateProductPriceAnalytics(after).latest.price, 9900);
  assert.equal(calculateProductPriceAnalytics(after).previous.price, 9500);
  assert.equal(baseline.price, 9500);
  assert.equal(before.length, 1);
  await commitShoppingAction({ type: "end" }, "trip");
  await start("next", "Puregold - Makati");
  await add(7500, "next", "r4");
  assert.equal((await getLatestPriceForProduct("milk")).store, "Puregold - Makati");
});

test("future price records and product deletion preserve completed receipts and orphan prices", async () => {
  await start();
  await add();
  await commitShoppingAction({ type: "end" }, "trip");
  const before = await getShoppingHistory();
  await start("next", "Puregold");
  await add(11000, "next", "r2");
  assert.deepEqual(await getShoppingHistory(), before);
  assert.equal(before[0].items[0].price, 9500);
  await commitShoppingAction({ type: "basket", action: { type: "remove", id: "row" } }, "next");
  await deleteProduct("milk");
  assert.equal(await getProductById("milk"), undefined);
  assert.equal((await getPriceHistoryForProduct("milk")).length, 2);
  assert.deepEqual(await getShoppingHistory(), before);
  assert.equal((await loadShoppingState()).activeSession.store, "Puregold");
});

test("corrupt persisted timestamp rejects loading rather than fabricating analytics or repairing data", async () => {
  await createProduct(product);
  const db = await openScanCartDatabase();
  await db.put(STORES.priceHistory, record("corrupt", 9500, "invalid"));
  await assert.rejects(getPriceHistoryForProduct("milk"), /timestamp/);
  assert.equal((await db.get(STORES.priceHistory, "corrupt")).recordedAt, "invalid");
});
