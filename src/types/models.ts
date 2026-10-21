/** Monetary values are integer centavos, not floating-point pesos. */
export type Money = number;
export type ISODateString = string;

export interface Product {
  id: string;
  barcode?: string;
  name: string;
  brand: string;
  category: string;
  lastPrice: Money;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface PriceRecord {
  id: string;
  productId: Product["id"];
  store: string;
  price: Money;
  recordedAt: ISODateString;
  sessionId?: ActiveShoppingSession["id"];
}

/** Snapshot fields preserve receipts if the product is subsequently edited. */
export interface BasketItem {
  id: string;
  productId?: Product["id"];
  barcode?: string;
  name: string;
  brand: string;
  category?: string;
  price: Money;
  quantity: number;
  store: string;
}

interface ShoppingSessionBase {
  id: string;
  store: string;
  budget: Money | null;
  startedAt: ISODateString;
  items: BasketItem[];
}

export interface ActiveShoppingSession extends ShoppingSessionBase {
  status: "active";
  completedAt: null;
}

export interface CompletedShoppingSession extends ShoppingSessionBase {
  status: "completed";
  total: Money;
  productCount: number;
  itemCount: number;
  completedAt: ISODateString;
}

export type ShoppingSession = ActiveShoppingSession | CompletedShoppingSession;

export type BudgetStatus = "no-budget" | "within-budget" | "near-budget" | "over-budget";

export interface BudgetSummary {
  budget: Money | null;
  total: Money;
  remaining: Money | null;
  overBudgetBy: Money;
  productCount: number;
  itemCount: number;
  averagePricePerItem: Money;
  usagePercentage: number;
  progressPercentage: number;
  status: BudgetStatus;
}
