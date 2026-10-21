import type { Metadata } from "next";
import type { Viewport } from "next";
import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { ShoppingSessionProvider } from "@/context/shopping-session-context";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "ScanCart | Shop smarter", template: "%s | ScanCart" },
  description: "Your everyday grocery companion. Check product prices, plan your basket, and keep your shopping budget in view.",
  applicationName: "ScanCart",
  appleWebApp: { capable: true, title: "ScanCart", statusBarStyle: "default" },
  icons: { apple: "/icons/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#173f32",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className="min-h-full antialiased"
    >
      <body><ShoppingSessionProvider><AppShell>{children}</AppShell></ShoppingSessionProvider></body>
    </html>
  );
}
