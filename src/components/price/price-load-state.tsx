export function PriceLoadState({ error = false, retry }: { error?: boolean; retry?: () => void }) {
  if (!error) return <p role="status" className="text-sm text-muted">Loading price history...</p>;
  return (
    <div className="space-y-3">
      <p role="alert" className="form-error">We couldn&apos;t load the price history. No saved records have been changed.</p>
      <button type="button" onClick={retry} className="button border border-line text-forest">Try Again</button>
    </div>
  );
}
