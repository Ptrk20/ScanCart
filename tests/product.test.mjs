import assert from "node:assert/strict";
import test from "node:test";
import { createProduct, validateProduct } from "../src/lib/shopping/product.ts";
import { initialShoppingState, shoppingReducer } from "../src/lib/shopping/basket.ts";
import { createSession } from "../src/lib/shopping/session.ts";
import { calculateBudget } from "../src/lib/shopping/budget.ts";

const draft = { barcode: " 0123456789012 ", name: " Fresh Milk ", brand: " Example Brand ", category: " Dairy ", price: "95", quantity: "2" };
const activeState = () => ({ ...initialShoppingState, activeSession: createSession({ store: "SM Supermarket", budget: 300000 }, "session", "2026-10-21T09:00:00.000Z") });
function action(values = draft, id = "p1", basketId = "b1", timestamp = "2026-10-21T09:01:00.000Z") {
  const result = validateProduct(values);
  assert.equal(result.ok, true);
  return { type: "product", product: createProduct(result.value, id, timestamp), quantity: result.value.quantity, basketId };
}

test("valid product normalizes strings, preserves leading zeros, and adds complete basket snapshot", () => {
  const state = shoppingReducer(activeState(), action());
  assert.equal(state.basketError, null);
  assert.deepEqual(state.products[0], {
    id: "p1", barcode: "0123456789012", name: "Fresh Milk", brand: "Example Brand", category: "Dairy",
    lastPrice: 9500, createdAt: "2026-10-21T09:01:00.000Z", updatedAt: "2026-10-21T09:01:00.000Z",
  });
  assert.equal("quantity" in state.products[0], false);
  assert.deepEqual(state.activeSession.items[0], {
    id: "b1", productId: "p1", barcode: "0123456789012", name: "Fresh Milk", brand: "Example Brand",
    category: "Dairy", price: 9500, quantity: 2, store: "SM Supermarket",
  });
  const summary = calculateBudget(300000, state.activeSession.items);
  assert.equal(summary.total, 19000);
  assert.equal(summary.remaining, 281000);
  assert.equal(state.successMessage, "Fresh Milk was added to your basket.");
});

test("barcodes and descriptive details are optional; no-barcode products never merge by name", () => {
  const values = { ...draft, barcode: "", brand: "", category: "My custom category", name: "Bread", price: "75", quantity: "1" };
  let state = shoppingReducer(activeState(), action(values));
  state = shoppingReducer(state, action(values, "p2", "b2"));
  assert.equal(state.activeSession.items.length, 2);
  assert.equal(state.products.length, 2);
  assert.equal(state.products[0].barcode, undefined);
  assert.equal(state.products[0].category, "My custom category");
});

test("duplicate barcode reuses product ID, preserves creation date, merges quantity, and reprices", () => {
  let state = shoppingReducer(activeState(), action({ ...draft, quantity: "1" }));
  state = shoppingReducer(state, action({ ...draft, price: "99" }, "p2", "b2", "2026-10-21T10:00:00.000Z"));
  assert.equal(state.products.length, 1);
  assert.equal(state.products[0].id, "p1");
  assert.equal(state.products[0].createdAt, "2026-10-21T09:01:00.000Z");
  assert.equal(state.products[0].updatedAt, "2026-10-21T10:00:00.000Z");
  assert.equal(state.products[0].lastPrice, 9900);
  assert.equal(state.activeSession.items.length, 1);
  assert.equal(state.activeSession.items[0].quantity, 3);
  assert.equal(state.activeSession.items[0].price, 9900);
  assert.equal(calculateBudget(300000, state.activeSession.items).total, 29700);
});

test("field validation rejects invalid prices and quantities with understandable messages", () => {
  assert.equal(validateProduct({ ...draft, name: " " }).errors.name, "Please enter a product name.");
  assert.equal(validateProduct({ ...draft, price: "" }).errors.price, "Please enter the product price.");
  assert.equal(validateProduct({ ...draft, price: "-95" }).errors.price, "Price cannot be negative.");
  assert.equal(validateProduct({ ...draft, price: "abc" }).errors.price, "Please enter a valid price.");
  assert.equal(validateProduct({ ...draft, quantity: "0" }).errors.quantity, "Quantity must be at least 1.");
  for (const price of ["NaN", "Infinity", "1e2", "99999999999999999"]) {
    assert.equal(validateProduct({ ...draft, price }).ok, false, price);
  }
  for (const quantity of ["", "-1", "1.5", "NaN", "Infinity", "1e2", "9007199254740992"]) {
    assert.equal(validateProduct({ ...draft, quantity }).ok, false, quantity);
  }
  assert.equal(validateProduct({ ...draft, price: "0" }).value.lastPrice, 0);
  assert.equal(validateProduct({ ...draft, price: "95.555" }).value.lastPrice, 9556);
  assert.equal(validateProduct({ ...draft, price: "0.001" }).value.lastPrice, 0);
});

test("failed adds are atomic and cannot create orphan products or success messages", () => {
  const withoutSession = shoppingReducer(initialShoppingState, action());
  assert.equal(withoutSession.activeSession, null);
  assert.deepEqual(withoutSession.products, []);
  assert.ok(withoutSession.basketError);
  const state = activeState();
  const overflow = shoppingReducer(state, action({ ...draft, price: "90071992547409.91", quantity: "2" }));
  assert.equal(overflow.activeSession, state.activeSession);
  assert.deepEqual(overflow.products, []);
  assert.equal(overflow.successMessage, null);
  assert.ok(overflow.basketError);
  const added = shoppingReducer(state, action());
  assert.deepEqual(shoppingReducer(added, { type: "end" }), { ...initialShoppingState, products: added.products });
});
