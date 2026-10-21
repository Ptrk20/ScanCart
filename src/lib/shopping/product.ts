import type { Product } from "../../types/models";
import { parseMoneyInput } from "../utils/money.ts";

export interface ProductFormValues {
  barcode: string;
  name: string;
  brand: string;
  category: string;
  price: string;
  quantity: string;
}

export type ProductFormErrors = Partial<Record<keyof ProductFormValues, string>>;

export function normalizeBarcode(value: string): string | undefined {
  return value.trim() || undefined;
}

export function validateProduct(values: ProductFormValues):
  | { ok: true; value: Pick<Product, "barcode" | "name" | "brand" | "category" | "lastPrice"> & { quantity: number } }
  | { ok: false; errors: ProductFormErrors } {
  const errors: ProductFormErrors = {};
  const name = values.name.trim();
  const price = parseMoneyInput(values.price, "Price");
  const quantity = Number(values.quantity);
  if (!name) errors.name = "Please enter a product name.";
  if (!values.price.trim()) errors.price = "Please enter the product price.";
  else if (!price.ok) errors.price = price.error;
  if (!/^-?\d+$/.test(values.quantity.trim()) || !Number.isSafeInteger(quantity)) {
    errors.quantity = "Please enter a valid quantity. Use a whole number.";
  } else if (quantity < 1) {
    errors.quantity = "Quantity must be at least 1.";
  }
  if (Object.keys(errors).length || !price.ok) return { ok: false, errors };
  return { ok: true, value: {
    barcode: normalizeBarcode(values.barcode),
    name, brand: values.brand.trim(), category: values.category.trim(),
    lastPrice: price.value, quantity,
  } };
}

export function createProduct(
  value: Extract<ReturnType<typeof validateProduct>, { ok: true }>["value"],
  id: string,
  timestamp: string,
): Product {
  return {
    id, barcode: value.barcode, name: value.name, brand: value.brand,
    category: value.category, lastPrice: value.lastPrice,
    createdAt: timestamp, updatedAt: timestamp,
  };
}
