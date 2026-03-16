"use client";

import { useState, useEffect } from "react";
import { useI18n, useCurrentLocale } from "@/locales/client";
import { AnimatePresence } from "framer-motion";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { YearlyBreakdown, calculateBtcOverlay } from "@/lib/calculations";
import { fetchBtcPrices } from "@/lib/bitcoin";
import { CountryCode, COUNTRIES } from "@/data/inflation";

interface YearlyChartProps {
  yearlyBreakdown: YearlyBreakdown[];
  birthYear: number;
  monthlyIncome: number;
  country: CountryCode;
}

export function YearlyChart({
  yearlyBreakdown,
  birthYear,
  monthlyIncome,
  country,
}: YearlyChartProps) {
  const t = useI18n();
  const locale = useCurrentLocale();
  const [showBtc, setShowBtc] = useState(false);
  const [btcOverlay, setBtcOverlay] = useState<{ year: number; btcValue: number; totalInvested: number }[]>([]);
  const { currencySymbol } = COUNTRIES[country];

  useEffect(() => {
    if (showBtc && btcOverlay.length === 0) {
      fetchBtcPrices().then((prices) => {
        const overlay = calculateBtcOverlay(birthYear, monthlyIncome, prices);
        setBtcOverlay(overlay);
      });
    }
  }, [showBtc, btcOverlay.length, birthYear, monthlyIncome]);

  const chartData = yearlyBreakdown.map((point, i) => ({
    year: point.year,
    purchasingPower: Number((point.purchasingPower * 100).toFixed(2)),
    ...(showBtc && btcOverlay[i]
      ? {
          btcValue: Math.round(btcOverlay[i].btcValue),
        }
      : {}),
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="mx-auto w-full max-w-4xl rounded-[20px] border border-border-light bg-bg-card p-6 shadow-lg sm:p-8"
    >
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <h2 className="font-[var(--font-heading)] text-xl font-bold text-text-heading">{t("chart.title")}</h2>
        <label className="flex cursor-pointer items-center gap-3">
          <span className="text-sm text-text-secondary">
            {t("chart.btcToggle")}
          </span>
          <div className="relative">
            <input
              type="checkbox"
              checked={showBtc}
              onChange={() => setShowBtc(!showBtc)}
              className="peer sr-only"
            />
            <div className="h-6 w-11 rounded-full bg-[#F3F0EB] transition-colors peer-checked:bg-positive" />
            <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
          </div>
        </label>
      </div>

      <AnimatePresence>
        {showBtc && btcOverlay.length > 0 && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 text-center text-sm font-medium text-positive"
          >
            {locale === "es" ? "As\u00ed se ve el dinero s\u00f3lido \u2728" : "This is what sound money looks like \u2728"}
          </motion.p>
        )}
      </AnimatePresence>

      <ResponsiveContainer width="100%" height={400}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="gradientRed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#FF6B6B" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#FF6B6B" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradientBtc" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2EC4B6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#2EC4B6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(229, 221, 211, 0.5)" />
          <XAxis
            dataKey="year"
            stroke="#9CA3AF"
            tick={{ fill: "#9CA3AF", fontSize: 12 }}
          />
          <YAxis
            yAxisId="left"
            stroke="#9CA3AF"
            tick={{ fill: "#9CA3AF", fontSize: 12 }}
            tickFormatter={(val: number) => `${val}%`}
            label={{
              value: t("chart.purchasingPower"),
              angle: -90,
              position: "insideLeft",
              fill: "#6B7280",
              fontSize: 12,
            }}
          />
          {showBtc && (
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#2EC4B6"
              tick={{ fill: "#2EC4B6", fontSize: 12 }}
              tickFormatter={(val: number) =>
                val >= 1000000
                  ? `${currencySymbol}${(val / 1000000).toFixed(1)}M`
                  : val >= 1000
                    ? `${currencySymbol}${(val / 1000).toFixed(0)}K`
                    : `${currencySymbol}${val}`
              }
            />
          )}
          <Tooltip
            contentStyle={{
              backgroundColor: "#FFFFFF",
              border: "1px solid rgba(229, 221, 211, 0.5)",
              borderRadius: "12px",
              color: "#2D3047",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
            }}
            formatter={(value, name) => {
              const v = Number(value);
              if (name === "purchasingPower") return [`${v.toFixed(1)}%`, t("chart.purchasingPower")];
              if (name === "btcValue")
                return [`${currencySymbol}${v.toLocaleString()}`, t("chart.btcLabel")];
              return [String(value), String(name)];
            }}
            labelFormatter={(label) => `${t("chart.year")}: ${label}`}
          />
          <Legend
            wrapperStyle={{ color: "#6B7280", fontSize: 12 }}
          />
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="purchasingPower"
            stroke="#FF6B6B"
            fill="url(#gradientRed)"
            strokeWidth={2}
            name={t("chart.purchasingPower")}
          />
          {showBtc && (
            <Area
              yAxisId="right"
              type="monotone"
              dataKey="btcValue"
              stroke="#2EC4B6"
              fill="url(#gradientBtc)"
              strokeWidth={2}
              name={t("chart.btcLabel")}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
