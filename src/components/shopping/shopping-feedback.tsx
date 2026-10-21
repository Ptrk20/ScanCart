"use client";

import { useShoppingSession } from "@/context/shopping-session-context";

export function ShoppingFeedback() {
  const { successMessage, dismissSuccess } = useShoppingSession();
  if (!successMessage) return null;
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl bg-sage p-4">
      <p role="status" className="min-w-0 break-words text-sm font-semibold text-forest">{successMessage}</p>
      <button type="button" onClick={dismissSuccess} aria-label="Dismiss success message" className="min-h-11 shrink-0 px-2 text-sm text-forest underline">Dismiss</button>
    </div>
  );
}
