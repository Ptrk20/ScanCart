"use client";

export function QuantityControl({ name, quantity, onIncrease, onDecrease }: {
  name: string;
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-xl border border-line p-1">
      <button type="button" aria-label={`Decrease quantity of ${name}`} disabled={quantity === 1} onClick={onDecrease} className="size-11 rounded-lg text-xl hover:bg-sage disabled:cursor-not-allowed disabled:text-gray-400">−</button>
      <span aria-label={`Quantity of ${name}`} className="min-w-8 px-1 text-center text-sm font-semibold tabular-nums">{quantity}</span>
      <button type="button" aria-label={`Increase quantity of ${name}`} onClick={onIncrease} className="size-11 rounded-lg text-xl hover:bg-sage">+</button>
    </div>
  );
}
