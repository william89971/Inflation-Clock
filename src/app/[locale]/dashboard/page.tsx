"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCurrentLocale } from "@/locales/client";
import { motion } from "framer-motion";
import { fetchProfile, hasProfileData, UserProfile } from "@/lib/profile";
import { formatCurrency } from "@/lib/calculations";
import { CountryCode } from "@/data/inflation";
import { calculateReturnVisitData } from "@/lib/dashboard";
import Link from "next/link";

const stagger = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function DashboardPage() {
  const locale = useCurrentLocale();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const p = await fetchProfile();
      if (!hasProfileData(p)) {
        router.replace(`/${locale}`);
        return;
      }
      setProfile(p);
      setLoading(false);
    }
    load();
  }, [locale, router]);

  if (loading || !profile) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-bitcoin border-t-transparent" />
      </div>
    );
  }

  const country = (profile.country_code || "US") as CountryCode;
  const visitData = calculateReturnVisitData(profile);
  const {
    lossSinceLastVisit,
    daysSinceLastVisit,
    modulesCompleted,
    totalModules,
  } = visitData;

  const lastVisitFormatted = profile.last_visit
    ? new Date(profile.last_visit).toLocaleDateString(
        locale === "es" ? "es" : "en",
        { month: "long", day: "numeric", year: "numeric" }
      )
    : "";

  const dailyLossFormatted =
    profile.daily_loss != null
      ? formatCurrency(profile.daily_loss, country)
      : formatCurrency(0, country);

  const progressPercent =
    totalModules > 0
      ? Math.round((modulesCompleted / totalModules) * 100)
      : 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="flex flex-col gap-6"
      >
        {/* Welcome Back Header */}
        <motion.div variants={fadeUp}>
          <h1 className="font-[var(--font-heading)] text-2xl font-extrabold text-text-heading sm:text-3xl">
            {locale === "es" ? "Bienvenido de vuelta" : "Welcome back"} <span role="img" aria-label="wave">&#x1F44B;</span>
          </h1>
          {lastVisitFormatted && (
            <p className="mt-1 text-sm text-text-muted">
              {locale === "es"
                ? `Esto es lo que ha pasado desde ${lastVisitFormatted}`
                : `Here's what's happened since ${lastVisitFormatted}`}
            </p>
          )}
        </motion.div>

        {/* Since Last Visit Card (THE HOOK) */}
        {daysSinceLastVisit > 0 && (
          <motion.div
            variants={fadeUp}
            className="overflow-hidden rounded-2xl p-6 text-white shadow-lg sm:p-8"
            style={{
              background:
                "linear-gradient(135deg, #FF6B6B 0%, #F7931A 50%, #FFB347 100%)",
            }}
          >
            <p className="mb-1 text-sm font-medium text-white/80">
              {locale === "es" ? "Desde tu ultima visita" : "Since your last visit"}
            </p>
            <p className="font-[var(--font-heading)] text-3xl font-extrabold sm:text-4xl">
              {locale === "es" ? "Has perdido " : "You've lost "}
              {formatCurrency(lossSinceLastVisit, country)}
              {locale === "es" ? " a la inflacion" : " to inflation"}
            </p>
            <p className="mt-1 text-sm text-white/80">
              {locale === "es"
                ? `en los ultimos ${daysSinceLastVisit} ${daysSinceLastVisit === 1 ? "dia" : "dias"}`
                : `in the last ${daysSinceLastVisit} ${daysSinceLastVisit === 1 ? "day" : "days"}`}
            </p>
            <p className="mt-4 text-sm text-white/70">
              {locale === "es"
                ? `Son ${dailyLossFormatted} por dia, todos los dias, lo notes o no.`
                : `That's ${dailyLossFormatted} per day, every day, whether you notice it or not.`}
            </p>
          </motion.div>
        )}

        {/* Financial Snapshot Grid */}
        <motion.div
          variants={fadeUp}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          {/* Card 1: Lifetime Loss */}
          <div className="stat-card rounded-2xl p-6 shadow-lg">
            <div className="mb-2 text-2xl">&#x1F4B8;</div>
            <p className="font-[var(--font-heading)] text-2xl font-bold text-negative">
              {formatCurrency(profile.lifetime_loss || 0, country)}
            </p>
            <p className="mt-1 text-sm text-text-secondary">
              {locale === "es"
                ? "Poder adquisitivo perdido en tu vida"
                : "Total purchasing power lost"}
            </p>
          </div>

          {/* Card 2: Monthly Drain */}
          <div className="stat-card rounded-2xl p-6 shadow-lg">
            <div className="mb-2 text-2xl">&#x1F4C9;</div>
            <p className="font-[var(--font-heading)] text-2xl font-bold text-negative">
              {formatCurrency(profile.monthly_loss || 0, country)}
              <span className="text-base font-normal text-text-muted">
                /{locale === "es" ? "mes" : "mo"}
              </span>
            </p>
            <p className="mt-1 text-sm text-text-secondary">
              {locale === "es"
                ? "Lo que te cuesta la inflacion"
                : "What inflation costs you"}
            </p>
          </div>

          {/* Card 3: Bitcoin Alternative */}
          <div className="stat-card rounded-2xl p-6 shadow-lg">
            <div className="mb-2 text-2xl">&#x20BF;</div>
            {profile.btc_comparison != null ? (
              <>
                <p className="font-[var(--font-heading)] text-2xl font-bold text-positive">
                  +{formatCurrency(profile.btc_comparison, country)}
                </p>
                <p className="mt-1 text-sm text-text-secondary">
                  {locale === "es"
                    ? "Si hubieras hecho DCA en Bitcoin"
                    : "If you'd been DCA'ing"}
                </p>
              </>
            ) : (
              <>
                <Link
                  href={`/${locale}/dashboard/simulator`}
                  className="font-[var(--font-heading)] text-xl font-bold text-bitcoin hover:underline"
                >
                  {locale === "es"
                    ? "Calcula el tuyo \u2192"
                    : "Calculate yours \u2192"}
                </Link>
                <p className="mt-1 text-sm text-text-secondary">
                  {locale === "es"
                    ? "Simulador de DCA en Bitcoin"
                    : "Bitcoin DCA Simulator"}
                </p>
              </>
            )}
          </div>

          {/* Card 4: Learning Progress */}
          <div className="stat-card rounded-2xl p-6 shadow-lg">
            <div className="mb-2 text-2xl">&#x1F4DA;</div>
            <p className="font-[var(--font-heading)] text-2xl font-bold text-text-heading">
              {modulesCompleted}
              <span className="text-base font-normal text-text-muted">
                /{totalModules}{" "}
                {locale === "es" ? "modulos" : "modules"}
              </span>
            </p>
            {/* Progress bar */}
            <div className="progress-warm mt-3 h-2.5">
              <div
                className="progress-warm-fill h-2.5"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="mt-2 text-sm text-text-secondary">
              {locale === "es"
                ? "Progreso de aprendizaje"
                : "Learning progress"}
            </p>
          </div>
        </motion.div>

        {/* Continue Learning Section */}
        <motion.div
          variants={fadeUp}
          className="card-warm rounded-2xl p-6"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-[var(--font-heading)] text-lg font-bold text-text-heading">
                {locale === "es"
                  ? "Continua donde lo dejaste"
                  : "Pick up where you left off"}
              </h2>
              <p className="mt-1 text-sm text-text-secondary">
                {modulesCompleted > 0
                  ? locale === "es"
                    ? `Has completado ${modulesCompleted} ${modulesCompleted === 1 ? "modulo" : "modulos"}. Sigue adelante.`
                    : `You've completed ${modulesCompleted} ${modulesCompleted === 1 ? "module" : "modules"}. Keep going.`
                  : locale === "es"
                    ? "Empieza tu viaje de aprendizaje."
                    : "Start your learning journey."}
              </p>
            </div>
            <Link
              href={`/${locale}/learn`}
              className="btn-primary inline-flex shrink-0 items-center justify-center whitespace-nowrap px-6 py-3 text-base"
            >
              {locale === "es" ? "Seguir Aprendiendo" : "Continue Learning"}
            </Link>
          </div>
        </motion.div>

        {/* Quick Actions Bar */}
        <motion.div variants={fadeUp}>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-muted">
            {locale === "es" ? "Acciones Rapidas" : "Quick Actions"}
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <QuickAction
              href={`/${locale}/dashboard/expenses`}
              icon="📝"
              label={locale === "es" ? "Rastrear Gastos" : "Track Expenses"}
            />
            <QuickAction
              href={`/${locale}/dashboard/simulator`}
              icon="📊"
              label={locale === "es" ? "Simulador DCA" : "DCA Simulator"}
            />
            <QuickAction
              href={`/${locale}/dashboard/family`}
              icon="👪"
              label={locale === "es" ? "Historia Familiar" : "Family Story"}
            />
            <QuickAction
              href={`/${locale}/learn/chat`}
              icon="🤖"
              label={locale === "es" ? "Tutor IA" : "AI Tutor"}
            />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

function QuickAction({
  href,
  icon,
  label,
}: {
  href: string;
  icon: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="card-warm flex flex-col items-center gap-2 rounded-2xl px-4 py-5 text-center transition-all hover:-translate-y-0.5"
    >
      <span className="text-2xl">{icon}</span>
      <span className="text-xs font-medium text-text-secondary">{label}</span>
    </Link>
  );
}
