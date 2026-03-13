"use client";

import { useI18n } from "@/locales/client";
import { motion } from "framer-motion";

interface SectionNavProps {
  currentSection: number;
  totalSections: number;
  onPrev: () => void;
  onNext: () => void;
  isCompleted: boolean;
  onMarkComplete: () => void;
}

export function SectionNav({
  currentSection,
  totalSections,
  onPrev,
  onNext,
  isCompleted,
  onMarkComplete,
}: SectionNavProps) {
  const t = useI18n();

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
      <button
        onClick={onPrev}
        disabled={currentSection === 0}
        className="btn-secondary px-4 py-2 text-sm disabled:opacity-30 disabled:cursor-not-allowed"
      >
        &larr; {t("learn.module.prev")}
      </button>

      <div className="flex items-center gap-3">
        <span className="text-sm text-text-muted">
          {t("learn.module.section", {
            current: String(currentSection + 1),
            total: String(totalSections),
          })}
        </span>
        {!isCompleted ? (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onMarkComplete}
            className="rounded-[14px] bg-positive/15 px-3 py-1.5 text-xs font-medium text-positive transition-colors hover:bg-positive/25"
          >
            {t("learn.module.complete")}
          </motion.button>
        ) : (
          <span className="rounded-[14px] bg-positive-light px-3 py-1.5 text-xs font-medium text-positive">
            {t("learn.module.completed")}
          </span>
        )}
      </div>

      <motion.button
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.97 }}
        onClick={onNext}
        disabled={currentSection >= totalSections - 1}
        className="btn-primary px-5 py-2 text-sm disabled:opacity-30 disabled:cursor-not-allowed"
      >
        {t("learn.module.next")} &rarr;
      </motion.button>
    </div>
  );
}
