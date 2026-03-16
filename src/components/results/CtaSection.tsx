"use client";

import { useRouter } from "next/navigation";
import { useI18n, useCurrentLocale } from "@/locales/client";
import { motion } from "framer-motion";

export function CtaSection() {
  const t = useI18n();
  const locale = useCurrentLocale();
  const router = useRouter();

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="mx-auto w-full max-w-4xl rounded-[20px] border border-border-light bg-gradient-to-br from-[#FFFBF5] to-[#FFF0E6] p-6 text-center shadow-lg"
    >
      <h2 className="mb-3 font-[var(--font-heading)] text-xl font-bold text-text-heading">
        {locale === "es" ? "Ya est\u00e1s adelante por saber esto \uD83D\uDCAA" : "You're already ahead by knowing this \uD83D\uDCAA"}
      </h2>
      <p className="mb-6 text-text-secondary">
        {locale === "es"
          ? "La mayor\u00eda nunca ve estos n\u00fameros. Ahora que los tienes, \u00bfquieres entender por qu\u00e9?"
          : "Most people never see these numbers. Now that you have, want to understand why?"}
      </p>
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <motion.button
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => router.push(`/${locale}/learn`)}
          className="btn-primary px-8 py-4 text-lg font-bold"
        >
          {locale === "es" ? "Empieza a Aprender" : "Start Learning"}
        </motion.button>
      </div>
    </motion.div>
  );
}
