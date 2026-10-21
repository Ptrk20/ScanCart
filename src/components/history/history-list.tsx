"use client";

import Link from "next/link";
import { useShoppingHistory } from "@/hooks/use-shopping-history";
import { useShoppingSession } from "@/context/shopping-session-context";
import { ShoppingFeedback } from "@/components/shopping/shopping-feedback";
import { HistoryCard } from "./history-card";
import { HistoryLoadState } from "./history-load-state";

export function HistoryList() {
  const { state, retry } = useShoppingHistory();
  const { activeSession } = useShoppingSession();
  return (
    <div className="space-y-5">
      <ShoppingFeedback />
      {state.status !== "ready" ? <HistoryLoadState status={state.status} onRetry={retry} /> : state.records.length === 0 ? (
        <section className="card space-y-4 border-dashed p-6 text-center">
          <h2 className="text-xl font-bold">No shopping history yet.</h2>
          <p className="text-sm leading-6 text-muted">Completed shopping trips will appear here.</p>
          <Link href={activeSession ? "/basket" : "/shopping/new"} className="button bg-forest text-white">{activeSession ? "Back to Basket" : "Start Shopping"}</Link>
        </section>
      ) : (
        <ul className="grid items-start gap-4 md:grid-cols-2">{state.records.map((trip) => <HistoryCard key={trip.id} trip={trip} />)}</ul>
      )}
      <p className="text-xs leading-5 text-muted">History is saved only on this device and browser. Clearing site data may remove it. Viewing history never changes your current basket.</p>
    </div>
  );
}
