import type { ActiveShoppingSession, PriceRecord } from "../../types/models";
import { initialShoppingState, shoppingReducer, type ShoppingAction, type ShoppingState } from "../shopping/basket.ts";
import { calculateBudget } from "../shopping/budget.ts";
import { ACTIVE_SESSION_KEY, INDEXES, STORES, withTransaction, type DatabaseTransaction } from "./database.ts";
import { recordConfirmedPrice } from "./price-history.ts";
import { restoreBasketItems } from "./basket.ts";
import { assertBasketItem, assertProduct, assertSession } from "./validation.ts";
import { createShoppingHistorySnapshot } from "../shopping/history.ts";
import { insertShoppingHistory } from "./shopping-history.ts";

type PersistentAction = Exclude<ShoppingAction, { type: "error" | "dismiss-success" }>;
export class SessionChangedError extends Error {}

async function readState(tx: DatabaseTransaction<"readonly" | "readwrite">): Promise<ShoppingState> {
  const products = await tx.objectStore(STORES.products).getAll();
  const items = restoreBasketItems(await tx.objectStore(STORES.basket).getAll());
  const session = await tx.objectStore(STORES.sessions).get(ACTIVE_SESSION_KEY);
  products.forEach(assertProduct);
  if (session) assertSession(session);
  if (!session && items.length) throw new Error("A saved basket has no active session.");
  const ids = new Set(products.map((product) => product.id));
  if (items.some((item) => item.productId && !ids.has(item.productId))) throw new Error("A basket product is missing.");
  if (session && items.some((item) => item.store !== session.store)) throw new Error("A basket store does not match its session.");
  calculateBudget(session ? session.budget : null, items);
  return { ...initialShoppingState, products, activeSession: session ? { ...session, items } : null };
}

export async function loadShoppingState(): Promise<ShoppingState> {
  return withTransaction("readonly", readState);
}

export async function commitShoppingAction(
  action: PersistentAction, expectedSessionId: string | null, priceRecordId?: string,
): Promise<ShoppingState> {
  return withTransaction("readwrite", async (tx) => {
    const state = await readState(tx);
    if ((state.activeSession?.id ?? null) !== expectedSessionId) {
      throw new SessionChangedError("The active shopping session changed in another tab. Reload before continuing.");
    }
    if (action.type === "end") {
      if (!state.activeSession) throw new SessionChangedError("There is no active shopping session to complete. Reload before continuing.");
      const receipt = createShoppingHistorySnapshot(state.activeSession, new Date().toISOString());
      if (receipt) await insertShoppingHistory(tx, receipt);
    }
    if (action.type === "product" && action.product.barcode) {
      const existing = await tx.objectStore(STORES.products).index(INDEXES.barcode).get(action.product.barcode);
      if (existing) action = { ...action, product: { ...action.product, id: existing.id, createdAt: existing.createdAt } };
    }
    const next = shoppingReducer(state, action);
    if (next.basketError) return next;
    if (action.type === "end") {
      next.successMessage = state.activeSession?.items.length ? "Shopping trip saved." : "Empty shopping session ended. No history record was created.";
    }
    const products = tx.objectStore(STORES.products);
    if (action.type === "product") {
      const productId = action.product.id;
      const product = next.products.find((entry) => entry.id === productId);
      if (!product) throw new Error("The product could not be saved.");
      assertProduct(product);
      await products.put(product);
      await confirmPrice(product.id, product.lastPrice, product.updatedAt);
    }
    if (action.type === "basket" && action.action.type === "price") {
      const itemId = action.action.id;
      const item = next.activeSession?.items.find((entry) => entry.id === itemId);
      if (item?.productId) {
        const product = next.products.find((entry) => entry.id === item.productId);
        if (!product) throw new Error("The product for this price confirmation is missing.");
        const updated = { ...product, lastPrice: item.price, updatedAt: new Date().toISOString() };
        await products.put(updated);
        next.products = next.products.map((entry) => entry.id === updated.id ? updated : entry);
        await confirmPrice(updated.id, updated.lastPrice, updated.updatedAt);
      }
    }
    await tx.objectStore(STORES.basket).clear();
    for (const [position, item] of (next.activeSession?.items ?? []).entries()) {
      assertBasketItem(item);
      await tx.objectStore(STORES.basket).put({ ...item, position });
    }
    if (next.activeSession) {
      assertSession(next.activeSession);
      const { id, store, budget, startedAt, status, completedAt } = next.activeSession;
      await tx.objectStore(STORES.sessions).put({ id, store, budget, startedAt, status, completedAt }, ACTIVE_SESSION_KEY);
    } else {
      await tx.objectStore(STORES.sessions).delete(ACTIVE_SESSION_KEY);
    }
    return next;

    async function confirmPrice(productId: string, price: number, recordedAt: string) {
      const session: ActiveShoppingSession | null = next.activeSession;
      if (!session || !priceRecordId) throw new Error("The price confirmation is missing its session or ID.");
      const record: PriceRecord = { id: priceRecordId, productId, price, store: session.store, recordedAt, sessionId: session.id };
      await recordConfirmedPrice(tx, record);
    }
  });
}
