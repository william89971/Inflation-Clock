"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useI18n, useCurrentLocale } from "@/locales/client";
import { motion } from "framer-motion";
import { trackEvent } from "@/lib/analytics";

export default function ReferralPage() {
  const t = useI18n();
  const locale = useCurrentLocale();
  const router = useRouter();
  const params = useParams();
  const code = params.code as string;

  useEffect(() => {
    if (code) {
      localStorage.setItem("referral_code", code);
      trackEvent("referral_signup", { code });
    }
  }, [code]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-lg text-center"
      >
        {/* Glow accent */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-blood/10"
        >
          <span className="text-5xl">🔍</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-4 text-3xl font-extrabold sm:text-4xl"
        >
          {t("referral.headline")}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mb-8 text-lg text-text-secondary"
        >
          {t("referral.subheadline")}
        </motion.p>

        {/* Social proof */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="mb-8 flex items-center justify-center gap-2"
        >
          <div className="flex -space-x-2">
            {["🇺🇸", "🇲🇽", "🇦🇷", "🇧🇷", "🇨🇴", "🇸🇻", "🇻🇪"].map(
              (flag, i) => (
                <span
                  key={i}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-surface bg-surface-card text-sm"
                >
                  {flag}
                </span>
              )
            )}
          </div>
          <span className="ml-2 text-sm text-text-muted">
            {t("referral.trust", { count: "7" })}
          </span>
        </motion.div>

        {/* CTA */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push(`/${locale}`)}
          className="w-full rounded-lg bg-blood px-8 py-4 text-lg font-bold text-white transition-colors hover:bg-blood-dark sm:w-auto"
        >
          {t("referral.cta")}
        </motion.button>

        {/* Referral code badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.1 }}
          className="mt-8"
        >
          <span className="rounded-full border border-border bg-surface-card px-4 py-2 text-xs text-text-muted">
            Referral: {code}
          </span>
        </motion.div>
      </motion.div>
    </main>
  );
}
