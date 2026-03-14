"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  AreaChart,
  Area,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useI18n, useCurrentLocale } from "@/locales/client";
import { CountryCode } from "@/data/inflation";
import { calculateBitcoinScenarios } from "@/lib/bitcoinCalc";
import { btcPriceHistory } from "@/lib/btcPriceHistory";
import { useCountUp } from "@/hooks/useCountUp";

const BitcoinCoin = dynamic(() => import("./three/BitcoinCoin"), { ssr: false });

function formatUSD(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}K`;
  return `$${Math.round(value).toLocaleString()}`;
}

function formatUSDFull(value: number): string {
  return `$${Math.round(value).toLocaleString()}`;
}

// Inline SVG arrow icon
function TrendUpIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}

interface BitcoinShieldPanelProps {
  monthlyIncome: number;
  currentAge: number;
  country: CountryCode;
  inflationLossTotal: number;
}

export function BitcoinShieldPanel({
  monthlyIncome,
  currentAge,
  country,
}: BitcoinShieldPanelProps) {
  const t = useI18n();
  const locale = useCurrentLocale();
  const shouldReduceMotion = useReducedMotion();

  const calc = useMemo(
    () => calculateBitcoinScenarios(monthlyIncome, currentAge, country as string),
    [monthlyIncome, currentAge, country]
  );

  const { scenarios, cashSavingsToday, bestScenario, spinSpeed } = calc;

  // 2019 scenario for Big Comparison
  const scenario2019 = scenarios.find((s) => s.year === 2019) ?? bestScenario;

  // Animated coin counter
  const animatedValue = useCountUp(bestScenario.currentValue, 1500, true);

  const isElSalvador = country === "SV";

  // El Salvador 2021 special scenario
  const sv2021Scenario = useMemo(() => {
    if (!isElSalvador) return null;
    const yearsInvesting = 2025 - 2021;
    const amountPerMonth = monthlyIncome * 0.10;
    const totalInvested = amountPerMonth * yearsInvesting * 12;
    const btcAccumulated = (amountPerMonth * 12 * 4) / 47000;
    const currentValue = btcAccumulated * 84000;
    const returnMultiple = totalInvested > 0 ? currentValue / totalInvested : 0;
    const roi = totalInvested > 0 ? ((currentValue - totalInvested) / totalInvested) * 100 : 0;
    return { year: 2021, totalInvested, currentValue, returnMultiple, roi, btcAccumulated };
  }, [isElSalvador, monthlyIncome]);

  const fadeIn = shouldReduceMotion
    ? {}
    : { initial: { opacity: 0, y: 40 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6 } };

  const cardVariants = shouldReduceMotion
    ? {}
    : {
        initial: { opacity: 0, x: 30 },
        whileInView: { opacity: 1, x: 0 },
        viewport: { once: true },
      };

  return (
    <motion.div
      id="bitcoin-shield"
      {...fadeIn}
      className="relative overflow-hidden rounded-3xl"
      style={{
        background: "linear-gradient(135deg, #0f0c0a 0%, #1a1008 50%, #0f0c0a 100%)",
        boxShadow: "0 0 60px rgba(247,147,26,0.15), 0 0 120px rgba(247,147,26,0.05)",
      }}
    >
      {/* Background glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(247,147,26,0.12) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 p-6 sm:p-10">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-3 inline-block rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-orange-400">
            Bitcoin Shield
          </div>
          <h2 className="mb-3 font-[var(--font-heading)] text-3xl font-extrabold text-white sm:text-4xl">
            {t("bitcoin.shield.title")}
          </h2>
          <p className="mx-auto max-w-xl text-base text-orange-200/70">
            {isElSalvador
              ? t("bitcoin.shield.subtitle.sv")
              : t("bitcoin.shield.subtitle")}
          </p>
        </div>

        {/* 3D Coin */}
        <div className="mb-6 flex flex-col items-center">
          <div className="h-[280px] w-full max-w-sm sm:h-[400px]">
            <BitcoinCoin spinSpeed={spinSpeed} />
          </div>
          <div className="mt-2 text-center">
            <div className="font-[var(--font-heading)] text-4xl font-extrabold text-orange-400 sm:text-5xl">
              {formatUSDFull(animatedValue)}
            </div>
            <p className="mt-1 text-sm text-orange-200/60">
              {t("bitcoin.shield.coinLabel", { year: String(bestScenario.year) })}
            </p>
          </div>
        </div>

        {/* Scenario Cards */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row">
          {scenarios.map((scenario, i) => {
            const isBest = scenario.year === bestScenario.year;
            return (
              <motion.div
                key={scenario.year}
                {...(shouldReduceMotion
                  ? {}
                  : {
                      ...cardVariants,
                      transition: { duration: 0.4, delay: i * 0.1 },
                    })}
                className="group relative flex-1 cursor-default rounded-2xl border p-5 transition-all duration-200"
                style={{
                  background: isBest
                    ? "linear-gradient(135deg, rgba(255,215,0,0.08) 0%, rgba(247,147,26,0.06) 100%)"
                    : "rgba(255,255,255,0.03)",
                  borderColor: isBest ? "#ffd700" : "rgba(247,147,26,0.2)",
                  boxShadow: isBest ? "0 0 20px rgba(255,215,0,0.15)" : "none",
                }}
                whileHover={shouldReduceMotion ? undefined : { borderColor: "#f7931a", scale: 1.02 }}
              >
                {isBest && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-yellow-400/50 bg-yellow-900/60 px-3 py-0.5 text-xs font-bold text-yellow-300">
                    {t("bitcoin.shield.bestEntry")} 🏆
                  </div>
                )}

                <div className="mb-3 flex items-center justify-between">
                  <span className="rounded-lg bg-orange-500/15 px-2.5 py-1 text-xs font-bold text-orange-300">
                    {t("bitcoin.shield.boughtIn", { year: String(scenario.year) })}
                  </span>
                  <span className="flex items-center gap-1 text-green-400">
                    <TrendUpIcon />
                  </span>
                </div>

                <div className="mb-1 text-sm text-white/50">
                  {t("bitcoin.shield.totalInvested")}:{" "}
                  <span className="text-white/80">{formatUSD(scenario.totalInvested)}</span>
                </div>

                <div className="mb-2 text-sm text-white/50">
                  {t("bitcoin.shield.currentValue")}:{" "}
                  <span className="font-bold text-green-400">{formatUSD(scenario.currentValue)}</span>
                </div>

                <div className="mb-1 text-3xl font-extrabold text-orange-400">
                  {scenario.returnMultiple.toFixed(1)}x
                </div>
                <div className="text-xs text-white/40">
                  {t("bitcoin.shield.return")} &nbsp;·&nbsp; {t("bitcoin.shield.roi")}:{" "}
                  <span className="text-green-400/80">{scenario.roi.toFixed(0)}%</span>
                </div>
              </motion.div>
            );
          })}

          {/* El Salvador 2021 special card */}
          {isElSalvador && sv2021Scenario && (
            <motion.div
              {...(shouldReduceMotion
                ? {}
                : {
                    ...cardVariants,
                    transition: { duration: 0.4, delay: 0.35 },
                  })}
              className="relative flex-1 rounded-2xl border border-blue-500/30 p-5"
              style={{
                background:
                  "linear-gradient(135deg, rgba(0,80,200,0.08) 0%, rgba(0,140,255,0.04) 100%)",
              }}
            >
              <div className="mb-3 flex items-center gap-2">
                <span className="text-lg">🇸🇻</span>
                <span className="rounded-lg bg-blue-500/15 px-2.5 py-1 text-xs font-bold text-blue-300">
                  {t("bitcoin.shield.svCard")}
                </span>
              </div>
              <p className="mb-3 text-xs text-blue-300/60">{t("bitcoin.shield.svNote")}</p>

              <div className="mb-1 text-sm text-white/50">
                {t("bitcoin.shield.totalInvested")}:{" "}
                <span className="text-white/80">{formatUSD(sv2021Scenario.totalInvested)}</span>
              </div>
              <div className="mb-2 text-sm text-white/50">
                {t("bitcoin.shield.currentValue")}:{" "}
                <span className="font-bold text-green-400">{formatUSD(sv2021Scenario.currentValue)}</span>
              </div>
              <div className="mb-1 text-3xl font-extrabold text-orange-400">
                {sv2021Scenario.returnMultiple.toFixed(1)}x
              </div>
              <div className="text-xs text-white/40">
                {t("bitcoin.shield.roi")}:{" "}
                <span className="text-green-400/80">{sv2021Scenario.roi.toFixed(0)}%</span>
              </div>
            </motion.div>
          )}
        </div>

        {/* BTC Price History Sparkline */}
        <div className="mb-8 overflow-hidden rounded-2xl border border-orange-500/15 bg-white/3 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-orange-400/60">
            Bitcoin Price History
          </p>
          <div className="h-[100px] sm:h-[120px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={btcPriceHistory} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
                <defs>
                  <linearGradient id="btcGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f7931a" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#f7931a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Tooltip
                  contentStyle={{
                    background: "#1a1008",
                    border: "1px solid rgba(247,147,26,0.3)",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                  formatter={(value) => [`$${Number(value).toLocaleString()}`, "BTC Price"]}
                  labelFormatter={(label) => `Year: ${label}`}
                />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke="#f7931a"
                  strokeWidth={2}
                  fill="url(#btcGradient)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Big Comparison */}
        <div className="mb-8 overflow-hidden rounded-2xl border border-orange-500/15 bg-white/3 p-6">
          <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
            {/* Cash side */}
            <div className="flex-1 rounded-xl bg-red-950/30 p-4 text-center">
              <p className="mb-1 text-xs font-semibold text-red-400/80">
                {t("bitcoin.shield.cashLabel")}
              </p>
              <p className="text-2xl font-extrabold text-red-400">
                {formatUSD(cashSavingsToday)}
              </p>
            </div>

            {/* VS */}
            <div
              className="flex shrink-0 items-center justify-center text-2xl font-extrabold text-orange-400"
              style={{ textShadow: "0 0 20px rgba(247,147,26,0.8)" }}
            >
              VS
            </div>

            {/* BTC side */}
            <div className="flex-1 rounded-xl bg-green-950/30 p-4 text-center">
              <p className="mb-1 text-xs font-semibold text-green-400/80">
                {t("bitcoin.shield.btcLabel")}
              </p>
              <p className="text-2xl font-extrabold text-green-400">
                {formatUSD(scenario2019.currentValue)}
              </p>
            </div>
          </div>

          <p className="mt-5 text-center text-base font-bold text-white/80">
            {t("bitcoin.shield.summary", {
              invested: formatUSD(scenario2019.totalInvested),
              cash: formatUSD(cashSavingsToday),
              btc: formatUSD(scenario2019.currentValue),
            })}
          </p>
        </div>

        {/* El Salvador learn link */}
        {isElSalvador && (
          <div className="mb-6 text-center">
            <a
              href={`/${locale}/learn`}
              className="inline-flex items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-5 py-2.5 text-sm font-semibold text-blue-300 transition-all hover:border-blue-400/50 hover:bg-blue-500/20"
            >
              {t("bitcoin.shield.learnSv")}
            </a>
          </div>
        )}

        {/* Disclaimer */}
        <p className="text-center text-xs text-white/25">
          {t("bitcoin.shield.disclaimer")}
        </p>
      </div>
    </motion.div>
  );
}
