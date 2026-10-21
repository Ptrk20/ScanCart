import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { HistoryDetails } from "@/components/history/history-details";

export const metadata: Metadata = { title: "Shopping trip" };

async function Trip({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <HistoryDetails key={id} id={id} />;
}

export default function HistoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <div className="space-y-6">
      <Link href="/history" className="inline-flex min-h-11 items-center text-sm font-semibold text-forest underline">Back to History</Link>
      <Suspense fallback={<p role="status" className="card p-6">Loading shopping history...</p>}><Trip params={params} /></Suspense>
    </div>
  );
}
