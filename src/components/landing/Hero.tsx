"use client";

import { useI18n } from "@/locales/client";
import { motion } from "framer-motion";

export function Hero() {
  const t = useI18n();

  return (
    <section className="relative flex min-h-[50vh] flex-col items-center justify-center px-4 pt-28 text-center overflow-hidden">
      {/* Decorative gradient blobs */}
      <div className="pointer-events-none absolute top-0 right-0 h-[500px] w-[500px] rounded-full bg-gradient-to-bl from-bitcoin/5 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-gradient-to-tr from-positive/5 to-transparent blur-3xl" />

      {/* Subtle Bitcoin watermark */}
      <div className="pointer-events-none absolute top-10 right-10 text-[200px] font-black text-bitcoin/[0.03] leading-none select-none hidden md:block">
        &#x20BF;
      </div>

      <motion.h1
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative max-w-4xl font-[var(--font-heading)] text-4xl font-extrabold leading-tight tracking-tight text-text-heading sm:text-5xl"
      >
        {t("hero.headline")}
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
        className="relative mt-6 max-w-2xl text-lg leading-relaxed text-text-secondary sm:text-xl"
      >
        {t("hero.subheadline")}
      </motion.p>
    </section>
  );
}
