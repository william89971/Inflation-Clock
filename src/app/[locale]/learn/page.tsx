"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/locales/client";
import { motion } from "framer-motion";
import { MODULES, getModulesByPath } from "@/content/modules";
import { getAllProgress } from "@/lib/progress";
import { LearningPathSection } from "@/components/learn/LearningPathSection";
import { ProgressBar } from "@/components/learn/ProgressBar";
import { SearchBar } from "@/components/learn/SearchBar";

export default function LearnHubPage() {
  const t = useI18n();
  const [search, setSearch] = useState("");
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [completedModules, setCompletedModules] = useState(0);

  useEffect(() => {
    getAllProgress().then((data) => {
      const percentages: Record<string, number> = {};
      let completed = 0;
      for (const mod of MODULES) {
        const moduleData = data[mod.slug];
        if (moduleData) {
          // Approximate — we'll refine when content is loaded
          const pct = Math.min(100, moduleData.completed * 25);
          percentages[mod.slug] = pct;
          if (pct >= 100) completed++;
        }
      }
      setProgress(percentages);
      setCompletedModules(completed);
    });
  }, []);

  const paths = [1, 2, 3, 4, 5];

  const filteredBySearch = (modules: typeof MODULES) => {
    if (!search) return modules;
    const q = search.toLowerCase();
    return modules.filter(
      (m) =>
        m.slug.includes(q) ||
        t(m.titleKey as Parameters<typeof t>[0]).toLowerCase().includes(q) ||
        t(m.hookKey as Parameters<typeof t>[0]).toLowerCase().includes(q)
    );
  };

  return (
    <main className="min-h-screen bg-bg-primary pb-20 pt-24">
      <div className="mx-auto max-w-6xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <h1 className="mb-3 font-[var(--font-heading)] text-3xl font-extrabold text-text-heading sm:text-4xl md:text-5xl">
            {t("learn.hub.title")}
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-text-secondary">
            {t("learn.hub.subtitle")}
          </p>
        </motion.div>

        <ProgressBar completed={completedModules} total={MODULES.length} />
        <SearchBar value={search} onChange={setSearch} />

        {paths.map((pathNum) => {
          const modules = filteredBySearch(getModulesByPath(pathNum));
          if (modules.length === 0) return null;
          return (
            <LearningPathSection
              key={pathNum}
              pathNumber={pathNum}
              modules={modules}
              progress={progress}
            />
          );
        })}
      </div>
    </main>
  );
}
