"use client";

import Link from "next/link";
import { useI18n, useCurrentLocale } from "@/locales/client";
import { motion } from "framer-motion";
import { ModuleMeta } from "@/content/modules";

interface ModuleCardProps {
  module: ModuleMeta;
  progress?: number;
  index: number;
}

const PATH_BORDER_CLASS: Record<number, string> = {
  1: "module-card-money",
  2: "module-card-freedom",
  3: "module-card-industry",
  4: "module-card-technical",
  5: "module-card-action",
};

export function ModuleCard({ module, progress = 0, index }: ModuleCardProps) {
  const t = useI18n();
  const locale = useCurrentLocale();
  const isComplete = progress >= 100;
  const borderClass = PATH_BORDER_CLASS[module.path] || "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <Link
        href={`/${locale}/learn/${module.slug}`}
        className={`group relative block overflow-hidden rounded-[20px] border border-border bg-bg-card p-5 shadow-md transition-all hover:translate-y-[-3px] hover:border-bitcoin/50 hover:bg-bg-card-hover hover:shadow-lg ${borderClass}`}
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F3F0EB] text-lg">{module.order}</span>
            <span className="text-2xl">{module.icon}</span>
          </div>
          {isComplete && (
            <span className="rounded-full bg-positive-light px-2 py-0.5 text-xs text-positive">
              {t("learn.hub.completed")}
            </span>
          )}
          {module.order === 1 && !isComplete && (
            <span className="rounded-full bg-bitcoin/20 px-2 py-0.5 text-xs text-bitcoin">
              {t("learn.hub.startHere")}
            </span>
          )}
        </div>
        <h3 className="mb-1 font-[var(--font-heading)] font-bold text-primary group-hover:text-bitcoin transition-colors">
          {t(module.titleKey as Parameters<typeof t>[0])}
        </h3>
        <p className="mb-3 text-sm text-text-muted line-clamp-2">
          {t(module.hookKey as Parameters<typeof t>[0])}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-text-muted">
            {t("learn.hub.readTime", { min: String(module.readTime) })}
          </span>
          {progress > 0 && progress < 100 && (
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[#F3F0EB]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-bitcoin to-bitcoin-light transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs text-text-muted">{progress}%</span>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
