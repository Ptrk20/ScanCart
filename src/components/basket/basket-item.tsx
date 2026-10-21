"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import type { BasketItem as BasketItemModel } from "@/types/models";
import { formatCurrency, moneyInputValue, parseMoneyInput } from "@/lib/utils/money";
import { calculateItemSubtotal } from "@/lib/shopping/budget";
import { useShoppingSession } from "@/context/shopping-session-context";
import { QuantityControl } from "./quantity-control";

export function BasketItem({ item }: { item: BasketItemModel }) {
  const { removeItem, increaseQuantity, decreaseQuantity, updatePrice } = useShoppingSession();
  const [editing, setEditing] = useState(false);
  const [price, setPrice] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const locked = useRef(false);
  const inputId = useId();
  const editButtonRef = useRef<HTMLButtonElement>(null);
  const subtotal = calculateItemSubtotal(item);

  function finishEditing() {
    setEditing(false);
    setError(null);
    editButtonRef.current?.focus();
  }

  async function savePrice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked.current) return;
    const result = parseMoneyInput(price, "Price");
    if (!result.ok) {
      setError(result.error);
      return;
    }
    locked.current = true;
    setSaving(true);
    const updated = await updatePrice(item.id, result.value);
    locked.current = false;
    setSaving(false);
    if (!updated.ok) {
      setError(updated.error);
      return;
    }
    finishEditing();
  }

  return (
    <li className="card min-w-0 p-5 sm:p-6">
      <h2 className="break-words text-lg font-bold">{item.name}</h2>
      {(item.brand || item.category) && <p className="mt-1 break-words text-sm text-muted">{[item.brand, item.category].filter(Boolean).join(" · ")}</p>}
      {item.barcode && <p className="mt-1 break-words text-xs text-muted">Barcode: {item.barcode}</p>}
      <p className="mt-1 text-sm text-muted">{formatCurrency(item.price)} each</p>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <QuantityControl name={item.name} quantity={item.quantity} onIncrease={() => increaseQuantity(item.id)} onDecrease={() => decreaseQuantity(item.id)} />
        <div className="min-w-0 text-right">
          <p className="text-xs text-muted">Subtotal</p>
          <p className="break-words text-xl font-bold tabular-nums">{formatCurrency(subtotal)}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-4">
        <button ref={editButtonRef} type="button" aria-label={`Edit price of ${item.name}`} aria-expanded={editing} onClick={() => { setPrice(moneyInputValue(item.price)); setError(null); setEditing(true); }} className="min-h-11 text-sm font-semibold text-forest underline underline-offset-4">Edit Price</button>
        <button type="button" aria-label={`Remove ${item.name}`} onClick={() => removeItem(item.id)} className="min-h-11 text-sm font-semibold text-red-700 underline underline-offset-4">Remove</button>
        {item.productId && <Link href={`/products/${encodeURIComponent(item.productId)}/prices`} aria-label={`Price history for ${item.name}`} className="inline-flex min-h-11 items-center text-sm font-semibold text-forest underline underline-offset-4">Price History</Link>}
      </div>
      {editing && (
        <form onSubmit={savePrice} noValidate className="mt-3 border-t border-line pt-4">
          <label htmlFor={inputId} className="text-sm font-semibold">New price for {item.name} (PHP)</label>
          <input id={inputId} autoFocus disabled={saving} inputMode="decimal" value={price} onChange={(event) => setPrice(event.target.value)} className="form-input" aria-invalid={!!error} aria-describedby={`${inputId}-help${error ? ` ${inputId}-error` : ""}`} />
          <p id={`${inputId}-help`} className="mt-2 text-xs text-muted">Extra decimals round to the nearest centavo; half rounds up.</p>
          {error && <p id={`${inputId}-error`} role="alert" className="form-error">{error}</p>}
          <div className="mt-3 flex flex-wrap gap-3">
            <button type="submit" disabled={saving} className="button bg-forest text-white disabled:opacity-60">{saving ? "Saving..." : "Save Price"}</button>
            <button type="button" disabled={saving} onClick={finishEditing} className="button border border-line text-forest disabled:opacity-60">Cancel</button>
          </div>
        </form>
      )}
    </li>
  );
}
