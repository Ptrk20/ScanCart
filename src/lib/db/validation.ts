import type { BasketItem, CompletedShoppingSession, PriceRecord, Product } from "../../types/models";
import type { StoredSession } from "./database.ts";
import { calculateBudget, calculateItemSubtotal } from "../shopping/budget.ts";
import { normalizeBarcode } from "../shopping/product.ts";
import { assertCentavos } from "../utils/money.ts";

function record(value: unknown): asserts value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError("Invalid local record.");
}
function text(value: unknown): asserts value is string {
  if (typeof value !== "string" || !value.trim()) throw new TypeError("A required local field is invalid.");
}
function date(value: unknown): asserts value is string {
  text(value);
  const time = Date.parse(value);
  if (!Number.isFinite(time) || new Date(time).toISOString() !== value) throw new TypeError("A local timestamp is invalid.");
}
function amount(value: unknown): asserts value is number {
  if (typeof value !== "number") throw new TypeError("A local price is invalid.");
  assertCentavos(value);
  if (value < 0) throw new RangeError("A local price cannot be negative.");
}
function optionalText(value: unknown): void {
  if (value !== undefined && typeof value !== "string") throw new TypeError("A local text field is invalid.");
}
function barcode(value: unknown): void {
  optionalText(value);
  if (typeof value === "string" && normalizeBarcode(value) !== value) throw new TypeError("A local barcode is not normalized.");
}

export function assertProduct(value: unknown): asserts value is Product {
  record(value);
  text(value.id); text(value.name);
  if (typeof value.brand !== "string" || typeof value.category !== "string") throw new TypeError("Invalid product details.");
  barcode(value.barcode);
  amount(value.lastPrice); date(value.createdAt); date(value.updatedAt);
}

export function assertBasketItem(value: unknown): asserts value is BasketItem {
  record(value);
  text(value.id); text(value.name); text(value.store);
  optionalText(value.productId); optionalText(value.category);
  if (typeof value.brand !== "string") throw new TypeError("Invalid basket brand.");
  barcode(value.barcode);
  amount(value.price);
  if (typeof value.quantity !== "number") throw new TypeError("Invalid basket quantity.");
  calculateItemSubtotal({ price: value.price, quantity: value.quantity });
}

export function assertSession(value: unknown): asserts value is StoredSession {
  record(value);
  text(value.id); text(value.store); date(value.startedAt);
  if (value.status !== "active" || value.completedAt !== null) throw new TypeError("Invalid active session.");
  if (value.budget !== null) amount(value.budget);
  calculateBudget(value.budget, []);
}

export function assertPriceRecord(value: unknown): asserts value is PriceRecord {
  record(value);
  text(value.id); text(value.productId); text(value.store);
  optionalText(value.sessionId); amount(value.price); date(value.recordedAt);
}

export function assertShoppingHistory(value: unknown): asserts value is CompletedShoppingSession {
  record(value);
  text(value.id); text(value.store); date(value.startedAt); date(value.completedAt);
  if (value.status !== "completed" || value.completedAt < value.startedAt) throw new TypeError("Invalid completed session.");
  if (value.budget !== null) amount(value.budget);
  amount(value.total);
  if (!Array.isArray(value.items) || value.items.length === 0) throw new TypeError("A historical trip must contain items.");
  value.items.forEach(assertBasketItem);
  if (value.items.some((item) => item.store !== value.store) || new Set(value.items.map((item) => item.id)).size !== value.items.length) {
    throw new TypeError("Invalid historical basket.");
  }
  const summary = calculateBudget(value.budget, value.items);
  if (summary.total !== value.total || summary.productCount !== value.productCount || summary.itemCount !== value.itemCount) {
    throw new TypeError("Historical totals do not match their snapshots.");
  }
}
