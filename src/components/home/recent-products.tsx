import { Icon } from "@/components/ui/icon";
import { formatCurrency } from "@/lib/utils/money";
import type { Product } from "@/types/models";
import Link from "next/link";

export function RecentProducts({ products }: { products: readonly Product[] }) {
  return (
    <section aria-labelledby="recent-heading">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 id="recent-heading" className="text-lg font-bold tracking-tight">Recent scanned products</h2>
        <span className="text-xs text-muted">{products.length} products</span>
      </div>
      {products.length === 0 ? (
        <div className="card flex flex-col items-center border-dashed px-6 py-9 text-center">
          <span className="icon-tile mb-4"><Icon name="scan" className="size-6" /></span>
          <h3 className="font-semibold">Your grocery discoveries go here</h3>
          <p className="mt-2 max-w-sm text-sm leading-6 text-muted">No saved products yet. Scan a code or add an item manually to save your first grocery find.</p>
        </div>
      ) : (
        <div>
          <p className="mb-3 text-xs text-muted">Your five most recently saved products, including manual entries.</p>
          <ul className="card divide-y divide-line px-5">
          {products.map((product) => (
            <li key={product.id} className="flex items-center justify-between gap-4 py-4">
              <div className="min-w-0"><h3 className="break-words font-semibold">{product.name}</h3><p className="mt-1 text-xs text-muted">{product.brand || "No brand recorded"}</p><Link href={`/products/${encodeURIComponent(product.id)}/prices`} aria-label={`Price history for ${product.name}`} className="inline-flex min-h-11 items-center text-sm font-semibold text-forest underline">Price History</Link></div>
              <div className="shrink-0 text-right"><p className="font-semibold tabular-nums">{formatCurrency(product.lastPrice)}</p><p className="mt-1 text-xs text-muted">Last recorded</p></div>
            </li>
          ))}
          </ul>
        </div>
      )}
    </section>
  );
}
