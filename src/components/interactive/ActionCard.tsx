"use client";

import { motion } from "framer-motion";
import { trackAffiliateClick } from "@/lib/progress";

interface ActionCardProps {
  title: string;
  description: string;
  buttonText: string;
  href: string;
  platform: string;
  country?: string;
  moduleSlug?: string;
  icon?: string;
}

export function ActionCard({
  title,
  description,
  buttonText,
  href,
  platform,
  country,
  moduleSlug,
  icon,
}: ActionCardProps) {
  function handleClick() {
    trackAffiliateClick(platform, country, moduleSlug);
    window.open(href, "_blank");
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="rounded-xl border border-border bg-surface-card p-5 transition-colors hover:border-bitcoin/30"
    >
      <div className="mb-2 flex items-center gap-2">
        {icon && <span className="text-xl">{icon}</span>}
        <h4 className="font-bold text-text-primary">{title}</h4>
      </div>
      <p className="mb-4 text-sm text-text-muted">{description}</p>
      <button
        onClick={handleClick}
        className="rounded-lg bg-bitcoin px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-bitcoin-dark"
      >
        {buttonText}
      </button>
    </motion.div>
  );
}
