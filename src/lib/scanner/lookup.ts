import { findProductByBarcode } from "../db/products.ts";
import { equivalentRetailCode } from "./codes.ts";
import type { Product } from "../../types/models.ts";

export async function findScannedProduct(code: string): Promise<Product | undefined> {
  const exact = await findProductByBarcode(code);
  if (exact) return exact;
  const equivalent = equivalentRetailCode(code);
  return equivalent ? findProductByBarcode(equivalent) : undefined;
}
