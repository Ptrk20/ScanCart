import type { BasketItem } from "../../types/models";
import { calculateBudget } from "../shopping/budget.ts";
import { ACTIVE_SESSION_KEY, STORES, withTransaction, type StoredBasketItem } from "./database.ts";
import { assertBasketItem, assertSession } from "./validation.ts";

export function restoreBasketItems(records: StoredBasketItem[]): BasketItem[] {
  records.forEach((item) => {
    assertBasketItem(item);
    if (item.position !== undefined && (!Number.isSafeInteger(item.position) || item.position < 0)) {
      throw new TypeError("A saved basket position is invalid.");
    }
  });
  return records
    .map((item, index) => ({ item, position: item.position ?? index }))
    .sort((a, b) => a.position - b.position)
    .map(({ item }) => {
      const snapshot = { ...item };
      delete snapshot.position;
      return snapshot;
    });
}

export async function getBasketItems(): Promise<BasketItem[]> {
  return withTransaction("readonly", async (tx) => {
    const items = await tx.objectStore(STORES.basket).getAll();
    return restoreBasketItems(items);
  });
}
export async function saveBasketItem(item: BasketItem): Promise<void> {
  assertBasketItem(item);
  await withTransaction("readwrite", async (tx) => {
    const session = await tx.objectStore(STORES.sessions).get(ACTIVE_SESSION_KEY);
    assertSession(session);
    if (item.store !== session.store) throw new Error("The basket store does not match the active session.");
    if (item.productId && !await tx.objectStore(STORES.products).getKey(item.productId)) throw new Error("The saved product is missing.");
    const store = tx.objectStore(STORES.basket);
    const items = restoreBasketItems(await store.getAll());
    calculateBudget(session.budget, [...items.filter((entry) => entry.id !== item.id), item]);
    const next = items.some((entry) => entry.id === item.id)
      ? items.map((entry) => entry.id === item.id ? item : entry)
      : [...items, item];
    for (const [position, entry] of next.entries()) await store.put({ ...entry, position });
  });
}
export async function updateBasketItem(item: BasketItem): Promise<void> {
  await saveBasketItem(item);
}
export async function deleteBasketItem(id: string): Promise<void> {
  await withTransaction("readwrite", async (tx) => { await tx.objectStore(STORES.basket).delete(id); });
}
export async function clearBasket(): Promise<void> {
  await withTransaction("readwrite", async (tx) => { await tx.objectStore(STORES.basket).clear(); });
}
