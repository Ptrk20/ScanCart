import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/", name: "ScanCart", short_name: "ScanCart",
    description: "A grocery barcode scanner, basket total tracker, and personal price history app.",
    start_url: "/", scope: "/", display: "standalone",
    background_color: "#f8f9f5", theme_color: "#173f32",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Scan Item", url: "/scan" },
      { name: "Basket", url: "/basket" },
    ],
  };
}
