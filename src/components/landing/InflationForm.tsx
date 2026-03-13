"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n, useCurrentLocale } from "@/locales/client";
import { motion } from "framer-motion";
import { COUNTRIES, CountryCode } from "@/data/inflation";
import { trackEvent } from "@/lib/analytics";

const COUNTRY_CODES: CountryCode[] = ["US", "SV", "MX", "AR", "BR", "CO", "VE"];

export function InflationForm() {
  const t = useI18n();
  const locale = useCurrentLocale();
  const router = useRouter();

  const [country, setCountry] = useState<CountryCode>("US");
  const [age, setAge] = useState("");
  const [income, setIncome] = useState("");

  const currencySymbol = COUNTRIES[country].currencySymbol;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!country || !age || !income) return;

    trackEvent("inflation_clock_start", { country, age: parseInt(age), income: parseFloat(income) });

    const params = new URLSearchParams({
      country,
      age,
      income,
    });

    router.push(`/${locale}/results?${params.toString()}`);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
      className="mx-auto w-full max-w-[520px] px-4 pb-12"
    >
      <form
        onSubmit={handleSubmit}
        className="rounded-[20px] border border-border-light bg-bg-card p-8 sm:p-10 shadow-lg"
      >
        {/* Country */}
        <div className="mb-6">
          <label
            htmlFor="country"
            className="mb-2 block font-[var(--font-heading)] text-sm font-semibold text-text-primary"
          >
            {t("form.country")}
          </label>
          <select
            id="country"
            value={country}
            onChange={(e) => setCountry(e.target.value as CountryCode)}
            className="w-full rounded-[14px] border-2 border-border bg-bg-input px-4 py-3.5 text-text-primary outline-none transition-all focus:border-bitcoin focus:shadow-[0_0_0_4px_rgba(247,147,26,0.1)]"
          >
            {COUNTRY_CODES.map((code) => (
              <option key={code} value={code}>
                {t(`country.${code}` as Parameters<typeof t>[0])}
              </option>
            ))}
          </select>
        </div>

        {/* Age */}
        <div className="mb-6">
          <label
            htmlFor="age"
            className="mb-2 block font-[var(--font-heading)] text-sm font-semibold text-text-primary"
          >
            {t("form.age")}
          </label>
          <input
            id="age"
            type="number"
            min="1"
            max="120"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder={t("form.age.placeholder")}
            className="w-full rounded-[14px] border-2 border-border bg-bg-input px-4 py-3.5 text-text-primary placeholder-[#B8B0A4] outline-none transition-all focus:border-bitcoin focus:bg-white focus:shadow-[0_0_0_4px_rgba(247,147,26,0.1)]"
            required
          />
        </div>

        {/* Income */}
        <div className="mb-8">
          <label
            htmlFor="income"
            className="mb-2 block font-[var(--font-heading)] text-sm font-semibold text-text-primary"
          >
            {t("form.income")} ({currencySymbol})
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
              {currencySymbol}
            </span>
            <input
              id="income"
              type="number"
              min="1"
              value={income}
              onChange={(e) => setIncome(e.target.value)}
              placeholder={t("form.income.placeholder")}
              className="w-full rounded-[14px] border-2 border-border bg-bg-input py-3.5 pl-10 pr-4 text-text-primary placeholder-[#B8B0A4] outline-none transition-all focus:border-bitcoin focus:bg-white focus:shadow-[0_0_0_4px_rgba(247,147,26,0.1)]"
              required
            />
          </div>
        </div>

        {/* Submit */}
        <motion.button
          whileHover={{ y: -2, boxShadow: "0 6px 20px rgba(247, 147, 26, 0.35)" }}
          whileTap={{ scale: 0.97 }}
          type="submit"
          className="btn-primary animate-cta-pulse w-full py-4 text-lg font-[var(--font-heading)]"
        >
          {t("form.submit")} &#x2728;
        </motion.button>

        <p className="mt-4 text-center text-xs text-text-muted">
          {locale === "es"
            ? "Gratis. Sin registro. Tus datos son privados."
            : "Free. No signup required. Your data stays private."}
        </p>
      </form>
    </motion.div>
  );
}
