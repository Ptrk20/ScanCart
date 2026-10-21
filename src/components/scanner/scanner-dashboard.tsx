"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useShoppingSession } from "@/context/shopping-session-context";
import { findScannedProduct } from "@/lib/scanner/lookup";
import { inspectCode } from "@/lib/scanner/codes";
import type { Product } from "@/types/models";
import { BarcodeScanner } from "./barcode-scanner";
import { ScannedProductResult } from "./scanned-product-result";
import { ProductForm } from "@/components/product/product-form";

type ResultState =
  | { status: "ready" }
  | { status: "looking-up"; code: string }
  | { status: "review"; code: string; canUse: boolean }
  | { status: "found"; product: Product }
  | { status: "not-found"; code: string }
  | { status: "error"; code: string }
  | { status: "added"; name: string };

export function ScannerDashboard() {
  const { activeSession, isLoading, isSaving } = useShoppingSession();
  const [result, setResult] = useState<ResultState>({ status: "ready" });
  const [manual, setManual] = useState("");
  const [manualError, setManualError] = useState<string | null>(null);
  const [cameraKey, setCameraKey] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const lock = useRef(false);
  const generation = useRef(0);

  useEffect(() => () => { generation.current++; lock.current = false; setResult({ status: "ready" }); setManual(""); setManualError(null); }, [activeSession?.id]);

  function reset() {
    generation.current++;
    lock.current = false;
    setResult({ status: "ready" });
    setManual("");
    setManualError(null);
    setCameraKey((key) => key + 1);
  }
  async function lookup(code: string) {
    const token = ++generation.current;
    setResult({ status: "looking-up", code });
    try {
      const product = await findScannedProduct(code);
      if (token !== generation.current) return;
      setResult(product ? { status: "found", product } : { status: "not-found", code });
    } catch (error) {
      if (token !== generation.current) return;
      console.error("ScanCart could not look up the scanned product.", error);
      setResult({ status: "error", code });
    }
  }
  function process(value: string) {
    if (lock.current || isLoading || !activeSession) return;
    const code = inspectCode(value);
    if (code.kind === "invalid") { setManualError(code.message); return; }
    lock.current = true;
    setManualError(null);
    if (code.kind === "review") setResult({ status: "review", code: code.code, canUse: code.canUse });
    else void lookup(code.code);
  }
  function submitManual(event: FormEvent) {
    event.preventDefault();
    // Remounting the camera stops even a pending permission request before lookup.
    setCameraKey((key) => key + 1);
    process(manual);
  }
  if (!activeSession) return (
    <section className="card space-y-4 p-6">
      <p>Start a shopping session before scanning products.</p>
      <Link href="/shopping/new" className="button bg-forest text-white">Start Shopping</Link>
    </section>
  );
  return (
    <div className="min-w-0 space-y-5">
      <p className="break-words text-sm text-muted">Shopping at <strong>{activeSession.store}</strong></p>
      {result.status === "ready" && <>
        <BarcodeScanner key={cameraKey} onDetected={process} onManualEntry={() => input.current?.focus()} />
        <form onSubmit={submitManual} noValidate className="card space-y-4 p-5" aria-label="Manual code entry">
          <h2 className="text-lg font-bold">Can&apos;t scan? Enter the code.</h2>
          <div>
            <label htmlFor="manual-code" className="text-sm font-semibold">Barcode or Code</label>
            <input ref={input} id="manual-code" value={manual} onChange={(event) => { setManual(event.target.value); setManualError(null); }} className="form-input" aria-invalid={!!manualError} aria-describedby={manualError ? "manual-code-error" : undefined} />
            {manualError && <p role="alert" id="manual-code-error" className="form-error">{manualError}</p>}
          </div>
          <button type="submit" disabled={isSaving} className="button bg-forest text-white disabled:opacity-50">Look Up Code</button>
        </form>
      </>}
      {result.status === "looking-up" && <p role="status" className="card p-5">Looking up product...</p>}
      {result.status === "review" && <section className="card space-y-4 p-5">
        <h2 className="text-lg font-bold">Review this code</h2>
        <p className="text-sm leading-6 text-muted">This may be a URL or arbitrary QR text, not a product identifier. ScanCart will not open or execute it.</p>
        <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-all rounded-xl bg-surface p-3 text-sm">{result.code.slice(0, 1000)}{result.code.length > 1000 ? "\n[Preview truncated]" : ""}</pre>
        {!result.canUse && <p role="alert" className="form-error">This content is too large or contains unsupported control characters. Enter a short product code manually or add an item without a barcode.</p>}
        <div className="flex flex-wrap gap-3">
          {result.canUse && <button type="button" onClick={() => { void lookup(result.code); }} className="button bg-forest text-white">Use as Product Code</button>}
          <button type="button" onClick={reset} className="button border border-line text-forest">Cancel</button>
        </div>
      </section>}
      {result.status === "found" && <ScannedProductResult key={result.product.id} product={result.product} onAdded={(name) => setResult({ status: "added", name })} onScanAgain={reset} />}
      {result.status === "not-found" && <section className="space-y-4">
        <h2 className="text-xl font-bold">New product</h2>
        <p role="status" className="text-sm text-muted">No saved product matches this code. Enter its details and current price.</p>
        <ProductForm key={result.code} initialBarcode={result.code} onAdded={(name) => setResult({ status: "added", name })} onCancel={reset} />
      </section>}
      {result.status === "error" && <section className="card space-y-4 p-5">
        <p role="alert" className="form-error">We couldn&apos;t look up this product. Try again or enter the details manually.</p>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={() => { void lookup(result.code); }} className="button bg-forest text-white">Retry Lookup</button>
          <button type="button" onClick={() => setResult({ status: "not-found", code: result.code })} className="button border border-line text-forest">Enter Product Details</button>
          <button type="button" onClick={reset} className="button border border-line text-forest">Scan Again</button>
        </div>
      </section>}
      {result.status === "added" && <section className="card space-y-4 p-5">
        <p role="status" className="break-words font-semibold">{result.name} was added to your basket.</p>
        <p className="text-sm text-muted">The camera is off. Choose Scan Another Item, then Start Camera when ready.</p>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={reset} className="button bg-forest text-white">Scan Another Item</button>
          <Link href="/basket" className="button border border-line text-forest">View Basket</Link>
        </div>
      </section>}
      <Link href="/products/new" className="button border border-line text-forest">Add Item Manually</Link>
    </div>
  );
}
