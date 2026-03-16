"use client";

import { useChangeLocale, useCurrentLocale } from "@/locales/client";
import { motion } from "framer-motion";

export function LanguageToggle() {
  const locale = useCurrentLocale();
  const changeLocale = useChangeLocale();

  return (
    <div className="flex rounded-[10px] bg-[#F3F0EB] p-[3px]">
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => changeLocale("en")}
        aria-label="Switch to English"
        className={`rounded-lg px-3.5 py-1.5 text-[13px] font-semibold transition-all ${
          locale === "en"
            ? "bg-white text-bitcoin shadow-sm"
            : "text-text-secondary hover:text-text-primary"
        }`}
      >
        EN
      </motion.button>
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => changeLocale("es")}
        aria-label="Cambiar a Español"
        className={`rounded-lg px-3.5 py-1.5 text-[13px] font-semibold transition-all ${
          locale === "es"
            ? "bg-white text-bitcoin shadow-sm"
            : "text-text-secondary hover:text-text-primary"
        }`}
      >
        ES
      </motion.button>
    </div>
  );
}
