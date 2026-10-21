"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useShoppingSession } from "@/context/shopping-session-context";

export function EndSessionButton() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const dialogId = useId();
  const { endSession, isSaving, items } = useShoppingSession();
  const router = useRouter();
  const [ending, setEnding] = useState(false);
  const locked = useRef(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const element = dialogRef.current;
    return () => { element?.close(); };
  }, []);

  async function confirmEnd() {
    if (locked.current) return;
    locked.current = true;
    setEnding(true);
    const result = await endSession();
    if (result.ok) { dialogRef.current?.close(); router.push("/history"); }
    else setError(result.error);
    locked.current = false;
    setEnding(false);
  }

  return (
    <>
      <button type="button" disabled={isSaving} onClick={() => { setError(null); dialogRef.current?.showModal(); }} className="min-h-11 self-start text-sm font-semibold text-forest underline underline-offset-4 disabled:opacity-60">End Shopping</button>
      <dialog ref={dialogRef} aria-labelledby={`${dialogId}-title`} aria-describedby={`${dialogId}-description`} onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          if (!locked.current) dialogRef.current?.close();
        }
      }} onCancel={(event) => { if (locked.current) event.preventDefault(); }} className="confirmation-dialog">
        <h2 id={`${dialogId}-title`} className="text-xl font-bold">End shopping session?</h2>
        <p id={`${dialogId}-description`} className="mt-3 text-sm leading-6 text-muted">{items.length
          ? "Save this trip to shopping history, then clear your active session and basket. Your saved products and price records are kept."
          : "End this empty shopping session? No shopping history record will be created. Your saved products and price records are kept."}</p>
        {error && <p role="alert" className="form-error">{error}</p>}
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" autoFocus disabled={ending} onClick={() => dialogRef.current?.close()} className="button flex-1 border border-line text-forest hover:bg-surface disabled:opacity-60">Cancel</button>
          <button type="button" disabled={ending} onClick={confirmEnd} className="button flex-1 bg-forest text-white hover:bg-[#214c3b] disabled:opacity-60">{ending ? "Saving trip..." : error ? "Try Again" : "End Shopping"}</button>
        </div>
      </dialog>
    </>
  );
}
