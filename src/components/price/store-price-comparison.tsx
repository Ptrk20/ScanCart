import type { PriceRecord } from "@/types/models";
import { calculatePriceDifference } from "@/lib/shopping/price-analytics";
import { formatCurrency } from "@/lib/utils/money";
import { formatShoppingDate } from "@/lib/utils/date";

export function StorePriceComparison({ records }: { records: readonly PriceRecord[] }) {
  if (!records.length) return null;
  const lowest = records[0];
  const highest = records[records.length - 1];
  const tied = records.filter((record) => record.price === lowest.price).length > 1;
  return (
    <section className="card min-w-0 space-y-4 p-5" aria-labelledby="store-prices-heading">
      <h2 id="store-prices-heading" className="text-xl font-bold">Latest Recorded by Store</h2>
      <p className="text-sm leading-6 text-muted">Only your latest recorded price at each exact store name is compared. These are not guaranteed current prices.</p>
      {records.length > 1 && <p className="break-words text-sm font-semibold">
        Lowest Latest Recorded{tied ? " (tied)" : ""}: {formatCurrency(lowest.price)}. Difference between highest and lowest latest recorded: {formatCurrency(calculatePriceDifference(highest.price, lowest.price))}.
      </p>}
      <ul className="divide-y divide-line">
        {records.map((record) => <li key={record.id} className="min-w-0 space-y-1 py-4">
          <h3 className="break-words font-semibold">{record.store}</h3>
          <p className="break-words font-bold tabular-nums">{formatCurrency(record.price)}</p>
          {records.length > 1 && record.price === lowest.price && <p className="text-xs font-semibold text-forest">Lowest latest recorded{tied ? " (tied)" : ""}</p>}
          <p className="text-xs text-muted">Recorded <time dateTime={record.recordedAt}>{formatShoppingDate(record.recordedAt)}</time></p>
        </li>)}
      </ul>
    </section>
  );
}
