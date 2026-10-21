import assert from "node:assert/strict";
import test from "node:test";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { BinaryBitmap, HybridBinarizer, RGBLuminanceSource } from "@zxing/library";
import { createBrowserCamera } from "../src/lib/scanner/browser-camera.ts";

class RotatablePixels extends RGBLuminanceSource {
  isRotateSupported() { return true; }
  rotateCounterClockwise() {
    const width = this.getWidth();
    const height = this.getHeight();
    const source = this.getMatrix();
    const rotated = new Uint8ClampedArray(width * height);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) rotated[(width - 1 - x) * height + y] = source[y * width + x];
    }
    return new RotatablePixels(rotated, height, width);
  }
}

function barcodeBitmap(placement) {
  const width = 640, height = 480;
  const pixels = new Uint8ClampedArray(width * height).fill(255);
  const left = ["0001101", "0011001", "0010011", "0111101", "0100011", "0110001", "0101111", "0111011", "0110111", "0001011"];
  const code = "0123456789012";
  const bits = "101" + [...code.slice(1, 7)].map((digit) => left[Number(digit)]).join("") + "01010" +
    [...code.slice(7)].map((digit) => left[Number(digit)].replace(/[01]/g, (bit) => bit === "0" ? "1" : "0")).join("") + "101";
  for (let index = 0; index < bits.length; index++) {
    if (bits[index] !== "1") continue;
    for (let bar = 0; bar < 4; bar++) {
      for (let thickness = 0; thickness < 40; thickness++) {
        const x = placement === "vertical" ? 300 + thickness : 130 + index * 4 + bar;
        const y = placement === "vertical" ? 50 + index * 4 + bar : placement === "off-center" ? 30 + thickness : 220 + thickness;
        pixels[y * width + x] = 0;
      }
    }
  }
  return new BinaryBitmap(new HybridBinarizer(new RotatablePixels(pixels, width, height)));
}

test("browser camera adapter decodes centered, off-center and sideways retail barcodes", async (t) => {
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  Object.defineProperty(globalThis, "window", { configurable: true, value: { isSecureContext: true } });
  Object.defineProperty(globalThis, "navigator", { configurable: true, value: { mediaDevices: { getUserMedia() {} } } });
  t.after(() => {
    if (originalWindow) Object.defineProperty(globalThis, "window", originalWindow);
    else delete globalThis.window;
    Object.defineProperty(globalThis, "navigator", originalNavigator);
  });
  for (const placement of ["center", "off-center", "vertical"]) {
    const driver = await createBrowserCamera({});
    const results = [];
    const failures = [];
    // Use the adapter's configured reader with real decoding, replacing only video capture.
    const scan = t.mock.method(BrowserMultiFormatReader.prototype, "scan", function (_video, callback) {
      try { callback(this.decodeBitmap(barcodeBitmap(placement))); }
      catch (error) { callback(undefined, error); }
      return { stop() {} };
    });
    driver.scan((text) => results.push(text), (error) => failures.push(error));
    scan.mock.restore();
    assert.deepEqual(failures, [], placement);
    assert.deepEqual(results, ["123456789012"], placement);
  }
});

test("browser camera requests sharp video as a preference without excluding lower resolution devices", async (t) => {
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  const requests = [];
  const stream = {};
  Object.defineProperty(globalThis, "window", { configurable: true, value: { isSecureContext: true } });
  Object.defineProperty(globalThis, "navigator", { configurable: true, value: {
    mediaDevices: { getUserMedia: async (constraints) => { requests.push(constraints); return stream; } },
  } });
  t.after(() => {
    if (originalWindow) Object.defineProperty(globalThis, "window", originalWindow);
    else delete globalThis.window;
    Object.defineProperty(globalThis, "navigator", originalNavigator);
  });
  const driver = await createBrowserCamera({});
  assert.equal(await driver.acquire(), stream);
  assert.equal(await driver.acquire("selected-camera"), stream);
  assert.deepEqual(requests, [
    { audio: false, video: { width: { ideal: 1920 }, height: { ideal: 1080 }, facingMode: { ideal: "environment" } } },
    { audio: false, video: { width: { ideal: 1920 }, height: { ideal: 1080 }, deviceId: { exact: "selected-camera" } } },
  ]);
});
