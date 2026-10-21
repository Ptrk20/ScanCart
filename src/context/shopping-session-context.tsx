"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createSession, validateSession, type SessionDraft, type SessionErrors } from "@/lib/shopping/session";
import { initialShoppingState, type ShoppingAction, type BasketAction, type NewBasketItem } from "@/lib/shopping/basket";
import { createProduct, validateProduct, type ProductFormValues } from "@/lib/shopping/product";
import { calculateBudget } from "@/lib/shopping/budget";
import { commitShoppingAction, loadShoppingState, SessionChangedError } from "@/lib/db/shopping";
import type { ActiveShoppingSession, BasketItem, BudgetSummary, Product } from "@/types/models";

type ActionResult = { ok: true } | { ok: false; error: string };
type StartResult = { ok: true } | { ok: false; errors: SessionErrors };
type PersistentAction = Exclude<ShoppingAction, { type: "error" | "dismiss-success" }>;

interface ShoppingSessionContextValue {
  activeSession: ActiveShoppingSession | null;
  startSession: (draft: SessionDraft) => Promise<StartResult>;
  endSession: () => Promise<ActionResult>;
  items: readonly BasketItem[];
  products: readonly Product[];
  summary: BudgetSummary;
  basketError: string | null;
  addItem: (item: NewBasketItem) => Promise<ActionResult>;
  removeItem: (id: string) => Promise<ActionResult>;
  increaseQuantity: (id: string) => Promise<ActionResult>;
  decreaseQuantity: (id: string) => Promise<ActionResult>;
  updateQuantity: (id: string, quantity: number) => Promise<ActionResult>;
  updatePrice: (id: string, price: number) => Promise<ActionResult>;
  clearBasket: () => Promise<ActionResult>;
  addProduct: (values: ProductFormValues) => Promise<ActionResult>;
  successMessage: string | null;
  dismissSuccess: () => void;
  isLoading: boolean;
  isSaving: boolean;
  storageError: string | null;
}

const ShoppingSessionContext = createContext<ShoppingSessionContextValue | null>(null);
const emptyItems: readonly BasketItem[] = [];
const saveError = "Your change was not saved. Your previous saved shopping data is unchanged. Check that browser storage is available, close other ScanCart tabs, and try again.";

export function ShoppingSessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(initialShoppingState);
  const stateRef = useRef(initialShoppingState);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const ready = useRef(false);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const pending = useRef(0);
  const { activeSession, basketError, successMessage } = state;

  useEffect(() => {
    let cancelled = false;
    ready.current = false;
    void loadShoppingState().then((saved) => {
      if (cancelled) return;
      stateRef.current = saved;
      setState(saved);
      setLoadFailed(false);
      setStorageError(null);
      ready.current = true;
    }).catch((error: unknown) => {
      if (cancelled) return;
      console.error("ScanCart could not load local shopping data.", error);
      setLoadFailed(true);
      setStorageError("We couldn't load your saved shopping data. Allow browser storage, close other ScanCart tabs, and retry. No saved records have been changed.");
    }).finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; ready.current = false; };
  }, [attempt]);

  const items = activeSession ? activeSession.items : emptyItems;
  const summary = useMemo(() => calculateBudget(activeSession ? activeSession.budget : null, items), [activeSession, items]);

  function commit(action: PersistentAction, priceRecordId?: string): Promise<ActionResult> {
    if (!ready.current) return Promise.resolve({ ok: false, error: "Wait until saved shopping data has loaded before making changes." });
    const expectedSessionId = stateRef.current.activeSession?.id ?? null;
    pending.current++;
    setIsSaving(true);
    // Serialize actions, read the latest database snapshot, then publish only after transaction completion.
    const operation = queue.current.then(async (): Promise<ActionResult> => {
      try {
        const next = await commitShoppingAction(action, expectedSessionId, priceRecordId);
        stateRef.current = next;
        setState(next);
        setStorageError(null);
        return next.basketError ? { ok: false, error: next.basketError } : { ok: true };
      } catch (error) {
        console.error("ScanCart could not save a shopping change.", error);
        const message = error instanceof SessionChangedError ? error.message : action.type === "end"
          ? "We couldn't save this shopping trip. Your basket has not been cleared. Check browser storage, close other ScanCart tabs, and try again."
          : saveError;
        setStorageError(message);
        return { ok: false, error: message };
      } finally {
        pending.current--;
        if (!pending.current) setIsSaving(false);
      }
    });
    queue.current = operation;
    return operation;
  }

  async function startSession(draft: SessionDraft): Promise<StartResult> {
    if (stateRef.current.activeSession) {
      return { ok: false, errors: { form: "End your current shopping session before starting another." } };
    }
    const result = validateSession(draft);
    if (!result.ok) return result;
    if (typeof crypto.randomUUID !== "function") {
      return { ok: false, errors: { form: "Your browser cannot create a shopping session. Open ScanCart over HTTPS or use a supported browser." } };
    }
    const saved = await commit({ type: "start", session: createSession(result.value, crypto.randomUUID(), new Date().toISOString()) });
    return saved.ok ? saved : { ok: false, errors: { form: saved.error } };
  }

  function changeBasket(action: BasketAction): Promise<ActionResult> {
    if (action.type === "price" && typeof crypto.randomUUID !== "function") {
      const error = "Your browser cannot save a price confirmation. Open ScanCart over HTTPS or use a supported browser.";
      setStorageError(error);
      return Promise.resolve({ ok: false, error });
    }
    return commit({ type: "basket", action }, action.type === "price" ? crypto.randomUUID() : undefined);
  }

  async function addProduct(values: ProductFormValues): Promise<ActionResult> {
    const validation = validateProduct(values);
    if (!validation.ok) return { ok: false, error: Object.values(validation.errors).join(" ") };
    if (typeof crypto.randomUUID !== "function") {
      return { ok: false, error: "Your browser cannot create a product. Open ScanCart over HTTPS or use a supported browser." };
    }
    const product = createProduct(validation.value, crypto.randomUUID(), new Date().toISOString());
    return commit({ type: "product", product, quantity: validation.value.quantity, basketId: crypto.randomUUID() }, crypto.randomUUID());
  }

  function addItem(item: NewBasketItem): Promise<ActionResult> {
    if (typeof crypto.randomUUID !== "function") {
      const error = "Your browser cannot create a basket entry. Open ScanCart over HTTPS or use a supported browser.";
      setStorageError(error);
      return Promise.resolve({ ok: false, error });
    }
    return commit({ type: "basket", action: { type: "add", item, id: crypto.randomUUID() } });
  }

  return (
    <ShoppingSessionContext.Provider value={{
      activeSession, startSession, endSession: () => commit({ type: "end" }), items, products: state.products, summary, basketError,
      addItem, addProduct, successMessage, isLoading, isSaving, storageError,
      dismissSuccess: () => {
        stateRef.current = { ...stateRef.current, successMessage: null };
        setState(stateRef.current);
      },
      removeItem: (id) => changeBasket({ type: "remove", id }),
      increaseQuantity: (id) => changeBasket({ type: "increase", id }),
      decreaseQuantity: (id) => changeBasket({ type: "decrease", id }),
      updateQuantity: (id, quantity) => changeBasket({ type: "quantity", id, quantity }),
      updatePrice: (id, price) => changeBasket({ type: "price", id, price }),
      clearBasket: () => changeBasket({ type: "clear" }),
    }}>
      {isLoading && <section role="status" aria-live="polite" className="card mx-auto mt-8 max-w-xl p-6">Loading your saved shopping data...</section>}
      {!isLoading && loadFailed && (
        <section className="card mx-auto mt-8 max-w-xl space-y-4 p-6">
          <h1 className="text-xl font-bold">Local storage is unavailable</h1>
          <p role="alert" className="text-sm leading-6 text-muted">{storageError}</p>
          <button type="button" onClick={() => { setIsLoading(true); setAttempt((value) => value + 1); }} className="button bg-forest text-white">Retry loading</button>
        </section>
      )}
      {!loadFailed && storageError && <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{storageError}</div>}
      {isSaving && <p role="status" className="mb-3 text-sm text-muted">Saving to this device...</p>}
      {/* Keep the route tree rendered for Next's navigation validation, but inaccessible until hydration succeeds. */}
      <div hidden={isLoading || loadFailed} inert={isLoading || loadFailed}>{children}</div>
    </ShoppingSessionContext.Provider>
  );
}

export function useShoppingSession(): ShoppingSessionContextValue {
  const context = useContext(ShoppingSessionContext);
  if (!context) throw new Error("useShoppingSession must be used within ShoppingSessionProvider.");
  return context;
}
