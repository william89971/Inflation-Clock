"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/locales/client";
import { motion } from "framer-motion";
import { trackEvent } from "@/lib/analytics";

interface Feature {
  id: string;
  titleKey: string;
  descKey: string;
  icon: string;
}

const FEATURES: Feature[] = [
  {
    id: "calculator",
    titleKey: "premium.feature.calculator",
    descKey: "premium.feature.calculator.desc",
    icon: "🧮",
  },
  {
    id: "tutor",
    titleKey: "premium.feature.tutor",
    descKey: "premium.feature.tutor.desc",
    icon: "🤖",
  },
  {
    id: "alerts",
    titleKey: "premium.feature.alerts",
    descKey: "premium.feature.alerts.desc",
    icon: "🔔",
  },
  {
    id: "family",
    titleKey: "premium.feature.family",
    descKey: "premium.feature.family.desc",
    icon: "👨‍👩‍👧‍👦",
  },
  {
    id: "adfree",
    titleKey: "premium.feature.adfree",
    descKey: "premium.feature.adfree.desc",
    icon: "✨",
  },
  {
    id: "early",
    titleKey: "premium.feature.early",
    descKey: "premium.feature.early.desc",
    icon: "🚀",
  },
];

export default function PremiumPage() {
  const t = useI18n();
  const [email, setEmail] = useState("");
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [waitlistCount, setWaitlistCount] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/premium/waitlist")
      .then((res) => res.json())
      .then((data) => {
        if (data.count !== undefined) setWaitlistCount(data.count);
      })
      .catch(() => {});
  }, []);

  function toggleFeature(id: string) {
    setSelectedFeatures((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const res = await fetch("/api/premium/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          interested_features: selectedFeatures,
        }),
      });
      const data = await res.json();
      trackEvent("premium_waitlist", {
        features: selectedFeatures,
      });
      setSubmitted(true);
      if (data.count !== undefined) setWaitlistCount(data.count);
    } catch (err) {
      console.error("Waitlist signup failed:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen px-4 py-20">
      <div className="mx-auto max-w-4xl">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-12 text-center"
        >
          <h1 className="mb-4 text-3xl font-extrabold sm:text-5xl">
            <span className="text-bitcoin">{t("premium.headline")}</span>
          </h1>
          <p className="mx-auto max-w-xl text-lg text-text-secondary">
            {t("premium.subheadline")}
          </p>

          {/* Social proof */}
          {waitlistCount !== null && waitlistCount > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-4"
            >
              <span className="rounded-full border border-bitcoin/30 bg-bitcoin/10 px-4 py-2 text-sm font-medium text-bitcoin">
                {t("premium.waitlistCount", {
                  count: waitlistCount.toLocaleString(),
                })}
              </span>
            </motion.div>
          )}
        </motion.div>

        {/* Feature interest selection */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-8"
        >
          <p className="mb-4 text-center text-sm font-medium text-text-secondary">
            {t("premium.expressInterest")}
          </p>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature, i) => {
              const isSelected = selectedFeatures.includes(feature.id);
              return (
                <motion.button
                  key={feature.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 * i }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => toggleFeature(feature.id)}
                  className={`relative rounded-xl border p-6 text-left transition-colors ${
                    isSelected
                      ? "border-bitcoin bg-bitcoin/5"
                      : "border-border bg-surface-card hover:bg-surface-hover"
                  }`}
                >
                  {/* Checkbox indicator */}
                  <div
                    className={`absolute top-4 right-4 flex h-5 w-5 items-center justify-center rounded-md border transition-colors ${
                      isSelected
                        ? "border-bitcoin bg-bitcoin"
                        : "border-border bg-surface"
                    }`}
                  >
                    {isSelected && (
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="black"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>

                  <span className="mb-3 block text-3xl">{feature.icon}</span>
                  <h3 className="mb-2 pr-6 text-lg font-bold">
                    {t(feature.titleKey as Parameters<typeof t>[0])}
                  </h3>
                  <p className="text-sm text-text-secondary">
                    {t(feature.descKey as Parameters<typeof t>[0])}
                  </p>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Signup form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mx-auto max-w-md"
        >
          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl border border-bitcoin/30 bg-surface-card p-8 text-center"
            >
              <span className="mb-4 block text-4xl">🎉</span>
              <h2 className="mb-2 text-2xl font-bold text-bitcoin">
                {t("premium.joined")}
              </h2>
              {waitlistCount !== null && (
                <p className="text-text-secondary">
                  {t("premium.waitlistCount", {
                    count: waitlistCount.toLocaleString(),
                  })}
                </p>
              )}
            </motion.div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="rounded-2xl border border-border bg-surface-card p-8"
            >
              <div className="mb-4">
                <label
                  htmlFor="premium-email"
                  className="mb-2 block text-sm font-medium text-text-secondary"
                >
                  {t("premium.email")}
                </label>
                <input
                  id="premium-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("premium.email.placeholder")}
                  className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-text-primary placeholder-text-muted outline-none transition-colors focus:border-bitcoin"
                  required
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-bitcoin px-8 py-4 text-lg font-bold text-black transition-colors hover:bg-bitcoin-dark disabled:opacity-50"
              >
                {loading ? "..." : t("premium.join")}
              </motion.button>
            </form>
          )}
        </motion.div>
      </div>
    </main>
  );
}
