import "fake-indexeddb/auto";
import { openDB } from "idb";
import assert from "node:assert/strict";
import test from "node:test";
import { DB_NAME, DB_VERSION, STORES, openScanCartDatabase } from "../src/lib/db/database.ts";
import { loadShoppingState } from "../src/lib/db/shopping.ts";
import { getShoppingHistory } from "../src/lib/db/shopping-history.ts";

test("upgrading a populated Phase 8 v1 database to v2 preserves every source record and key", async () => {
  const legacy = await openDB(DB_NAME, 1, { upgrade(db) {
    const products = db.createObjectStore("products", { keyPath: "id" });
    products.createIndex("barcode", "barcode", { unique: true });
    db.createObjectStore("basket", { keyPath: "id" });
    db.createObjectStore("sessions");
    const prices = db.createObjectStore("priceHistory", { keyPath: "id" });
    prices.createIndex("productTime", ["productId", "recordedAt"]);
    prices.createIndex("sessionProduct", ["sessionId", "productId"]);
  } });
  const time = "2026-10-21T09:00:00.000Z";
  const source = {
    products: [{ id: "p1", barcode: "0123456789012", name: "Milk", brand: "A", category: "Dairy", lastPrice: 9500, createdAt: time, updatedAt: time }],
    basket: [{ id: "b1", productId: "p1", barcode: "0123456789012", name: "Milk", brand: "A", category: "Dairy", price: 9500, quantity: 2, store: "SM Supermarket", position: 0 }],
    sessions: [{ id: "s1", store: "SM Supermarket", budget: 300000, status: "active", startedAt: time, completedAt: null }],
    priceHistory: [{ id: "price1", productId: "p1", sessionId: "s1", price: 9500, store: "SM Supermarket", recordedAt: time }],
  };
  const tx = legacy.transaction(Object.keys(source), "readwrite");
  for (const [name, records] of Object.entries(source)) {
    for (const record of records) await tx.objectStore(name).put(record, name === "sessions" ? "active" : undefined);
  }
  await tx.done;
  legacy.close();
  const upgraded = await openScanCartDatabase();
  assert.equal(DB_VERSION, 2);
  assert.equal(upgraded.version, 2);
  assert.ok(upgraded.objectStoreNames.contains(STORES.shoppingHistory));
  for (const [name, records] of Object.entries(source)) assert.deepEqual(await upgraded.getAll(name), records, name);
  assert.deepEqual(await upgraded.getAllKeys("sessions"), ["active"]);
  assert.deepEqual(await getShoppingHistory(), []);
  assert.equal((await loadShoppingState()).activeSession.items[0].quantity, 2);
  assert.equal((await loadShoppingState()).activeSession.budget, 300000);
  assert.equal((await loadShoppingState()).products[0].barcode, "0123456789012");
});
