"use client";

import { useI18n } from "@/locales/client";
import { motion } from "framer-motion";
import { CountryCode } from "@/data/inflation";

interface CountryContextProps {
  country: CountryCode;
}

export function CountryContext({ country }: CountryContextProps) {
  const t = useI18n();

  const contextKey = `context.${country}` as Parameters<typeof t>[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="mx-auto w-full max-w-4xl rounded-[20px] border border-border-light bg-[#FFF0E6] p-8 shadow-lg"
    >
      <h2 className="mb-4 font-[var(--font-heading)] text-xl font-bold text-[#2D3047]">{t("context.title")}</h2>
      <p className="text-lg leading-relaxed text-text-secondary">
        {t(contextKey)}
      </p>
    </motion.div>
  );
}
