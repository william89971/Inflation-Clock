"use client";

import Link from "next/link";
import { useI18n, useCurrentLocale } from "@/locales/client";
import { motion } from "framer-motion";
import { ModuleMeta } from "@/content/modules";

interface RelatedModulesProps {
  nextModule: ModuleMeta | null;
  prevModule: ModuleMeta | null;
}

export function RelatedModules({ nextModule, prevModule }: RelatedModulesProps) {
  const t = useI18n();
  const locale = useCurrentLocale();

  if (!nextModule && !prevModule) return null;

  return (
    <div className="mt-12">
      <h3 className="mb-4 font-[var(--font-heading)] text-lg font-bold text-primary">{t("learn.module.related")}</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {prevModule && (
          <Link href={`/${locale}/learn/${prevModule.slug}`}>
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="rounded-[20px] border border-border bg-bg-card p-4 shadow-md transition-colors hover:border-bitcoin/30 hover:bg-bg-card-hover"
            >
              <span className="text-xs text-text-muted">&larr; Previous</span>
              <p className="mt-1 font-medium text-primary">
                {prevModule.icon}{" "}
                {t(prevModule.titleKey as Parameters<typeof t>[0])}
              </p>
            </motion.div>
          </Link>
        )}
        {nextModule && (
          <Link href={`/${locale}/learn/${nextModule.slug}`}>
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="rounded-[20px] border border-border bg-bg-card p-4 text-right shadow-md transition-colors hover:border-bitcoin/30 hover:bg-bg-card-hover"
            >
              <span className="text-xs text-text-muted">
                {t("learn.module.nextModule")} &rarr;
              </span>
              <p className="mt-1 font-medium text-primary">
                {nextModule.icon}{" "}
                {t(nextModule.titleKey as Parameters<typeof t>[0])}
              </p>
            </motion.div>
          </Link>
        )}
      </div>
    </div>
  );
}
