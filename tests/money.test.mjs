import assert from "node:assert/strict";
import test from "node:test";
import { formatCurrency, fromCentavos, itemSubtotal, moneyInputValue, parseMoneyInput, toCentavos } from "../src/lib/utils/money.ts";

test("formats integer centavos as Philippine pesos", () => {
  assert.equal(formatCurrency(9500), "₱95.00");
  assert.equal(formatCurrency(125050), "₱1,250.50");
  assert.equal(formatCurrency(0), "₱0.00");
  assert.equal(formatCurrency(-15000), "-₱150.00");
  assert.equal(formatCurrency(-1), "-₱0.01");
  assert.equal(formatCurrency(Number.MAX_SAFE_INTEGER), "₱90,071,992,547,409.91");
});

test("peso conversion uses half-up decimal rounding, not binary multiplication", () => {
  for (const [pesos, centavos] of [[95.5, 9550], [1.005, 101], [10.555, 1056], [95.555, 9556], [0.0049, 0], [0.005, 1], [1e-7, 0], [1e5, 10000000], [0, 0]]) {
    assert.equal(toCentavos(pesos), centavos);
  }
  assert.equal(fromCentavos(9550), 95.5);
  assert.equal(fromCentavos(-15000), -150);
  for (const value of [-1, NaN, Infinity, Number.MAX_VALUE]) {
    assert.throws(() => toCentavos(value), RangeError);
  }
  for (const value of [1.5, NaN, Infinity, undefined]) {
    assert.throws(() => fromCentavos(value), RangeError);
    assert.throws(() => formatCurrency(value), RangeError);
  }
  assert.equal(parseMoneyInput("10.555", "Budget").ok, false);
  assert.equal(parseMoneyInput("90071992547409.915", "Price").ok, false);
  assert.deepEqual(parseMoneyInput("00010.555", "Price"), { ok: true, value: 1056 });
});

test("calculates exact centavo subtotals", () => {
  assert.equal(itemSubtotal(9500, 2), 19000);
  assert.equal(itemSubtotal(10, 3), 30);
  assert.equal(itemSubtotal(0, 1), 0);
});

test("rejects invalid prices, quantities, and unsafe arithmetic", () => {
  for (const price of [-1, 1.5, NaN, Infinity]) {
    assert.throws(() => itemSubtotal(price, 1), RangeError);
  }
  for (const quantity of [0, -1, 1.5, NaN, Infinity]) {
    assert.throws(() => itemSubtotal(100, quantity), RangeError);
  }
  assert.throws(() => itemSubtotal(Number.MAX_SAFE_INTEGER, 2), RangeError);
  assert.throws(() => formatCurrency(1.5), RangeError);
});

test("parses and round-trips decimal inputs exactly at safe integer boundaries", () => {
  for (const amount of [0, 10, 9500, 123456789, Number.MAX_SAFE_INTEGER]) {
    assert.deepEqual(parseMoneyInput(moneyInputValue(amount), "Price"), { ok: true, value: amount });
  }
  assert.equal(parseMoneyInput("90071992547409.92", "Price").ok, false);
  assert.equal(parseMoneyInput("90071992547409.93", "Price").ok, false);
});
