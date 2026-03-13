"use client";

import { motion } from "framer-motion";

interface QuoteCardProps {
  stat: string;
  description: string;
  source?: string;
}

export function QuoteCard({ stat, description, source }: QuoteCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      className="my-6 rounded-2xl border-l-4 border-bitcoin bg-surface-card p-6"
    >
      <p className="mb-2 text-3xl font-black text-bitcoin">{stat}</p>
      <p className="text-text-secondary">{description}</p>
      {source && (
        <p className="mt-2 text-xs text-text-muted">Source: {source}</p>
      )}
    </motion.div>
  );
}
