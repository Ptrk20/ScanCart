import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ProductPriceHistory } from "@/components/price/product-price-history";

export const metadata: Metadata = { title: "Product Price History" };

async function ProductPrices({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProductPriceHistory key={id} id={id} />;
}

export default function ProductPricesPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <div className="min-w-0 space-y-6">
      <Link href="/" className="inline-flex min-h-11 items-center text-sm font-semibold text-forest underline">Back to Home</Link>
      <Suspense fallback={<p role="status" className="card p-6">Loading price history...</p>}><ProductPrices params={params} /></Suspense>
    </div>
  );
}
