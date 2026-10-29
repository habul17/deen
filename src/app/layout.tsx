import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Noto_Naskh_Arabic, Schibsted_Grotesk } from "next/font/google";
import { Providers } from "@/components/providers";
import { InlineScript } from "@/components/sky/inline-script";
import { Sky } from "@/components/sky/sky-driver";
import { skyBootScript } from "@/lib/sky";
import "./globals.css";

const display = Bricolage_Grotesque({
  subsets: ["latin", "latin-ext"],
  axes: ["opsz"],
  variable: "--font-bricolage",
  display: "swap",
});
const sans = Schibsted_Grotesk({ subsets: ["latin", "latin-ext"], variable: "--font-schibsted", display: "swap" });
const naskh = Noto_Naskh_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500"],
  variable: "--font-naskh",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: { default: "Deen: a quiet prayer companion", template: "%s · Deen" },
  description: "Track your five daily prayers and Tahajjud. Accurate times, gentle reminders, honest stats. Private by design.",
  applicationName: "Deen",
  appleWebApp: { capable: true, title: "Deen", statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
  openGraph: {
    title: "Deen: a quiet prayer companion",
    description: "Track your five daily prayers and Tahajjud. Private by design.",
    type: "website",
  },
};

// The theme colour follows the sky; the boot script and SkyDriver keep it current.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${display.variable} ${sans.variable} ${naskh.variable}`}>
      <head>
        <meta name="theme-color" content="#070a1c" />
        <InlineScript html={skyBootScript} />
      </head>
      <body className="min-h-dvh">
        <Sky />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
