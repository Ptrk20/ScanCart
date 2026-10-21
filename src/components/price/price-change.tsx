import type { Money, PriceRecord } from "@/types/models";
import { calculatePriceChangePercentage, calculatePriceDifference, getPriceTrend } from "@/lib/shopping/price-analytics";
import { formatCurrency } from "@/lib/utils/money";
import { formatShoppingDate } from "@/lib/utils/date";

const percentageFormatter = new Intl.NumberFormat("en-PH", { maximumFractionDigits: 2, signDisplay: "always" });

export function PriceChange({ current, previous, label }: { current: Money | undefined; previous?: PriceRecord; label: string }) {
  const trend = getPriceTrend(current, previous?.price);
  const difference = current !== undefined && previous ? calculatePriceDifference(current, previous.price) : undefined;
  const percentage = current !== undefined && previous ? calculatePriceChangePercentage(current, previous.price) : null;
  return (
    <div className="min-w-0 space-y-2 rounded-xl bg-surface p-4 text-sm" aria-live="polite">
      <p className="font-semibold">Price change</p>
      {previous && <p className="break-words text-muted">{label}: {formatCurrency(previous.price)} at {previous.store}, recorded {formatShoppingDate(previous.recordedAt)}.</p>}
      {trend === "insufficient-data" ? <p>{current === undefined && previous ? "Enter a valid price to compare." : "Not enough history to calculate a price change."}</p> : <>
        <p className="font-semibold">{trend === "unchanged" ? "No change" : trend === "increased" ? "Price increased" : "Price decreased"}{difference !== undefined && <>: {difference > 0 ? "+" : ""}{formatCurrency(difference)}</>}</p>
        {percentage === null ? <p className="text-muted">Percentage unavailable because the previous price was zero.</p> : trend !== "unchanged" && <p>{percentageFormatter.format(percentage)}%</p>}
      </>}
    </div>
  );
}
