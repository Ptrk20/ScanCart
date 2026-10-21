import type { Metadata } from "next";
import { ShoppingSessionForm } from "@/components/shopping/shopping-session-form";

export const metadata: Metadata = { title: "Start shopping" };

export default function NewShoppingPage() {
  return (
    <section className="mx-auto max-w-xl space-y-6">
      <div>
        <p className="eyebrow">A fresh start</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Make a plan for your next shop.</h1>
        <p className="mt-3 text-sm leading-6 text-muted">Choose your store and an optional spending limit. A little planning goes a long way.</p>
      </div>
      <ShoppingSessionForm />
    </section>
  );
}
