import type { ActiveShoppingSession, BasketItem, Product } from "../../types/models";
import { calculateBudget } from "./budget.ts";
import { itemSubtotal } from "../utils/money.ts";

export type NewBasketItem = Pick<BasketItem, "name" | "price" | "quantity" | "productId" | "barcode">
  & Partial<Pick<BasketItem, "brand" | "category">>;

export type BasketAction =
  | { type: "add"; item: NewBasketItem; id: string }
  | { type: "remove"; id: string }
  | { type: "increase"; id: string }
  | { type: "decrease"; id: string }
  | { type: "quantity"; id: string; quantity: number }
  | { type: "price"; id: string; price: number }
  | { type: "clear" };

export class BasketValidationError extends Error {}

function matchesProduct(existing: BasketItem, incoming: NewBasketItem): boolean {
  if (existing.barcode && incoming.barcode) return existing.barcode === incoming.barcode;
  if (existing.productId && incoming.productId) return existing.productId === incoming.productId;
  return !!existing.barcode && !!incoming.barcode && existing.barcode === incoming.barcode;
}

export function applyBasketAction(session: ActiveShoppingSession, action: BasketAction): ActiveShoppingSession {
  let items: BasketItem[];
  if (action.type === "clear") {
    items = [];
  } else if (action.type === "add") {
    const name = action.item.name.trim();
    if (!name) throw new BasketValidationError("Please enter a product name.");
    itemSubtotal(action.item.price, action.item.quantity);
    const existing = session.items.find((item) => matchesProduct(item, action.item));
    if (existing) {
      items = session.items.map((item) => item.id === existing.id
        ? { ...item, ...action.item, name, id: item.id, quantity: item.quantity + action.item.quantity }
        : item);
    } else {
      if (!action.id || session.items.some((item) => item.id === action.id)) {
        throw new BasketValidationError("Could not create a unique basket entry. Please try again.");
      }
      items = [...session.items, {
        ...action.item, name, id: action.id, brand: action.item.brand ?? "", store: session.store,
      }];
    }
  } else {
    const existing = session.items.find((item) => item.id === action.id);
    if (!existing) throw new BasketValidationError("That basket item is no longer available.");
    if (action.type === "remove") {
      items = session.items.filter((item) => item.id !== action.id);
    } else {
      items = session.items.map((item) => {
        if (item.id !== action.id) return item;
        switch (action.type) {
          case "increase": return { ...item, quantity: item.quantity + 1 };
          case "decrease": return { ...item, quantity: Math.max(1, item.quantity - 1) };
          case "quantity": return { ...item, quantity: action.quantity };
          case "price": return { ...item, price: action.price };
        }
      });
    }
  }
  calculateBudget(session.budget, items);
  return { ...session, items };
}

export interface ShoppingState {
  activeSession: ActiveShoppingSession | null;
  basketError: string | null;
  products: Product[];
  successMessage: string | null;
}

export const initialShoppingState: ShoppingState = {
  activeSession: null, basketError: null, products: [], successMessage: null,
};

export type ShoppingAction =
  | { type: "start"; session: ActiveShoppingSession }
  | { type: "end" }
  | { type: "basket"; action: BasketAction }
  | { type: "product"; product: Product; quantity: number; basketId: string }
  | { type: "dismiss-success" }
  | { type: "error"; message: string };

export function shoppingReducer(state: ShoppingState, action: ShoppingAction): ShoppingState {
  switch (action.type) {
    case "start":
      return state.activeSession
        ? { ...state, basketError: "End your current shopping session before starting another." }
        : { ...initialShoppingState, products: state.products, activeSession: action.session };
    case "end":
      return { ...initialShoppingState, products: state.products };
    case "dismiss-success":
      return { ...state, successMessage: null };
    case "error":
      return { ...state, basketError: action.message };
    case "basket":
      if (!state.activeSession) {
        return { ...state, basketError: "Start a shopping session before changing your basket." };
      }
      try {
        return { ...state, activeSession: applyBasketAction(state.activeSession, action.action), basketError: null, successMessage: null };
      } catch (error) {
        if (error instanceof BasketValidationError || error instanceof RangeError) {
          return { ...state, basketError: error.name === "RangeError"
            ? "This price or quantity exceeds the supported basket size. Please enter a smaller value."
            : error.message };
        }
        throw error;
      }
    case "product":
      if (!state.activeSession) {
        return { ...state, basketError: "Start a shopping session before adding products." };
      }
      try {
        const previous = action.product.barcode
          ? state.products.find((product) => product.barcode === action.product.barcode)
          : state.products.find((product) => product.id === action.product.id);
        const product = previous
          ? { ...action.product, id: previous.id, createdAt: previous.createdAt }
          : action.product;
        const activeSession = applyBasketAction(state.activeSession, { type: "add", id: action.basketId, item: {
          productId: product.id, barcode: product.barcode, name: product.name,
          brand: product.brand, category: product.category, price: product.lastPrice, quantity: action.quantity,
        } });
        return {
          activeSession, basketError: null,
          products: [...state.products.filter((entry) => entry.id !== product.id), product],
          successMessage: `${product.name} was added to your basket.`,
        };
      } catch (error) {
        if (error instanceof BasketValidationError || error instanceof RangeError) {
          return { ...state, basketError: error.name === "RangeError"
            ? "This price or quantity exceeds the supported basket size. Please enter a smaller value."
            : error.message };
        }
        throw error;
      }
  }
}
