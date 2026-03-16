"use client";

import { usePathname } from "next/navigation";
import { useCurrentLocale } from "@/locales/client";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface NavItem {
  key: string;
  label: string;
  labelEs: string;
  href: string;
  icon: React.ReactNode;
}

function getNavItems(locale: string): NavItem[] {
  return [
    {
      key: "dashboard",
      label: "Dashboard",
      labelEs: "Panel",
      href: `/${locale}/dashboard`,
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
    },
    {
      key: "expenses",
      label: "Expenses",
      labelEs: "Gastos",
      href: `/${locale}/dashboard/expenses`,
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      ),
    },
    {
      key: "family",
      label: "Family",
      labelEs: "Familia",
      href: `/${locale}/dashboard/family`,
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      key: "simulator",
      label: "Simulator",
      labelEs: "Simulador",
      href: `/${locale}/dashboard/simulator`,
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      ),
    },
    {
      key: "monitor",
      label: "Monitor",
      labelEs: "Monitor",
      href: `/${locale}/dashboard/monitor`,
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
      ),
    },
  ];
}

function isActive(pathname: string, href: string): boolean {
  // Exact match for dashboard root, prefix match for sub-routes
  if (href.endsWith("/dashboard")) {
    return pathname === href;
  }
  return pathname.startsWith(href);
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = useCurrentLocale();
  const pathname = usePathname();
  const navItems = getNavItems(locale);

  return (
    <div className="flex min-h-screen flex-col bg-bg-primary lg:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden w-[240px] shrink-0 border-r border-border bg-bg-card lg:block">
        <div className="sticky top-0 flex h-screen flex-col px-4 py-8">
          <Link
            href={`/${locale}`}
            className="mb-8 px-3 font-[var(--font-heading)] text-lg font-bold text-bitcoin"
          >
            Inflation Clock
          </Link>

          <nav className="flex flex-1 flex-col gap-1">
            {navItems.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                    active
                      ? "bg-bitcoin-soft text-bitcoin"
                      : "text-text-secondary hover:bg-bg-card-hover hover:text-text-primary"
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute inset-0 rounded-xl bg-bitcoin-soft"
                      transition={{
                        type: "spring",
                        stiffness: 350,
                        damping: 30,
                      }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-3">
                    {item.icon}
                    {locale === "es" ? item.labelEs : item.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto px-3 text-xs text-text-muted">
            {locale === "es"
              ? "El conocimiento es poder."
              : "Knowledge is power."}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 pb-20 lg:pb-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Tab Bar */}
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-bg-card/95 backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-2">
          {navItems.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.key}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-[11px] font-medium transition-colors ${
                  active
                    ? "text-bitcoin"
                    : "text-text-muted hover:text-text-secondary"
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="tab-active"
                    className="absolute -top-px left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-bitcoin"
                    transition={{
                      type: "spring",
                      stiffness: 350,
                      damping: 30,
                    }}
                  />
                )}
                <span className="relative">{item.icon}</span>
                <span>{locale === "es" ? item.labelEs : item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
