import type { Money, PriceRecord } from "../../types/models";
import { assertPriceRecord } from "../db/validation.ts";
import { assertCentavos } from "../utils/money.ts";

export type PriceTrend = "increased" | "decreased" | "unchanged" | "insufficient-data";
export interface ProductPriceAnalytics {
  latest?: PriceRecord;
  previous?: PriceRecord;
  lowest?: PriceRecord;
  highest?: PriceRecord;
  average?: Money;
  latestByStore: PriceRecord[];
  records: PriceRecord[];
  recordCount: number;
}

function assertPrice(price: Money): void {
  assertCentavos(price);
  if (price < 0) throw new RangeError("Recorded prices cannot be negative.");
}

export function sortPriceHistoryNewestFirst(records: readonly PriceRecord[]): PriceRecord[] {
  records.forEach(assertPriceRecord);
  return [...records].sort((a, b) => Date.parse(b.recordedAt) - Date.parse(a.recordedAt) || a.id.localeCompare(b.id));
}

export function getLatestPrice(records: readonly PriceRecord[]): PriceRecord | undefined {
  return sortPriceHistoryNewestFirst(records)[0];
}

export function getPreviousPrice(records: readonly PriceRecord[]): PriceRecord | undefined {
  return sortPriceHistoryNewestFirst(records)[1];
}

export function getLowestPrice(records: readonly PriceRecord[]): PriceRecord | undefined {
  return sortPriceHistoryNewestFirst(records).reduce<PriceRecord | undefined>(
    (lowest, record) => !lowest || record.price < lowest.price ? record : lowest, undefined,
  );
}

export function getHighestPrice(records: readonly PriceRecord[]): PriceRecord | undefined {
  return sortPriceHistoryNewestFirst(records).reduce<PriceRecord | undefined>(
    (highest, record) => !highest || record.price > highest.price ? record : highest, undefined,
  );
}

export function getAveragePrice(records: readonly PriceRecord[]): Money | undefined {
  records.forEach(assertPriceRecord);
  if (!records.length) return undefined;
  // Exact accumulation avoids overflow when many individually valid prices are added.
  const count = BigInt(records.length);
  const total = records.reduce((sum, record) => sum + BigInt(record.price), BigInt(0));
  return Number(total / count + (total % count * BigInt(2) >= count ? BigInt(1) : BigInt(0)));
}

export function getPriceHistoryForStore(records: readonly PriceRecord[], store: string): PriceRecord[] {
  return sortPriceHistoryNewestFirst(records).filter((record) => record.store === store);
}

export function groupPriceHistoryByStore(records: readonly PriceRecord[]): Map<string, PriceRecord[]> {
  const groups = new Map<string, PriceRecord[]>();
  for (const record of sortPriceHistoryNewestFirst(records)) {
    const group = groups.get(record.store);
    if (group) group.push(record);
    else groups.set(record.store, [record]);
  }
  return groups;
}

export function getLatestPricesByStore(records: readonly PriceRecord[]): PriceRecord[] {
  return [...groupPriceHistoryByStore(records).values()].map((group) => group[0])
    .sort((a, b) => a.price - b.price || a.store.localeCompare(b.store));
}

export function getComparisonPrice(records: readonly PriceRecord[], store: string): PriceRecord | undefined {
  return getPriceHistoryForStore(records, store)[0] ?? getLatestPrice(records);
}

export function calculatePriceDifference(currentPrice: Money, previousPrice: Money): Money {
  assertPrice(currentPrice);
  assertPrice(previousPrice);
  return currentPrice - previousPrice;
}

export function calculatePriceChangePercentage(currentPrice: Money, previousPrice: Money): number | null {
  const difference = calculatePriceDifference(currentPrice, previousPrice);
  return previousPrice === 0 ? null : difference / previousPrice * 100;
}

export function getPriceTrend(currentPrice: Money | undefined, previousPrice: Money | undefined): PriceTrend {
  if (currentPrice !== undefined) assertPrice(currentPrice);
  if (previousPrice !== undefined) assertPrice(previousPrice);
  if (currentPrice === undefined || previousPrice === undefined) return "insufficient-data";
  const difference = calculatePriceDifference(currentPrice, previousPrice);
  return difference > 0 ? "increased" : difference < 0 ? "decreased" : "unchanged";
}

export function calculateProductPriceAnalytics(records: readonly PriceRecord[]): ProductPriceAnalytics {
  const sorted = sortPriceHistoryNewestFirst(records);
  return {
    records: sorted, recordCount: sorted.length, latest: sorted[0], previous: sorted[1],
    lowest: getLowestPrice(sorted), highest: getHighestPrice(sorted),
    average: getAveragePrice(sorted), latestByStore: getLatestPricesByStore(sorted),
  };
}
