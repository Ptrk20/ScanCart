"use client";

import Link from "next/link";
import { BudgetOverview } from "@/components/home/budget-overview";
import { RecentProducts } from "@/components/home/recent-products";
import { Icon } from "@/components/ui/icon";
import { useShoppingSession } from "@/context/shopping-session-context";
import { EndSessionButton } from "@/components/shopping/end-session-button";

export default function HomePage() {
  const { activeSession, summary, products } = useShoppingSession();
  const recentProducts = [...products].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5);
  return (
    <div className="space-y-7">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">A little planning. A better shop.</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Hello, smart shopper.
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            Know your prices. Keep your budget in check.
          </p>
        </div>
        <span className="rounded-full border border-line bg-white px-3 py-2 text-xs font-medium text-muted">
          Philippine Peso · PHP
        </span>
      </section>

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <section className="relative overflow-hidden rounded-3xl bg-forest p-6 text-white sm:p-8">
          <div className="pointer-events-none absolute -right-10 -top-14 size-52 rounded-full border-[30px] border-white/5" />
          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-emerald-100">
              <span className="size-1.5 rounded-full bg-lime-300" />
              {activeSession ? "Shopping session active" : "Ready when you are"}
            </span>
            <h2 className="mt-5 max-w-xs text-2xl font-semibold tracking-tight sm:text-3xl">
              {activeSession ? "A little clarity for every aisle." : "A smarter grocery run starts here."}
            </h2>
            <p className="mt-3 max-w-sm text-sm leading-6 text-emerald-100">
              {activeSession ? "Your store and spending plan are ready. Keep your budget in view as you shop." : "Set your store and budget, then keep track of every item as you shop."}
            </p>
            <Link href={activeSession ? "/scan" : "/shopping/new"} className="button mt-6 bg-lime text-forest hover:bg-lime-200">
              {activeSession ? "Scan Item" : "Start Shopping"} <Icon name={activeSession ? "scan" : "arrow"} className="size-4" />
            </Link>
          </div>
        </section>

        <section aria-labelledby="store-heading" className="card flex min-w-0 flex-col justify-between gap-6 p-6 sm:p-7">
          <div>
            <div className="mb-5 flex items-center justify-between">
              <span className="icon-tile"><Icon name="store" /></span>
              <span className="rounded-full bg-surface px-3 py-1 text-xs font-medium text-muted">{activeSession ? "Shopping now" : "No active session"}</span>
            </div>
            <h2 id="store-heading" className="eyebrow">{activeSession ? "Shopping at" : "Current store"}</h2>
            <p className="mt-2 break-words text-xl font-semibold">{activeSession?.store ?? "Where are we shopping?"}</p>
            <p className="mt-2 text-sm leading-6 text-muted">{activeSession ? "Your active session and basket are saved on this device. End shopping to save a receipt for a non-empty trip." : "Choose your store when you start a new shopping session."}</p>
          </div>
          {activeSession ? <EndSessionButton /> : <Link href="/shopping/new" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-forest hover:underline">
            Set up your shop <Icon name="arrow" className="size-4" />
          </Link>}
        </section>
      </div>

      <BudgetOverview summary={summary} hasSession={activeSession !== null} />

      <Link href="/scan" className="group flex min-h-24 items-center gap-4 rounded-2xl border border-forest/15 bg-sage p-5 transition-colors hover:bg-[#dfebdf]">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-forest text-white">
          <Icon name="scan" className="size-7" />
        </span>
        <span className="flex-1">
          <span className="block text-lg font-bold text-forest">Scan item</span>
          <span className="mt-1 block text-sm text-muted">Your next grocery find starts with a scan.</span>
        </span>
        <Icon name="arrow" className="size-5 shrink-0 text-forest transition-transform group-hover:translate-x-1" />
      </Link>

      <Link href="/products/new" className="button w-full border border-forest/20 bg-white text-forest hover:bg-sage sm:w-auto">
        Add Item Manually <Icon name="arrow" className="size-4" />
      </Link>

      <RecentProducts products={recentProducts} />

      <aside className="flex items-start gap-3 rounded-2xl border border-line bg-[#f5f2e9] p-5">
        <Icon name="bulb" className="mt-0.5 size-5 shrink-0 text-[#756025]" />
        <div>
          <h2 className="text-sm font-semibold">A small tip for a smarter shop</h2>
          <p className="mt-1 text-sm leading-6 text-muted">
            A barcode identifies a product, not its price. Always check the shelf price before adding an item.
          </p>
        </div>
      </aside>
    </div>
  );
}
