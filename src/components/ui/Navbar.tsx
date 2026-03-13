"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useI18n } from "@/locales/client";
import { LanguageToggle } from "./LanguageToggle";
import { getCachedProfile, hasProfileData } from "@/lib/profile";
import Link from "next/link";

interface NavbarProps {
  locale: string;
}

export function Navbar({ locale }: NavbarProps) {
  const t = useI18n();
  const pathname = usePathname();
  const [showDashboard, setShowDashboard] = useState(false);

  useEffect(() => {
    const profile = getCachedProfile();
    setShowDashboard(hasProfileData(profile));
  }, []);

  const isLearn = pathname.includes("/learn");
  const isResults = pathname.includes("/results");
  const isDashboard = pathname.includes("/dashboard");

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-bg-primary/85 backdrop-blur-md border-b border-border-light">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link
          href={`/${locale}`}
          className="font-[var(--font-heading)] text-xl font-extrabold text-bitcoin"
        >
          The Inflation Clock
        </Link>

        <nav className="hidden items-center gap-1 sm:flex">
          <Link
            href={`/${locale}`}
            className={`nav-link ${!isLearn && !isResults && !isDashboard ? "nav-link-active" : ""}`}
          >
            {locale === "es" ? "Inicio" : "Home"}
          </Link>
          <Link
            href={`/${locale}/learn`}
            className={`nav-link ${isLearn ? "nav-link-active" : ""}`}
          >
            {locale === "es" ? "Aprender" : "Learn"}
          </Link>
          {showDashboard && (
            <Link
              href={`/${locale}/dashboard`}
              className={`nav-link ${isDashboard ? "nav-link-active" : ""}`}
            >
              {locale === "es" ? "Mi Panel" : "Dashboard"}
            </Link>
          )}
        </nav>

        <LanguageToggle />
      </div>
    </header>
  );
}
