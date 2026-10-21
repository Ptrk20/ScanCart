import { inspectCode } from "./codes.ts";

export interface ScanControls { stop: () => void }
export interface CameraDevice { id: string; label: string }
export interface CameraDriver {
  acquire: (deviceId?: string) => Promise<MediaStream>;
  play: (stream: MediaStream) => Promise<void>;
  scan: (onResult: (text: unknown, format?: string) => void, onError: (error: unknown) => void) => ScanControls;
  devices: () => Promise<CameraDevice[]>;
  detach: () => void;
}
export type CameraState = "idle" | "starting" | "scanning" | "error";
interface CameraEvents {
  state: (state: CameraState) => void;
  detected: (code: string, format?: string) => void;
  error: (error: unknown) => void;
  devices: (devices: CameraDevice[], currentId?: string) => void;
}

/** Owns one stream; generations invalidate permission/play promises that cannot be cancelled. */
export class CameraSession {
  private generation = 0;
  private stream?: MediaStream;
  private controls?: ScanControls;
  private driver?: CameraDriver;
  private timer?: ReturnType<typeof setTimeout>;
  private ended?: () => void;

  constructor(privateFactory: () => Promise<CameraDriver>, events: CameraEvents, timeout = 20000) {
    this.factory = privateFactory;
    this.events = events;
    this.timeout = timeout;
  }
  private readonly factory: () => Promise<CameraDriver>;
  private readonly events: CameraEvents;
  private readonly timeout: number;

  stop(notify = true): void {
    this.generation++;
    clearTimeout(this.timer);
    this.timer = undefined;
    this.controls?.stop();
    this.controls = undefined;
    if (this.stream) {
      for (const track of this.stream.getTracks()) {
        if (this.ended) track.removeEventListener("ended", this.ended);
        track.stop();
      }
    }
    this.stream = undefined;
    this.ended = undefined;
    this.driver?.detach();
    this.driver = undefined;
    if (notify) this.events.state("idle");
  }

  async start(deviceId?: string): Promise<void> {
    this.stop(false);
    const generation = this.generation;
    const current = () => generation === this.generation;
    const fail = (error: unknown) => {
      if (!current()) return;
      this.stop(false);
      this.events.state("error");
      this.events.error(error);
    };
    this.events.state("starting");
    this.timer = setTimeout(() => fail(new DOMException("Camera startup timed out.", "TimeoutError")), this.timeout);
    try {
      const driver = await this.factory();
      if (!current()) return;
      this.driver = driver;
      const stream = await driver.acquire(deviceId);
      if (!current()) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      this.stream = stream;
      const ended = () => fail(new Error("Camera stream was interrupted."));
      this.ended = ended;
      stream.getVideoTracks().forEach((track) => track.addEventListener("ended", ended));
      await driver.play(stream);
      if (!current()) return;
      clearTimeout(this.timer);
      this.timer = undefined;
      this.events.state("scanning");
      // ZXing can call back synchronously before returning its controls.
      this.controls = driver.scan((text, format) => queueMicrotask(() => {
        if (!current()) return;
        const result = inspectCode(text);
        if (result.kind === "invalid") return;
        this.stop();
        this.events.detected(result.code, format);
      }), (error) => queueMicrotask(() => fail(error)));
      void driver.devices().then((devices) => {
        if (current()) this.events.devices(devices, stream.getVideoTracks()[0]?.getSettings().deviceId);
      }).catch((error: unknown) => {
        if (current()) console.warn("ScanCart could not enumerate cameras; the selected camera remains available.", error);
      });
    } catch (error) {
      fail(error);
    }
  }
}
