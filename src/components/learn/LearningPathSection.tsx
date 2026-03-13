"use client";

import { useI18n, useCurrentLocale } from "@/locales/client";
import { ModuleMeta } from "@/content/modules";
import { ModuleCard } from "./ModuleCard";

const PATH_SUBTITLES: Record<number, { en: string; es: string }> = {
  1: { en: "Understanding what\u2019s broken is the first step to fixing it.", es: "Entender lo que est\u00e1 roto es el primer paso para arreglarlo." },
  2: { en: "How Bitcoin is changing lives around the world.", es: "C\u00f3mo Bitcoin est\u00e1 cambiando vidas alrededor del mundo." },
  3: { en: "How Bitcoin is transforming business, energy, and the environment.", es: "C\u00f3mo Bitcoin est\u00e1 transformando negocios, energ\u00eda y medio ambiente." },
  4: { en: "The technical side, explained without jargon.", es: "El lado t\u00e9cnico, explicado sin jerga." },
  5: { en: "You\u2019ve learned the why. Now here\u2019s the how.", es: "Ya aprendiste el porqu\u00e9. Ahora el c\u00f3mo." },
};

const PATH_ICONS: Record<number, string> = {
  1: "\uD83D\uDCB8",
  2: "\uD83C\uDF0D",
  3: "\uD83C\uDFD7\uFE0F",
  4: "\u26A1",
  5: "\uD83D\uDE80",
};

interface LearningPathSectionProps {
  pathNumber: number;
  modules: ModuleMeta[];
  progress: Record<string, number>;
}

export function LearningPathSection({
  pathNumber,
  modules,
  progress,
}: LearningPathSectionProps) {
  const t = useI18n();
  const locale = useCurrentLocale();
  const pathKey = `learn.path.${pathNumber}` as Parameters<typeof t>[0];
  const subtitle = PATH_SUBTITLES[pathNumber];
  const icon = PATH_ICONS[pathNumber] || "";

  return (
    <section className="mb-12">
      <h2 className="mb-1 font-[var(--font-heading)] text-xl font-bold text-text-heading">
        {icon} {t(pathKey)}
      </h2>
      {subtitle && (
        <p className="mb-3 text-sm text-text-secondary">
          {locale === "es" ? subtitle.es : subtitle.en}
        </p>
      )}
      <div className="mb-4 h-px bg-border" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((mod, i) => (
          <ModuleCard
            key={mod.slug}
            module={mod}
            progress={progress[mod.slug] ?? 0}
            index={i}
          />
        ))}
      </div>
    </section>
  );
}
