"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/locales/client";
import { trackEvent } from "@/lib/analytics";
import { getSupabase } from "@/lib/supabase";

const REACTIONS = [
  { id: "angry", emoji: "\uD83D\uDE21", ariaLabel: "Angry" },
  { id: "shocked", emoji: "\uD83D\uDE31", ariaLabel: "Mind blown" },
  { id: "motivated", emoji: "\uD83D\uDCAA", ariaLabel: "Motivated" },
  { id: "scared", emoji: "\uD83D\uDE30", ariaLabel: "Scared" },
] as const;

interface ReactionBarProps {
  country?: string;
}

interface AggregateData {
  [key: string]: number;
}

export function ReactionBar({ country }: ReactionBarProps) {
  const t = useI18n();
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [aggregates, setAggregates] = useState<AggregateData | null>(null);

  async function fetchAggregates() {
    const sb = getSupabase();
    if (!sb) return;

    try {
      const { data } = await sb
        .from("user_reactions")
        .select("reaction")
        .eq("module_slug", "inflation-clock-results");

      if (!data || data.length === 0) return;

      const counts: AggregateData = {};
      const total = data.length;

      for (const row of data) {
        counts[row.reaction] = (counts[row.reaction] || 0) + 1;
      }

      // Convert to percentages
      const percentages: AggregateData = {};
      for (const key of Object.keys(counts)) {
        percentages[key] = Math.round((counts[key] / total) * 100);
      }

      setAggregates(percentages);
    } catch {
      // Silently fail
    }
  }

  async function handleReaction(reaction: string) {
    if (submitted) return;
    setSelected(reaction);
    setSubmitted(true);

    trackEvent("reaction_submit", { reaction, country });

    const sb = getSupabase();
    if (sb) {
      const sessionId = localStorage.getItem("session_id") || "";
      await sb.from("user_reactions").upsert(
        {
          session_id: sessionId,
          module_slug: "inflation-clock-results",
          reaction,
        },
        { onConflict: "session_id,module_slug,section_index" }
      );
    }

    // Fetch aggregate data after submitting
    await fetchAggregates();
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="card-warm mx-auto w-full max-w-md p-6 text-center"
    >
      <p className="mb-4 text-sm font-medium text-text-secondary">
        {t("reaction.title")}
      </p>

      <div className="flex justify-center gap-4">
        {REACTIONS.map((r) => (
          <motion.button
            key={r.id}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleReaction(r.id)}
            disabled={submitted}
            aria-label={r.ariaLabel}
            className={`flex flex-col items-center gap-1 rounded-[14px] px-3 py-2 transition-all ${
              selected === r.id
                ? "bg-bg-card-hover ring-2 ring-bitcoin"
                : submitted
                  ? "opacity-40"
                  : "hover:bg-bg-card-hover"
            }`}
          >
            <span className="text-2xl" aria-hidden="true">{r.emoji}</span>
            <span className="text-xs text-text-muted">
              {t(`reaction.${r.id}` as Parameters<typeof t>[0])}
            </span>
          </motion.button>
        ))}
      </div>

      {/* Aggregate percentages shown after voting */}
      <AnimatePresence>
        {submitted && aggregates && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: 0.4 }}
            className="mt-4 space-y-2"
          >
            {REACTIONS.map((r) => {
              const pct = aggregates[r.id] || 0;
              return (
                <div key={r.id} className="flex items-center gap-2">
                  <span className="w-6 text-center text-sm">{r.emoji}</span>
                  <div className="flex-1">
                    <div className="progress-warm h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className={`h-full rounded-full ${
                          selected === r.id ? "progress-warm-fill" : "bg-text-muted"
                        }`}
                      />
                    </div>
                  </div>
                  <span className="w-10 text-right text-xs text-text-muted">
                    {pct}%
                  </span>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
