import assert from "node:assert/strict";
import test from "node:test";
import { setTimeout as delay } from "node:timers/promises";
import { CameraSession } from "../src/lib/scanner/camera-session.ts";
import { cameraErrorMessage, equivalentRetailCode, inspectCode, MAX_PRODUCT_CODE_LENGTH } from "../src/lib/scanner/codes.ts";
import { BarcodeFormat, BinaryBitmap, HybridBinarizer, MultiFormatReader, QRCodeWriter, RGBLuminanceSource } from "@zxing/library";

const flush = async () => { await Promise.resolve(); await Promise.resolve(); };
function deferred() {
  let resolve;
  const promise = new Promise((yes) => { resolve = yes; });
  return { promise, resolve };
}
class Track extends EventTarget {
  stopped = 0;
  stop() { this.stopped++; }
  getSettings() { return { deviceId: "rear" }; }
}
function fixture(overrides = {}, timeout = 1000) {
  const track = new Track();
  const stream = { getTracks: () => [track], getVideoTracks: () => [track] };
  const states = [];
  const errors = [];
  const detections = [];
  const devices = [];
  let emit;
  let scanError;
  let stops = 0;
  let detached = 0;
  const requestedDevices = [];
  const driver = {
    acquire: async (id) => { requestedDevices.push(id); return stream; },
    play: async () => undefined,
    scan: (onResult, onError) => { emit = onResult; scanError = onError; return { stop: () => { stops++; } }; },
    devices: async () => [{ id: "rear", label: "Rear" }, { id: "front", label: "Front" }],
    detach: () => { detached++; },
    ...overrides,
  };
  const session = new CameraSession(async () => driver, {
    state: (state) => states.push(state),
    error: (error) => errors.push(error),
    detected: (code, format) => detections.push({ code, format }),
    devices: (available, selected) => devices.push({ available, selected }),
  }, timeout);
  return { session, track, stream, states, errors, detections, devices, driver, requestedDevices,
    emit: (...args) => emit(...args), fail: (error) => scanError(error),
    stops: () => stops, detached: () => detached };
}

test("code inspection preserves identifiers, leading zeros and normalized strings", () => {
  for (const code of ["0123456789012", "4801234567890", "ABC-123", "sku/001", "001.02"]) {
    assert.deepEqual(inspectCode(` ${code} `), { kind: "identifier", code });
  }
  for (const value of ["", "   ", undefined, null, {}, 123]) assert.equal(inspectCode(value).kind, "invalid");
});

test("URLs, scripts, HTML and arbitrary QR text require review, never navigation", () => {
  for (const code of ["https://example.test/?code=001", "javascript:alert(1)", "<img src=x onerror=alert(1)>", "//example.test", "Product code 0123", "QR:\nline2"]) {
    assert.deepEqual(inspectCode(code), { kind: "review", code, canUse: true });
  }
  assert.equal(inspectCode("a".repeat(MAX_PRODUCT_CODE_LENGTH + 1)).canUse, false);
  assert.equal(inspectCode("abc\u0000def").canUse, false);
  assert.equal(inspectCode("a".repeat(MAX_PRODUCT_CODE_LENGTH)).kind, "identifier");
});

test("camera errors give friendly recovery messages rather than raw exceptions", () => {
  const messages = {
    NotAllowedError: /permission was denied/,
    PermissionDeniedError: /permission was denied/,
    NotFoundError: /No camera/,
    NotReadableError: /in use/,
    SecurityError: /HTTPS/,
    NotSupportedError: /supported browser/,
    TimeoutError: /timed out/,
    UnknownError: /couldn't scan/,
  };
  for (const [name, pattern] of Object.entries(messages)) {
    const message = cameraErrorMessage(new DOMException("Secret raw failure details", name));
    assert.match(message, pattern);
    assert.doesNotMatch(message, /Secret raw/);
  }
  assert.match(cameraErrorMessage(undefined), /couldn't scan/);
});

test("only checksum-valid equivalent UPC-A / zero-prefixed EAN-13 codes are aliases", () => {
  assert.equal(equivalentRetailCode("123456789012"), "0123456789012");
  assert.equal(equivalentRetailCode(" 0123456789012 "), "123456789012");
  for (const value of ["0123456789013", "123456789013", "12345", "4801234567890", "QR:0123456789012", "https://example.test/123456789012", ""]) {
    assert.equal(equivalentRetailCode(value), undefined);
  }
  assert.deepEqual(inspectCode("0123456789012"), { kind: "identifier", code: "0123456789012" });
});

test("start/stop releases the single decoder, all tracks and preview idempotently", async () => {
  const f = fixture();
  await f.session.start();
  assert.deepEqual(f.states, ["starting", "scanning"]);
  assert.deepEqual(f.requestedDevices, [undefined]);
  assert.equal(f.devices[0].selected, "rear");
  f.session.stop();
  assert.equal(f.track.stopped, 1);
  assert.equal(f.stops(), 1);
  assert.equal(f.detached(), 1);
  f.session.stop();
  assert.equal(f.track.stopped, 1);
  assert.equal(f.stops(), 1);
});

test("repeated camera callbacks accept exactly one code and dispose resources", async () => {
  const f = fixture();
  await f.session.start();
  f.emit(" 0123456789012 ", "EAN_13");
  f.emit("0123456789012", "EAN_13");
  f.emit("another");
  await flush();
  assert.deepEqual(f.detections, [{ code: "0123456789012", format: "EAN_13" }]);
  assert.equal(f.track.stopped, 1);
  assert.equal(f.stops(), 1);
  f.emit("late callback");
  await flush();
  assert.equal(f.detections.length, 1);
});

test("invalid detections neither stop camera nor emit product lookups", async () => {
  const f = fixture();
  await f.session.start();
  for (const value of ["", " ", null, undefined, {}]) f.emit(value);
  await flush();
  assert.equal(f.detections.length, 0);
  assert.equal(f.track.stopped, 0);
  assert.equal(f.states.at(-1), "scanning");
  f.session.stop();
});

test("synchronous first-frame detection still disposes returned scan controls", async () => {
  let stopped = false;
  const f = fixture({ scan: (onResult) => { onResult("001"); return { stop: () => { stopped = true; } }; } });
  await f.session.start();
  await flush();
  assert.equal(stopped, true);
  assert.equal(f.track.stopped, 1);
  assert.equal(f.detections.length, 1);
});

test("stop/navigation while permission is pending releases a late-granted stream", async () => {
  const pending = deferred();
  let plays = 0;
  const f = fixture({ acquire: () => pending.promise, play: async () => { plays++; } });
  const starting = f.session.start();
  await flush();
  f.session.stop();
  pending.resolve(f.stream);
  await starting;
  assert.equal(f.track.stopped, 1);
  assert.equal(plays, 0);
  assert.equal(f.states.at(-1), "idle");
});

test("stop during library loading never requests a camera", async () => {
  const loading = deferred();
  const f = fixture();
  const camera = new CameraSession(() => loading.promise, { state() {}, detected() {}, error() {}, devices() {} });
  const starting = camera.start();
  camera.stop();
  loading.resolve(f.driver);
  await starting;
  assert.deepEqual(f.requestedDevices, []);
});

test("stop during preview startup prevents scanning when play eventually resolves", async () => {
  const playing = deferred();
  let scans = 0;
  const f = fixture({ play: () => playing.promise, scan: () => { scans++; return { stop() {} }; } });
  const starting = f.session.start();
  await flush();
  f.session.stop();
  playing.resolve();
  await starting;
  assert.equal(scans, 0);
  assert.equal(f.track.stopped, 1);
});

test("permission denial exits loading and retry can start a fresh stream", async () => {
  const f = fixture({ acquire: async () => { throw new DOMException("denied", "NotAllowedError"); } });
  await f.session.start();
  assert.equal(f.states.at(-1), "error");
  assert.equal(f.errors.length, 1);
  f.driver.acquire = async () => f.stream;
  await f.session.start();
  assert.equal(f.states.at(-1), "scanning");
  f.session.stop();
  assert.equal(f.track.stopped, 1);
});

test("startup timeout exits loading and releases tracks from a late permission grant", async () => {
  const permission = deferred();
  const f = fixture({ acquire: () => permission.promise }, 10);
  const starting = f.session.start();
  await delay(25);
  assert.equal(f.states.at(-1), "error");
  assert.equal(f.errors[0].name, "TimeoutError");
  permission.resolve(f.stream);
  await starting;
  assert.equal(f.track.stopped, 1);
  assert.equal(f.detections.length, 0);
});

test("decoder errors and interrupted tracks release resources", async () => {
  const f = fixture();
  await f.session.start();
  f.fail(new Error("Decoder failed"));
  await flush();
  assert.equal(f.track.stopped, 1);
  assert.equal(f.stops(), 1);
  assert.equal(f.states.at(-1), "error");
  const g = fixture();
  await g.session.start();
  g.track.dispatchEvent(new Event("ended"));
  assert.equal(g.track.stopped, 1);
  assert.equal(g.stops(), 1);
  assert.equal(g.states.at(-1), "error");
});

test("switching stops the old reader and targets the selected next camera", async () => {
  const f = fixture();
  await f.session.start();
  await f.session.start("front");
  assert.deepEqual(f.requestedDevices, [undefined, "front"]);
  assert.equal(f.stops(), 1);
  assert.equal(f.track.stopped, 1);
  f.session.stop();
  assert.equal(f.stops(), 2);
});

test("preview and synchronous decoder initialization failures release acquired streams", async () => {
  for (const overrides of [
    { play: async () => { throw new Error("Preview failed"); } },
    { scan: () => { throw new Error("Decoder failed"); } },
  ]) {
    const f = fixture(overrides);
    await f.session.start();
    assert.equal(f.track.stopped, 1);
    assert.equal(f.detached(), 1);
    assert.equal(f.states.at(-1), "error");
    assert.equal(f.errors.length, 1);
  }
});

test("library import failures exit loading without leaking the startup timer", async () => {
  const states = [];
  const errors = [];
  const camera = new CameraSession(async () => { throw new Error("Import failed"); }, {
    state: (state) => states.push(state), error: (error) => errors.push(error), detected() {}, devices() {},
  }, 10);
  await camera.start();
  await delay(25);
  assert.deepEqual(states, ["starting", "error"]);
  assert.equal(errors.length, 1);
});

test("restarting invalidates every callback and device enumeration from the old attempt", async () => {
  const available = deferred();
  const callbacks = [];
  const f = fixture({
    devices: () => available.promise,
    scan: (result, error) => { callbacks.push({ result, error }); return { stop() {} }; },
  });
  await f.session.start();
  await f.session.start("front");
  callbacks[0].result("old-code");
  callbacks[0].error(new Error("Old decoder error"));
  available.resolve([{ id: "front", label: "Front" }]);
  await flush();
  assert.equal(f.detections.length, 0);
  assert.equal(f.errors.length, 0);
  assert.equal(f.devices.length, 1, "only latest enumeration is published");
  callbacks[1].result("new-code");
  await flush();
  assert.deepEqual(f.detections, [{ code: "new-code", format: undefined }]);
});

test("installed ZXing decodes actual QR pixels, preserving URLs as untrusted text", () => {
  const text = "https://example.test/product?code=001";
  const matrix = new QRCodeWriter().encode(text, BarcodeFormat.QR_CODE, 240, 240, new Map());
  const pixels = new Uint8ClampedArray(matrix.getWidth() * matrix.getHeight());
  for (let y = 0; y < matrix.getHeight(); y++) {
    for (let x = 0; x < matrix.getWidth(); x++) pixels[y * matrix.getWidth() + x] = matrix.get(x, y) ? 0 : 255;
  }
  const bitmap = new BinaryBitmap(new HybridBinarizer(new RGBLuminanceSource(pixels, matrix.getWidth(), matrix.getHeight())));
  const result = new MultiFormatReader().decode(bitmap);
  assert.equal(result.getText(), text);
  assert.equal(result.getBarcodeFormat(), BarcodeFormat.QR_CODE);
  assert.equal(inspectCode(result.getText()).kind, "review");
});
