import type { Metadata } from "next";
import Link from "next/link";
import { ProductForm } from "@/components/product/product-form";

export const metadata: Metadata = { title: "Add Product" };

export default function NewProductPage() {
  return (
    <section className="mx-auto max-w-xl space-y-6">
      <Link href="/basket" className="inline-flex min-h-11 items-center text-sm font-semibold text-forest underline underline-offset-4">Back to Basket</Link>
      <div>
        <p className="eyebrow">Know what goes in your cart</p>
        <h1 className="mt-2 text-3xl font-bold">Add Product</h1>
        <p className="mt-3 text-sm leading-6 text-muted">Enter the product details and its current store price.</p>
      </div>
      <ProductForm />
    </section>
  );
}
