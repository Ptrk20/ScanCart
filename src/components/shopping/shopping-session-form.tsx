"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useShoppingSession } from "@/context/shopping-session-context";
import type { SessionErrors } from "@/lib/shopping/session";
import { Icon } from "@/components/ui/icon";

export function ShoppingSessionForm() {
  const { activeSession, startSession } = useShoppingSession();
  const router = useRouter();
  const [store, setStore] = useState("");
  const [budget, setBudget] = useState("");
  const [errors, setErrors] = useState<SessionErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const locked = useRef(false);
  const storeRef = useRef<HTMLInputElement>(null);
  const budgetRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked.current) return;
    locked.current = true;
    setSubmitting(true);
    const result = await startSession({ store, budget });
    locked.current = false;
    setSubmitting(false);
    if (!result.ok) {
      setErrors(result.errors);
      if (result.errors.store) storeRef.current?.focus();
      else if (result.errors.budget) budgetRef.current?.focus();
      return;
    }
    setStore("");
    setBudget("");
    setErrors({});
    router.push("/");
  }

  if (activeSession) {
    return (
      <div className="card space-y-4 p-6">
        <h2 className="text-lg font-semibold">You already have a shopping session</h2>
        <p className="break-words text-sm leading-6 text-muted">Your shop at {activeSession.store} is still active. Return Home to continue or end it before starting another.</p>
        <Link href="/" className="button bg-forest text-white">Return to your shop</Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="card space-y-6 p-6 sm:p-8">
      <div>
        <label htmlFor="store" className="block text-sm font-semibold">Store name <span className="font-normal text-muted">(required)</span></label>
        <input ref={storeRef} id="store" name="store" autoComplete="organization" required value={store} onChange={(event) => setStore(event.target.value)} aria-invalid={!!errors.store} aria-describedby={errors.store ? "store-error" : undefined} className="form-input" placeholder="e.g. SM Supermarket" />
        {errors.store && <p id="store-error" className="form-error">{errors.store}</p>}
      </div>
      <div>
        <label htmlFor="budget" className="block text-sm font-semibold">Shopping budget <span className="font-normal text-muted">(optional, PHP)</span></label>
        <input ref={budgetRef} id="budget" name="budget" type="text" inputMode="decimal" value={budget} onChange={(event) => setBudget(event.target.value)} aria-invalid={!!errors.budget} aria-describedby={`budget-help${errors.budget ? " budget-error" : ""}`} className="form-input" placeholder="e.g. 3000.00" />
        <p id="budget-help" className="mt-2 text-xs leading-5 text-muted">Leave blank for no budget, or enter zero or more with up to two decimal places.</p>
        {errors.budget && <p id="budget-error" className="form-error">{errors.budget}</p>}
      </div>
      {Object.keys(errors).length > 0 && <p role="alert" className="form-error">{errors.form ?? "Please check the highlighted fields."}</p>}
      <p className="rounded-xl bg-surface p-3 text-xs leading-5 text-muted">Your active session and basket are saved on this device, including after a refresh. End shopping to save a receipt for a non-empty trip.</p>
      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={submitting} className="button flex-1 bg-forest text-white hover:bg-[#214c3b] disabled:opacity-60">{submitting ? "Starting..." : "Start Shopping"} <Icon name="arrow" className="size-4" /></button>
        {submitting ? <span className="button border border-line text-muted" aria-disabled="true">Cancel</span> : <Link href="/" className="button border border-line text-forest hover:bg-surface">Cancel</Link>}
      </div>
    </form>
  );
}
