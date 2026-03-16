import type { Metadata } from "next";
import { Inter, Nunito } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";

const inter = Inter({ subsets: ["latin"], variable: "--font-body" });
const nunito = Nunito({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-heading",
});

export const metadata: Metadata = {
  title: "The Inflation Clock",
  description:
    "See exactly how inflation has affected YOUR purchasing power. It takes 30 seconds.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "https://inflation-clock.vercel.app"),
  openGraph: {
    title: "The Inflation Clock",
    description:
      "See exactly how inflation has affected YOUR purchasing power. It takes 30 seconds.",
    url: "https://inflation-clock.vercel.app",
    siteName: "The Inflation Clock",
    images: [
      {
        url: "/api/og",
        width: 1200,
        height: 630,
        alt: "The Inflation Clock - See your personalized inflation damage",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Inflation Clock",
    description:
      "See exactly how inflation has affected YOUR purchasing power. It takes 30 seconds.",
    images: ["/api/og"],
  },
  manifest: "/manifest.json",
  other: {
    "theme-color": "#f7931a",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#f7931a" />
      </head>
      <body className={`${inter.variable} ${nunito.variable} font-[var(--font-body)] bg-bg-primary text-text-primary antialiased`}>
        <ServiceWorkerRegistrar />
        {children}
      </body>
    </html>
  );
}
