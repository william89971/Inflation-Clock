"use client";

import { useParams, useRouter } from "next/navigation";
import { useCurrentLocale } from "@/locales/client";
import { motion } from "framer-motion";
import { calculateInflation, formatCurrency } from "@/lib/calculations";
import { COUNTRIES, CountryCode, INFLATION_RATES } from "@/data/inflation";

const COUNTRY_NAMES: Record<CountryCode, string> = {
  US: "United States",
  SV: "El Salvador",
  MX: "Mexico",
  AR: "Argentina",
  BR: "Brazil",
  CO: "Colombia",
  VE: "Venezuela",
};

const COUNTRY_CONTEXTS: Record<CountryCode, string> = {
  US: "The US dollar has lost over 96% of its purchasing power since the Federal Reserve was created in 1913. Your savings are melting away \u2014 and the money printer hasn\u2019t stopped.",
  SV: "El Salvador used the col\u00f3n until 2001, when it dollarized. But the US dollar itself has been losing purchasing power. Since adopting Bitcoin as legal tender in 2021, El Salvador has offered its citizens a way out of the inflation trap.",
  MX: "Mexico has experienced devastating inflation crises \u2014 the peso lost 99.9% of its value between 1970 and 1993, leading to the creation of the \u2018nuevo peso.\u2019 Inflation continues to erode Mexican purchasing power year after year.",
  AR: "Argentina has lived through hyperinflation multiple times. The peso has been redenominated repeatedly, losing 13 zeros since 1970. Annual inflation regularly exceeds 100%. Argentines know better than anyone: fiat money fails.",
  BR: "Brazil changed its currency 8 times in the 20th century due to hyperinflation. The real, introduced in 1994, has already lost significant purchasing power. Brazilian workers watch their wages evaporate.",
  CO: "Colombia\u2019s peso has steadily depreciated over decades. What cost 1 peso in 1970 costs over 17,000 pesos today. The inflation tax hits the poorest the hardest.",
  VE: "Venezuela\u2019s bol\u00edvar has experienced one of the worst hyperinflation episodes in human history \u2014 reaching over 1,000,000% annually. The currency has been redenominated 3 times, removing 14 zeros. Venezuela is the ultimate cautionary tale of fiat money.",
};

function getLatestRate(country: CountryCode): number {
  const rates = INFLATION_RATES[country];
  const years = Object.keys(rates).map(Number).sort((a, b) => b - a);
  return rates[years[0]];
}

export function CountryPage() {
  const params = useParams();
  const router = useRouter();
  const locale = useCurrentLocale();

  const countryCode = (params.country as string).toUpperCase() as CountryCode;

  if (!COUNTRIES[countryCode]) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center">
        <p className="text-text-muted">Country not found</p>
        <button
          onClick={() => router.push(`/${locale}`)}
          className="mt-4 text-bitcoin hover:underline"
        >
          Go to Inflation Clock
        </button>
      </main>
    );
  }

  const countryName = COUNTRY_NAMES[countryCode];
  const countryConfig = COUNTRIES[countryCode];
  const currentYear = new Date().getFullYear();
  const latestRate = getLatestRate(countryCode);

  // Calculate stats for a representative 30-year-old
  const results = calculateInflation(currentYear - 30, countryCode, 5000);

  // Calculate cumulative inflation over the last 10 years
  const tenYearStart = currentYear - 10;
  const tenYearResults = calculateInflation(tenYearStart, countryCode, 1000);

  return (
    <main className="min-h-screen pb-20 pt-24">
      <div className="mx-auto max-w-4xl px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <button
            onClick={() => router.push(`/${locale}`)}
            className="mb-6 inline-block text-sm text-text-muted transition-colors hover:text-text-primary"
          >
            &larr; Back to Inflation Clock
          </button>
          <h1 className="mb-4 text-4xl font-extrabold sm:text-5xl">
            Inflation in{" "}
            <span className="text-bitcoin">{countryName}</span>{" "}
            {currentYear}
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-text-secondary">
            See how inflation has eroded purchasing power in {countryName} and
            what it means for your money.
          </p>
        </motion.div>

        {/* Key Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-12 grid gap-4 sm:grid-cols-3"
        >
          <div className="rounded-2xl border border-border bg-surface-card p-6 text-center">
            <p className="mb-1 text-sm text-text-muted">
              Current Annual Rate
            </p>
            <p className="text-3xl font-extrabold text-blood">
              {latestRate.toFixed(1)}%
            </p>
            <p className="mt-1 text-xs text-text-muted">{currentYear}</p>
          </div>

          <div className="rounded-2xl border border-border bg-surface-card p-6 text-center">
            <p className="mb-1 text-sm text-text-muted">
              10-Year Cumulative
            </p>
            <p className="text-3xl font-extrabold text-blood">
              {tenYearResults.totalCumulativeInflation.toFixed(0)}%
            </p>
            <p className="mt-1 text-xs text-text-muted">
              Since {tenYearStart}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-surface-card p-6 text-center">
            <p className="mb-1 text-sm text-text-muted">
              Purchasing Power of {countryConfig.currencySymbol}1
            </p>
            <p className="text-3xl font-extrabold text-blood">
              {countryConfig.currencySymbol}
              {results.currentPurchasingPower.toFixed(2)}
            </p>
            <p className="mt-1 text-xs text-text-muted">
              vs. 30 years ago
            </p>
          </div>
        </motion.div>

        {/* Country Context */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-12 rounded-2xl border border-border bg-surface-card p-8"
        >
          <h2 className="mb-4 text-2xl font-bold">
            The Bigger Picture
          </h2>
          <p className="text-text-secondary leading-relaxed">
            {COUNTRY_CONTEXTS[countryCode]}
          </p>
        </motion.div>

        {/* Quick Calculator Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mb-12 rounded-2xl border border-border bg-surface-card p-8"
        >
          <h2 className="mb-4 text-2xl font-bold">
            What Does This Mean For You?
          </h2>
          <p className="mb-6 text-text-secondary">
            If you are 30 years old earning{" "}
            {formatCurrency(5000, countryCode)}/month in {countryName}:
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-surface p-4">
              <p className="text-sm text-text-muted">Daily Loss to Inflation</p>
              <p className="text-xl font-bold text-blood">
                {formatCurrency(results.dailyLoss, countryCode)}
              </p>
            </div>
            <div className="rounded-xl bg-surface p-4">
              <p className="text-sm text-text-muted">
                Monthly Loss to Inflation
              </p>
              <p className="text-xl font-bold text-blood">
                {formatCurrency(results.monthlyLoss, countryCode)}
              </p>
            </div>
            <div className="rounded-xl bg-surface p-4">
              <p className="text-sm text-text-muted">
                Yearly Loss to Inflation
              </p>
              <p className="text-xl font-bold text-blood">
                {formatCurrency(results.yearlyLoss, countryCode)}
              </p>
            </div>
            <div className="rounded-xl bg-surface p-4">
              <p className="text-sm text-text-muted">
                Lifetime Purchasing Power Lost
              </p>
              <p className="text-xl font-bold text-blood">
                {formatCurrency(results.lifetimeLoss, countryCode)}
              </p>
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center"
        >
          <h2 className="mb-4 text-2xl font-bold">
            Calculate Your Personal Inflation Damage
          </h2>
          <p className="mb-6 text-text-secondary">
            Enter your age, country, and income to see exactly how much
            inflation has stolen from you.
          </p>
          <button
            onClick={() =>
              router.push(
                `/${locale}?country=${countryCode}`
              )
            }
            className="rounded-full bg-bitcoin px-8 py-4 text-lg font-bold text-white transition-transform hover:scale-105"
          >
            See My Inflation Damage
          </button>
        </motion.div>
      </div>
    </main>
  );
}
