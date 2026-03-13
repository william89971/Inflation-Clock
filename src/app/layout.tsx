import type { Metadata } from "next";
import { Inter, Nunito } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-body" });
const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-heading",
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://inflationclock.com";

export const metadata: Metadata = {
  title: "The Inflation Clock — See How Inflation Affects You",
  description:
    "See exactly how much purchasing power you've lost to inflation, personalized to your age, country, and income.",
  openGraph: {
    title: "The Inflation Clock",
    description:
      "See exactly how inflation has affected YOUR purchasing power. It takes 30 seconds. The truth lasts forever.",
    type: "website",
    url: siteUrl,
    siteName: "The Inflation Clock",
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "The Inflation Clock — See How Inflation Affects You",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Inflation Clock",
    description:
      "See exactly how inflation has affected YOUR purchasing power. It takes 30 seconds.",
    images: [`${siteUrl}/og-image.png`],
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
        {children}
      </body>
    </html>
  );
}
