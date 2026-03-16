"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCurrentLocale } from "@/locales/client";
import { fetchProfile, UserProfile } from "@/lib/profile";
import { formatCurrency } from "@/lib/calculations";
import { CountryCode } from "@/data/inflation";
import {
  calculateGenerationalLoss,
  generateFamilyTimeline,
  loadHistoricalData,
  getHistoricalForYear,
  GenerationalLoss,
  HistoricalComparison,
} from "@/lib/family-calculations";

/* ── animation variants ─────────────────────────────────────────────── */
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const cardPop = {
  hidden: { opacity: 0, scale: 0.95, y: 16 },
  show: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.4 } },
  exit: { opacity: 0, scale: 0.9, y: -10, transition: { duration: 0.25 } },
};

/* ── constants ──────────────────────────────────────────────────────── */
const RELATIONSHIPS = [
  "Grandmother",
  "Grandfather",
  "Mother",
  "Father",
  "Aunt",
  "Uncle",
  "Sibling",
  "Child",
  "Cousin",
  "Other",
] as const;

const MAX_MEMBERS = 5;

interface FamilyMemberInput {
  id: string;
  name: string;
  relationship: string;
  birth_year: number;
  country: CountryCode;
}

/* ═══════════════════════════════════════════════════════════════════════
   FAMILY GENERATIONAL COMPARISON PAGE
   ═══════════════════════════════════════════════════════════════════════ */
export default function FamilyPage() {
  const locale = useCurrentLocale();

  /* ── profile state ─────────────────────────────────────────────────── */
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const userCountry: CountryCode =
    (profile?.country_code as CountryCode) || "US";

  /* ── family members state ──────────────────────────────────────────── */
  const [members, setMembers] = useState<FamilyMemberInput[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState("");
  const [formRelationship, setFormRelationship] = useState<string>(
    RELATIONSHIPS[0]
  );
  const [formBirthYear, setFormBirthYear] = useState<number | "">("");
  const [formCountry, setFormCountry] = useState<CountryCode>(userCountry);

  /* ── results state ─────────────────────────────────────────────────── */
  const [results, setResults] = useState<GenerationalLoss[] | null>(null);
  const [historicalData, setHistoricalData] = useState<
    HistoricalComparison[]
  >([]);
  const [calculating, setCalculating] = useState(false);

  /* ── load profile on mount ─────────────────────────────────────────── */
  useEffect(() => {
    async function load() {
      const p = await fetchProfile();
      setProfile(p);
      setLoading(false);
    }
    load();
  }, []);

  /* keep form country in sync when profile loads */
  useEffect(() => {
    if (profile?.country_code) {
      setFormCountry(profile.country_code as CountryCode);
    }
  }, [profile?.country_code]);

  /* ── derived ────────────────────────────────────────────────────────── */
  const currentYear = new Date().getFullYear();
  const userBirthYear = profile?.birth_year || 1990;
  const userAge = currentYear - userBirthYear;

  /* "You" card always present ── */
  const userMember: FamilyMemberInput = {
    id: "__user__",
    name: locale === "es" ? "Tu" : "You",
    relationship: locale === "es" ? "Tu" : "You",
    birth_year: userBirthYear,
    country: userCountry,
  };

  /* ── add family member ──────────────────────────────────────────────── */
  function handleAddMember() {
    if (!formName.trim() || !formBirthYear) return;
    if (members.length >= MAX_MEMBERS) return;

    setMembers((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: formName.trim(),
        relationship: formRelationship,
        birth_year: Number(formBirthYear),
        country: formCountry,
      },
    ]);
    setFormName("");
    setFormRelationship(RELATIONSHIPS[0]);
    setFormBirthYear("");
    setFormCountry(userCountry);
    setShowForm(false);
  }

  function handleRemoveMember(id: string) {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  }

  /* ── calculate ──────────────────────────────────────────────────────── */
  async function handleCalculate() {
    setCalculating(true);

    const allMembers = [userMember, ...members];

    const timeline = generateFamilyTimeline(
      allMembers.map((m) => ({
        name: m.name,
        birth_year: m.birth_year,
        relationship: m.relationship,
        country: m.country,
        monthly_income: profile?.monthly_income,
      }))
    );

    setResults(timeline);

    /* load historical data for the user's country */
    const hd = await loadHistoricalData(userCountry);
    setHistoricalData(hd);

    setCalculating(false);
  }

  /* ── historical comparison helpers ──────────────────────────────────── */
  const oldestMember =
    results && results.length > 0 ? results[0] : null;
  const oldestWhenUserAge =
    oldestMember && historicalData.length > 0
      ? getHistoricalForYear(
          historicalData,
          oldestMember.birth_year + userAge
        )
      : null;
  const currentComparison =
    historicalData.length > 0
      ? getHistoricalForYear(historicalData, currentYear)
      : null;

  /* multiplier for emotional highlight */
  const userResult = results?.find((r) => r.name === userMember.name);
  const oldestResult = results?.[0];
  const userPowerRemaining = userResult ? 100 - userResult.purchasing_power_lost_percent : 0;
  const buyingPowerMultiplier =
    userResult && oldestResult && userPowerRemaining > 0.1
      ? (
          (100 - oldestResult.purchasing_power_lost_percent) /
          userPowerRemaining
        ).toFixed(1)
      : null;

  /* ── loading spinner ────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-bitcoin border-t-transparent" />
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════════════ */
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="flex flex-col gap-8"
      >
        {/* ── Header ──────────────────────────────────────────────────── */}
        <motion.div variants={fadeUp}>
          <h1 className="font-[var(--font-heading)] text-2xl font-extrabold text-text-heading sm:text-3xl">
            {locale === "es"
              ? "Comparacion Generacional Familiar"
              : "Family Generational Comparison"}
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            {locale === "es"
              ? "Descubre cuanto poder adquisitivo ha perdido cada generacion de tu familia."
              : "See how much purchasing power each generation of your family has lost."}
          </p>
        </motion.div>

        {/* ── Your Card ───────────────────────────────────────────────── */}
        <motion.div variants={fadeUp} className="card-warm rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-bitcoin-soft text-lg font-bold text-bitcoin">
              {locale === "es" ? "T" : "Y"}
            </div>
            <div>
              <p className="font-[var(--font-heading)] font-bold text-text-heading">
                {locale === "es" ? "Tu" : "You"}
              </p>
              <p className="text-xs text-text-muted">
                {locale === "es" ? "Nacido en" : "Born"} {userBirthYear}{" "}
                &middot; {userCountry} &middot;{" "}
                {locale === "es" ? "Edad" : "Age"} {userAge}
              </p>
            </div>
          </div>
        </motion.div>

        {/* ── Family Member Cards ─────────────────────────────────────── */}
        <AnimatePresence mode="popLayout">
          {members.map((m) => (
            <motion.div
              key={m.id}
              variants={cardPop}
              initial="hidden"
              animate="show"
              exit="exit"
              layout
              className="card-warm relative rounded-2xl p-6"
            >
              {/* Remove button */}
              <button
                onClick={() => handleRemoveMember(m.id)}
                className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-negative-light hover:text-negative"
                aria-label={
                  locale === "es" ? "Eliminar miembro" : "Remove member"
                }
              >
                &times;
              </button>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-bg-secondary text-lg font-bold text-text-heading">
                  {m.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-[var(--font-heading)] font-bold text-text-heading">
                    {m.name}
                  </p>
                  <p className="text-xs text-text-muted">
                    {m.relationship} &middot;{" "}
                    {locale === "es" ? "Nacido en" : "Born"} {m.birth_year}{" "}
                    &middot; {m.country}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* ── Add Member Form / Button ────────────────────────────────── */}
        <motion.div variants={fadeUp}>
          <AnimatePresence mode="wait">
            {showForm ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="card-warm overflow-hidden rounded-2xl p-6"
              >
                <h3 className="mb-4 font-[var(--font-heading)] text-lg font-bold text-text-heading">
                  {locale === "es"
                    ? "Agregar familiar"
                    : "Add Family Member"}
                </h3>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Name */}
                  <div>
                    <label className="mb-1 block text-xs font-medium text-text-secondary">
                      {locale === "es" ? "Nombre" : "Name"}
                    </label>
                    <input
                      type="text"
                      className="input-warm"
                      placeholder={
                        locale === "es" ? "Ej: Maria" : "e.g. Maria"
                      }
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                    />
                  </div>

                  {/* Relationship */}
                  <div>
                    <label className="mb-1 block text-xs font-medium text-text-secondary">
                      {locale === "es" ? "Parentesco" : "Relationship"}
                    </label>
                    <select
                      className="input-warm"
                      value={formRelationship}
                      onChange={(e) => setFormRelationship(e.target.value)}
                    >
                      {RELATIONSHIPS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Birth Year */}
                  <div>
                    <label className="mb-1 block text-xs font-medium text-text-secondary">
                      {locale === "es"
                        ? "Ano de nacimiento"
                        : "Birth Year"}
                    </label>
                    <input
                      type="number"
                      className="input-warm"
                      placeholder="1955"
                      min={1900}
                      max={currentYear}
                      value={formBirthYear}
                      onChange={(e) =>
                        setFormBirthYear(
                          e.target.value ? Number(e.target.value) : ""
                        )
                      }
                    />
                  </div>

                  {/* Country (optional, defaults to user's country) */}
                  <div>
                    <label className="mb-1 block text-xs font-medium text-text-secondary">
                      {locale === "es" ? "Pais" : "Country"}{" "}
                      <span className="text-text-muted">
                        ({locale === "es" ? "opcional" : "optional"})
                      </span>
                    </label>
                    <select
                      className="input-warm"
                      value={formCountry}
                      onChange={(e) =>
                        setFormCountry(e.target.value as CountryCode)
                      }
                    >
                      {(
                        [
                          "US",
                          "SV",
                          "MX",
                          "AR",
                          "BR",
                          "CO",
                          "VE",
                        ] as CountryCode[]
                      ).map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Form actions */}
                <div className="mt-5 flex items-center gap-3">
                  <button
                    onClick={handleAddMember}
                    disabled={!formName.trim() || !formBirthYear}
                    className="btn-primary px-6 py-3 text-base disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {locale === "es" ? "Agregar" : "Add"}
                  </button>
                  <button
                    onClick={() => setShowForm(false)}
                    className="btn-secondary px-6 py-3 text-base"
                  >
                    {locale === "es" ? "Cancelar" : "Cancel"}
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.button
                key="add-btn"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowForm(true)}
                disabled={members.length >= MAX_MEMBERS}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border py-5 text-sm font-semibold text-text-secondary transition-colors hover:border-bitcoin hover:text-bitcoin disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span className="text-xl">+</span>
                {locale === "es"
                  ? "Agregar Familiar"
                  : "Add Family Member"}
                {members.length >= MAX_MEMBERS && (
                  <span className="text-xs text-text-muted">
                    ({locale === "es" ? "maximo 5" : "max 5"})
                  </span>
                )}
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── Calculate Button ─────────────────────────────────────────── */}
        <motion.div variants={fadeUp} className="flex justify-center">
          <button
            onClick={handleCalculate}
            disabled={calculating}
            className="btn-primary px-10 py-4 text-lg disabled:cursor-not-allowed disabled:opacity-50"
          >
            {calculating
              ? locale === "es"
                ? "Calculando..."
                : "Calculating..."
              : locale === "es"
                ? "Calcular Impacto Generacional"
                : "Calculate Generational Impact"}
          </button>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════════════
           RESULTS SECTION
           ═══════════════════════════════════════════════════════════════ */}
        <AnimatePresence>
          {results && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col gap-8"
            >
              {/* ── Timeline Visualization ─────────────────────────────── */}
              <div className="card-warm rounded-2xl p-6 sm:p-8">
                <h2 className="mb-6 font-[var(--font-heading)] text-xl font-bold text-text-heading">
                  {locale === "es"
                    ? "Linea de Tiempo Familiar"
                    : "Family Timeline"}
                </h2>

                <motion.div
                  variants={stagger}
                  initial="hidden"
                  animate="show"
                  className="flex flex-col gap-5"
                >
                  {results.map((r, i) => (
                    <motion.div key={r.name + r.birth_year} variants={fadeUp}>
                      {/* Label row */}
                      <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-x-3">
                        <div className="flex items-baseline gap-2">
                          <span className="font-[var(--font-heading)] font-bold text-text-heading">
                            {r.name}
                          </span>
                          <span className="text-xs text-text-muted">
                            {r.relationship}
                          </span>
                        </div>
                        <div className="flex items-baseline gap-3 text-xs text-text-muted">
                          <span>
                            {locale === "es" ? "Nacido en" : "Born"}{" "}
                            {r.birth_year}
                          </span>
                          <span>
                            {locale === "es" ? "Edad" : "Age"}{" "}
                            {r.current_age}
                          </span>
                        </div>
                      </div>

                      {/* Bar */}
                      <div className="relative h-8 w-full overflow-hidden rounded-full bg-bg-secondary">
                        <motion.div
                          className="absolute inset-y-0 left-0 rounded-full"
                          style={{ backgroundColor: r.color }}
                          initial={{ width: 0 }}
                          animate={{
                            width: `${Math.min(r.purchasing_power_lost_percent, 100)}%`,
                          }}
                          transition={{
                            duration: 0.8,
                            delay: i * 0.15,
                            ease: "easeOut",
                          }}
                        />
                        <span className="absolute inset-0 flex items-center px-4 text-xs font-bold text-text-heading">
                          {r.purchasing_power_lost_percent.toFixed(1)}%{" "}
                          {locale === "es"
                            ? "poder adquisitivo perdido"
                            : "purchasing power lost"}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </div>

              {/* ── Emotional Highlight Card ──────────────────────────── */}
              {oldestResult &&
                userResult &&
                oldestResult.name !== userResult.name &&
                buyingPowerMultiplier && (
                  <motion.div
                    variants={fadeUp}
                    initial="hidden"
                    animate="show"
                    className="overflow-hidden rounded-2xl p-6 text-white shadow-lg sm:p-8"
                    style={{
                      background:
                        "linear-gradient(135deg, #FF6B6B 0%, #F7931A 50%, #FFB347 100%)",
                    }}
                  >
                    <p className="font-[var(--font-heading)] text-xl font-extrabold leading-snug sm:text-2xl">
                      {locale === "es"
                        ? `El dolar de ${oldestResult.name} compraba ${buyingPowerMultiplier}x mas que el tuyo hoy.`
                        : `${oldestResult.name}'s dollar bought ${buyingPowerMultiplier}x more than yours does today.`}
                    </p>
                    <p className="mt-3 text-sm text-white/80">
                      {locale === "es"
                        ? `${oldestResult.name} (${oldestResult.relationship}) perdio ${oldestResult.purchasing_power_lost_percent.toFixed(1)}% de su poder adquisitivo en ${oldestResult.current_age} anos.`
                        : `${oldestResult.name} (${oldestResult.relationship}) lost ${oldestResult.purchasing_power_lost_percent.toFixed(1)}% of their purchasing power over ${oldestResult.current_age} years.`}
                    </p>
                  </motion.div>
                )}

              {/* ── Historical Comparison ("When X was your age") ──────── */}
              {oldestMember &&
                oldestWhenUserAge &&
                currentComparison &&
                oldestMember.name !== userMember.name && (
                  <motion.div
                    variants={fadeUp}
                    initial="hidden"
                    animate="show"
                    className="card-warm rounded-2xl p-6 sm:p-8"
                  >
                    <h2 className="mb-2 font-[var(--font-heading)] text-xl font-bold text-text-heading">
                      {locale === "es"
                        ? `Cuando ${oldestMember.name} tenia tu edad...`
                        : `When ${oldestMember.name} was your age...`}
                    </h2>
                    <p className="mb-6 text-sm text-text-muted">
                      {locale === "es"
                        ? `Comparando precios de ${oldestWhenUserAge.year} vs ${currentComparison.year}`
                        : `Comparing prices from ${oldestWhenUserAge.year} vs ${currentComparison.year}`}
                    </p>

                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                      <ComparisonItem
                        label={locale === "es" ? "Renta mensual" : "Monthly Rent"}
                        then={formatCurrency(
                          oldestWhenUserAge.avg_monthly_rent,
                          userCountry
                        )}
                        now={formatCurrency(
                          currentComparison.avg_monthly_rent,
                          userCountry
                        )}
                        locale={locale}
                      />
                      <ComparisonItem
                        label={locale === "es" ? "Leche (galon)" : "Milk (gallon)"}
                        then={formatCurrency(
                          oldestWhenUserAge.milk_gallon,
                          userCountry
                        )}
                        now={formatCurrency(
                          currentComparison.milk_gallon,
                          userCountry
                        )}
                        locale={locale}
                      />
                      <ComparisonItem
                        label={locale === "es" ? "Pan" : "Bread (loaf)"}
                        then={formatCurrency(
                          oldestWhenUserAge.bread_loaf,
                          userCountry
                        )}
                        now={formatCurrency(
                          currentComparison.bread_loaf,
                          userCountry
                        )}
                        locale={locale}
                      />
                      <ComparisonItem
                        label={
                          locale === "es" ? "Gasolina (galon)" : "Gas (gallon)"
                        }
                        then={formatCurrency(
                          oldestWhenUserAge.gas_gallon,
                          userCountry
                        )}
                        now={formatCurrency(
                          currentComparison.gas_gallon,
                          userCountry
                        )}
                        locale={locale}
                      />
                      <ComparisonItem
                        label={
                          locale === "es"
                            ? "Salario minimo/hr"
                            : "Min Wage/hr"
                        }
                        then={formatCurrency(
                          oldestWhenUserAge.min_wage_hourly,
                          userCountry
                        )}
                        now={formatCurrency(
                          currentComparison.min_wage_hourly,
                          userCountry
                        )}
                        locale={locale}
                      />
                    </div>

                    {oldestWhenUserAge.source && (
                      <p className="mt-4 text-xs text-text-muted">
                        {locale === "es" ? "Fuente:" : "Source:"}{" "}
                        {oldestWhenUserAge.source}
                      </p>
                    )}
                  </motion.div>
                )}

              {/* ── Per-Member Detail Cards ────────────────────────────── */}
              <motion.div
                variants={stagger}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 gap-4 sm:grid-cols-2"
              >
                {results.map((r) => (
                  <motion.div
                    key={r.name + r.birth_year}
                    variants={fadeUp}
                    className="stat-card rounded-2xl p-6 shadow-md"
                  >
                    <div className="mb-3 flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: r.color }}
                      />
                      <span className="font-[var(--font-heading)] font-bold text-text-heading">
                        {r.name}
                      </span>
                      <span className="text-xs text-text-muted">
                        ({r.relationship})
                      </span>
                    </div>

                    <p className="font-[var(--font-heading)] text-2xl font-extrabold text-negative">
                      {r.purchasing_power_lost_percent.toFixed(1)}%
                    </p>
                    <p className="text-sm text-text-secondary">
                      {locale === "es"
                        ? "poder adquisitivo perdido"
                        : "purchasing power lost"}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-muted">
                      <span>
                        {locale === "es" ? "Nacido en" : "Born"} {r.birth_year}
                      </span>
                      <span>
                        {locale === "es" ? "Edad" : "Age"} {r.current_age}
                      </span>
                      <span>{r.country}</span>
                    </div>

                    {r.estimated_lifetime_loss > 0 && (
                      <p className="mt-3 text-sm font-semibold text-negative">
                        {locale === "es" ? "Perdida estimada: " : "Est. loss: "}
                        {formatCurrency(r.estimated_lifetime_loss, r.country)}
                      </p>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════════════════════════════ */

function ComparisonItem({
  label,
  then,
  now,
  locale,
}: {
  label: string;
  then: string;
  now: string;
  locale: string;
}) {
  return (
    <div className="flex flex-col items-center rounded-xl bg-bg-secondary p-4 text-center">
      <span className="mb-2 text-xs font-medium text-text-muted">{label}</span>
      <span className="text-sm font-bold text-positive">{then}</span>
      <span className="my-0.5 text-[10px] text-text-muted">
        {locale === "es" ? "vs" : "vs"}
      </span>
      <span className="text-sm font-bold text-negative">{now}</span>
    </div>
  );
}
