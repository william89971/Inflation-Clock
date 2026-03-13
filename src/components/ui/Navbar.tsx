"use client";

import { usePathname } from "next/navigation";
import { useI18n } from "@/locales/client";
import { LanguageToggle } from "./LanguageToggle";

interface NavbarProps {
  locale: string;
}

export function Navbar({ locale }: NavbarProps) {
  const t = useI18n();
  const pathname = usePathname();

  const isLearn = pathname.includes("/learn");
  const isResults = pathname.includes("/results");

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-bg-primary/85 backdrop-blur-md border-b border-border-light">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <a
          href={`/${locale}`}
          className="font-[var(--font-heading)] text-xl font-extrabold text-bitcoin"
        >
          The Inflation Clock
        </a>

        <nav className="hidden items-center gap-1 sm:flex">
          <a
            href={`/${locale}`}
            className={`nav-link ${!isLearn && !isResults ? "nav-link-active" : ""}`}
          >
            {locale === "es" ? "Inicio" : "Home"}
          </a>
          <a
            href={`/${locale}/learn`}
            className={`nav-link ${isLearn ? "nav-link-active" : ""}`}
          >
            {locale === "es" ? "Aprender" : "Learn"}
          </a>
        </nav>

        <LanguageToggle />
      </div>
    </header>
  );
}
