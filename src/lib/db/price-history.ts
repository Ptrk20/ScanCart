import type { PriceRecord } from "../../types/models";
import { INDEXES, STORES, withTransaction, type DatabaseTransaction } from "./database.ts";
import { assertPriceRecord } from "./validation.ts";
import { getLatestPrice } from "../shopping/price-analytics.ts";

export async function addPriceRecord(record: PriceRecord): Promise<void> {
  assertPriceRecord(record);
  await withTransaction("readwrite", async (tx) => {
    if (!await tx.objectStore(STORES.products).getKey(record.productId)) throw new Error("The saved product is missing.");
    await tx.objectStore(STORES.priceHistory).add(record);
  });
}
export async function getPriceHistoryForProduct(productId: string): Promise<PriceRecord[]> {
  return withTransaction("readonly", async (tx) => {
    const records = await tx.objectStore(STORES.priceHistory).index(INDEXES.productTime)
      .getAll(IDBKeyRange.bound([productId, ""], [productId, "\uffff"]));
    records.forEach(assertPriceRecord);
    return records;
  });
}
export async function getLatestPriceForProduct(productId: string): Promise<PriceRecord | undefined> {
  const records = await getPriceHistoryForProduct(productId);
  return getLatestPrice(records);
}

export async function recordConfirmedPrice(tx: DatabaseTransaction, record: PriceRecord): Promise<void> {
  assertPriceRecord(record);
  const store = tx.objectStore(STORES.priceHistory);
  const records = record.sessionId
    ? await store.index(INDEXES.sessionProduct).getAll([record.sessionId, record.productId])
    : [];
  records.forEach(assertPriceRecord);
  const previous = records.sort((a, b) => a.recordedAt.localeCompare(b.recordedAt)).at(-1);
  if (previous?.price === record.price && previous.store === record.store) return;
  // Preserve ordering even when two explicit confirmations occur in the same millisecond.
  const recordedAt = previous && record.recordedAt <= previous.recordedAt
    ? new Date(Date.parse(previous.recordedAt) + 1).toISOString()
    : record.recordedAt;
  await store.add({ ...record, recordedAt });
}
