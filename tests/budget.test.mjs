import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateAveragePricePerItem, calculateBasketItemCount, calculateBasketTotal,
  calculateBudget, calculateBudgetUsagePercentage, calculateItemSubtotal,
  calculateOverBudgetAmount, calculateProductRowCount, calculateRemainingBudget,
  getBudgetStatus,
} from "../src/lib/shopping/budget.ts";
import { formatCurrency, parseMoneyInput, toCentavos } from "../src/lib/utils/money.ts";

test("empty basket produces all safe defaults and preserves a configured budget", () => {
  assert.deepEqual(calculateBudget(300000, []), {
    budget: 300000, total: 0, remaining: 300000, overBudgetBy: 0,
    itemCount: 0, productCount: 0, averagePricePerItem: 0,
    usagePercentage: 0, progressPercentage: 0, status: "within-budget",
  });
  assert.equal(calculateProductRowCount([]), 0);
  assert.equal(calculateBasketItemCount([]), 0);
  assert.equal(calculateBasketTotal([]), 0);
  assert.equal(calculateAveragePricePerItem([]), 0);
});

test("single item and decimal subtotal do not mutate inputs", () => {
  const item = Object.freeze({ price: 9500, quantity: 1 });
  const items = Object.freeze([item]);
  const summary = calculateBudget(300000, items);
  assert.equal(calculateItemSubtotal(item), 9500);
  assert.equal(summary.productCount, 1);
  assert.equal(summary.itemCount, 1);
  assert.equal(summary.total, 9500);
  assert.equal(calculateItemSubtotal({ price: 9550, quantity: 3 }), 28650);
  assert.deepEqual(item, { price: 9500, quantity: 1 });
});

test("multiple quantities distinguish rows from physical items", () => {
  const items = [{ price: 9500, quantity: 2 }, { price: 7500, quantity: 3 }];
  const summary = calculateBudget(300000, items);
  assert.equal(summary.productCount, 2);
  assert.equal(summary.itemCount, 5);
  assert.equal(summary.total, 41500);
  assert.equal(calculateProductRowCount(items), 2);
  assert.equal(calculateBasketItemCount(items), 5);
  assert.equal(calculateBasketTotal(items), 41500);
});

test("mixed decimal prices total exactly 506.45 pesos", () => {
  const items = [{ price: 9550, quantity: 2 }, { price: 7525, quantity: 1 }, { price: 12010, quantity: 2 }];
  const summary = calculateBudget(300000, items);
  assert.equal(summary.productCount, 3);
  assert.equal(summary.itemCount, 5);
  assert.equal(summary.total, 50645);
  assert.equal(summary.remaining, 249355);
});

test("floating-point inputs convert before aggregation, yielding 0.30 pesos", () => {
  const total = calculateBasketTotal([{ price: toCentavos(0.1), quantity: 1 }, { price: toCentavos(0.2), quantity: 1 }]);
  assert.equal(total, 30);
  assert.equal(formatCurrency(total), "₱0.30");
});

test("remaining budget supports exact decimals and negative remaining", () => {
  assert.equal(calculateRemainingBudget(300000, 125050), 174950);
  assert.equal(calculateRemainingBudget(300000, 315000), -15000);
  assert.equal(calculateOverBudgetAmount(300000, 250000), 0);
  assert.equal(calculateOverBudgetAmount(300000, 315000), 15000);
});

test("exact budget is near, not over; threshold uses unrounded centavos", () => {
  assert.equal(calculateRemainingBudget(300000, 300000), 0);
  assert.equal(calculateOverBudgetAmount(300000, 300000), 0);
  assert.equal(getBudgetStatus(300000, 300000), "near-budget");
  assert.equal(getBudgetStatus(300000, 150000), "within-budget");
  assert.equal(getBudgetStatus(300000, 239999), "within-budget");
  assert.equal(getBudgetStatus(300000, 240000), "near-budget");
  assert.equal(getBudgetStatus(300000, 240001), "near-budget");
  assert.equal(getBudgetStatus(300000, 300001), "over-budget");
  assert.equal(getBudgetStatus(101, 80), "within-budget");
  assert.equal(getBudgetStatus(101, 81), "near-budget");
});

test("usage retains actual percentage above 100 while visual percentage clamps", () => {
  assert.equal(calculateBudgetUsagePercentage(300000, 150000), 50);
  assert.equal(calculateBudgetUsagePercentage(300000, 240000), 80);
  assert.equal(calculateBudgetUsagePercentage(300000, 315000), 105);
  const summary = calculateBudget(300000, [{ price: 315000, quantity: 1 }]);
  assert.equal(summary.overBudgetBy, 15000);
  assert.equal(summary.usagePercentage, 105);
  assert.equal(summary.progressPercentage, 100);
  assert.equal(summary.status, "over-budget");
  assert.ok(Number.isFinite(calculateBudgetUsagePercentage(1, Number.MAX_SAFE_INTEGER)));
});

test("zero budget remains a real spending limit without division by zero", () => {
  const summary = calculateBudget(0, [{ price: 50000, quantity: 1 }]);
  assert.equal(summary.status, "over-budget");
  assert.equal(summary.remaining, -50000);
  assert.equal(summary.overBudgetBy, 50000);
  assert.equal(summary.usagePercentage, 0);
  assert.equal(summary.progressPercentage, 0);
  assert.equal(getBudgetStatus(0, 0), "within-budget");
});

test("absent budget has no limit and never becomes over budget", () => {
  const summary = calculateBudget(null, [{ price: 50000, quantity: 1 }]);
  assert.equal(summary.budget, null);
  assert.equal(summary.remaining, null);
  assert.equal(summary.overBudgetBy, 0);
  assert.equal(summary.usagePercentage, 0);
  assert.equal(summary.status, "no-budget");
  assert.equal(summary.total, 50000);
});

test("zero-price items stay visible in counts and do not increase totals", () => {
  const item = { price: 0, quantity: 2 };
  const summary = calculateBudget(0, [item]);
  assert.equal(calculateItemSubtotal(item), 0);
  assert.equal(summary.productCount, 1);
  assert.equal(summary.itemCount, 2);
  assert.equal(summary.total, 0);
  assert.equal(summary.averagePricePerItem, 0);
});

test("average price uses physical item count with half-up centavo rounding", () => {
  assert.equal(calculateAveragePricePerItem([{ price: 10000, quantity: 6 }]), 10000);
  assert.equal(calculateAveragePricePerItem([{ price: 1, quantity: 1 }, { price: 0, quantity: 1 }]), 1);
  assert.equal(calculateAveragePricePerItem([{ price: 1, quantity: 1 }, { price: 0, quantity: 2 }]), 0);
  assert.equal(calculateAveragePricePerItem([{ price: Number.MAX_SAFE_INTEGER, quantity: 1 }]), Number.MAX_SAFE_INTEGER);
  assert.equal(calculateAveragePricePerItem([{ price: Number.MAX_SAFE_INTEGER, quantity: 1 }, { price: 0, quantity: 1 }]), 4503599627370496);
});

test("rounding is consistent in product inputs, subtotal, basket total, and display", () => {
  const result = parseMoneyInput("10.555", "Price");
  assert.deepEqual(result, { ok: true, value: 1056 });
  assert.equal(toCentavos(10.555), 1056);
  const item = { price: result.value, quantity: 1 };
  assert.equal(calculateItemSubtotal(item), 1056);
  assert.equal(calculateBasketTotal([item]), 1056);
  assert.equal(formatCurrency(calculateItemSubtotal(item)), "₱10.56");
});

test("corrupt numbers and missing inputs explicitly fail instead of producing NaN", () => {
  for (const budget of [-1, 0.5, NaN, Infinity, undefined]) {
    assert.throws(() => calculateBudget(budget, []), RangeError);
    assert.throws(() => getBudgetStatus(budget, 0), RangeError);
    assert.throws(() => calculateBudgetUsagePercentage(budget, 0), RangeError);
  }
  for (const price of [-1, 0.5, NaN, Infinity, undefined]) {
    assert.throws(() => calculateBudget(100, [{ price, quantity: 1 }]), RangeError);
    assert.throws(() => calculateRemainingBudget(100, price), RangeError);
  }
  for (const quantity of [-1, 0, 1.5, NaN, Infinity, undefined]) {
    assert.throws(() => calculateBudget(100, [{ price: 100, quantity }]), RangeError);
    assert.throws(() => calculateBasketItemCount([{ price: 100, quantity }]), RangeError);
  }
  for (const items of [undefined, null, {}, "items"]) {
    assert.throws(() => calculateBudget(null, items), TypeError);
  }
  assert.throws(() => calculateBudget(null, [null]), TypeError);
  assert.throws(() => calculateBudget(null, Array(2)), TypeError);
});

test("aggregate, subtotal, and quantity overflow explicitly fail", () => {
  assert.throws(() => calculateBudget(0, [
    { price: Number.MAX_SAFE_INTEGER, quantity: 1 },
    { price: 1, quantity: 1 },
  ]), RangeError);
  assert.throws(() => calculateBudget(0, [
    { price: 0, quantity: Number.MAX_SAFE_INTEGER },
    { price: 0, quantity: 1 },
  ]), RangeError);
  assert.throws(() => calculateItemSubtotal({ price: Number.MAX_SAFE_INTEGER, quantity: 2 }), RangeError);
});
