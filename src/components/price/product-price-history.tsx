"use client";

import Link from "next/link";
import { usePriceHistory } from "@/hooks/use-price-history";
import { formatCurrency } from "@/lib/utils/money";
import { formatShoppingDateTime } from "@/lib/utils/date";
import { PriceLoadState } from "./price-load-state";
import { PriceChange } from "./price-change";
import { StorePriceComparison } from "./store-price-comparison";

export function ProductPriceHistory({ id }: { id: string }) {
  const { state, retry } = usePriceHistory(id);
  if (state.status !== "ready") return <div className="card p-6"><PriceLoadState error={state.status === "error"} retry={retry} /></div>;
  if (!state.product) return <section className="card space-y-4 p-6">
    <h1 className="text-2xl font-bold">Product not found.</h1>
    <p className="text-sm text-muted">This product may have been removed. Retained price records and completed shopping receipts have not been changed.</p>
    <Link href="/" className="button border border-line text-forest">Go Back</Link>
  </section>;
  const { product, analytics } = state;
  const summary = [
    { label: "Last Recorded", record: analytics.latest },
    { label: "Lowest Recorded", record: analytics.lowest },
    { label: "Highest Recorded", record: analytics.highest },
  ];
  return (
    <div className="min-w-0 space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-semibold text-forest">Product Price History</p>
        <h1 className="break-words text-3xl font-bold tracking-tight">{product.name}</h1>
        {product.brand && <p className="break-words text-muted">{product.brand}</p>}
        {product.barcode && <p className="break-all text-sm text-muted">Barcode: {product.barcode}</p>}
        <p className="text-sm text-muted">{analytics.recordCount} recorded {analytics.recordCount === 1 ? "price" : "prices"}</p>
        <p className="text-sm leading-6 text-muted">Prices you personally recorded in ScanCart, not live or official supermarket pricing.</p>
      </header>
      {!analytics.recordCount ? <section className="card space-y-2 p-6">
        <h2 className="text-xl font-bold">No price history recorded yet.</h2>
        <p className="text-sm text-muted">Prices you record while shopping will appear here.</p>
      </section> : <>
        <section className="card min-w-0 space-y-5 p-5" aria-labelledby="price-summary-heading">
          <h2 id="price-summary-heading" className="text-xl font-bold">Price Summary</h2>
          <dl className="grid min-w-0 gap-5 sm:grid-cols-2">
            {summary.map(({ label, record }) => record && <div key={label} className="min-w-0">
              <dt className="text-sm text-muted">{label}</dt>
              <dd className="break-words text-2xl font-bold tabular-nums">{formatCurrency(record.price)}</dd>
              <dd className="break-words text-xs leading-5 text-muted">{record.store} · <time dateTime={record.recordedAt}>{formatShoppingDateTime(record.recordedAt)}</time></dd>
            </div>)}
            {analytics.average !== undefined && <div className="min-w-0">
              <dt className="text-sm text-muted">Average Recorded</dt>
              <dd className="break-words text-2xl font-bold tabular-nums">{formatCurrency(analytics.average)}</dd>
              <dd className="text-xs text-muted">Each recorded price counts once, regardless of quantity.</dd>
            </div>}
          </dl>
          <PriceChange current={analytics.latest?.price} previous={analytics.previous} label="Previous recorded price (any store)" />
        </section>
        <StorePriceComparison records={analytics.latestByStore} />
        <section className="card min-w-0 space-y-4 p-5" aria-labelledby="price-history-heading">
          <h2 id="price-history-heading" className="text-xl font-bold">Price History</h2>
          <ul className="divide-y divide-line">
            {analytics.records.map((record) => <li key={record.id} className="min-w-0 space-y-1 py-4">
              <p className="text-sm text-muted"><time dateTime={record.recordedAt}>{formatShoppingDateTime(record.recordedAt)}</time></p>
              <p className="break-words font-semibold">{record.store}</p>
              <p className="break-words text-lg font-bold tabular-nums">{formatCurrency(record.price)}</p>
            </li>)}
          </ul>
        </section>
      </>}
      <p className="text-xs leading-5 text-muted">Saved only in this browser on this device. Viewing this page does not create price records or change your basket or completed trips.</p>
    </div>
  );
}
