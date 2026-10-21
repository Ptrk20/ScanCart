import type { Metadata } from "next";
import Link from "next/link";
import { ScannerDashboard } from "@/components/scanner/scanner-dashboard";

export const metadata: Metadata = { title: "Scan" };

export default function ScanPage() {
  return (
    <section className="mx-auto max-w-xl space-y-6">
      <Link href="/" className="inline-flex min-h-11 items-center text-sm font-semibold text-forest underline underline-offset-4">Back to Home</Link>
      <header>
        <p className="eyebrow">ScanCart · Know your prices</p>
        <h1 className="mt-2 text-3xl font-bold">Scan an Item</h1>
        <p className="mt-3 text-sm leading-6 text-muted">Scan a product barcode or QR code, then confirm today&apos;s store price.</p>
      </header>
      <ScannerDashboard />
    </section>
  );
}
