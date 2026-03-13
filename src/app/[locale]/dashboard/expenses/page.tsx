"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCurrentLocale } from "@/locales/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import {
  fetchProfile,
  hasProfileData,
  saveExpenses,
  UserProfile,
  ExpenseData,
} from "@/lib/profile";
import { formatCurrency } from "@/lib/calculations";
import { CountryCode, COUNTRIES } from "@/data/inflation";
import {
  calculateExpenseImpact,
  ExpenseImpactResult,
} from "@/lib/expense-calculations";
import { SmartRecommendation } from "@/components/SmartRecommendation";

// ── Animation variants ──────────────────────────────────────────────
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

// ── Expense category metadata ───────────────────────────────────────
const CATEGORIES: {
  key: keyof ExpenseData;
  emoji: string;
  label: string;
  labelEs: string;
  placeholder: string;
}[] = [
  {
    key: "monthly_rent",
    emoji: "\u{1F3E0}",
    label: "Rent / Housing",
    labelEs: "Renta / Vivienda",
    placeholder: "1,500",
  },
  {
    key: "monthly_groceries",
    emoji: "\u{1F6D2}",
    label: "Groceries & Food",
    labelEs: "Comida y Abarrotes",
    placeholder: "600",
  },
  {
    key: "monthly_transport",
    emoji: "\u26FD",
    label: "Transportation",
    labelEs: "Transporte",
    placeholder: "350",
  },
  {
    key: "monthly_utilities",
    emoji: "\u26A1",
    label: "Utilities",
    labelEs: "Servicios",
    placeholder: "200",
  },
  {
    key: "monthly_healthcare",
    emoji: "\u{1F3E5}",
    label: "Healthcare",
    labelEs: "Salud",
    placeholder: "300",
  },
  {
    key: "monthly_education",
    emoji: "\u{1F4DA}",
    label: "Education",
    labelEs: "Educaci\u00F3n",
    placeholder: "150",
  },
  {
    key: "monthly_other",
    emoji: "\u{1F4E6}",
    label: "Other",
    labelEs: "Otros",
    placeholder: "200",
  },
];

// ── Custom Tooltip for chart ────────────────────────────────────────
function ChartTooltip({
  active,
  payload,
  country,
}: {
  active?: boolean;
  payload?: Array<{ value: number; payload: { name: string; pct: number } }>;
  country: CountryCode;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-xl border border-border bg-bg-card px-4 py-3 shadow-lg">
      <p className="text-sm font-semibold text-text-heading">{d.name}</p>
      <p className="text-sm text-text-muted">
        +{d.pct.toFixed(1)}% &middot;{" "}
        {formatCurrency(payload[0].value, country)}/yr more
      </p>
    </div>
  );
}

// ── Bar fill color helper ───────────────────────────────────────────
function barFill(pct: number): string {
  if (pct > 25) return "#FF6B6B";
  if (pct > 10) return "#FFD93D";
  return "#2EC4B6";
}

// ── Page Component ──────────────────────────────────────────────────
export default function ExpensesPage() {
  const locale = useCurrentLocale();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<ExpenseData>({
    monthly_rent: 0,
    monthly_groceries: 0,
    monthly_transport: 0,
    monthly_utilities: 0,
    monthly_healthcare: 0,
    monthly_education: 0,
    monthly_other: 0,
  });
  const [results, setResults] = useState<ExpenseImpactResult | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [savingsPercent, setSavingsPercent] = useState(5);
  const [saved, setSaved] = useState(false);

  const country = (profile?.country_code || "US") as CountryCode;
  const currencySymbol = COUNTRIES[country]?.currencySymbol ?? "$";

  // ── On mount: fetch profile, pre-fill ─────────────────────────────
  useEffect(() => {
    async function load() {
      const p = await fetchProfile();
      if (!hasProfileData(p)) {
        router.replace(`/${locale}`);
        return;
      }
      setProfile(p);
      if (p) {
        setExpenses({
          monthly_rent: p.monthly_rent || 0,
          monthly_groceries: p.monthly_groceries || 0,
          monthly_transport: p.monthly_transport || 0,
          monthly_utilities: p.monthly_utilities || 0,
          monthly_healthcare: p.monthly_healthcare || 0,
          monthly_education: p.monthly_education || 0,
          monthly_other: p.monthly_other || 0,
        });
      }
      setLoading(false);
    }
    load();
  }, [locale, router]);

  // ── Derived ───────────────────────────────────────────────────────
  const total = Object.values(expenses).reduce((s, v) => s + v, 0);

  const savingsDollar =
    results && savingsPercent > 0
      ? (results.total_increase_yearly * savingsPercent) / 100
      : 0;

  // ── Handlers ──────────────────────────────────────────────────────
  function updateExpense(key: keyof ExpenseData, value: string) {
    const num = parseFloat(value) || 0;
    setExpenses((prev) => ({ ...prev, [key]: num }));
    if (showResults) setShowResults(false);
  }

  async function handleCalculate() {
    if (total <= 0) return;
    setCalculating(true);
    const result = await calculateExpenseImpact(
      expenses as unknown as Record<string, number>,
      country
    );
    setResults(result);
    setShowResults(true);
    setCalculating(false);
  }

  async function handleSave() {
    await saveExpenses(expenses);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  // ── Loading state ─────────────────────────────────────────────────
  if (loading || !profile) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-bitcoin border-t-transparent" />
      </div>
    );
  }

  // ── Chart data ────────────────────────────────────────────────────
  const barData =
    results?.analyses.map((a) => ({
      name: locale === "es" ? a.label_es : a.label,
      increase: a.increase_dollar_5yr,
      pct: a.increase_percent_5yr,
    })) || [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="flex flex-col gap-8"
      >
        {/* ── Page Header ──────────────────────────────────────────── */}
        <motion.div variants={fadeUp} className="text-center">
          <h1 className="font-[var(--font-heading)] text-3xl font-extrabold text-text-heading sm:text-4xl">
            {locale === "es"
              ? "Tu Reporte Real de Inflaci\u00F3n"
              : "Your Real Inflation Report"}
          </h1>
          <p className="mx-auto mt-2 max-w-lg text-text-muted">
            {locale === "es"
              ? "Ingresa tus gastos mensuales para ver cu\u00E1nto te est\u00E1 costando realmente la inflaci\u00F3n."
              : "Enter your monthly expenses to see how much inflation is really costing you."}
          </p>
        </motion.div>

        {/* ── Expense Input Grid ───────────────────────────────────── */}
        <motion.div
          variants={fadeUp}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          {CATEGORIES.map((cat) => (
            <div
              key={cat.key}
              className="rounded-2xl border border-border bg-bg-card p-5 shadow-sm transition-all focus-within:border-bitcoin focus-within:shadow-md"
            >
              <div className="mb-3 flex items-center gap-2">
                <span className="text-2xl">{cat.emoji}</span>
                <span className="text-sm font-semibold text-text-heading">
                  {locale === "es" ? cat.labelEs : cat.label}
                </span>
              </div>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step={1}
                  placeholder={cat.placeholder}
                  value={expenses[cat.key] || ""}
                  onChange={(e) => updateExpense(cat.key, e.target.value)}
                  className="input-warm pl-8"
                />
              </div>
            </div>
          ))}
        </motion.div>

        {/* ── Total + Calculate ─────────────────────────────────────── */}
        <motion.div
          variants={fadeUp}
          className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between"
        >
          <div className="text-center sm:text-left">
            <p className="text-sm font-medium text-text-muted">
              {locale === "es" ? "Total mensual" : "Monthly total"}
            </p>
            <p className="font-[var(--font-heading)] text-3xl font-extrabold text-text-heading">
              {formatCurrency(total, country)}
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleCalculate}
            disabled={total <= 0 || calculating}
            className="w-full rounded-2xl px-8 py-4 text-lg font-bold text-white shadow-lg transition-all disabled:opacity-40 sm:w-auto"
            style={{
              background:
                "linear-gradient(135deg, #FF6B6B 0%, #F7931A 50%, #FFB347 100%)",
            }}
          >
            {calculating ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                {locale === "es" ? "Calculando..." : "Calculating..."}
              </span>
            ) : locale === "es" ? (
              "Mu\u00E9strame El Da\u00F1o Real"
            ) : (
              "Show Me The Real Damage"
            )}
          </motion.button>
        </motion.div>

        {/* ── Results Section ───────────────────────────────────────── */}
        <AnimatePresence>
          {showResults && results && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col gap-8"
            >
              {/* Big headline */}
              <div
                className="overflow-hidden rounded-2xl p-6 text-center text-white shadow-lg sm:p-8"
                style={{
                  background:
                    "linear-gradient(135deg, #FF6B6B 0%, #F7931A 50%, #FFB347 100%)",
                }}
              >
                <p className="text-sm font-medium text-white/80">
                  {locale === "es"
                    ? "Comparado con hace 5 a\u00F1os"
                    : "Compared to 5 years ago"}
                </p>
                <p className="mt-2 font-[var(--font-heading)] text-3xl font-extrabold sm:text-4xl">
                  {locale === "es"
                    ? `Est\u00E1s pagando ${formatCurrency(results.total_increase_yearly, country)} M\u00C1S al a\u00F1o`
                    : `You're paying ${formatCurrency(results.total_increase_yearly, country)} MORE per year`}
                </p>
                <p className="mt-1 text-sm text-white/70">
                  {locale === "es"
                    ? "...por exactamente lo mismo."
                    : "...for the exact same things."}
                </p>
              </div>

              {/* ── Horizontal Bar Chart ─────────────────────────────── */}
              <div className="rounded-2xl border border-border bg-bg-card p-5 shadow-sm sm:p-6">
                <h2 className="mb-4 font-[var(--font-heading)] text-lg font-bold text-text-heading">
                  {locale === "es"
                    ? "Aumento por Categor\u00EDa (5 a\u00F1os)"
                    : "Increase by Category (5 years)"}
                </h2>
                <div style={{ width: "100%", height: barData.length * 56 + 40 }}>
                  <ResponsiveContainer>
                    <BarChart
                      data={barData}
                      layout="vertical"
                      margin={{ top: 0, right: 24, left: 8, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        horizontal={false}
                        stroke="rgba(229,221,211,0.4)"
                      />
                      <XAxis
                        type="number"
                        tickFormatter={(v: number) =>
                          v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`
                        }
                        tick={{ fontSize: 12, fill: "#9CA3AF" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={120}
                        tick={{ fontSize: 12, fill: "#6B7280" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        content={<ChartTooltip country={country} />}
                        cursor={{ fill: "rgba(247,147,26,0.06)" }}
                      />
                      <Bar
                        dataKey="increase"
                        radius={[0, 8, 8, 0]}
                        maxBarSize={28}
                        isAnimationActive
                        animationDuration={800}
                      >
                        {barData.map((entry, i) => (
                          <Cell key={i} fill={barFill(entry.pct)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* ── Category Detail Cards ────────────────────────────── */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {results.analyses.map((a) => (
                  <motion.div
                    key={a.category}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-border bg-bg-card p-4 shadow-sm"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-xl">{a.emoji}</span>
                      <span className="text-sm font-semibold text-text-heading">
                        {locale === "es" ? a.label_es : a.label}
                      </span>
                    </div>
                    <p className="font-[var(--font-heading)] text-xl font-bold text-negative">
                      +{a.increase_percent_5yr.toFixed(1)}%
                    </p>
                    <p className="text-xs text-text-muted">
                      {locale === "es"
                        ? `${formatCurrency(a.amount_5yr_ago, country)}/mes hace 5 a\u00F1os \u2192 ${formatCurrency(a.current_monthly, country)}/mes hoy`
                        : `${formatCurrency(a.amount_5yr_ago, country)}/mo 5yr ago \u2192 ${formatCurrency(a.current_monthly, country)}/mo today`}
                    </p>
                  </motion.div>
                ))}
              </div>

              {/* ── Future Projection Cards ─────────────────────────── */}
              <div>
                <h2 className="mb-4 font-[var(--font-heading)] text-lg font-bold text-text-heading">
                  {locale === "es"
                    ? "Si nada cambia, pagar\u00E1s..."
                    : "If nothing changes, you'll pay..."}
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {(
                    [
                      { years: 1, key: "projected_1yr" },
                      { years: 5, key: "projected_5yr" },
                      { years: 10, key: "projected_10yr" },
                    ] as const
                  ).map(({ years, key }) => {
                    const projected = results.analyses.reduce(
                      (s, a) => s + a[key],
                      0
                    );
                    const increase = projected - results.total_current;
                    return (
                      <motion.div
                        key={years}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: years * 0.1 }}
                        className="stat-card rounded-2xl p-5 shadow-lg"
                      >
                        <p className="text-sm font-medium text-text-muted">
                          {locale === "es"
                            ? `En ${years} ${years === 1 ? "a\u00F1o" : "a\u00F1os"}`
                            : `In ${years} ${years === 1 ? "year" : "years"}`}
                        </p>
                        <p className="mt-1 font-[var(--font-heading)] text-2xl font-extrabold text-text-heading">
                          {formatCurrency(projected, country)}
                          <span className="text-sm font-normal text-text-muted">
                            /{locale === "es" ? "mes" : "mo"}
                          </span>
                        </p>
                        <p className="mt-1 text-sm font-semibold text-negative">
                          +{formatCurrency(increase, country)}/{locale === "es" ? "mes" : "mo"}
                        </p>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* ── Bitcoin Savings Slider ──────────────────────────── */}
              <div className="rounded-2xl border border-border bg-bg-card p-6 shadow-sm">
                <h2 className="mb-1 font-[var(--font-heading)] text-lg font-bold text-text-heading">
                  {locale === "es"
                    ? "\u00BFQu\u00E9 pasa si ahorras en Bitcoin?"
                    : "What if you saved in Bitcoin?"}
                </h2>
                <p className="mb-5 text-sm text-text-muted">
                  {locale === "es"
                    ? "Desliza para ver cu\u00E1nto podr\u00EDas compensar la inflaci\u00F3n."
                    : "Slide to see how much you could offset inflation."}
                </p>

                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min={1}
                    max={20}
                    value={savingsPercent}
                    onChange={(e) => setSavingsPercent(Number(e.target.value))}
                    className="h-2 w-full cursor-pointer appearance-none rounded-full bg-bitcoin-soft accent-bitcoin"
                  />
                  <span className="min-w-[48px] text-right font-[var(--font-heading)] text-2xl font-extrabold text-bitcoin">
                    {savingsPercent}%
                  </span>
                </div>

                <div className="mt-4 flex flex-col gap-2 rounded-xl bg-positive-light p-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-text-primary">
                    {locale === "es"
                      ? `Ahorrando ${savingsPercent}% de tu gasto mensual en Bitcoin...`
                      : `Saving ${savingsPercent}% of your monthly spend in Bitcoin...`}
                  </p>
                  <p className="font-[var(--font-heading)] text-xl font-bold text-positive">
                    {formatCurrency(savingsDollar, country)}
                    <span className="text-sm font-normal text-text-muted">
                      /{locale === "es" ? "a\u00F1o" : "yr"}{" "}
                      {locale === "es" ? "compensado" : "offset"}
                    </span>
                  </p>
                </div>
              </div>

              {/* ── Smart Recommendation ────────────────────────────── */}
              <SmartRecommendation
                country={country}
                modulesCompleted={profile.modules_completed?.length || 0}
              />

              {/* ── Save Button ─────────────────────────────────────── */}
              <div className="flex justify-center">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSave}
                  className="btn-primary px-10 py-3"
                >
                  {saved
                    ? locale === "es"
                      ? "\u2713 Guardado"
                      : "\u2713 Saved!"
                    : locale === "es"
                      ? "Guardar Mis Gastos"
                      : "Save My Expenses"}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
