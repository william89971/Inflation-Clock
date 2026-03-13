"use client";

import { useState } from "react";
import { useI18n } from "@/locales/client";
import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/calculations";
import { CountryCode } from "@/data/inflation";

interface ShareCardProps {
  lifetimeLoss: number;
  country: CountryCode;
}

export function ShareCard({ lifetimeLoss, country }: ShareCardProps) {
  const t = useI18n();
  const [copied, setCopied] = useState(false);

  const shareText = t("share.text", {
    amount: formatCurrency(lifetimeLoss, country),
  });

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  function handleCopy() {
    navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleTwitter() {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, "_blank");
  }

  function handleWhatsApp() {
    const url = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`;
    window.open(url, "_blank");
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="mx-auto w-full max-w-4xl rounded-[20px] border border-border-light bg-bg-card p-8 text-center shadow-lg"
    >
      <h2 className="mb-6 font-[var(--font-heading)] text-xl font-bold text-[#2D3047]">{t("share.title")}</h2>

      {/* Preview card */}
      <div className="mx-auto mb-6 max-w-sm rounded-xl bg-gradient-to-br from-[#FFFBF5] to-[#FFF0E6] p-6 text-left border border-border-light">
        <p className="mb-1 text-xs font-medium uppercase tracking-widest text-negative">
          The Inflation Clock
        </p>
        <p className="text-3xl font-black text-[#2D3047]">
          -{formatCurrency(lifetimeLoss, country)}
        </p>
        <p className="mt-2 text-sm text-text-secondary">
          Lifetime purchasing power lost to inflation
        </p>
      </div>

      <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleTwitter}
          className="w-full rounded-lg bg-[#1DA1F2] px-6 py-3 font-medium text-white sm:w-auto"
        >
          {t("share.twitter")}
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleWhatsApp}
          className="w-full rounded-lg bg-[#25D366] px-6 py-3 font-medium text-white sm:w-auto"
        >
          {t("share.whatsapp")}
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleCopy}
          className="w-full rounded-lg border border-border-light bg-white px-6 py-3 font-medium text-[#2D3047] sm:w-auto"
        >
          {copied ? t("share.copied") : t("share.copy")}
        </motion.button>
      </div>
    </motion.div>
  );
}
