"use client";

import { useState, useEffect } from "react";
import { useI18n, useCurrentLocale } from "@/locales/client";
import { motion } from "framer-motion";
import { getUserData } from "@/lib/user-context";

interface PersonalizedInsightProps {
  moduleSlug: string;
  moduleTopic: string;
}

export function PersonalizedInsight({
  moduleSlug,
  moduleTopic,
}: PersonalizedInsightProps) {
  const t = useI18n();
  const locale = useCurrentLocale();
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const userData = getUserData();
    setLoading(true);

    fetch("/api/insights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        moduleSlug,
        moduleTopic,
        country: userData.country,
        age: userData.age,
        income: userData.income,
        language: locale,
      }),
    })
      .then((r) => r.json())
      .then((data) => setInsight(data.insight))
      .catch(() => setInsight(null))
      .finally(() => setLoading(false));
  }, [moduleSlug, moduleTopic, locale]);

  if (!loading && !insight) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[20px] border border-bitcoin/30 bg-gradient-to-br from-bitcoin/5 to-white p-6 shadow-md"
    >
      <h3 className="mb-3 font-[var(--font-heading)] text-lg font-bold text-bitcoin">
        {t("learn.module.insight")}
      </h3>
      {loading ? (
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-bitcoin border-t-transparent" />
          <span className="text-sm text-text-muted">
            {t("learn.module.insightLoading")}
          </span>
        </div>
      ) : (
        <p className="text-text-secondary leading-relaxed">{insight}</p>
      )}
    </motion.div>
  );
}
