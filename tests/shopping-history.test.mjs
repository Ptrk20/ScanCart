import "fake-indexeddb/auto";
import { IDBObjectStore } from "fake-indexeddb";
import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";
import { clearScanCartData, openScanCartDatabase, STORES } from "../src/lib/db/database.ts";
import { commitShoppingAction, loadShoppingState, SessionChangedError } from "../src/lib/db/shopping.ts";
import { clearShoppingHistory, deleteShoppingHistory, getShoppingHistory, getShoppingHistoryById, saveShoppingHistory } from "../src/lib/db/shopping-history.ts";
import { deleteProduct, getAllProducts, updateProduct } from "../src/lib/db/products.ts";
import { getPriceHistoryForProduct } from "../src/lib/db/price-history.ts";
import { createShoppingHistorySnapshot } from "../src/lib/shopping/history.ts";
import { createSession } from "../src/lib/shopping/session.ts";
import { calculateBudget } from "../src/lib/shopping/budget.ts";
import { assertShoppingHistory } from "../src/lib/db/validation.ts";
import { formatShoppingDate, formatShoppingDateTime } from "../src/lib/utils/date.ts";

const startedAt = "2026-10-21T09:00:00.000Z";
const completedAt = "2026-10-21T10:00:00.000Z";
const milk = { id: "milk-row", productId: "milk", barcode: "0123456789012", name: "Fresh Milk", brand: "Brand A", category: "Dairy", price: 9500, quantity: 2, store: "SM Supermarket" };
const bread = { id: "bread-row", name: "Bread", brand: "", price: 7500, quantity: 1, store: "SM Supermarket" };
const session = (id = "trip", budget = 300000, items = [milk, bread]) => ({
  ...createSession({ store: "SM Supermarket", budget }, id, startedAt), items: items.map((item) => ({ ...item })),
});
const snapshot = (id = "trip", time = completedAt) => createShoppingHistorySnapshot(session(id), time);

beforeEach(async () => { await clearScanCartData(); });

async function populate(id = "trip", budget = 300000) {
  await commitShoppingAction({ type: "start", session: session(id, budget, []) }, null);
  const product = { id: "milk", barcode: milk.barcode, name: milk.name, brand: milk.brand, category: milk.category, lastPrice: milk.price, createdAt: startedAt, updatedAt: startedAt };
  await commitShoppingAction({ type: "product", product, quantity: milk.quantity, basketId: milk.id }, id, `${id}-price`);
  await commitShoppingAction({ type: "basket", action: { type: "add", id: bread.id, item: bread } }, id);
}

test("pure snapshot owns item values, exact totals, store, original budget and distinct counts", () => {
  const source = session();
  source.items.forEach(Object.freeze);
  Object.freeze(source.items);
  Object.freeze(source);
  const receipt = createShoppingHistorySnapshot(source, completedAt);
  assert.equal(receipt.id, source.id);
  assert.equal(receipt.status, "completed");
  assert.equal(receipt.total, 26500);
  assert.equal(receipt.productCount, 2);
  assert.equal(receipt.itemCount, 3);
  assert.equal(receipt.budget, 300000);
  assert.equal(receipt.startedAt, startedAt);
  assert.equal(receipt.completedAt, completedAt);
  assert.deepEqual(JSON.parse(JSON.stringify(receipt.items)), source.items);
  assert.notEqual(receipt.items, source.items);
  assert.notEqual(receipt.items[0], source.items[0]);
  receipt.items[0].name = "Changed snapshot";
  assert.equal(source.items[0].name, "Fresh Milk");
});

test("historical quantities and centavo subtotals use snapshots, including free items", () => {
  const receipt = createShoppingHistorySnapshot(session("exact", 30, [
    { ...milk, quantity: 1, price: 10 },
    { ...bread, price: 20 },
    { ...milk, id: "free", name: "Free Sample", price: 0, quantity: 2 },
  ]), completedAt);
  assert.equal(receipt.total, 30);
  assert.equal(receipt.productCount, 3);
  assert.equal(receipt.itemCount, 4);
  assert.equal(calculateBudget(receipt.budget, receipt.items).remaining, 0);
  assert.equal(calculateBudget(receipt.budget, receipt.items).overBudgetBy, 0);
  const quantity = createShoppingHistorySnapshot(session("three", null, [{ ...milk, quantity: 3 }]), completedAt);
  assert.equal(quantity.total, 28500);
  assert.equal(quantity.itemCount, 3);
});

test("over-budget, exact, unlimited and zero-budget semantics survive snapshots", () => {
  for (const [budget, price, remaining, over] of [[300000, 315000, -15000, 15000], [300000, 300000, 0, 0], [null, 50000, null, 0], [0, 0, 0, 0], [0, 1, -1, 1]]) {
    const receipt = createShoppingHistorySnapshot(session("budget", budget, [{ ...milk, price, quantity: 1 }]), completedAt);
    const summary = calculateBudget(receipt.budget, receipt.items);
    assert.equal(summary.remaining, remaining);
    assert.equal(summary.overBudgetBy, over);
  }
});

test("snapshot rejects corrupt data, inconsistent stores, unsafe arithmetic and invalid completion times", () => {
  for (const source of [
    session("bad", -1),
    session("bad", null, [{ ...milk, quantity: 0 }]),
    session("bad", null, [{ ...milk, price: NaN }]),
    session("bad", null, [{ ...milk, price: Infinity }]),
    session("bad", null, [{ ...milk, price: Number.MAX_SAFE_INTEGER, quantity: 2 }]),
    session("bad", null, [{ ...milk, store: "Wrong Store" }]),
    session("bad", null, [milk, milk]),
  ]) assert.throws(() => createShoppingHistorySnapshot(source, completedAt));
  for (const time of ["invalid", "", "2026-10-20T10:00:00.000Z"]) {
    assert.throws(() => createShoppingHistorySnapshot(session(), time));
  }
  assert.throws(() => assertShoppingHistory({ ...snapshot(), total: 1 }));
  assert.throws(() => assertShoppingHistory({ ...snapshot(), itemCount: 2 }));
});

test("completing normal session atomically saves 265 receipt before clearing active data", async () => {
  await populate();
  const priceBefore = await getPriceHistoryForProduct("milk");
  const next = await commitShoppingAction({ type: "end" }, "trip");
  const receipt = await getShoppingHistoryById("trip");
  assert.equal(receipt.total, 26500);
  assert.equal(receipt.productCount, 2);
  assert.equal(receipt.itemCount, 3);
  assert.deepEqual(JSON.parse(JSON.stringify(receipt.items)), session().items);
  assert.equal(next.activeSession, null);
  assert.equal(next.successMessage, "Shopping trip saved.");
  assert.equal((await loadShoppingState()).activeSession, null);
  assert.equal(await (await openScanCartDatabase()).count(STORES.basket), 0);
  assert.equal((await getAllProducts()).length, 1);
  assert.deepEqual(await getPriceHistoryForProduct("milk"), priceBefore);
});

test("empty trip ends without history, but free items still produce a receipt", async () => {
  assert.equal(createShoppingHistorySnapshot(session("empty", null, []), completedAt), undefined);
  await commitShoppingAction({ type: "start", session: session("empty", null, []) }, null);
  const ended = await commitShoppingAction({ type: "end" }, "empty");
  assert.match(ended.successMessage, /Empty shopping session ended/);
  assert.equal(ended.activeSession, null);
  assert.deepEqual(await getShoppingHistory(), []);
  await commitShoppingAction({ type: "start", session: session("free", 0, []) }, null);
  await commitShoppingAction({ type: "basket", action: { type: "add", id: "free-row", item: { ...bread, price: 0, quantity: 2 } } }, "free");
  await commitShoppingAction({ type: "end" }, "free");
  const free = await getShoppingHistoryById("free");
  assert.equal(free.total, 0);
  assert.equal(free.itemCount, 2);
  assert.equal(free.items.length, 1);
});

test("history save failure retains active session and basket for retry", async (t) => {
  await populate();
  const before = await loadShoppingState();
  const add = IDBObjectStore.prototype.add;
  const fail = t.mock.method(IDBObjectStore.prototype, "add", function (...args) {
    if (this.name === STORES.shoppingHistory) throw new DOMException("Test quota", "QuotaExceededError");
    return add.apply(this, args);
  });
  await assert.rejects(commitShoppingAction({ type: "end" }, "trip"), /Test quota/);
  fail.mock.restore();
  assert.deepEqual(await loadShoppingState(), before);
  assert.deepEqual(await getShoppingHistory(), []);
  await commitShoppingAction({ type: "end" }, "trip");
  assert.equal((await getShoppingHistory()).length, 1);
});

test("failure clearing active basket rolls back the already-written receipt too", async (t) => {
  await populate();
  const before = await loadShoppingState();
  const clear = IDBObjectStore.prototype.clear;
  const fail = t.mock.method(IDBObjectStore.prototype, "clear", function (...args) {
    if (this.name === STORES.basket) throw new DOMException("Test clear failure", "UnknownError");
    return clear.apply(this, args);
  });
  await assert.rejects(commitShoppingAction({ type: "end" }, "trip"), /Test clear failure/);
  fail.mock.restore();
  assert.deepEqual(await loadShoppingState(), before);
  assert.deepEqual(await getShoppingHistory(), []);
});

test("rapid and cross-tab completions create exactly one immutable receipt", async () => {
  await populate();
  const outcomes = await Promise.allSettled(Array.from({ length: 5 }, () => commitShoppingAction({ type: "end" }, "trip")));
  assert.equal(outcomes.filter((result) => result.status === "fulfilled").length, 1);
  assert.equal(outcomes.filter((result) => result.status === "rejected" && result.reason instanceof SessionChangedError).length, 4);
  const receipts = await getShoppingHistory();
  assert.equal(receipts.length, 1);
  await assert.rejects(commitShoppingAction({ type: "end" }, null), /no active shopping session/);
  await assert.rejects(saveShoppingHistory({ ...receipts[0], total: 0 }));
  await assert.rejects(saveShoppingHistory(receipts[0]), /constraint/i);
  assert.deepEqual(await getShoppingHistory(), receipts);
});

test("history remains independent after product edits, deletion and future budgets", async () => {
  await populate();
  await commitShoppingAction({ type: "end" }, "trip");
  const before = await getShoppingHistoryById("trip");
  const product = (await getAllProducts())[0];
  await updateProduct({ ...product, name: "New Milk", brand: "Brand B", lastPrice: 11000, updatedAt: completedAt });
  assert.deepEqual(await getShoppingHistoryById("trip"), before);
  await deleteProduct("milk");
  assert.deepEqual(await getShoppingHistoryById("trip"), before);
  await commitShoppingAction({ type: "start", session: { ...session("new-trip", 50000, []), store: "Puregold" } }, null);
  const state = await loadShoppingState();
  assert.deepEqual((await getShoppingHistory())[0], before);
  assert.deepEqual(await loadShoppingState(), state, "viewing receipt cannot alter the new session");
});

test("history repository sorts explicit dates newest first with a deterministic ID tie-break", async () => {
  await saveShoppingHistory(snapshot("middle", "2026-10-22T10:00:00.000Z"));
  await saveShoppingHistory(snapshot("old", "2026-10-21T10:00:00.000Z"));
  await saveShoppingHistory(snapshot("new", "2026-10-23T10:00:00.000Z"));
  await saveShoppingHistory(snapshot("a-tie", "2026-10-23T10:00:00.000Z"));
  assert.deepEqual((await getShoppingHistory()).map((trip) => trip.id), ["a-tie", "new", "middle", "old"]);
  assert.equal(await getShoppingHistoryById("missing"), undefined);
});

test("delete and internal history-only clear preserve products, prices, other trips and active basket", async () => {
  await populate();
  await saveShoppingHistory(snapshot("old"));
  await saveShoppingHistory(snapshot("other"));
  const before = await loadShoppingState();
  const prices = await getPriceHistoryForProduct("milk");
  await deleteShoppingHistory("old");
  assert.equal(await getShoppingHistoryById("old"), undefined);
  assert.equal((await getShoppingHistory())[0].id, "other");
  assert.deepEqual(await loadShoppingState(), before);
  assert.deepEqual(await getPriceHistoryForProduct("milk"), prices);
  await clearShoppingHistory();
  assert.deepEqual(await getShoppingHistory(), []);
  assert.deepEqual(await loadShoppingState(), before);
  assert.deepEqual(await getPriceHistoryForProduct("milk"), prices);
});

test("delete failures retain receipts and corrupted history rejects with no destructive repair", async (t) => {
  await saveShoppingHistory(snapshot());
  const remove = IDBObjectStore.prototype.delete;
  const fail = t.mock.method(IDBObjectStore.prototype, "delete", function (...args) {
    if (this.name === STORES.shoppingHistory) throw new DOMException("Test delete failure", "UnknownError");
    return remove.apply(this, args);
  });
  await assert.rejects(deleteShoppingHistory("trip"), /Test delete failure/);
  fail.mock.restore();
  assert.ok(await getShoppingHistoryById("trip"));
  const db = await openScanCartDatabase();
  await db.put(STORES.shoppingHistory, { ...snapshot("corrupt"), completedAt: "invalid" });
  await assert.rejects(getShoppingHistory(), /timestamp/);
  await assert.rejects(getShoppingHistoryById("corrupt"), /timestamp/);
  assert.equal((await db.get(STORES.shoppingHistory, "corrupt")).completedAt, "invalid");
  assert.equal((await loadShoppingState()).activeSession, null, "history corruption does not prevent shopping hydration");
});

test("date formatting is locale-aware and respects the runtime's local timezone", () => {
  assert.equal(formatShoppingDate(completedAt), new Intl.DateTimeFormat("en-PH", { year: "numeric", month: "long", day: "numeric" }).format(new Date(completedAt)));
  assert.equal(formatShoppingDateTime(completedAt), new Intl.DateTimeFormat("en-PH", { year: "numeric", month: "long", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(completedAt)));
  assert.throws(() => formatShoppingDate("invalid"), /Invalid shopping date/);
  assert.throws(() => formatShoppingDateTime("invalid"), /Invalid shopping date/);
});
