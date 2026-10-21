"use client";

import Link from "next/link";
import { useShoppingHistory } from "@/hooks/use-shopping-history";
import { calculateBudget, calculateItemSubtotal } from "@/lib/shopping/budget";
import { formatCurrency } from "@/lib/utils/money";
import { formatShoppingDateTime } from "@/lib/utils/date";
import { HistoryLoadState } from "./history-load-state";
import { DeleteHistoryButton } from "./delete-history-button";

export function HistoryDetails({ id }: { id: string }) {
  const { state, retry } = useShoppingHistory(id);
  if (state.status !== "ready") return <HistoryLoadState status={state.status} onRetry={retry} />;
  const trip = state.records[0];
  if (!trip) return (
    <section className="card space-y-4 p-6">
      <h1 className="text-2xl font-bold">Shopping trip not found.</h1>
      <Link href="/history" className="button bg-forest text-white">Back to History</Link>
    </section>
  );
  const summary = calculateBudget(trip.budget, trip.items);
  return (
    <article className="min-w-0 space-y-6">
      <header className="space-y-3">
        <p className="eyebrow">Your completed shop</p>
        <h1 className="break-words text-3xl font-bold">{trip.store}</h1>
        <p className="text-sm text-muted">Completed <time dateTime={trip.completedAt}>{formatShoppingDateTime(trip.completedAt)}</time></p>
        <p className="text-xs text-muted">Started <time dateTime={trip.startedAt}>{formatShoppingDateTime(trip.startedAt)}</time></p>
        <p className="text-sm font-semibold">{trip.productCount} {trip.productCount === 1 ? "product" : "products"} · {trip.itemCount} {trip.itemCount === 1 ? "item" : "items"}</p>
      </header>
      <dl className="card grid gap-5 p-5 sm:grid-cols-3 sm:p-6">
        <div className="min-w-0"><dt className="text-sm text-muted">Original budget</dt><dd className="mt-2 break-words text-xl font-bold tabular-nums">{trip.budget === null ? "No budget set" : formatCurrency(trip.budget)}</dd></div>
        <div className="min-w-0"><dt className="text-sm text-muted">Total spent</dt><dd className="mt-2 break-words text-2xl font-bold tabular-nums text-forest">{formatCurrency(trip.total)}</dd></div>
        <div className="min-w-0"><dt className="text-sm text-muted">{summary.overBudgetBy > 0 ? "Over budget" : "Remaining"}</dt><dd className={`mt-2 break-words text-xl font-bold tabular-nums ${summary.overBudgetBy > 0 ? "text-red-800" : "text-forest"}`}>{summary.remaining === null ? "No spending limit" : formatCurrency(summary.overBudgetBy > 0 ? summary.overBudgetBy : summary.remaining)}</dd></div>
      </dl>
      <section aria-labelledby="purchased-items-heading" className="space-y-4">
        <h2 id="purchased-items-heading" className="text-xl font-bold">Purchased items</h2>
        <ul className="grid items-start gap-4 md:grid-cols-2">
          {trip.items.map((item) => (
            <li key={item.id} className="card min-w-0 space-y-3 p-5">
              <h3 className="break-words text-lg font-semibold">{item.name}</h3>
              {(item.brand || item.category) && <p className="break-words text-sm text-muted">{[item.brand, item.category].filter(Boolean).join(" · ")}</p>}
              {item.barcode && <p className="break-all text-xs text-muted">Barcode: {item.barcode}</p>}
              <p className="break-words text-sm">{formatCurrency(item.price)} × {item.quantity}</p>
              <p className="break-words font-semibold tabular-nums">Subtotal <span className="text-forest">{formatCurrency(calculateItemSubtotal(item))}</span></p>
            </li>
          ))}
        </ul>
      </section>
      <p className="text-xs leading-5 text-muted">This read-only receipt preserves the names, prices, and quantities recorded at checkout. Later product changes do not change this trip.</p>
      <DeleteHistoryButton id={trip.id} />
    </article>
  );
}
