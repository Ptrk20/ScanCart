"use client";

import { useEffect, useRef, useState } from "react";
import { CameraSession, type CameraDevice, type CameraState } from "@/lib/scanner/camera-session";
import { createBrowserCamera } from "@/lib/scanner/browser-camera";
import { cameraErrorMessage } from "@/lib/scanner/codes";

export function BarcodeScanner({ onDetected, onManualEntry, autoStart = true }: { onDetected: (code: string, format?: string) => void; onManualEntry: () => void; autoStart?: boolean }) {
  const video = useRef<HTMLVideoElement>(null);
  const session = useRef<CameraSession | null>(null);
  const [status, setStatus] = useState<CameraState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<CameraDevice[]>([]);
  const currentDevice = useRef<string | undefined>(undefined);
  const detected = useRef(onDetected);
  useEffect(() => { detected.current = onDetected; }, [onDetected]);

  useEffect(() => {
    const camera = new CameraSession(async () => {
      if (!video.current) throw new Error("The camera preview is unavailable.");
      return createBrowserCamera(video.current);
    }, {
      state: setStatus,
      detected: (code, format) => detected.current(code, format),
      error: (failure) => {
        console.error("ScanCart camera scanning failed.", failure);
        setError(cameraErrorMessage(failure));
      },
      devices: (available, selected) => { setDevices(available); currentDevice.current = selected; },
    });
    session.current = camera;
    const inactive = () => { if (document.visibilityState !== "visible") camera.stop(); };
    const pageHide = () => camera.stop();
    document.addEventListener("visibilitychange", inactive);
    window.addEventListener("pagehide", pageHide);
    if (autoStart && document.visibilityState === "visible") void camera.start();
    return () => {
      document.removeEventListener("visibilitychange", inactive);
      window.removeEventListener("pagehide", pageHide);
      camera.stop(false);
      session.current = null;
      setStatus("idle");
      setError(null);
    };
  }, [autoStart]);

  function start(deviceId?: string) {
    setError(null);
    void session.current?.start(deviceId);
  }
  const active = status === "starting" || status === "scanning";
  return (
    <section className="card space-y-4 p-3 sm:p-5" aria-label="Camera scanner">
      <div className="relative h-[55svh] min-h-80 max-h-[36rem] overflow-hidden rounded-2xl bg-forest">
        <video ref={video} muted playsInline aria-label="Live camera preview" className="h-full w-full object-contain" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-8 inset-y-12 rounded-xl border-2 border-lime" />
      </div>
      <p className="text-sm leading-6 text-muted">Opening Scan starts your camera. Video is processed locally, never uploaded or saved.</p>
      <p className="text-xs leading-5 text-muted">Keep the whole barcode and its white margins visible in good light. Move closer until the bars look sharp, then hold still. If the image is blurry, move back slightly. The frame is a guide; decoding uses the full video image.</p>
      <p role="status" aria-live="polite" className="text-sm font-semibold">{status === "starting" ? "Starting camera... Check the browser permission prompt." : status === "scanning" ? "Camera is scanning. Position a barcode or QR code in view." : status === "error" ? "Camera stopped. Manual code entry is available below." : "Camera is off. Press Start Camera when ready."}</p>
      {error && <p role="alert" className="form-error">{error}</p>}
      <div className="flex flex-wrap gap-3">
        <button type="button" disabled={active} onClick={() => start()} className="button bg-forest text-white disabled:opacity-50">{status === "error" ? "Try Camera Again" : "Start Camera"}</button>
        <button type="button" disabled={!active} onClick={() => session.current?.stop()} className="button border border-line text-forest disabled:opacity-50">Stop Camera</button>
        {devices.length > 1 && status === "scanning" && <button type="button" onClick={() => {
          const index = devices.findIndex((device) => device.id === currentDevice.current);
          start(devices[(index + 1) % devices.length].id);
        }} className="button border border-line text-forest">Switch Camera</button>}
        <button type="button" onClick={() => { session.current?.stop(); onManualEntry(); }} className="button border border-line text-forest">Enter Code Manually</button>
      </div>
    </section>
  );
}
