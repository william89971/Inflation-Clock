"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useCurrentLocale } from "@/locales/client";
import { motion } from "framer-motion";
import {
  simulateDCA,
  DCASimulation,
  getDailyComparison,
} from "@/lib/dca-calculations";
import { fetchProfile, UserProfile } from "@/lib/profile";
import { formatCurrency } from "@/lib/calculations";
import { formatSats } from "@/lib/sats";
import { CountryCode } from "@/data/inflation";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// ── Animation variants ──────────────────────────────────────────────
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

// ── Time-period options ─────────────────────────────────────────────
const PERIOD_OPTIONS = [
  { months: 12, en: "1 yr", es: "1 a\u00f1o" },
  { months: 36, en: "3 yr", es: "3 a\u00f1os" },
  { months: 60, en: "5 yr", es: "5 a\u00f1os" },
  { months: 120, en: "10 yr", es: "10 a\u00f1os" },
];

// ── Component ───────────────────────────────────────────────────────
export default function SimulatorPage() {
  const locale = useCurrentLocale();
  const isEs = locale === "es";

  // Profile state
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Input state
  const [monthlyIncome, setMonthlyIncome] = useState(3000);
  const [percentage, setPercentage] = useState(5);
  const [months, setMonths] = useState(60);

  // Simulation result
  const [simulation, setSimulation] = useState<DCASimulation | null>(null);
  const [simulating, setSimulating] = useState(false);

  const country: CountryCode = (profile?.country_code as CountryCode) || "US";

  // ── Derived values ──────────────────────────────────────────────
  const dcaAmount = useMemo(
    () => Math.round(monthlyIncome * (percentage / 100)),
    [monthlyIncome, percentage]
  );

  const dailyAmount = useMemo(() => dcaAmount / 30, [dcaAmount]);

  const dailyComparison = useMemo(
    () => getDailyComparison(country),
    [country]
  );

  // ── Fetch profile on mount ────────────────────────────────────────
  useEffect(() => {
    async function load() {
      const p = await fetchProfile();
      if (p) {
        setProfile(p);
        if (p.monthly_income && p.monthly_income > 0) {
          setMonthlyIncome(p.monthly_income);
        }
      }
      setLoading(false);
    }
    load();
  }, []);

  // ── Run simulation when params change (debounced) ─────────────────
  const runSimulation = useCallback(async () => {
    if (dcaAmount <= 0) return;
    setSimulating(true);
    try {
      const result = await simulateDCA(dcaAmount, months);
      setSimulation(result);
    } catch {
      // silently fail
    } finally {
      setSimulating(false);
    }
  }, [dcaAmount, months]);

  useEffect(() => {
    if (loading) return;
    const timer = setTimeout(() => {
      runSimulation();
    }, 400);
    return () => clearTimeout(timer);
  }, [runSimulation, loading]);

  // ── Chart data from bitcoin.monthly_breakdown ─────────────────────
  const chartData = useMemo(() => {
    if (!simulation) return [];
    return simulation.bitcoin.monthly_breakdown.map((m) => ({
      date: m.date,
      portfolio: Math.round(m.portfolio_value),
      invested: Math.round(m.total_invested),
    }));
  }, [simulation]);

  // ── Loading spinner ───────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-bitcoin border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="flex flex-col gap-8"
      >
        {/* ── Header ─────────────────────────────────────────── */}
        <motion.div variants={fadeUp}>
          <h1 className="font-[var(--font-heading)] text-2xl font-extrabold text-text-heading sm:text-3xl">
            {isEs ? "Simulador de DCA en Bitcoin" : "Bitcoin DCA Simulator"}
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            {isEs
              ? "Descubre qu\u00e9 hubiera pasado si hubieras invertido un poco cada mes."
              : "See what would have happened if you'd invested a little each month."}
          </p>
        </motion.div>

        {/* ── Inputs Card ────────────────────────────────────── */}
        <motion.div variants={fadeUp} className="card-warm rounded-2xl p-6">
          {/* Monthly Income */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-semibold text-text-heading">
              {isEs ? "Ingreso mensual" : "Monthly income"}
            </label>
            <input
              type="number"
              min={0}
              step={100}
              value={monthlyIncome || ""}
              onChange={(e) =>
                setMonthlyIncome(Math.max(0, Number(e.target.value)))
              }
              className="input-warm max-w-xs"
            />
          </div>

          {/* Percentage Slider */}
          <div className="mb-6">
            <div className="mb-2 flex items-baseline justify-between">
              <label className="text-sm font-semibold text-text-heading">
                {isEs ? "Porcentaje a invertir" : "Percentage to invest"}
              </label>
              <span className="font-[var(--font-heading)] text-lg font-bold text-bitcoin">
                {percentage}% = {formatCurrency(dcaAmount, country)}
                <span className="text-sm font-normal text-text-muted">
                  /{isEs ? "mes" : "mo"}
                </span>
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={20}
              step={1}
              value={percentage}
              onChange={(e) => setPercentage(Number(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-full bg-border accent-bitcoin"
            />
            <div className="mt-1 flex justify-between text-xs text-text-muted">
              <span>1%</span>
              <span>20%</span>
            </div>
          </div>

          {/* Time Period Toggle */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-semibold text-text-heading">
              {isEs ? "Periodo de tiempo" : "Time period"}
            </label>
            <div className="flex flex-wrap gap-2">
              {PERIOD_OPTIONS.map((opt) => (
                <button
                  key={opt.months}
                  onClick={() => setMonths(opt.months)}
                  className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition-all ${
                    months === opt.months
                      ? "btn-primary shadow-md"
                      : "btn-secondary"
                  }`}
                >
                  {isEs ? opt.es : opt.en}
                </button>
              ))}
            </div>
          </div>

          {/* Daily Latte Framing */}
          <div className="rounded-xl bg-bitcoin-soft px-4 py-3">
            <p className="text-sm text-text-secondary">
              <span className="mr-1">&#x2615;</span>
              {isEs ? "Eso es aproximadamente " : "That's about "}
              <span className="font-semibold text-bitcoin">
                {formatCurrency(dailyAmount, country)}
              </span>
              {isEs ? "/d\u00eda" : "/day"} &mdash;{" "}
              <span className="italic">
                {isEs ? dailyComparison.es : dailyComparison.en}
              </span>
            </p>
          </div>
        </motion.div>

        {/* ── Simulation Loading ──────────────────────────────── */}
        {simulating && !simulation && (
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-bitcoin border-t-transparent" />
          </div>
        )}

        {/* ── Results ────────────────────────────────────────── */}
        {simulation && (
          <>
            {/* 3-Column Comparison Cards */}
            <motion.div
              variants={fadeUp}
              className="grid grid-cols-1 gap-4 sm:grid-cols-3"
            >
              {/* Under the Mattress */}
              <motion.div
                variants={fadeUp}
                className="stat-card rounded-2xl p-6"
              >
                <div className="mb-3 text-2xl">&#x1F6CF;&#xFE0F;</div>
                <h3 className="mb-1 text-sm font-semibold text-text-muted">
                  {isEs ? "Bajo el colch\u00f3n" : "Under the Mattress"}
                </h3>
                <p className="font-[var(--font-heading)] text-xl font-bold text-text-heading">
                  {formatCurrency(simulation.mattress.real_value, country)}
                </p>
                <p className="mt-1 text-xs text-text-muted">
                  {isEs ? "Valor real (ajustado)" : "Real value (adjusted)"}
                </p>
                <div className="mt-3 rounded-lg bg-negative-light px-3 py-2">
                  <p className="text-sm font-semibold text-negative">
                    -{formatCurrency(simulation.mattress.purchasing_power_lost, country)}
                  </p>
                  <p className="text-xs text-negative/70">
                    {isEs
                      ? "Poder adquisitivo perdido"
                      : "Purchasing power lost"}
                  </p>
                </div>
              </motion.div>

              {/* Savings Account */}
              <motion.div
                variants={fadeUp}
                className="stat-card rounded-2xl p-6"
              >
                <div className="mb-3 text-2xl">&#x1F3E6;</div>
                <h3 className="mb-1 text-sm font-semibold text-text-muted">
                  {isEs ? "Cuenta de ahorro (0.5%)" : "Savings Account (0.5% APY)"}
                </h3>
                <p className="font-[var(--font-heading)] text-xl font-bold text-text-heading">
                  {formatCurrency(simulation.savings_account.nominal_value, country)}
                </p>
                <p className="mt-1 text-xs text-text-muted">
                  {isEs ? "Valor nominal" : "Nominal value"}
                </p>
                <div
                  className={`mt-3 rounded-lg px-3 py-2 ${
                    simulation.savings_account.real_gain_loss >= 0
                      ? "bg-positive-light"
                      : "bg-negative-light"
                  }`}
                >
                  <p
                    className={`text-sm font-semibold ${
                      simulation.savings_account.real_gain_loss >= 0
                        ? "text-positive"
                        : "text-negative"
                    }`}
                  >
                    {simulation.savings_account.real_gain_loss >= 0 ? "+" : ""}
                    {formatCurrency(simulation.savings_account.real_gain_loss, country)}
                  </p>
                  <p
                    className={`text-xs ${
                      simulation.savings_account.real_gain_loss >= 0
                        ? "text-positive/70"
                        : "text-negative/70"
                    }`}
                  >
                    {isEs ? "Ganancia/p\u00e9rdida real" : "Real gain/loss"}
                  </p>
                </div>
              </motion.div>

              {/* Bitcoin DCA */}
              <motion.div
                variants={fadeUp}
                className="stat-card rounded-2xl p-6 ring-2 ring-bitcoin/20"
              >
                <div className="mb-3 text-2xl">&#x20BF;</div>
                <h3 className="mb-1 text-sm font-semibold text-bitcoin">
                  Bitcoin DCA
                </h3>
                <p className="font-[var(--font-heading)] text-xl font-bold text-text-heading">
                  {formatCurrency(simulation.bitcoin.current_value, country)}
                </p>
                <p className="mt-1 text-xs text-text-muted">
                  {simulation.bitcoin.total_btc.toFixed(6)} BTC
                </p>
                <p className="mt-0.5 text-xs text-text-muted">
                  {formatSats(Math.round(simulation.bitcoin.total_btc * 1e8))}
                </p>
                <div className="mt-3 rounded-lg bg-positive-light px-3 py-2">
                  <p className="text-sm font-semibold text-positive">
                    +{formatCurrency(simulation.bitcoin.gain_loss_dollar, country)}
                    <span className="ml-1 text-xs">
                      (+{simulation.bitcoin.gain_loss_percent.toFixed(1)}%)
                    </span>
                  </p>
                  <p className="text-xs text-positive/70">
                    {isEs ? "Ganancia total" : "Total gain"}
                  </p>
                </div>
              </motion.div>
            </motion.div>

            {/* ── Area Chart: Portfolio Growth ────────────────── */}
            <motion.div
              variants={fadeUp}
              className="card-warm rounded-2xl p-4 sm:p-6"
            >
              <h3 className="mb-1 font-[var(--font-heading)] text-lg font-bold text-text-heading">
                {isEs ? "Crecimiento del portafolio" : "Portfolio Growth"}
              </h3>
              <p className="mb-4 text-xs text-text-muted">
                {isEs
                  ? `${formatCurrency(dcaAmount, country)}/mes durante ${simulation.months} meses`
                  : `${formatCurrency(dcaAmount, country)}/mo over ${simulation.months} months`}
              </p>
              <div className="h-64 w-full sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={chartData}
                    margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="gradInvested"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#9CA3AF"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="100%"
                          stopColor="#9CA3AF"
                          stopOpacity={0.05}
                        />
                      </linearGradient>
                      <linearGradient
                        id="gradPortfolio"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#F7931A"
                          stopOpacity={0.4}
                        />
                        <stop
                          offset="100%"
                          stopColor="#F7931A"
                          stopOpacity={0.05}
                        />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: "#9CA3AF" }}
                      tickLine={false}
                      axisLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#9CA3AF" }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v: number) =>
                        v >= 1000
                          ? `${(v / 1000).toFixed(0)}k`
                          : String(v)
                      }
                      width={48}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#2D3047",
                        border: "none",
                        borderRadius: 12,
                        color: "#F0ECE3",
                        fontSize: 13,
                      }}
                      formatter={(value, name) => [
                        formatCurrency(Number(value ?? 0), country),
                        name === "invested"
                          ? isEs
                            ? "Invertido"
                            : "Invested"
                          : isEs
                            ? "Portafolio"
                            : "Portfolio",
                      ]}
                      labelStyle={{ color: "#9CA3AF", fontSize: 11 }}
                    />
                    <Legend
                      formatter={(value: string) =>
                        value === "invested"
                          ? isEs
                            ? "Total invertido"
                            : "Total invested"
                          : isEs
                            ? "Valor del portafolio"
                            : "Portfolio value"
                      }
                      wrapperStyle={{ fontSize: 12 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="invested"
                      stroke="#9CA3AF"
                      strokeWidth={2}
                      fill="url(#gradInvested)"
                    />
                    <Area
                      type="monotone"
                      dataKey="portfolio"
                      stroke="#F7931A"
                      strokeWidth={2}
                      fill="url(#gradPortfolio)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* ── Volatility Disclaimer ───────────────────────── */}
            <motion.div variants={fadeUp}>
              <p className="rounded-xl bg-bg-secondary px-4 py-3 text-center text-xs leading-relaxed text-text-muted">
                {isEs
                  ? "El rendimiento pasado no garantiza resultados futuros. Bitcoin es vol\u00e1til. Solo invierte lo que puedas permitirte perder."
                  : "Past performance doesn't guarantee future results. Bitcoin is volatile. Only invest what you can afford to lose."}
              </p>
            </motion.div>
          </>
        )}
      </motion.div>
    </div>
  );
}
