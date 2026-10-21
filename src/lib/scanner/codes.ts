import { normalizeBarcode } from "../shopping/product.ts";

export const MAX_PRODUCT_CODE_LENGTH = 512;
export type CodeResult =
  | { kind: "invalid"; message: string }
  | { kind: "review"; code: string; canUse: boolean }
  | { kind: "identifier"; code: string };

export function inspectCode(value: unknown): CodeResult {
  if (typeof value !== "string") return { kind: "invalid", message: "No readable code was found. Try again or enter the code manually." };
  const code = normalizeBarcode(value);
  if (!code) return { kind: "invalid", message: "Please enter a barcode or code." };
  const canUse = code.length <= MAX_PRODUCT_CODE_LENGTH && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(code);
  if (!canUse || !/^[a-zA-Z0-9._/-]+$/.test(code) || /^\/\//.test(code)) return { kind: "review", code, canUse };
  return { kind: "identifier", code };
}

export function equivalentRetailCode(value: string): string | undefined {
  const code = normalizeBarcode(value);
  if (!code || !/^(?:[0-9]{12}|0[0-9]{12})$/.test(code)) return undefined;
  let sum = 0;
  for (let offset = 0; offset < code.length; offset++) {
    sum += (code.charCodeAt(code.length - 1 - offset) - 48) * (offset % 2 === 0 ? 1 : 3);
  }
  if (sum % 10 !== 0) return undefined;
  // UPC-A and a zero-prefixed EAN-13 have identical bars; never rewrite stored identifiers.
  return code.length === 12 ? `0${code}` : code.slice(1);
}

export function cameraErrorMessage(error: unknown): string {
  const name = error && typeof error === "object" && "name" in error ? error.name : "";
  switch (name) {
    case "NotAllowedError":
    case "PermissionDeniedError": return "Camera permission was denied. Allow camera access in your browser settings or enter the barcode manually.";
    case "NotFoundError":
    case "DevicesNotFoundError": return "No camera is available on this device. Enter the barcode manually.";
    case "NotReadableError":
    case "TrackStartError": return "The camera may be in use by another application. Close the other camera application and try again.";
    case "SecurityError":
    case "NotSupportedError": return "Camera scanning is unavailable. Use HTTPS or localhost and a supported browser, or enter the barcode manually.";
    case "TimeoutError": return "Starting the camera timed out. Check your permission prompt, try again, or enter the barcode manually.";
    default: return "We couldn't scan the barcode. Try better lighting, move the camera, or enter the code manually.";
  }
}
