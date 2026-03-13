"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useI18n, useCurrentLocale } from "@/locales/client";
import { Suspense, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { calculateInflation } from "@/lib/calculations";
import { CountryCode } from "@/data/inflation";
import { saveUserData } from "@/lib/user-context";
import { saveProfile } from "@/lib/profile";
import { COUNTRIES } from "@/data/inflation";
import { getInflationRate } from "@/data/inflation";
import { LiveTicker } from "@/components/results/LiveTicker";
import { LifetimeLossCard } from "@/components/results/LifetimeLossCard";
import { YearlyChart } from "@/components/results/YearlyChart";
import { LossCards } from "@/components/results/LossCards";
import { ComparisonCards } from "@/components/results/ComparisonCards";
import { CountryContext } from "@/components/results/CountryContext";
import { ShareCard } from "@/components/results/ShareCard";
import { CtaSection } from "@/components/results/CtaSection";
import { ShareButtons } from "@/components/share/ShareButtons";
import { ReactionBar } from "@/components/social/ReactionBar";
import { SmartRecommendation } from "@/components/SmartRecommendation";
import { NewsletterCTA } from "@/components/newsletter/NewsletterCTA";
import { LocalPriceCard } from "@/components/results/LocalPriceCard";
import { trackEvent } from "@/lib/analytics";

function ResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = useI18n();
  const locale = useCurrentLocale();
  const hasSaved = useRef(false);

  const country = (searchParams.get("country") || "US") as CountryCode;
  const age = parseInt(searchParams.get("age") || "30", 10);
  const income = parseFloat(searchParams.get("income") || "5000");

  const currentYear = new Date().getFullYear();
  const birthYear = currentYear - age;

  const results = calculateInflation(birthYear, country, income);

  // Persist user data + track analytics (run once on mount, not during render)
  useEffect(() => {
    if (hasSaved.current) return;
    hasSaved.current = true;

    saveUserData({ country, age, income, birthYear });
    trackEvent("inflation_clock_result", {
      country,
      age,
      income,
      lifetime_loss: results.lifetimeLoss,
      daily_loss: results.dailyLoss,
    });

    // Save to personalization profile (fire-and-forget)
    const countryConfig = COUNTRIES[country];
    saveProfile({
      country: countryConfig?.code || country,
      country_code: country,
      birth_year: birthYear,
      age,
      monthly_income: income,
      currency: countryConfig?.currency || "USD",
      language: locale,
      lifetime_loss: results.lifetimeLoss,
      daily_loss: results.dailyLoss,
      monthly_loss: results.monthlyLoss,
      yearly_loss: results.yearlyLoss,
      last_inflation_rate: getInflationRate(country, currentYear),
      last_visit: new Date().toISOString(),
    });
  }, [country, age, income, birthYear, locale, currentYear, results]);

  return (
    <main className="min-h-screen bg-bg-primary pb-20 pt-24">
      <div className="mx-auto max-w-5xl px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-12 text-center"
        >
          <button
            onClick={() => router.push(`/${locale}`)}
            className="mb-6 inline-block text-sm text-text-muted transition-colors hover:text-bitcoin"
          >
            &larr; {t("results.back")}
          </button>

          <div className="badge-orange mx-auto mb-4 w-fit">
            {locale === "es" ? "Tu Reporte de Inflaci\u00f3n \uD83D\uDCCA" : "Your Inflation Report \uD83D\uDCCA"}
          </div>

          <h1 className="font-[var(--font-heading)] text-3xl font-extrabold text-text-heading sm:text-4xl">
            {t("results.title")}
          </h1>
        </motion.div>

        {/* Components stacked vertically */}
        <div className="flex flex-col gap-8">
          <LiveTicker
            lossPerSecond={results.lossPerSecond}
            country={country}
          />

          <LifetimeLossCard
            lifetimeLoss={results.lifetimeLoss}
            birthYear={birthYear}
            country={country}
          />

          <YearlyChart
            yearlyBreakdown={results.yearlyBreakdown}
            birthYear={birthYear}
            monthlyIncome={income}
            country={country}
          />

          <LossCards
            dailyLoss={results.dailyLoss}
            monthlyLoss={results.monthlyLoss}
            yearlyLoss={results.yearlyLoss}
            country={country}
          />

          <ComparisonCards
            monthlyIncome={income}
            incomeAtBirth={results.incomeAtBirth}
            birthIncomeToday={results.birthIncomeToday}
            country={country}
          />

          <LocalPriceCard
            country={country}
            region={country === "US" ? "los-angeles" : country === "MX" ? "cdmx" : country === "SV" ? "san-salvador" : country === "AR" ? "buenos-aires" : undefined}
            currencySymbol={COUNTRIES[country]?.currencySymbol || "$"}
          />

          <CountryContext country={country} />

          <ReactionBar country={country} />

          <ShareButtons
            lifetimeLoss={results.lifetimeLoss}
            dailyLoss={results.dailyLoss}
            country={country}
            age={age}
          />

          {/* Dashboard CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="overflow-hidden rounded-2xl p-6 text-center text-white shadow-lg sm:p-8"
            style={{
              background: "linear-gradient(135deg, #F7931A 0%, #FFB347 100%)",
            }}
          >
            <h3 className="mb-2 font-[var(--font-heading)] text-xl font-bold">
              {locale === "es"
                ? "Rastrea tu dinero, protege tu futuro"
                : "Track your money, protect your future"}
            </h3>
            <p className="mb-4 text-sm text-white/80">
              {locale === "es"
                ? "Ve tu panel personalizado con gastos, simulador Bitcoin y m\u00e1s"
                : "See your personalized dashboard with expenses, Bitcoin simulator, and more"}
            </p>
            <a
              href={`/${locale}/dashboard`}
              className="inline-block rounded-xl bg-white px-6 py-3 text-sm font-bold text-bitcoin transition-transform hover:scale-105"
            >
              {locale === "es" ? "Ver Mi Panel \u2192" : "View My Dashboard \u2192"}
            </a>
          </motion.div>

          <CtaSection />

          <SmartRecommendation country={country} modulesCompleted={0} />

          <NewsletterCTA source="results" />
        </div>
      </div>
    </main>
  );
}

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-bg-primary">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-bitcoin border-t-transparent" />
        </div>
      }
    >
      <ResultsContent />
    </Suspense>
  );
}
