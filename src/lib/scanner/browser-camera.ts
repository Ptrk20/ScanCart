import type { CameraDriver } from "./camera-session.ts";

export async function createBrowserCamera(video: HTMLVideoElement): Promise<CameraDriver> {
  if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
    throw new DOMException("Camera APIs unavailable.", "NotSupportedError");
  }
  // Load decoding code only after intentional camera activation, never during SSR.
  const [{ BrowserMultiFormatReader }, { BarcodeFormat, DecodeHintType, NotFoundException, ChecksumException, FormatException }] =
    await Promise.all([import("@zxing/browser"), import("@zxing/library")]);
  // Default decoding skips rotation and searches only a small band of the image.
  const reader = new BrowserMultiFormatReader(new Map([[DecodeHintType.TRY_HARDER, true]]), { delayBetweenScanAttempts: 250, delayBetweenScanSuccess: 500 });
  reader.possibleFormats = [
    BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A, BarcodeFormat.UPC_E,
    BarcodeFormat.CODE_128, BarcodeFormat.CODE_39, BarcodeFormat.ITF, BarcodeFormat.QR_CODE,
  ];
  return {
    acquire: (deviceId) => navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        ...(deviceId ? { deviceId: { exact: deviceId } } : { facingMode: { ideal: "environment" } }),
      },
    }),
    play: async (stream) => {
      video.srcObject = stream;
      await video.play();
    },
    scan: (onResult, onError) => reader.scan(video, (result, error) => {
      if (result) onResult(result.getText(), BarcodeFormat[result.getBarcodeFormat()]);
      else if (error && !(error instanceof NotFoundException || error instanceof ChecksumException || error instanceof FormatException)) onError(error);
    }),
    devices: async () => (await navigator.mediaDevices.enumerateDevices())
      .filter((device) => device.kind === "videoinput" && device.deviceId)
      .map((device, index) => ({ id: device.deviceId, label: device.label || `Camera ${index + 1}` })),
    detach: () => { video.pause(); video.srcObject = null; },
  };
}
