"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { deleteShoppingHistory } from "@/lib/db/shopping-history";

export function DeleteHistoryButton({ id }: { id: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const locked = useRef(false);
  const generation = useRef(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  useEffect(() => {
    const element = dialog.current;
    const token = ++generation.current;
    return () => {
      generation.current = token + 1;
      element?.close();
      locked.current = false;
      setSaving(false);
      setError(null);
    };
  }, [id]);

  async function remove() {
    if (locked.current) return;
    locked.current = true;
    const token = generation.current;
    setSaving(true);
    setError(null);
    try {
      await deleteShoppingHistory(id);
      if (token !== generation.current) return;
      dialog.current?.close();
      router.push("/history");
    } catch (failure) {
      console.error("ScanCart could not delete a shopping trip.", failure);
      if (token !== generation.current) return;
      setError("We couldn't delete this shopping trip. It has not been removed. Try again.");
      locked.current = false;
      setSaving(false);
    }
  }
  return (
    <>
      <button type="button" onClick={() => { setError(null); dialog.current?.showModal(); }} className="button border border-red-200 text-red-800">Delete History</button>
      <dialog ref={dialog} aria-labelledby={titleId} aria-describedby={descriptionId} className="confirmation-dialog" onKeyDown={(event) => {
        if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); if (!locked.current) dialog.current?.close(); }
      }} onCancel={(event) => { if (locked.current) event.preventDefault(); }}>
        <h2 id={titleId} className="text-xl font-bold">Delete this shopping trip?</h2>
        <p id={descriptionId} className="mt-3 text-sm leading-6 text-muted">This removes only this trip from your shopping history. Your saved products, price records, other trips, and current basket will not be deleted.</p>
        {error && <p role="alert" className="form-error">{error}</p>}
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" autoFocus disabled={saving} onClick={() => dialog.current?.close()} className="button flex-1 border border-line text-forest disabled:opacity-60">Cancel</button>
          <button type="button" disabled={saving} onClick={() => { void remove(); }} className="button flex-1 bg-red-800 text-white disabled:opacity-60">{saving ? "Deleting..." : error ? "Try Again" : "Delete"}</button>
        </div>
      </dialog>
    </>
  );
}
