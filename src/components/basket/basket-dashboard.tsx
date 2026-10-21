"use client";

import Link from "next/link";
import { useShoppingSession } from "@/context/shopping-session-context";
import { BudgetOverview } from "@/components/home/budget-overview";
import { EndSessionButton } from "@/components/shopping/end-session-button";
import { BasketItem } from "./basket-item";
import { formatCurrency } from "@/lib/utils/money";
import { ShoppingFeedback } from "@/components/shopping/shopping-feedback";

export function BasketDashboard() {
  const { activeSession, items, summary, basketError } = useShoppingSession();

  if (!activeSession) {
    return (
      <section className="card mx-auto max-w-xl p-6 text-center sm:p-8">
        <h1 className="text-3xl font-bold">Your basket is waiting</h1>
        <p className="mt-4 text-sm leading-6 text-muted">Start a shopping session to choose your store and add your first item.</p>
        {basketError && <p role="alert" className="form-error">{basketError}</p>}
        <Link href="/shopping/new" className="button mt-6 bg-forest text-white">Start Shopping</Link>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="eyebrow">Your grocery run</p>
          <h1 className="mt-2 text-3xl font-bold">Your Basket</h1>
          <p className="mt-2 break-words font-semibold text-forest">{activeSession.store}</p>
          <p className="mt-1 text-sm text-muted">{summary.productCount} {summary.productCount === 1 ? "product" : "products"} · {summary.itemCount} {summary.itemCount === 1 ? "item" : "items"}</p>
        </div>
        <EndSessionButton />
      </header>
      {basketError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{basketError}</p>}
      <ShoppingFeedback />
      <BudgetOverview summary={summary} hasSession showBasketLink={false} />
      <p className="text-sm text-muted">Average per physical item: <span className="font-semibold tabular-nums text-forest">{formatCurrency(summary.averagePricePerItem)}</span></p>
      <Link href="/scan" className="button bg-forest text-white">Scan Another Item</Link>
      <div>
        <div className="min-w-0 space-y-4">
          {summary.productCount === 0 ? (
            <section className="card border-dashed p-6 text-center">
              <h2 className="text-lg font-semibold">Your basket is empty.</h2>
              <p className="mt-2 text-sm leading-6 text-muted">Add your first product to start tracking your shopping total.</p>
              <Link href="/products/new" className="button mt-4 border border-line text-forest">Add Item Manually</Link>
            </section>
          ) : (
            <>
              <Link href="/products/new" className="button bg-forest text-white">Add Another Item</Link>
              <ul className="grid items-start gap-4 md:grid-cols-2">{items.map((item) => <BasketItem key={item.id} item={item} />)}</ul>
            </>
          )}
          <p role="status" aria-live="polite" aria-atomic="true" className="sr-only">{summary.itemCount} {summary.itemCount === 1 ? "item" : "items"} in your basket. Basket total {formatCurrency(summary.total)}.</p>
        </div>
      </div>
      <p className="text-xs leading-5 text-muted">Your active session and basket are saved on this device. Ending shopping saves a receipt for non-empty trips before clearing the active basket. Products and price records are kept. Clearing browser data may remove local records.</p>
    </div>
  );
}
