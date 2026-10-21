export function HistoryLoadState({ status, onRetry }: { status: "loading" | "error"; onRetry: () => void }) {
  if (status === "loading") return <p role="status" className="card p-6">Loading shopping history...</p>;
  return (
    <section className="card space-y-4 p-6">
      <p role="alert" className="form-error">We couldn&apos;t load your shopping history. Check browser storage and try again. No saved records have been changed.</p>
      <button type="button" onClick={onRetry} className="button bg-forest text-white">Try Again</button>
    </section>
  );
}
