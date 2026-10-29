import type { Metadata, Viewport } from "next";
import { Instrument_Sans, Instrument_Serif, Noto_Naskh_Arabic } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const sans = Instrument_Sans({ subsets: ["latin"], variable: "--font-instrument-sans", display: "swap" });
const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
  display: "swap",
});
const naskh = Noto_Naskh_Arabic({ subsets: ["arabic"], weight: ["400", "500"], variable: "--font-naskh", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: { default: "Deen — a quiet prayer companion", template: "%s · Deen" },
  description: "Track your five daily prayers and Tahajjud. Accurate times, gentle reminders, honest stats. Private by design.",
  applicationName: "Deen",
  appleWebApp: { capable: true, title: "Deen", statusBarStyle: "default" },
  formatDetection: { telephone: false },
  openGraph: {
    title: "Deen — a quiet prayer companion",
    description: "Track your five daily prayers and Tahajjud. Private by design.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f3ec" },
    { media: "(prefers-color-scheme: dark)", color: "#0d100f" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${sans.variable} ${serif.variable} ${naskh.variable}`}>
      <body className="min-h-dvh">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
