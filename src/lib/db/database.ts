import { openDB, type DBSchema, type IDBPDatabase, type IDBPTransaction } from "idb";
import type { ActiveShoppingSession, BasketItem, CompletedShoppingSession, PriceRecord, Product } from "../../types/models";

export const DB_NAME = "scancart-db";
export const DB_VERSION = 2;
export const STORES = { products: "products", basket: "basket", sessions: "sessions", priceHistory: "priceHistory", shoppingHistory: "shoppingHistory" } as const;
export const INDEXES = { barcode: "barcode", productTime: "productTime", sessionProduct: "sessionProduct" } as const;
export const ACTIVE_SESSION_KEY = "active";
export type StoredSession = Omit<ActiveShoppingSession, "items">;
export interface StoredBasketItem extends BasketItem {
  position?: number;
}

export interface ScanCartSchema extends DBSchema {
  products: { key: string; value: Product; indexes: { barcode: string } };
  basket: { key: string; value: StoredBasketItem };
  sessions: { key: string; value: StoredSession };
  shoppingHistory: { key: string; value: CompletedShoppingSession };
  priceHistory: {
    key: string;
    value: PriceRecord;
    indexes: { productTime: [string, string]; sessionProduct: [string, string] };
  };
}

type StoreName = typeof STORES[keyof typeof STORES];
export type DatabaseTransaction<Mode extends IDBTransactionMode = "readwrite"> =
  IDBPTransaction<ScanCartSchema, StoreName[], Mode>;
let connection: Promise<IDBPDatabase<ScanCartSchema>> | undefined;
const TIMEOUT_MS = 10000;

export function openScanCartDatabase(): Promise<IDBPDatabase<ScanCartSchema>> {
  if (typeof indexedDB === "undefined") return Promise.reject(new Error("IndexedDB is unavailable in this browser."));
  if (!connection) {
    connection = new Promise<IDBPDatabase<ScanCartSchema>>((resolve, reject) => {
      let expired = false;
      const fail = (message: string) => {
        expired = true;
        reject(new Error(message));
      };
      const timeout = setTimeout(() => fail("Opening local storage timed out. Close other ScanCart tabs and retry."), TIMEOUT_MS);
      let opening: Promise<IDBPDatabase<ScanCartSchema>>;
      try {
        opening = openDB<ScanCartSchema>(DB_NAME, DB_VERSION, {
          upgrade(db, oldVersion) {
            if (oldVersion < 1) {
              const products = db.createObjectStore(STORES.products, { keyPath: "id" });
              products.createIndex(INDEXES.barcode, "barcode", { unique: true });
              db.createObjectStore(STORES.basket, { keyPath: "id" });
              db.createObjectStore(STORES.sessions);
              const prices = db.createObjectStore(STORES.priceHistory, { keyPath: "id" });
              prices.createIndex(INDEXES.productTime, ["productId", "recordedAt"]);
              prices.createIndex(INDEXES.sessionProduct, ["sessionId", "productId"]);
            }
            if (oldVersion < 2) {
              db.createObjectStore(STORES.shoppingHistory, { keyPath: "id" });
            }
          },
          blocked() {
            clearTimeout(timeout);
            fail("Local storage is blocked by another ScanCart tab. Close it and retry.");
          },
          blocking() {
            void opening.then((db) => db.close());
            connection = undefined;
          },
          terminated() { connection = undefined; },
        });
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
        return;
      }
      void opening.then((db) => {
        clearTimeout(timeout);
        if (expired) db.close();
        else resolve(db);
      }, (error: unknown) => {
        clearTimeout(timeout);
        reject(error);
      });
    }).catch((error: unknown) => {
      connection = undefined;
      throw error;
    });
  }
  return connection;
}

export async function withTransaction<T, Mode extends "readonly" | "readwrite">(
  mode: Mode, operation: (tx: DatabaseTransaction<Mode>) => Promise<T>,
): Promise<T> {
  const db = await openScanCartDatabase();
  const tx = db.transaction(Object.values(STORES), mode);
  // Observe completion immediately, including aborts while an individual request is awaited.
  const done = tx.done;
  void done.catch(() => undefined);
  const timeout = setTimeout(() => tx.abort(), TIMEOUT_MS);
  try {
    const result = await operation(tx);
    await done;
    return result;
  } catch (error) {
    try { tx.abort(); } catch (abortError) {
      if (!(abortError instanceof DOMException && abortError.name === "InvalidStateError")) throw abortError;
    }
    await done.catch(() => undefined);
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

/** Internal developer utility only; callers must explicitly intend to erase local data. */
export async function clearScanCartData(): Promise<void> {
  await withTransaction("readwrite", async (tx) => {
    for (const store of Object.values(STORES)) await tx.objectStore(store).clear();
  });
}
