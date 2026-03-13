"use client";

import { useState } from "react";
import { useI18n } from "@/locales/client";
import { motion } from "framer-motion";
import { trackEvent } from "@/lib/analytics";
import { CountryCode } from "@/data/inflation";

const COUNTRY_CODES: CountryCode[] = ["US", "SV", "MX", "AR", "BR", "CO", "VE"];

export default function NewsletterPage() {
  const t = useI18n();
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState<CountryCode>("US");
  const [language, setLanguage] = useState("en");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      await fetch("/api/email/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, country, language }),
      });
      trackEvent("newsletter_signup", { country, language });
      setSubmitted(true);
    } catch (err) {
      console.error("Newsletter signup failed:", err);
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md text-center"
        >
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-bitcoin/10">
            <span className="text-4xl">✉️</span>
          </div>
          <h1 className="mb-4 text-3xl font-extrabold">
            {t("newsletter.thanksHeadline")}
          </h1>
          <p className="text-text-secondary">
            {t("newsletter.thanksMessage")}
          </p>
        </motion.div>
      </main>
    );
  }

  const benefits = [
    { icon: "📊", text: t("newsletter.benefit1") },
    { icon: "🟠", text: t("newsletter.benefit2") },
    { icon: "🚀", text: t("newsletter.benefit3") },
  ];

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-20">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-lg"
      >
        <div className="mb-8 text-center">
          <h1 className="mb-3 text-3xl font-extrabold sm:text-4xl">
            {t("newsletter.headline")}
          </h1>
          <p className="text-text-secondary">{t("newsletter.subheadline")}</p>
        </div>

        {/* Benefits */}
        <div className="mb-8 space-y-3">
          {benefits.map((benefit, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
              className="flex items-center gap-3 rounded-xl border border-border bg-surface-card p-4"
            >
              <span className="text-2xl">{benefit.icon}</span>
              <span className="text-text-secondary">{benefit.text}</span>
            </motion.div>
          ))}
        </div>

        {/* Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          onSubmit={handleSubmit}
          className="rounded-2xl border border-border bg-surface-card p-8"
        >
          {/* Email */}
          <div className="mb-5">
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-text-secondary"
            >
              {t("newsletter.email")}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("newsletter.email.placeholder")}
              className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-text-primary placeholder-text-muted outline-none transition-colors focus:border-bitcoin"
              required
            />
          </div>

          {/* Country */}
          <div className="mb-5">
            <label
              htmlFor="newsletter-country"
              className="mb-2 block text-sm font-medium text-text-secondary"
            >
              {t("newsletter.country")}
            </label>
            <select
              id="newsletter-country"
              value={country}
              onChange={(e) => setCountry(e.target.value as CountryCode)}
              className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-text-primary outline-none transition-colors focus:border-bitcoin"
            >
              {COUNTRY_CODES.map((code) => (
                <option key={code} value={code}>
                  {t(`country.${code}` as Parameters<typeof t>[0])}
                </option>
              ))}
            </select>
          </div>

          {/* Language */}
          <div className="mb-6">
            <label
              htmlFor="newsletter-lang"
              className="mb-2 block text-sm font-medium text-text-secondary"
            >
              {t("newsletter.language")}
            </label>
            <select
              id="newsletter-lang"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-text-primary outline-none transition-colors focus:border-bitcoin"
            >
              <option value="en">English</option>
              <option value="es">Español</option>
            </select>
          </div>

          {/* Submit */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-bitcoin px-8 py-4 text-lg font-bold text-black transition-colors hover:bg-bitcoin-dark disabled:opacity-50"
          >
            {loading ? "..." : t("newsletter.submit")}
          </motion.button>
        </motion.form>
      </motion.div>
    </main>
  );
}
