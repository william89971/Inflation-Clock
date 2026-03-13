"use client";

import { useState } from "react";
import { useI18n, useCurrentLocale } from "@/locales/client";
import { motion, AnimatePresence } from "framer-motion";

interface ELI5ButtonProps {
  sectionTitle: string;
  sectionContent: string;
}

export function ELI5Button({ sectionTitle, sectionContent }: ELI5ButtonProps) {
  const t = useI18n();
  const locale = useCurrentLocale();
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  async function handleClick() {
    if (explanation) {
      setOpen(!open);
      return;
    }

    setLoading(true);
    setOpen(true);

    try {
      const res = await fetch("/api/eli5", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: sectionTitle,
          content: sectionContent.slice(0, 2000),
          language: locale,
        }),
      });
      const data = await res.json();
      setExplanation(data.explanation);
    } catch {
      setExplanation("Could not generate a simplified explanation right now.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4">
      <button
        onClick={handleClick}
        className="eli5-button"
      >
        <span>\uD83D\uDCA1</span>
        {loading ? t("learn.module.eli5Loading") : t("learn.module.eli5")}
      </button>

      <AnimatePresence>
        {open && explanation && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 overflow-hidden rounded-[20px] border border-highlight bg-highlight-light p-4"
          >
            <p className="text-sm leading-relaxed text-[#B45309]">
              {explanation}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
