"use client";

import { useEffect, useState, useCallback } from "react";
import { useCurrentLocale } from "@/locales/client";
import { motion } from "framer-motion";
import type {
  BitcoinVitals,
  MacroSignalsData,
  EtfFlowsData,
  NetworkHealthData,
  FearGreedData,
  CorrelationPoint,
} from "@/types/monitor";

import BitcoinVitalsPanel from "@/components/monitor/BitcoinVitalsPanel";
import FearGreedGauge from "@/components/monitor/FearGreedGauge";
import MacroSignalsPanel from "@/components/monitor/MacroSignalsPanel";
import MoneyPrinterPanel from "@/components/monitor/MoneyPrinterPanel";
import EtfTrackerPanel from "@/components/monitor/EtfTrackerPanel";
import CorrelationChartPanel from "@/components/monitor/CorrelationChartPanel";
import NetworkHealthPanel from "@/components/monitor/NetworkHealthPanel";
import AdoptionMapPanel from "@/components/monitor/AdoptionMapPanel";
import Link from "next/link";

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

interface AllMonitorData {
  vitals: BitcoinVitals | null;
  macro: MacroSignalsData | null;
  etfFlows: EtfFlowsData | null;
  network: NetworkHealthData | null;
  fearGreed: FearGreedData | null;
  correlation: CorrelationPoint[];
}

export default function MonitorPage() {
  const locale = useCurrentLocale();
  const [vitals, setVitals] = useState<BitcoinVitals | null>(null);
  const [macro, setMacro] = useState<MacroSignalsData | null>(null);
  const [etfFlows, setEtfFlows] = useState<EtfFlowsData | null>(null);
  const [network, setNetwork] = useState<NetworkHealthData | null>(null);
  const [fearGreed, setFearGreed] = useState<FearGreedData | null>(null);
  const [correlation, setCorrelation] = useState<CorrelationPoint[]>([]);
  const [cpiRate, setCpiRate] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      // Single API call fetches all data — eliminates 6 roundtrips and deduplicates upstream calls
      const [monitorRes, inflationRes] = await Promise.allSettled([
        fetch("/api/bitcoin-monitor?type=all"),
        fetch("/api/inflation"),
      ]);

      if (monitorRes.status === "fulfilled" && monitorRes.value.ok) {
        const data: AllMonitorData = await monitorRes.value.json();
        if (data.vitals) setVitals(data.vitals);
        if (data.macro) setMacro(data.macro);
        if (data.etfFlows) setEtfFlows(data.etfFlows);
        if (data.network) setNetwork(data.network);
        if (data.fearGreed) setFearGreed(data.fearGreed);
        if (data.correlation) setCorrelation(data.correlation);
      }

      if (inflationRes.status === "fulfilled" && inflationRes.value.ok) {
        const infData = await inflationRes.value.json();
        if (infData.rate) setCpiRate(parseFloat(infData.rate));
      }
    } catch {
      /* graceful degradation — panels show individual fallbacks */
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12">
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="flex flex-col gap-6"
      >
        {/* Header */}
        <motion.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="font-[var(--font-heading)] text-2xl font-extrabold text-text-heading sm:text-3xl">
              {locale === "es" ? "Monitor Bitcoin" : "Bitcoin Monitor"}
              <span className="ml-2 text-base" role="img" aria-label="satellite">
                📡
              </span>
            </h1>
            <p className="mt-1 text-sm text-text-muted">
              {locale === "es"
                ? "Inteligencia de mercado en tiempo real para entender Bitcoin"
                : "Real-time market intelligence to understand Bitcoin"}
            </p>
          </div>
          <Link
            href={`/${locale}/learn`}
            className="btn-secondary inline-flex shrink-0 items-center justify-center whitespace-nowrap px-4 py-2 text-sm"
          >
            {locale === "es" ? "Aprender mas" : "Learn more"} →
          </Link>
        </motion.div>

        {/* Row 1: Vitals + Fear & Greed */}
        <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            <BitcoinVitalsPanel initial={vitals} locale={locale} />
          </div>
          <div className="lg:col-span-4">
            <div className="card-warm rounded-2xl p-6 flex flex-col items-center justify-center h-full">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">
                {locale === "es" ? "Miedo y Codicia" : "Fear & Greed"}
              </h3>
              {loading ? (
                <div className="h-[120px] w-[120px] animate-pulse rounded-full bg-border/30" />
              ) : (
                <FearGreedGauge
                  value={fearGreed?.value ?? null}
                  label={fearGreed?.label}
                />
              )}
              <p className="mt-3 text-[10px] text-text-muted text-center">
                {locale === "es"
                  ? "Sentimiento del mercado de las ultimas 24h"
                  : "Market sentiment over the last 24h"}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Row 2: Macro Signals */}
        <motion.div variants={fadeUp}>
          {loading ? (
            <div className="card-warm rounded-2xl p-6 h-64 animate-pulse">
              <div className="h-4 w-32 rounded bg-border/30 mb-4" />
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-24 rounded-xl bg-border/30" />
                ))}
              </div>
            </div>
          ) : (
            <MacroSignalsPanel data={macro} locale={locale} />
          )}
        </motion.div>

        {/* Row 3: Money Printer + ETF Tracker */}
        <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MoneyPrinterPanel
            m2Value={correlation.length > 0 ? correlation[correlation.length - 1]?.m2Supply : undefined}
            cpiRate={cpiRate}
            locale={locale}
          />
          {loading ? (
            <div className="card-warm rounded-2xl p-6 animate-pulse">
              <div className="h-4 w-32 rounded bg-border/30 mb-4" />
              <div className="h-48 rounded-xl bg-border/30" />
            </div>
          ) : (
            <EtfTrackerPanel data={etfFlows} locale={locale} />
          )}
        </motion.div>

        {/* Row 4: Correlation Chart + Network Health */}
        <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            <CorrelationChartPanel data={correlation} locale={locale} />
          </div>
          <div className="lg:col-span-4">
            <NetworkHealthPanel data={network} locale={locale} />
          </div>
        </motion.div>

        {/* Row 5: Adoption Map */}
        <motion.div variants={fadeUp}>
          <AdoptionMapPanel locale={locale} />
        </motion.div>

        {/* Educational CTA */}
        <motion.div variants={fadeUp} className="card-warm rounded-2xl p-6 text-center">
          <p className="font-[var(--font-heading)] text-lg font-bold text-text-heading">
            {locale === "es"
              ? "¿Quieres entender que significan estos datos?"
              : "Want to understand what this data means?"}
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            {locale === "es"
              ? "Nuestros modulos de aprendizaje te explican todo, paso a paso."
              : "Our learning modules explain it all, step by step."}
          </p>
          <Link
            href={`/${locale}/learn`}
            className="btn-primary mt-4 inline-flex items-center justify-center px-6 py-3 text-base"
          >
            {locale === "es" ? "Empezar a Aprender" : "Start Learning"}
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
