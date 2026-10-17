import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { SITE_NAME, SITE_URL } from "@/lib/api";
import { cookies } from "next/headers";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME} — Geyim marketplace`, template: `%s | ${SITE_NAME}` },
  description: "Gardrop — Azərbaycanın geyim marketplace-i. Yerli mağazalardan geyim, ayaqqabı və aksesuarlar.",
  openGraph: { siteName: SITE_NAME, type: "website", locale: "az_AZ" },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Read theme cookie on the server so server-rendered HTML matches client hydration.
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get("gardrop_theme")?.value;
  const isDark = themeCookie === "dark";

  return (
    <html lang="az" className={isDark ? "dark" : undefined} suppressHydrationWarning>
      <head>
        {/* Leaflet CSS */}
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      </head>
      <body>
        {children}
        {/* Leaflet global (window.L) — loaded after interactive to not block rendering */}
        <Script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" strategy="afterInteractive" />
        {/* Google Identity Services (window.google) */}
        <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
      </body>
    </html>
  );
}
