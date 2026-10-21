"use client";

import { useEffect, useState } from "react";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function usePwaInstall() {
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [iosSafari, setIosSafari] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const display = window.matchMedia("(display-mode: standalone)");
    const updateDisplay = () => {
      setStandalone(display.matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);
      const agent = navigator.userAgent;
      setIosSafari((/iPhone|iPad|iPod/.test(agent) || navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1) &&
        /Safari/.test(agent) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(agent));
    };
    updateDisplay();
    const available = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPromptEvent);
    };
    const installed = () => { setStandalone(true); setPrompt(null); };
    window.addEventListener("beforeinstallprompt", available);
    window.addEventListener("appinstalled", installed);
    display.addEventListener("change", updateDisplay);
    return () => {
      window.removeEventListener("beforeinstallprompt", available);
      window.removeEventListener("appinstalled", installed);
      display.removeEventListener("change", updateDisplay);
    };
  }, []);
  async function install() {
    if (!prompt) return;
    const event = prompt;
    setPrompt(null);
    setError(null);
    try {
      await event.prompt();
      const choice = await event.userChoice;
      if (choice.outcome === "dismissed") setDismissed(true);
    } catch (failure) {
      console.error("ScanCart could not open the install prompt.", failure);
      setError("Installation couldn't open. You can keep using ScanCart in your browser.");
    }
  }
  return {
    canInstall: !standalone && !dismissed && prompt !== null,
    showIosGuide: !standalone && !dismissed && iosSafari,
    dismiss: () => setDismissed(true), install, error,
  };
}
