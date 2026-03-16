"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/locales/client";
import { motion } from "framer-motion";
import { CountryCode, COUNTRIES } from "@/data/inflation";

interface LiveTickerProps {
  lossPerSecond: number;
  country: CountryCode;
}

export function LiveTicker({ lossPerSecond, country }: LiveTickerProps) {
  const t = useI18n();
  const [totalLoss, setTotalLoss] = useState(0);
  const startTimeRef = useRef(Date.now());
  const frameRef = useRef<number>(0);

  const { currencySymbol } = COUNTRIES[country];

  useEffect(() => {
    startTimeRef.current = Date.now();

    function tick() {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      setTotalLoss(elapsed * lossPerSecond);
      frameRef.current = requestAnimationFrame(tick);
    }

    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [lossPerSecond]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="mx-auto w-full max-w-2xl rounded-[20px] border border-negative/20 bg-bg-card p-6 text-center shadow-lg"
    >
      <p className="mb-3 text-sm font-medium uppercase tracking-widest text-negative">
        {t("ticker.label")}
      </p>
      <div className="text-5xl font-black tabular-nums text-negative sm:text-6xl md:text-7xl">
        -{currencySymbol}
        {totalLoss.toFixed(6)}
      </div>
      <p className="mt-3 text-sm text-text-muted">{t("ticker.perSecond")}</p>
    </motion.div>
  );
}
