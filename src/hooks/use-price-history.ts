"use client";

import { useEffect, useState } from "react";
import type { Product } from "@/types/models";
import { getProductById } from "@/lib/db/products";
import { getPriceHistoryForProduct } from "@/lib/db/price-history";
import { calculateProductPriceAnalytics, type ProductPriceAnalytics } from "@/lib/shopping/price-analytics";

type PriceHistoryState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; product: Product | undefined; analytics: ProductPriceAnalytics };

export function usePriceHistory(productId: string) {
  const [state, setState] = useState<PriceHistoryState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    void Promise.all([getProductById(productId), getPriceHistoryForProduct(productId)])
      .then(([product, records]) => {
        const analytics = calculateProductPriceAnalytics(records);
        if (!cancelled) setState({ status: "ready", product, analytics });
      }).catch((error: unknown) => {
        if (cancelled) return;
        console.error("ScanCart could not load product price history.", error);
        setState({ status: "error" });
      });
    return () => { cancelled = true; setState({ status: "loading" }); };
  }, [productId, attempt]);
  function retry() {
    setState({ status: "loading" });
    setAttempt((value) => value + 1);
  }
  return { state, retry };
}
