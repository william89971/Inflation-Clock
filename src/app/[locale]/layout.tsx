import { ReactNode } from "react";
import { headers } from "next/headers";
import { I18nProviderClient } from "@/locales/client";
import { Navbar } from "@/components/ui/Navbar";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || `/${locale}`;

  // Strip the locale prefix to get the base path for hreflang alternates
  const basePath = pathname.replace(/^\/(en|es)/, "") || "/";
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://inflationclock.com";

  return {
    alternates: {
      canonical: `${baseUrl}/${locale}${basePath}`,
      languages: {
        en: `${baseUrl}/en${basePath}`,
        es: `${baseUrl}/es${basePath}`,
        "x-default": `${baseUrl}/en${basePath}`,
      },
    },
  };
}

export default async function LocaleLayout({
  params,
  children,
}: {
  params: Promise<{ locale: string }>;
  children: ReactNode;
}) {
  const { locale } = await params;

  return (
    <I18nProviderClient locale={locale}>
      <div className="min-h-screen bg-bg-primary">
        <Navbar locale={locale} />
        {children}
        <footer className="footer-warm mt-20 px-4 py-12">
          <div className="mx-auto max-w-6xl text-center">
            <p className="font-[var(--font-heading)] text-lg font-bold text-bitcoin">
              The Inflation Clock
            </p>
            <p className="mt-2 text-sm text-text-muted">
              {locale === "es"
                ? "El conocimiento es tu mejor inversi\u00f3n."
                : "Knowledge is your best investment."}
            </p>
            <div className="mt-6 flex items-center justify-center gap-6">
              <a href={`/${locale}/learn`} className="text-sm text-text-muted transition-colors hover:text-white">
                {locale === "es" ? "Aprender" : "Learn"}
              </a>
              <a href={`/${locale}/learn/chat`} className="text-sm text-text-muted transition-colors hover:text-white">
                {locale === "es" ? "Tutor IA" : "AI Tutor"}
              </a>
            </div>
            <p className="mt-8 text-xs text-text-secondary">
              &copy; {new Date().getFullYear()} The Inflation Clock. {locale === "es" ? "Educativo, no asesor\u00eda financiera." : "Educational, not financial advice."}
            </p>
          </div>
        </footer>
      </div>
    </I18nProviderClient>
  );
}
