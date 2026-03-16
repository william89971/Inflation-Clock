"use client";

import { useI18n } from "@/locales/client";
import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/calculations";
import { CountryCode } from "@/data/inflation";

interface ComparisonCardsProps {
  monthlyIncome: number;
  incomeAtBirth: number;
  birthIncomeToday: number;
  country: CountryCode;
}

export function ComparisonCards({
  monthlyIncome,
  incomeAtBirth,
  birthIncomeToday,
  country,
}: ComparisonCardsProps) {
  const t = useI18n();

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="mx-auto w-full max-w-4xl"
    >
      <h2 className="mb-4 text-center font-[var(--font-heading)] text-xl font-bold text-text-heading">
        {t("comparison.title")}
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-[20px] border border-border-light bg-bg-card p-6 shadow-lg">
          <p className="text-text-secondary">
            {t("comparison.todayWorth", {
              income: formatCurrency(monthlyIncome, country),
              amount: formatCurrency(incomeAtBirth, country),
            })}
          </p>
        </div>
        <div className="rounded-[20px] border border-border-light bg-bg-card p-6 shadow-lg">
          <p className="text-text-secondary">
            {t("comparison.birthWorth", {
              income: formatCurrency(monthlyIncome, country),
              amount: formatCurrency(birthIncomeToday, country),
            })}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
