import type { Metadata, Viewport } from "next";
import { Inter, Barlow_Condensed, JetBrains_Mono } from "next/font/google";
import { AppShell } from "@/components/layout/AppShell";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { KvkkProvider } from "@/components/kvkk/KvkkProvider";
import { Analytics } from "@/components/providers/Analytics";
import { JsonLd } from "@/components/seo/JsonLd";
import { PushNotificationManager } from "@/components/providers/PushNotificationManager";
import { ServiceWorkerRegister } from "@/components/providers/ServiceWorkerRegister";
import { ConfirmProvider } from "@/components/providers/ConfirmProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://jfsmethod.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "JFS Method — Fizyoterapi Sonrası Hareket Danışmanlığı",
    template: "%s | JFS Method",
  },
  description:
    "Ağrısız, kişiye özel ve sürdürülebilir vücut dönüşümü için bilimsel temelli hareket danışmanlığı. Online ve yüz yüze fizyoterapi, postür analizi ve dijital vücut takibi.",
  keywords: [
    "fizyoterapi", "hareket danışmanlığı", "postür analizi", "ağrı tedavisi",
    "sırt ağrısı", "bel ağrısı", "boyun ağrısı", "JFS Method", "fizyoterapist",
    "online fizyoterapi", "vücut ölçüm takibi", "rehabilitasyon",
  ],
  authors: [{ name: "JFS Method" }],
  creator: "JFS Method",
  publisher: "JFS Method",
  category: "health",
  alternates: {
    canonical: SITE_URL,
    languages: { "tr-TR": SITE_URL },
  },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: SITE_URL,
    siteName: "JFS Method",
    title: "JFS Method — Fizyoterapi Sonrası Hareket Danışmanlığı",
    description:
      "Ağrısız, kişiye özel ve sürdürülebilir vücut dönüşümü için bilimsel temelli hareket danışmanlığı.",
    images: [
      {
        url: "/screenshot-wide.png",
        width: 1280,
        height: 720,
        alt: "JFS Method — Hareket Danışmanlığı Platformu",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "JFS Method — Fizyoterapi Sonrası Hareket Danışmanlığı",
    description:
      "Ağrısız, kişiye özel ve sürdürülebilir vücut dönüşümü için bilimsel temelli hareket danışmanlığı.",
    images: ["/screenshot-wide.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "JFS Method",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#93c5fd" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1120" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={`${inter.variable} ${barlowCondensed.variable} ${jetbrainsMono.variable} antialiased`} suppressHydrationWarning>
      <body className="min-h-full bg-background text-foreground">
        <ThemeProvider>
          <ConfirmProvider>
            <AuthProvider>
              <AppShell>
                <KvkkProvider>{children}</KvkkProvider>
              </AppShell>
            <PushNotificationManager />
            <ServiceWorkerRegister />
            <Analytics />
            <JsonLd />
            </AuthProvider>
          </ConfirmProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
