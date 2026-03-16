"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useI18n, useCurrentLocale } from "@/locales/client";
import { motion } from "framer-motion";
import {
  MODULES,
  getModuleContent,
  getNextModule,
  getPrevModule,
  ModuleData,
} from "@/content/modules";
import { markSectionComplete, getModuleProgress } from "@/lib/progress";
import { getUserData } from "@/lib/user-context";
import { ModuleRenderer } from "@/components/learn/ModuleRenderer";
import { SectionNav } from "@/components/learn/SectionNav";
import { RelatedModules } from "@/components/learn/RelatedModules";

export default function ModulePage() {
  const params = useParams();
  const router = useRouter();
  const t = useI18n();
  const locale = useCurrentLocale();

  const slug = params.slug as string;
  const [moduleData, setModuleData] = useState<ModuleData | null>(null);
  const [currentSection, setCurrentSection] = useState(0);
  const [completedSections, setCompletedSections] = useState<Set<number>>(
    new Set()
  );
  const [loading, setLoading] = useState(true);

  const meta = MODULES.find((m) => m.slug === slug);
  const nextModule = getNextModule(slug);
  const prevModule = getPrevModule(slug);

  useEffect(() => {
    setLoading(true);
    setCurrentSection(0);
    setCompletedSections(new Set());

    getModuleContent(slug, locale).then((data) => {
      setModuleData(data);
      setLoading(false);
    });

    // Load existing progress
    getModuleProgress(slug, 999).then((prog) => {
      const completed = new Set<number>();
      for (let i = 0; i < prog.completed; i++) completed.add(i);
      setCompletedSections(completed);
    });
  }, [slug, locale]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-primary">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-bitcoin border-t-transparent" />
      </div>
    );
  }

  if (!moduleData || !meta) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center">
        <p className="text-text-muted">Module not found</p>
        <button
          onClick={() => router.push(`/${locale}/learn`)}
          className="mt-4 text-bitcoin hover:underline"
        >
          {t("learn.module.back")}
        </button>
      </main>
    );
  }

  const section = moduleData.sections[currentSection];
  const userData = getUserData();

  async function handleMarkComplete() {
    await markSectionComplete(slug, currentSection, userData.country);
    setCompletedSections((prev) => new Set([...prev, currentSection]));
  }

  function handlePrev() {
    if (currentSection > 0) setCurrentSection(currentSection - 1);
  }

  function handleNext() {
    if (currentSection < moduleData!.sections.length - 1)
      setCurrentSection(currentSection + 1);
  }

  // Progress dots
  const totalSections = moduleData.sections.length;

  return (
    <main className="min-h-screen bg-bg-primary pb-20 pt-24">
      <div className="mx-auto max-w-3xl px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-8"
        >
          <button
            onClick={() => router.push(`/${locale}/learn`)}
            className="mb-4 text-sm text-text-muted transition-colors hover:text-bitcoin"
          >
            &larr; {t("learn.module.back")}
          </button>

          <div className="mb-2 flex items-center gap-3">
            <span className="text-3xl">{meta.icon}</span>
            <h1 className="font-[var(--font-heading)] text-2xl font-extrabold text-text-heading sm:text-3xl">
              {moduleData.title}
            </h1>
          </div>
          <p className="text-text-secondary">{moduleData.hook}</p>

          {/* Progress dots */}
          <div className="mt-4 flex items-center gap-1.5">
            {moduleData.sections.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSection(i)}
                className={`h-2 rounded-full transition-all ${
                  i === currentSection
                    ? "w-6 bg-bitcoin"
                    : completedSections.has(i)
                      ? "w-2 bg-positive"
                      : "w-2 bg-[#F3F0EB]"
                }`}
              />
            ))}
          </div>
        </motion.div>

        {/* Section content */}
        <div className="mb-8" key={currentSection}>
          <ModuleRenderer section={section} />
        </div>

        {/* Section navigation */}
        <SectionNav
          currentSection={currentSection}
          totalSections={totalSections}
          onPrev={handlePrev}
          onNext={handleNext}
          isCompleted={completedSections.has(currentSection)}
          onMarkComplete={handleMarkComplete}
        />

        {/* Related modules */}
        <RelatedModules nextModule={nextModule} prevModule={prevModule} />
      </div>
    </main>
  );
}
