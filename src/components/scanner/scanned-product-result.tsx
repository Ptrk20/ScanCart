"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import type { Product } from "@/types/models";
import { formatCurrency, moneyInputValue, parseMoneyInput } from "@/lib/utils/money";
import { validateProduct, type ProductFormErrors } from "@/lib/shopping/product";
import { useShoppingSession } from "@/context/shopping-session-context";
import { QuantityControl } from "@/components/basket/quantity-control";
import { usePriceHistory } from "@/hooks/use-price-history";
import { getComparisonPrice } from "@/lib/shopping/price-analytics";
import { formatShoppingDate } from "@/lib/utils/date";
import { PriceChange } from "@/components/price/price-change";
import { PriceLoadState } from "@/components/price/price-load-state";

export function ScannedProductResult({ product, onAdded, onScanAgain }: { product: Product; onAdded: (name: string) => void; onScanAgain: () => void }) {
  const { activeSession, addProduct } = useShoppingSession();
  const [price, setPrice] = useState(moneyInputValue(product.lastPrice));
  const [quantity, setQuantity] = useState(1);
  const [errors, setErrors] = useState<ProductFormErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const locked = useRef(false);
  const generation = useRef(0);
  const priceInput = useRef<HTMLInputElement>(null);
  const { state: history, retry } = usePriceHistory(product.id);
  const enteredPrice = parseMoneyInput(price, "Price");
  const previous = history.status === "ready" ? getComparisonPrice(history.analytics.records, activeSession?.store ?? "") : undefined;
  useEffect(() => () => { generation.current++; }, []);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (locked.current) return;
    const values = { barcode: product.barcode ?? "", name: product.name, brand: product.brand, category: product.category, price, quantity: String(quantity) };
    const validation = validateProduct(values);
    if (!validation.ok) {
      setErrors(validation.errors);
      priceInput.current?.focus();
      return;
    }
    locked.current = true;
    const token = generation.current;
    setSaving(true);
    const result = await addProduct(values);
    if (token !== generation.current) return;
    if (!result.ok) {
      setError(result.error);
      setSaving(false);
      locked.current = false;
      return;
    }
    onAdded(product.name);
  }
  return (
    <section className="card min-w-0 space-y-4 p-5">
      <h2 className="text-xl font-bold">Product Found</h2>
      <p className="break-words text-lg font-semibold">{product.name}</p>
      {(product.brand || product.category) && <p className="break-words text-sm text-muted">{[product.brand, product.category].filter(Boolean).join(" · ")}</p>}
      <p className="break-all text-sm">Barcode: {product.barcode}</p>
      {history.status === "ready" ? history.analytics.latest ? <p className="break-words text-sm">Last recorded price: <strong>{formatCurrency(history.analytics.latest.price)}</strong> at {history.analytics.latest.store}, recorded {formatShoppingDate(history.analytics.latest.recordedAt)}.</p> : <p className="text-sm text-muted">No price history recorded yet.</p> : <PriceLoadState error={history.status === "error"} retry={retry} />}
      <p className="break-words text-sm">Current store: <strong>{activeSession?.store}</strong></p>
      <p className="text-xs leading-5 text-muted">History contains only your recorded prices, not live supermarket prices.</p>
      <Link href={`/products/${encodeURIComponent(product.id)}/prices`} className="inline-flex min-h-11 items-center text-sm font-semibold text-forest underline">View Price History</Link>
      <form onSubmit={submit} noValidate className="space-y-4">
        <div>
          <label htmlFor="scanned-price" className="text-sm font-semibold">Current price (PHP)</label>
          <input ref={priceInput} id="scanned-price" inputMode="decimal" required disabled={saving} value={price} onChange={(event) => { setPrice(event.target.value); setErrors({}); setError(null); }} className="form-input" aria-invalid={!!errors.price} aria-describedby={`scanned-price-help${errors.price ? " scanned-price-error" : ""}`} />
          <p id="scanned-price-help" className="mt-2 text-xs leading-5 text-muted">Confirm the shelf price. A code does not contain the current store price. Extra decimals round half-up to the nearest centavo.</p>
          {errors.price && <p id="scanned-price-error" className="form-error">{errors.price}</p>}
        </div>
        {history.status === "ready" && <PriceChange current={enteredPrice.ok ? enteredPrice.value : undefined} previous={previous} label={previous?.store === activeSession?.store ? "Last recorded at this store" : "No record at this store; comparing with last recorded at another store"} />}
        <fieldset disabled={saving} className="space-y-2">
          <legend className="mb-2 text-sm font-semibold">Quantity</legend>
          <QuantityControl name={product.name} quantity={quantity} onIncrease={() => {
            if (Number.isSafeInteger(quantity + 1)) { setQuantity(quantity + 1); setErrors({}); }
            else setErrors({ quantity: "This quantity is too large. Use a smaller quantity." });
          }} onDecrease={() => setQuantity(Math.max(1, quantity - 1))} />
        </fieldset>
        {(error || errors.quantity) && <p role="alert" className="form-error">{error ?? errors.quantity}</p>}
        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={saving} className="button bg-forest text-white disabled:opacity-50">{saving ? "Adding to basket..." : "Add to Basket"}</button>
          <button type="button" disabled={saving} onClick={onScanAgain} className="button border border-line text-forest">Scan Again</button>
          <button type="button" disabled={saving} onClick={onScanAgain} className="button border border-line text-forest">Cancel</button>
        </div>
      </form>
    </section>
  );
}
