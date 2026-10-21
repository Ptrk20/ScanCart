import assert from "node:assert/strict";
import test from "node:test";
import {
  calculatePriceChangePercentage, calculatePriceDifference, calculateProductPriceAnalytics,
  getAveragePrice, getComparisonPrice, getHighestPrice, getLatestPrice,
  getLatestPricesByStore, getLowestPrice, getPreviousPrice, getPriceHistoryForStore,
  getPriceTrend, groupPriceHistoryByStore, sortPriceHistoryNewestFirst,
} from "../src/lib/shopping/price-analytics.ts";
import { formatCurrency } from "../src/lib/utils/money.ts";

const record = (id, price, day, store = "SM Supermarket") => ({
  id, price, store, productId: "milk", recordedAt: `2026-10-${String(day).padStart(2, "0")}T09:00:00.000Z`,
});
const records = [
  record("first", 9500, 1), record("second", 9900, 8),
  record("third", 9200, 10, "Puregold"), record("fourth", 9700, 15),
];

test("no price records means unavailable prices, not a fabricated zero", () => {
  const analytics = calculateProductPriceAnalytics([]);
  for (const field of ["latest", "previous", "lowest", "highest", "average"]) assert.equal(analytics[field], undefined);
  assert.equal(analytics.recordCount, 0);
  assert.deepEqual(analytics.records, []);
  assert.deepEqual(analytics.latestByStore, []);
  assert.equal(getPriceTrend(undefined, undefined), "insufficient-data");
  assert.equal(getComparisonPrice([], "SM"), undefined);
});

test("single record provides real prices but insufficient price trend data", () => {
  const item = record("only", 9500, 1);
  const analytics = calculateProductPriceAnalytics([item]);
  assert.equal(analytics.latest, item);
  assert.equal(analytics.lowest, item);
  assert.equal(analytics.highest, item);
  assert.equal(analytics.average, 9500);
  assert.equal(analytics.previous, undefined);
  assert.equal(getPriceTrend(analytics.latest.price, analytics.previous?.price), "insufficient-data");
});

test("analytics explicitly order timestamps, retain records and do not mutate frozen inputs", () => {
  const input = Object.freeze([records[2], records[0], records[3], records[1]].map(Object.freeze));
  const before = structuredClone(input);
  const analytics = calculateProductPriceAnalytics(input);
  assert.deepEqual(analytics.records.map(r => r.id), ["fourth", "third", "second", "first"]);
  assert.equal(analytics.latest.price, 9700);
  assert.equal(analytics.previous.price, 9200);
  assert.equal(analytics.lowest.price, 9200);
  assert.equal(analytics.highest.price, 9900);
  assert.equal(analytics.average, 9575);
  assert.equal(analytics.recordCount, 4);
  assert.deepEqual(input, before);
  assert.notEqual(analytics.records, input);
  assert.equal(getLatestPrice(input), records[3]);
  assert.equal(getPreviousPrice(input), records[2]);
});

test("equal timestamps have deterministic ID order and extrema prefer newest matching record", () => {
  const input = [record("z", 9500, 1), record("b", 9500, 2), record("a", 9500, 2)];
  assert.deepEqual(sortPriceHistoryNewestFirst(input).map(r => r.id), ["a", "b", "z"]);
  assert.equal(getLowestPrice(input).id, "a");
  assert.equal(getHighestPrice(input).id, "a");
  assert.equal(getPriceTrend(9500, 9500), "unchanged");
});

test("price increase, decrease, unchanged and centavo differences are exact", () => {
  for (const [current, previous, difference, percentage, trend] of [
    [11000, 10000, 1000, 10, "increased"],
    [9000, 10000, -1000, -10, "decreased"],
    [9500, 9500, 0, 0, "unchanged"],
    [9520, 9510, 10, 10 / 9510 * 100, "increased"],
  ]) {
    assert.equal(calculatePriceDifference(current, previous), difference);
    assert.equal(calculatePriceChangePercentage(current, previous), percentage);
    assert.equal(getPriceTrend(current, previous), trend);
  }
  assert.equal(formatCurrency(calculatePriceDifference(9520, 9510)), "₱0.10");
  assert.equal(calculatePriceDifference(Number.MAX_SAFE_INTEGER, 0), Number.MAX_SAFE_INTEGER);
  assert.equal(calculatePriceDifference(0, Number.MAX_SAFE_INTEGER), -Number.MAX_SAFE_INTEGER);
});

test("zero prices are data, zero previous price never yields NaN or Infinity", () => {
  assert.equal(getAveragePrice([record("free", 0, 1)]), 0);
  assert.equal(getLowestPrice([record("free", 0, 1)]).price, 0);
  for (const current of [0, 1000, Number.MAX_SAFE_INTEGER]) {
    assert.equal(calculatePriceChangePercentage(current, 0), null);
  }
  assert.equal(getPriceTrend(1000, 0), "increased");
  assert.equal(getPriceTrend(0, 0), "unchanged");
  assert.equal(getPriceTrend(0, 1000), "decreased");
  assert.equal(getPriceTrend(undefined, 0), "insufficient-data");
  assert.ok(Number.isFinite(calculatePriceChangePercentage(Number.MAX_SAFE_INTEGER, 1)));
});

test("average rounds half-up to centavos without aggregate overflow or binary rounding", () => {
  assert.equal(getAveragePrice([record("a", 9000, 1), record("b", 10000, 2), record("c", 11000, 3)]), 10000);
  assert.equal(getAveragePrice([record("a", 9510, 1), record("b", 9511, 2)]), 9511);
  assert.equal(getAveragePrice([record("a", 0, 1), record("b", 1, 2), record("c", 0, 3)]), 0);
  const max = Number.MAX_SAFE_INTEGER;
  assert.equal(getAveragePrice([record("a", max, 1), record("b", max, 2)]), max);
  assert.equal(getAveragePrice([record("a", max, 1), record("b", max - 1, 2)]), max);
  assert.equal(getAveragePrice([record("a", max, 1), record("b", 0, 2)]), 4503599627370496);
});

test("latest per store ignores older cheap prices and sorts latest prices ascending", () => {
  const input = [record("old-cheap", 8500, 1, "Puregold"), record("new", 10000, 20, "Puregold"), record("sm", 9500, 15)];
  assert.deepEqual(getLatestPricesByStore(input).map(r => [r.store, r.price]), [["SM Supermarket", 9500], ["Puregold", 10000]]);
  assert.deepEqual(getPriceHistoryForStore(input, "Puregold").map(r => r.id), ["new", "old-cheap"]);
  assert.equal(getComparisonPrice(input, "Puregold").id, "new");
});

test("same-store baseline is preferred even if another store has a newer record", () => {
  const input = [record("sm", 9500, 1), record("puregold", 9700, 20, "Puregold")];
  const baseline = getComparisonPrice(input, "SM Supermarket");
  assert.equal(baseline.id, "sm");
  assert.equal(calculatePriceDifference(9900, baseline.price), 400);
  assert.equal(calculatePriceChangePercentage(9900, baseline.price), 400 / 9500 * 100);
  assert.equal(getComparisonPrice(input, "No History Store").id, "puregold");
});

test("store names remain exact including branches, case, spaces and prototype-like names", () => {
  const names = ["SM", "sm", "SM - Makati", " SM ", "__proto__"];
  const input = names.map((store, index) => record(String(index), 100, 1, store));
  const groups = groupPriceHistoryByStore(input);
  assert.equal(groups.size, names.length);
  for (const name of names) assert.equal(groups.get(name).length, 1);
  assert.equal(getLatestPricesByStore(input).length, names.length);
  assert.deepEqual(getPriceHistoryForStore(input, "SM Makati"), []);
});

test("invalid dates and corrupt monetary values fail explicitly without mutating inputs", () => {
  const valid = record("a", 9500, 1);
  for (const recordedAt of ["bad", "", "2026-13-01T00:00:00.000Z"]) {
    const invalid = { ...valid, recordedAt };
    assert.throws(() => calculateProductPriceAnalytics([valid, invalid]), /timestamp|field/);
    assert.equal(invalid.recordedAt, recordedAt);
  }
  for (const price of [-1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => calculateProductPriceAnalytics([{ ...valid, price }]));
    assert.throws(() => calculatePriceDifference(price, 9500));
    assert.throws(() => calculatePriceChangePercentage(9500, price));
    assert.throws(() => getPriceTrend(price, undefined));
  }
});
