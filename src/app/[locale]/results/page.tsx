"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useI18n, useCurrentLocale } from "@/locales/client";
import { Suspense, useEffect, useRef, useState, useMemo } from "react";
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
import { CtaSection } from "@/components/results/CtaSection";
import { ShareButtons } from "@/components/share/ShareButtons";
import { ReactionBar } from "@/components/social/ReactionBar";
import { SmartRecommendation } from "@/components/SmartRecommendation";
import { LocalPriceCard } from "@/components/results/LocalPriceCard";
import { trackEvent } from "@/lib/analytics";
import { BitcoinShieldPanel } from "@/components/BitcoinShieldPanel";
import { fetchFredCpiRate, FredCpiResult } from "@/lib/fred";

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

  const [fredData, setFredData] = useState<FredCpiResult | null>(null);

  useEffect(() => {
    if (country !== "US") return;
    fetchFredCpiRate().then(setFredData);
  }, [country]);

  const rateOverrides = useMemo(() => {
    if (country !== "US" || !fredData || fredData.source !== "fred") return undefined;
    return { [currentYear]: fredData.rate };
  }, [country, fredData, currentYear]);

  const results = useMemo(
    () => calculateInflation(birthYear, country, income, rateOverrides),
    [birthYear, country, income, rateOverrides]
  );

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

  useEffect(() => {
    if (results.lifetimeLoss > 0) {
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(results.lifetimeLoss);
      document.title = locale === "es"
        ? `Perdiste ${formatted} | The Inflation Clock`
        : `You lost ${formatted} | The Inflation Clock`;
    }
  }, [results.lifetimeLoss, locale]);

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

          {fredData?.source === "fred" && (
            <div className="text-center">
              <span className="inline-block rounded-full bg-positive/10 px-3 py-1 text-xs font-medium text-positive">
                Live CPI: {fredData.rate.toFixed(2)}% YoY (FRED • as of {fredData.asOf})
              </span>
            </div>
          )}

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

          <BitcoinShieldPanel
            monthlyIncome={income}
            currentAge={age}
            country={country}
            inflationLossTotal={results.lifetimeLoss}
          />

          <CtaSection />

          <SmartRecommendation country={country} modulesCompleted={0} />

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
