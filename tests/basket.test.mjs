import assert from "node:assert/strict";
import test from "node:test";
import { applyBasketAction, initialShoppingState, shoppingReducer } from "../src/lib/shopping/basket.ts";
import { createSession } from "../src/lib/shopping/session.ts";
import { calculateBudget } from "../src/lib/shopping/budget.ts";

const newSession = (budget = 300000) => createSession({ store: "SM Supermarket", budget }, "session", "2026-10-21T09:00:00.000Z");
const add = (session, id, name, price, quantity, identity = {}) =>
  applyBasketAction(session, { type: "add", id, item: { name, price, quantity, ...identity } });
const summary = (session) => calculateBudget(session.budget, session.items);

test("requested basket scenarios: add, increase, decrease, price edit, remove", () => {
  let session = add(newSession(), "milk", "Milk", 9500, 1);
  assert.equal(summary(session).total, 9500);
  assert.equal(summary(session).remaining, 290500);
  session = applyBasketAction(session, { type: "increase", id: "milk" });
  assert.equal(summary(session).total, 19000);
  assert.equal(summary(session).remaining, 281000);
  session = add(session, "bread", "Bread", 7500, 2);
  assert.equal(summary(session).total, 34000);
  assert.equal(summary(session).itemCount, 4);
  session = applyBasketAction(session, { type: "decrease", id: "bread" });
  assert.equal(summary(session).total, 26500);
  assert.equal(summary(session).itemCount, 3);
  const oneBread = session;
  session = applyBasketAction(session, { type: "decrease", id: "bread" });
  assert.deepEqual(session, oneBread);
  session = applyBasketAction(session, { type: "price", id: "milk", price: 10000 });
  assert.equal(session.items[0].price * session.items[0].quantity, 20000);
  session = applyBasketAction(session, { type: "remove", id: "bread" });
  assert.equal(session.items.length, 1);
  assert.equal(summary(session).total, 20000);
});

test("budget 300 with basket 350 is over budget by 50", () => {
  assert.equal(summary(add(newSession(30000), "milk", "Milk", 35000, 1)).overBudgetBy, 5000);
});

test("identity merges matched products and applies the latest price to all quantities", () => {
  let session = add(newSession(), "one", "Milk", 9500, 1, { barcode: "4801234567890" });
  session = add(session, "two", "Milk", 9500, 2, { barcode: "4801234567890" });
  assert.equal(session.items.length, 1);
  assert.equal(session.items[0].quantity, 3);
  assert.equal(session.items[0].id, "one");
  session = add(session, "three", "Milk", 9900, 1, { barcode: "4801234567890" });
  assert.equal(session.items.length, 1);
  assert.equal(session.items[0].price, 9900);
  assert.equal(session.items[0].quantity, 4);
  session = add(session, "four", "Milk", 9500, 1);
  session = add(session, "five", "Milk", 9500, 1);
  assert.equal(session.items.length, 3, "names alone do not identify a product");
  let byProductId = add(newSession(), "one", "Milk", 9500, 1, { productId: "p1" });
  byProductId = add(byProductId, "two", "Milk", 9500, 1, { productId: "p1" });
  assert.equal(byProductId.items.length, 1);
  byProductId = add(byProductId, "three", "Milk", 9500, 1, { productId: "p2" });
  assert.equal(byProductId.items.length, 2);
});

test("reducer protects state against invalid direct calls and overflow", () => {
  const state = { ...initialShoppingState, activeSession: add(newSession(), "milk", "Milk", 9500, 1) };
  const badActions = [
    { type: "price", id: "milk", price: -1 },
    { type: "price", id: "milk", price: NaN },
    { type: "price", id: "milk", price: 0.5 },
    { type: "quantity", id: "milk", quantity: 0 },
    { type: "quantity", id: "milk", quantity: -1 },
    { type: "quantity", id: "milk", quantity: 1.5 },
    { type: "quantity", id: "milk", quantity: NaN },
    { type: "quantity", id: "milk", quantity: Number.MAX_SAFE_INTEGER },
    { type: "remove", id: "missing" },
    { type: "add", id: "milk", item: { name: "Other", price: 100, quantity: 1 } },
    { type: "add", id: "new", item: { name: " ", price: 100, quantity: 1 } },
    { type: "add", id: "new", item: { name: "Other", price: -1, quantity: 1 } },
    { type: "add", id: "new", item: { name: "Other", price: 100, quantity: 0 } },
    { type: "add", id: "new", item: { name: "Other", price: Number.MAX_SAFE_INTEGER, quantity: 1 } },
  ];
  for (const action of badActions) {
    const result = shoppingReducer(state, { type: "basket", action });
    assert.equal(result.activeSession, state.activeSession);
    assert.ok(result.basketError, JSON.stringify(action));
  }
  const fixed = shoppingReducer({ ...state, basketError: "Previous error" }, {
    type: "basket", action: { type: "price", id: "milk", price: 0 },
  });
  assert.equal(fixed.basketError, null);
  assert.equal(summary(fixed.activeSession).total, 0);
});

test("clear retains session; end clears session and basket; operations need session", () => {
  const state = { ...initialShoppingState, activeSession: add(newSession(), "milk", "Milk", 9500, 1) };
  const cleared = shoppingReducer(state, { type: "basket", action: { type: "clear" } });
  assert.equal(cleared.activeSession.id, state.activeSession.id);
  assert.deepEqual(cleared.activeSession.items, []);
  const ended = shoppingReducer(state, { type: "end" });
  assert.deepEqual(ended, initialShoppingState);
  const noSession = shoppingReducer(ended, { type: "basket", action: {
    type: "add", id: "milk", item: { name: "Milk", price: 9500, quantity: 1 },
  } });
  assert.equal(noSession.activeSession, null);
  assert.match(noSession.basketError, /Start a shopping session/);
  const restarted = shoppingReducer(ended, { type: "start", session: newSession() });
  assert.deepEqual(restarted.activeSession.items, []);
  assert.equal(summary(state.activeSession).total, 9500, "transitions do not mutate prior state");
});

test("sequential rapid actions use the latest reducer state", () => {
  let state = { ...initialShoppingState, activeSession: add(newSession(), "milk", "Milk", 10, 1) };
  for (let index = 0; index < 100; index++) {
    state = shoppingReducer(state, { type: "basket", action: { type: "increase", id: "milk" } });
  }
  assert.equal(state.activeSession.items[0].quantity, 101);
  assert.equal(summary(state.activeSession).total, 1010);
  state = shoppingReducer(state, { type: "basket", action: { type: "quantity", id: "milk", quantity: 2 } });
  assert.equal(summary(state.activeSession).total, 20);
});

test("derived summary updates after every basket transition, including clear", () => {
  let session = newSession(30000);
  session = add(session, "milk", "Milk", 9500, 1);
  assert.equal(summary(session).productCount, 1);
  assert.equal(summary(session).averagePricePerItem, 9500);
  session = applyBasketAction(session, { type: "increase", id: "milk" });
  assert.equal(summary(session).itemCount, 2);
  assert.equal(summary(session).total, 19000);
  assert.equal(summary(session).remaining, 11000);
  session = applyBasketAction(session, { type: "quantity", id: "milk", quantity: 3 });
  assert.equal(summary(session).status, "near-budget");
  session = applyBasketAction(session, { type: "price", id: "milk", price: 11000 });
  assert.equal(summary(session).total, 33000);
  assert.equal(summary(session).remaining, -3000);
  assert.equal(summary(session).averagePricePerItem, 11000);
  assert.equal(summary(session).overBudgetBy, 3000);
  assert.ok(Math.abs(summary(session).usagePercentage - 110) < 1e-10);
  assert.equal(summary(session).progressPercentage, 100);
  assert.equal(summary(session).status, "over-budget");
  session = applyBasketAction(session, { type: "decrease", id: "milk" });
  assert.equal(summary(session).total, 22000);
  assert.equal(summary(session).status, "within-budget");
  session = applyBasketAction(session, { type: "remove", id: "milk" });
  assert.deepEqual(summary(session), summary(newSession(30000)));
  session = add(session, "free", "Free", 0, 2);
  session = applyBasketAction(session, { type: "clear" });
  assert.deepEqual(summary(session), summary(newSession(30000)));
  const unlimited = add(newSession(null), "free", "Free", 0, 2);
  assert.equal(summary(unlimited).status, "no-budget");
  assert.equal(summary(unlimited).remaining, null);
});
