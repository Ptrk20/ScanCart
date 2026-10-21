import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { Navigation, NavigationFallback } from "./navigation";
import { Icon } from "@/components/ui/icon";
import { PwaControls } from "@/components/pwa/pwa-controls";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <>
      <a href="#main-content" className="skip-link">Skip to content</a>
      <header className="app-header border-b border-line bg-white">
        <div className="mx-auto flex min-h-21 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
          <Link href="/" aria-label="ScanCart home" className="flex items-center gap-2.5">
            <span className="flex size-10 items-center justify-center rounded-xl bg-forest text-lime"><Icon name="basket" className="size-6" /></span>
            <span className="text-lg font-bold tracking-tight">Scan<span className="text-forest">Cart</span></span>
          </Link>
          <Suspense fallback={<NavigationFallback />}><Navigation /></Suspense>
          <span className="flex items-center gap-1.5 text-xs font-medium text-muted md:hidden"><Icon name="leaf" className="size-4 text-forest" /> Shop smarter</span>
        </div>
      </header>
      <Suspense fallback={null}><PwaControls /></Suspense>
      <main id="main-content" tabIndex={-1} className="page-content mx-auto w-full max-w-6xl px-5 pt-7 sm:px-8 sm:pt-10">
        {children}
      </main>
      <footer className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 border-t border-line px-5 pt-6 pb-[calc(6rem+env(safe-area-inset-bottom))] text-center text-xs text-muted md:flex-row md:px-8 md:pb-6 md:text-left">
        <span>Mindful shopping, one item at a time.</span>
        <div className="space-y-1 md:text-right">
          <p>All Rights Reserved @2026</p>
          <p className="font-medium tracking-wide">Developed by <span className="font-semibold text-forest">Ptrk20</span></p>
        </div>
      </footer>
    </>
  );
}
