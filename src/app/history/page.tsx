import type { Metadata } from "next";
import { HistoryList } from "@/components/history/history-list";

export const metadata: Metadata = { title: "History" };

export default function HistoryPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="eyebrow">Every shop tells a story</p>
        <h1 className="mt-2 text-3xl font-bold">Shopping History</h1>
        <p className="mt-3 text-sm leading-6 text-muted">Your completed trips, newest first. Open a trip to see what you bought and spent.</p>
      </header>
      <HistoryList />
    </div>
  );
}
