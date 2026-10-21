import type { BasketItem, BudgetStatus, BudgetSummary, Money } from "../../types/models";
import { assertCentavos, assertQuantity, itemSubtotal } from "../utils/money.ts";

type CalculationItem = Pick<BasketItem, "price" | "quantity">;
type CalculationItems = readonly CalculationItem[];

function assertItems(items: CalculationItems): void {
  if (!Array.isArray(items)) throw new TypeError("Basket items must be an array.");
}

function assertAmount(amount: Money): void {
  assertCentavos(amount);
  if (amount < 0) throw new RangeError("Price, budget, and basket total cannot be negative.");
}

function assertBudget(budget: Money | null): void {
  if (budget !== null) assertAmount(budget);
}

export function calculateItemSubtotal(item: CalculationItem): Money {
  if (!item || typeof item !== "object") throw new TypeError("A basket item is missing.");
  return itemSubtotal(item.price, item.quantity);
}

export function calculateProductRowCount(items: CalculationItems): number {
  assertItems(items);
  return items.length;
}

export function calculateBasketItemCount(items: CalculationItems): number {
  assertItems(items);
  let count = 0;
  for (const item of items) {
    if (!item || typeof item !== "object") throw new TypeError("A basket item is missing.");
    assertQuantity(item.quantity);
    count += item.quantity;
    if (!Number.isSafeInteger(count)) throw new RangeError("Item count exceeds the supported range.");
  }
  return count;
}

export function calculateBasketTotal(items: CalculationItems): Money {
  assertItems(items);
  let total = 0;
  for (const item of items) {
    total += calculateItemSubtotal(item);
    assertCentavos(total);
  }
  return total;
}

export function calculateRemainingBudget(budget: Money | null, basketTotal: Money): Money | null {
  assertBudget(budget);
  assertAmount(basketTotal);
  return budget === null ? null : budget - basketTotal;
}

export function calculateOverBudgetAmount(budget: Money | null, basketTotal: Money): Money {
  const remaining = calculateRemainingBudget(budget, basketTotal);
  return remaining === null ? 0 : Math.max(0, -remaining);
}

export function calculateBudgetUsagePercentage(budget: Money | null, basketTotal: Money): number {
  assertBudget(budget);
  assertAmount(basketTotal);
  return budget === null || budget === 0 ? 0 : (basketTotal / budget) * 100;
}

export function getBudgetStatus(budget: Money | null, basketTotal: Money): BudgetStatus {
  assertBudget(budget);
  assertAmount(basketTotal);
  if (budget === null) return "no-budget";
  if (basketTotal > budget) return "over-budget";
  if (budget === 0) return "within-budget";
  // Integer threshold is ceil(80% of budget), avoiding rounded percentage comparisons.
  if (basketTotal >= budget - Math.floor(budget / 5)) return "near-budget";
  return "within-budget";
}

function averagePrice(total: Money, itemCount: number): Money {
  if (itemCount === 0) return 0;
  const whole = Math.floor(total / itemCount);
  return whole + (total % itemCount >= Math.ceil(itemCount / 2) ? 1 : 0);
}

export function calculateAveragePricePerItem(items: CalculationItems): Money {
  return averagePrice(calculateBasketTotal(items), calculateBasketItemCount(items));
}

export function calculateBudget(budget: Money | null, items: CalculationItems): BudgetSummary {
  const total = calculateBasketTotal(items);
  const itemCount = calculateBasketItemCount(items);
  const usagePercentage = calculateBudgetUsagePercentage(budget, total);
  return {
    budget, total, itemCount,
    productCount: calculateProductRowCount(items),
    averagePricePerItem: averagePrice(total, itemCount),
    remaining: calculateRemainingBudget(budget, total),
    overBudgetBy: calculateOverBudgetAmount(budget, total),
    usagePercentage,
    progressPercentage: Math.min(100, Math.max(0, usagePercentage)),
    status: getBudgetStatus(budget, total),
  };
}
