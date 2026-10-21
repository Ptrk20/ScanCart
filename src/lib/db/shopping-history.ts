import type { CompletedShoppingSession } from "../../types/models.ts";
import { STORES, withTransaction, type DatabaseTransaction } from "./database.ts";
import { assertShoppingHistory } from "./validation.ts";

export async function insertShoppingHistory(tx: DatabaseTransaction, record: CompletedShoppingSession): Promise<void> {
  assertShoppingHistory(record);
  // add (not put) makes a session ID an immutable, unique receipt ID.
  await tx.objectStore(STORES.shoppingHistory).add(record);
}

export async function saveShoppingHistory(record: CompletedShoppingSession): Promise<void> {
  await withTransaction("readwrite", (tx) => insertShoppingHistory(tx, record));
}

export async function getShoppingHistory(): Promise<CompletedShoppingSession[]> {
  return withTransaction("readonly", async (tx) => {
    const records = await tx.objectStore(STORES.shoppingHistory).getAll();
    records.forEach(assertShoppingHistory);
    return records.sort((a, b) => b.completedAt.localeCompare(a.completedAt) || a.id.localeCompare(b.id));
  });
}

export async function getShoppingHistoryById(id: string): Promise<CompletedShoppingSession | undefined> {
  return withTransaction("readonly", async (tx) => {
    const record = await tx.objectStore(STORES.shoppingHistory).get(id);
    if (record) assertShoppingHistory(record);
    return record;
  });
}

export async function deleteShoppingHistory(id: string): Promise<void> {
  await withTransaction("readwrite", async (tx) => { await tx.objectStore(STORES.shoppingHistory).delete(id); });
}

/** Internal only; no bulk-delete action is exposed in the UI. */
export async function clearShoppingHistory(): Promise<void> {
  await withTransaction("readwrite", async (tx) => { await tx.objectStore(STORES.shoppingHistory).clear(); });
}
