"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useI18n, useCurrentLocale } from "@/locales/client";
import { Suspense } from "react";
import { motion } from "framer-motion";
import { calculateInflation } from "@/lib/calculations";
import { CountryCode } from "@/data/inflation";
import { saveUserData } from "@/lib/user-context";
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
import { trackEvent } from "@/lib/analytics";

function ResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = useI18n();
  const locale = useCurrentLocale();

  const country = (searchParams.get("country") || "US") as CountryCode;
  const age = parseInt(searchParams.get("age") || "30", 10);
  const income = parseFloat(searchParams.get("income") || "5000");

  const currentYear = new Date().getFullYear();
  const birthYear = currentYear - age;

  const results = calculateInflation(birthYear, country, income);

  // Persist user data for the education platform + track analytics
  if (typeof window !== "undefined") {
    saveUserData({ country, age, income, birthYear });
    trackEvent("inflation_clock_result", {
      country,
      age,
      income,
      lifetime_loss: results.lifetimeLoss,
      daily_loss: results.dailyLoss,
    });
  }

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

          <CountryContext country={country} />

          <ReactionBar country={country} />

          <ShareButtons
            lifetimeLoss={results.lifetimeLoss}
            dailyLoss={results.dailyLoss}
            country={country}
            age={age}
          />

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
