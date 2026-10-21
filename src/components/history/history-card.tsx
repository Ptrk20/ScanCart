import Link from "next/link";
import type { CompletedShoppingSession } from "@/types/models";
import { formatShoppingDate } from "@/lib/utils/date";
import { formatCurrency } from "@/lib/utils/money";

export function HistoryCard({ trip }: { trip: CompletedShoppingSession }) {
  return (
    <li className="card min-w-0 p-5 sm:p-6">
      <p className="text-sm text-muted"><time dateTime={trip.completedAt}>{formatShoppingDate(trip.completedAt)}</time></p>
      <h2 className="mt-2 break-words text-xl font-bold">{trip.store}</h2>
      <p className="mt-2 text-sm text-muted">{trip.productCount} {trip.productCount === 1 ? "product" : "products"} · {trip.itemCount} {trip.itemCount === 1 ? "item" : "items"}</p>
      <p className="mt-4 break-words text-2xl font-bold tabular-nums text-forest">{formatCurrency(trip.total)}</p>
      <p className="mt-2 break-words text-sm text-muted">{trip.budget === null ? "No budget set" : `Budget ${formatCurrency(trip.budget)}`}</p>
      <Link href={`/history/${encodeURIComponent(trip.id)}`} className="button mt-5 w-full border border-line text-forest" aria-label={`View details for ${trip.store}, ${formatShoppingDate(trip.completedAt)}`}>View Details</Link>
    </li>
  );
}
