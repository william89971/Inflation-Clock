"use client";

import { useI18n } from "@/locales/client";
import { motion } from "framer-motion";

interface ProgressBarProps {
  completed: number;
  total: number;
}

export function ProgressBar({ completed, total }: ProgressBarProps) {
  const t = useI18n();
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="mx-auto mb-10 w-full max-w-2xl">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-text-secondary">
          {t("learn.hub.progress")}
        </span>
        <span className="text-sm text-text-muted">
          {completed}/{total} modules ({percentage}%)
        </span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-[#F3F0EB]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="h-full rounded-full bg-gradient-to-r from-bitcoin to-bitcoin-light"
        />
      </div>
    </div>
  );
}
