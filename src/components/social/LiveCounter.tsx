"use client";

import { useState, useEffect, useRef } from "react";
import { useI18n } from "@/locales/client";
import { motion } from "framer-motion";

const COUNTRY_FLAGS: Record<string, string> = {
  US: "\u{1F1FA}\u{1F1F8}",
  SV: "\u{1F1F8}\u{1F1FB}",
  MX: "\u{1F1F2}\u{1F1FD}",
  AR: "\u{1F1E6}\u{1F1F7}",
  BR: "\u{1F1E7}\u{1F1F7}",
  CO: "\u{1F1E8}\u{1F1F4}",
  VE: "\u{1F1FB}\u{1F1EA}",
};

export function LiveCounter() {
  const t = useI18n();
  const [count, setCount] = useState<number | null>(null);
  const [countries, setCountries] = useState<string[]>([]);
  const [displayCount, setDisplayCount] = useState(0);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    fetch("/api/stats/counter")
      .then((r) => r.json())
      .then((data) => {
        const total = data.total_calculations ?? 0;
        setCount(total);
        if (data.countries) {
          setCountries(data.countries);
        } else if (data.country_count) {
          // Backwards compat: build a placeholder array
          setCountries([]);
        }

        // Animate the counter from 0 to total
        const duration = 2000;
        const startTime = performance.now();
        function step(currentTime: number) {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          // Ease out cubic
          const eased = 1 - Math.pow(1 - progress, 3);
          setDisplayCount(Math.round(eased * total));
          if (progress < 1) {
            animationRef.current = requestAnimationFrame(step);
          }
        }
        animationRef.current = requestAnimationFrame(step);
      })
      .catch(() => {});

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  if (count === null || count === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="mx-auto flex w-full max-w-4xl flex-col items-center gap-3 rounded-[20px] border border-border bg-bg-card px-6 py-4 text-center shadow-md sm:flex-row sm:justify-center"
    >
      <p className="text-sm text-text-secondary">
        {t("counter.people", { count: displayCount.toLocaleString() })}
      </p>

      {countries.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">
            {t("counter.countries", { count: countries.length.toString() })}
          </span>
          <div className="flex -space-x-1">
            {countries.slice(0, 7).map((code) => (
              <span
                key={code}
                className="inline-flex h-6 w-6 items-center justify-center rounded-full border-2 border-bg-card bg-bg-card text-xs"
              >
                {COUNTRY_FLAGS[code] || "\u{1F30D}"}
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
