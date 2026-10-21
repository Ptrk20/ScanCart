"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useShoppingSession } from "@/context/shopping-session-context";
import { validateProduct, type ProductFormErrors, type ProductFormValues } from "@/lib/shopping/product";

const categories = ["Bakery", "Beverages", "Canned Goods", "Dairy", "Frozen Food", "Fruits", "Household", "Meat", "Personal Care", "Snacks", "Vegetables", "Other"];
const emptyValues: ProductFormValues = { barcode: "", name: "", brand: "", category: "", price: "", quantity: "1" };

export function ProductForm({ initialBarcode = "", onAdded, onCancel }: { initialBarcode?: string; onAdded?: (name: string) => void; onCancel?: () => void }) {
  const { activeSession, addProduct } = useShoppingSession();
  const router = useRouter();
  const [values, setValues] = useState<ProductFormValues>({ ...emptyValues, barcode: initialBarcode });
  const [errors, setErrors] = useState<ProductFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const locked = useRef(false);
  const generation = useRef(0);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const token = ++generation.current;
    // Cached routes preserve state but clean up effects when hidden.
    return () => {
      generation.current = token + 1;
      locked.current = false;
      setSubmitting(false);
      setValues({ ...emptyValues, barcode: initialBarcode });
      setErrors({});
      setFormError(null);
    };
  }, [initialBarcode]);

  function change(field: keyof ProductFormValues, value: string) {
    const next = { ...values, [field]: value };
    setValues(next);
    setFormError(null);
    if (errors[field]) {
      const result = validateProduct(next);
      setErrors((current) => ({ ...current, [field]: result.ok ? undefined : result.errors[field] }));
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked.current) return;
    const result = validateProduct(values);
    if (!result.ok) {
      setErrors(result.errors);
      const field = result.errors.name ? "name" : result.errors.price ? "price" : "quantity";
      formRef.current?.querySelector<HTMLInputElement>(`[name="${field}"]`)?.focus();
      return;
    }
    locked.current = true;
    const token = generation.current;
    setSubmitting(true);
    const saved = await addProduct(values);
    if (token !== generation.current) return;
    if (!saved.ok) {
      setFormError(saved.error);
      setSubmitting(false);
      locked.current = false;
      return;
    }
    setValues(emptyValues);
    setErrors({});
    setFormError(null);
    if (onAdded) onAdded(result.value.name);
    else router.push("/basket");
  }

  if (!activeSession) {
    return (
      <div className="card p-6">
        <p className="text-sm leading-6 text-muted">Start a shopping session before adding products.</p>
        <Link href="/shopping/new" className="button mt-5 bg-forest text-white">Start Shopping</Link>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={submit} noValidate className="card space-y-5 p-5 sm:p-7">
      {(["barcode", "name", "brand"] as const).map((field) => (
        <div key={field}>
          <label htmlFor={`product-${field}`} className="text-sm font-semibold">{field === "name" ? "Product name" : field === "brand" ? "Brand (optional)" : "Barcode (optional)"}</label>
          <input id={`product-${field}`} name={field} required={field === "name"} inputMode="text" value={values[field]} onChange={(event) => change(field, event.target.value)} className="form-input" aria-invalid={!!errors[field]} aria-describedby={errors[field] ? `${field}-error` : undefined} />
          {errors[field] && <p id={`${field}-error`} className="form-error">{errors[field]}</p>}
        </div>
      ))}
      <div>
        <label htmlFor="product-category" className="text-sm font-semibold">Category (optional)</label>
        <input id="product-category" name="category" list="product-categories" value={values.category} onChange={(event) => change("category", event.target.value)} className="form-input" aria-describedby="category-help" />
        <datalist id="product-categories">{categories.map((category) => <option key={category} value={category} />)}</datalist>
        <p id="category-help" className="mt-2 text-xs text-muted">Choose a suggested category or type your own.</p>
      </div>
      {(["price", "quantity"] as const).map((field) => (
        <div key={field}>
          <label htmlFor={`product-${field}`} className="text-sm font-semibold">{field === "price" ? "Price (PHP)" : "Quantity"}</label>
          <input id={`product-${field}`} name={field} required inputMode={field === "price" ? "decimal" : "numeric"} value={values[field]} onChange={(event) => change(field, event.target.value)} className="form-input" aria-invalid={!!errors[field]} aria-describedby={[field === "price" ? "price-help" : "", errors[field] ? `${field}-error` : ""].filter(Boolean).join(" ") || undefined} />
          {errors[field] && <p id={`${field}-error`} className="form-error">{errors[field]}</p>}
          {field === "price" && <p id="price-help" className="mt-2 text-xs leading-5 text-muted">Prices with extra decimal places are rounded to the nearest centavo; half a centavo rounds up.</p>}
        </div>
      ))}
      <div>
        <label htmlFor="product-store" className="text-sm font-semibold">Store</label>
        <input id="product-store" readOnly value={activeSession.store} className="form-input bg-surface" />
      </div>
      <p className="text-xs leading-5 text-muted">Adding an existing barcode combines quantities and applies today&apos;s entered price to that product&apos;s entire basket row. Products, price records, and your active basket are saved on this device.</p>
      {(Object.values(errors).some(Boolean) || formError) && <p role="alert" className="form-error">{formError ?? "Please check the highlighted fields."}</p>}
      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={submitting} className="button flex-1 bg-forest text-white disabled:opacity-60">{submitting ? "Adding..." : "Save & Add to Basket"}</button>
        {submitting ? <span className="button border border-line text-muted" aria-disabled="true">Cancel</span> : onCancel ? <button type="button" onClick={onCancel} className="button border border-line text-forest">Cancel</button> : <Link href="/basket" className="button border border-line text-forest">Cancel</Link>}
      </div>
    </form>
  );
}
