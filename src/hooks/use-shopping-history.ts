"use client";

import { useEffect, useState } from "react";
import type { CompletedShoppingSession } from "@/types/models";
import { getShoppingHistory, getShoppingHistoryById } from "@/lib/db/shopping-history";

type HistoryState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; records: CompletedShoppingSession[] };

export function useShoppingHistory(id?: string) {
  const [state, setState] = useState<HistoryState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const loading = id === undefined ? getShoppingHistory() : getShoppingHistoryById(id).then((record) => record ? [record] : []);
    void loading.then((records) => {
      if (!cancelled) setState({ status: "ready", records });
    }).catch((error: unknown) => {
      if (cancelled) return;
      console.error("ScanCart could not load shopping history.", error);
      setState({ status: "error" });
    });
    // React Activity cleans up effects when cached routes are hidden.
    return () => { cancelled = true; setState({ status: "loading" }); };
  }, [id, attempt]);

  function retry() {
    setState({ status: "loading" });
    setAttempt((value) => value + 1);
  }
  return { state, retry };
}
