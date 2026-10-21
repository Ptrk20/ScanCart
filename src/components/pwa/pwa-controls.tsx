"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { usePwaInstall } from "@/hooks/use-pwa-install";
import { useServiceWorker } from "@/hooks/use-service-worker";
import { useShoppingSession } from "@/context/shopping-session-context";

export function PwaControls() {
  const online = useOnlineStatus();
  const install = usePwaInstall();
  const worker = useServiceWorker();
  const pathname = usePathname();
  const { isLoading, isSaving, activeSession } = useShoppingSession();
  const [cached, setCached] = useState<{ path: string; status: "ready" | "cached" | "error" } | null>(null);
  const cacheState = cached?.path === pathname ? cached.status : "preparing";
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !worker.registration || !online) return;
    let cancelled = false;
    let channel: MessageChannel | undefined;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    void navigator.serviceWorker.ready.then((registration) => {
      if (cancelled || !registration.active) return;
      channel = new MessageChannel();
      timeout = setTimeout(() => { if (!cancelled) setCached({ path: pathname, status: "error" }); channel?.port1.close(); }, 20000);
      channel.port1.onmessage = (event: MessageEvent<{ ok: boolean; cached?: boolean }>) => {
        clearTimeout(timeout);
        if (!cancelled) setCached({ path: pathname, status: event.data.cached ? "cached" : event.data.ok ? "ready" : "error" });
        channel?.port1.close();
      };
      registration.active.postMessage({ type: "CACHE_PAGE", path: pathname }, [channel.port2]);
    }).catch((error: unknown) => {
      console.error("ScanCart offline preparation failed.", error);
      if (!cancelled) setCached({ path: pathname, status: "error" });
    });
    return () => { cancelled = true; clearTimeout(timeout); channel?.port1.close(); };
  }, [worker.registration, pathname, online, attempt]);

  return (
    <aside aria-label="ScanCart app status" className="mx-auto w-full max-w-6xl space-y-3 px-5 pt-3 text-sm sm:px-8">
      {!online && <p role="status" className="rounded-xl border border-line bg-sage p-3">You&apos;re offline. Cached pages can use local ScanCart data. Pages or scanner resources not saved yet may need a connection.</p>}
      {online && worker.error && <div className="rounded-xl border border-line bg-surface p-3">
        <p role="status">{worker.error}</p>
        <button type="button" onClick={worker.retry} className="mt-2 min-h-11 font-semibold text-forest underline">Retry offline setup</button>
      </div>}
      {online && !worker.error && worker.registration && <div className="text-xs text-muted">
        <p role="status">{cacheState === "ready" ? "This page is saved for offline use. Local data stays on this device." : cacheState === "cached" ? "Using the previously saved offline page. It couldn't be refreshed from the network." : cacheState === "error" ? "This page couldn't be prepared offline. Keep using ScanCart online." : "Preparing this page for offline use..."}</p>
        {cacheState === "error" && <button type="button" onClick={() => { setCached(null); setAttempt((value) => value + 1); }} className="min-h-11 font-semibold text-forest underline">Retry offline preparation</button>}
      </div>}
      {worker.updateAvailable && <section className="card space-y-2 p-4" aria-label="App update">
        <p className="font-semibold">A ScanCart update is available.</p>
        <p className="text-xs leading-5 text-muted">{activeSession ? "Your saved session and basket are kept. " : ""}Finish any unsaved form edits and camera scan before reloading. Other open tabs will not reload automatically.</p>
        <button type="button" disabled={isLoading || isSaving || worker.updating || !online} onClick={worker.update} className="button bg-forest text-white disabled:opacity-60">{worker.updating ? "Updating..." : "Reload to Update"}</button>
      </section>}
      {pathname === "/" && (install.canInstall || install.showIosGuide) && <section className="card space-y-2 p-4" aria-label="Install ScanCart">
        <h2 className="font-semibold">Install ScanCart</h2>
        <p className="text-xs leading-5 text-muted">Add ScanCart to your home screen for quicker access. You can also keep using this website.</p>
        {install.canInstall ? <button type="button" onClick={() => { void install.install(); }} className="button bg-forest text-white">Install</button> : <p className="text-sm">In Safari, open Share, choose Add to Home Screen, then Add.</p>}
        <button type="button" onClick={install.dismiss} className="button text-forest underline">Not Now</button>
      </section>}
      {install.error && <p role="status" className="text-muted">{install.error}</p>}
    </aside>
  );
}
