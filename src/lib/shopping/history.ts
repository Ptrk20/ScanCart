import type { ActiveShoppingSession, CompletedShoppingSession } from "../../types/models.ts";
import { assertBasketItem, assertSession, assertShoppingHistory } from "../db/validation.ts";
import { calculateBudget } from "./budget.ts";

/** An empty session ends without a receipt; every other receipt owns its item values. */
export function createShoppingHistorySnapshot(session: ActiveShoppingSession, completedAt: string): CompletedShoppingSession | undefined {
  assertSession(session);
  if (!Array.isArray(session.items)) throw new TypeError("The active basket is invalid.");
  session.items.forEach(assertBasketItem);
  const summary = calculateBudget(session.budget, session.items);
  if (session.items.length === 0) return undefined;
  const snapshot: CompletedShoppingSession = {
    id: session.id, store: session.store, budget: session.budget,
    startedAt: session.startedAt, completedAt, status: "completed",
    total: summary.total, productCount: summary.productCount, itemCount: summary.itemCount,
    items: session.items.map(({ id, productId, barcode, name, brand, category, price, quantity, store }) =>
      ({ id, productId, barcode, name, brand, category, price, quantity, store })),
  };
  assertShoppingHistory(snapshot);
  return snapshot;
}
