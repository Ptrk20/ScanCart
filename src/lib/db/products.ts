import type { Product } from "../../types/models";
import { normalizeBarcode } from "../shopping/product.ts";
import { INDEXES, STORES, withTransaction } from "./database.ts";
import { assertProduct } from "./validation.ts";

export async function createProduct(product: Product): Promise<void> {
  assertProduct(product);
  await withTransaction("readwrite", async (tx) => { await tx.objectStore(STORES.products).add(product); });
}
export async function getProductById(id: string): Promise<Product | undefined> {
  return withTransaction("readonly", async (tx) => {
    const product = await tx.objectStore(STORES.products).get(id);
    if (product) assertProduct(product);
    return product;
  });
}
export async function getProductByBarcode(value: string): Promise<Product | undefined> {
  const barcode = normalizeBarcode(value);
  if (!barcode) throw new TypeError("Please enter a barcode to look up.");
  return withTransaction("readonly", async (tx) => {
    const product = await tx.objectStore(STORES.products).index(INDEXES.barcode).get(barcode);
    if (product) assertProduct(product);
    return product;
  });
}
export const findProductByBarcode = getProductByBarcode;

export async function getAllProducts(): Promise<Product[]> {
  return withTransaction("readonly", async (tx) => {
    const products = await tx.objectStore(STORES.products).getAll();
    products.forEach(assertProduct);
    return products;
  });
}
export async function updateProduct(product: Product): Promise<void> {
  assertProduct(product);
  await withTransaction("readwrite", async (tx) => {
    const store = tx.objectStore(STORES.products);
    if (!await store.getKey(product.id)) throw new Error("That saved product no longer exists.");
    await store.put(product);
  });
}
export async function deleteProduct(id: string): Promise<void> {
  await withTransaction("readwrite", async (tx) => {
    const items = await tx.objectStore(STORES.basket).getAll();
    if (items.some((item) => item.productId === id)) throw new Error("Remove this product from the active basket before deleting it.");
    await tx.objectStore(STORES.products).delete(id);
  });
}
