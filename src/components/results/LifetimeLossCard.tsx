"use client";

import { useI18n } from "@/locales/client";
import { motion } from "framer-motion";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { CountryCode, COUNTRIES } from "@/data/inflation";

interface LifetimeLossCardProps {
  lifetimeLoss: number;
  birthYear: number;
  country: CountryCode;
}

export function LifetimeLossCard({
  lifetimeLoss,
  birthYear,
  country,
}: LifetimeLossCardProps) {
  const t = useI18n();
  const { currencySymbol } = COUNTRIES[country];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="mx-auto w-full max-w-2xl rounded-[20px] border border-border-light bg-bg-card p-6 text-center shadow-lg"
    >
      <h2 className="mb-2 font-[var(--font-heading)] text-lg font-semibold text-text-secondary">
        {t("lifetime.title")}
      </h2>
      <p className="mb-4 text-sm text-text-muted">
        {t("lifetime.since", { year: String(birthYear) })}
      </p>
      <div className="text-5xl font-black text-negative sm:text-6xl">
        <AnimatedNumber
          value={lifetimeLoss}
          prefix={`-${currencySymbol}`}
          duration={2.5}
          decimals={0}
        />
      </div>
    </motion.div>
  );
}
