import { Cormorant_Garamond, Outfit } from "next/font/google";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toaster";
import { Providers } from "@/components/providers";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-sans" });
const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
});

const title = "US360 — Remember Better. Communicate Better. Care Better.";
const description =
  "A private AI-powered relationship assistant for thoughtful communication, memories, reminders and personalized daily care.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")),
  title: { default: title, template: "%s · US360" },
  description,
  applicationName: "US360",
  manifest: "/manifest.webmanifest",
  openGraph: {
    title,
    description,
    type: "website",
    siteName: "US360",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  robots: { index: true, follow: true },
  icons: { icon: "/icons/icon.svg", apple: "/icons/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#1c2430",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${outfit.variable} ${display.variable}`}>
      <body className="font-sans antialiased">
        <Providers>
          {children}
          <ToastProvider />
        </Providers>
      </body>
    </html>
  );
}
