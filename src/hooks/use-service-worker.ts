"use client";

import { useEffect, useRef, useState } from "react";

export function useServiceWorker() {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const [changed, setChanged] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [updating, setUpdating] = useState(false);
  const reloadRequested = useRef(false);
  const updateTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !window.isSecureContext || !("serviceWorker" in navigator)) return;
    let cancelled = false;
    let registration: ServiceWorkerRegistration | undefined;
    const removers: (() => void)[] = [];
    let controlled = !!navigator.serviceWorker.controller;
    const controllerChanged = () => {
      if (reloadRequested.current) { clearTimeout(updateTimeout.current); window.location.reload(); return; }
      setWaiting(null);
      if (controlled) setChanged(true);
      controlled = true;
    };
    const message = (event: MessageEvent) => {
      if (event.data?.type === "CACHE_ERROR") setError("Some resources couldn't be saved offline. ScanCart can still be used online.");
    };
    navigator.serviceWorker.addEventListener("controllerchange", controllerChanged);
    navigator.serviceWorker.addEventListener("message", message);
    void navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).then((value) => {
      if (cancelled) return;
      registration = value;
      setRegistration(value);
      setError(null);
      const inspect = () => {
        if (cancelled) return;
        setWaiting(value.waiting && navigator.serviceWorker.controller ? value.waiting : null);
      };
      const observeInstall = () => {
        const worker = value.installing;
        if (!worker) return;
        const stateChanged = () => {
          inspect();
          if (!cancelled && worker.state === "redundant") setError("Offline setup couldn't finish. Keep using ScanCart online, then retry.");
        };
        worker.addEventListener("statechange", stateChanged);
        removers.push(() => worker.removeEventListener("statechange", stateChanged));
      };
      inspect();
      observeInstall();
      value.addEventListener("updatefound", observeInstall);
      removers.push(() => value.removeEventListener("updatefound", observeInstall));
    }).catch((failure: unknown) => {
      if (cancelled) return;
      console.error("ScanCart could not register offline support.", failure);
      setError("Offline setup is unavailable. ScanCart still works as a normal website. Try again while online.");
    });
    const check = () => {
      if (!registration || document.visibilityState !== "visible" || !navigator.onLine) return;
      void registration.update().catch((failure: unknown) => {
        console.error("ScanCart could not check for an app update.", failure);
        if (!cancelled) setError("Couldn't check for updates. Your local data is unchanged. Try again while online.");
      });
    };
    document.addEventListener("visibilitychange", check);
    return () => {
      cancelled = true;
      removers.forEach((remove) => remove());
      navigator.serviceWorker.removeEventListener("controllerchange", controllerChanged);
      navigator.serviceWorker.removeEventListener("message", message);
      document.removeEventListener("visibilitychange", check);
      clearTimeout(updateTimeout.current);
    };
  }, [attempt]);

  function update() {
    setUpdating(true);
    reloadRequested.current = true;
    try {
      const pending = registration?.waiting;
      if (pending?.state === "installed") {
        updateTimeout.current = setTimeout(() => {
          reloadRequested.current = false;
          setUpdating(false);
          setError("The update didn't finish. Your local data is unchanged. Try again while online.");
        }, 15000);
        pending.postMessage({ type: "SKIP_WAITING" });
      } else window.location.reload();
    } catch (failure) {
      console.error("ScanCart could not activate the app update.", failure);
      clearTimeout(updateTimeout.current);
      reloadRequested.current = false;
      setUpdating(false);
      setError("The update couldn't start. Your local data is unchanged. Try again.");
    }
  }
  return {
    registration, updateAvailable: waiting !== null || changed, update, updating, error,
    retry: () => { setError(null); setAttempt((value) => value + 1); },
  };
}
