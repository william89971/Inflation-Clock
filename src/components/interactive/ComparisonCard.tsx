"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface ComparisonCardProps {
  leftTitle: string;
  rightTitle: string;
  items: {
    label: string;
    left: string;
    right: string;
    advantage?: "left" | "right";
  }[];
}

export function ComparisonCard({
  leftTitle,
  rightTitle,
  items,
}: ComparisonCardProps) {
  const [flipped, setFlipped] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="my-6 overflow-hidden rounded-2xl border border-border bg-surface-card"
    >
      {/* Header */}
      <div className="grid grid-cols-3 border-b border-border">
        <div className="p-3 text-center text-sm font-bold text-blood">
          {leftTitle}
        </div>
        <div className="flex items-center justify-center border-x border-border p-3">
          <button
            onClick={() => setFlipped(!flipped)}
            className="text-xs text-text-muted hover:text-text-primary"
          >
            ↔ Swap
          </button>
        </div>
        <div className="p-3 text-center text-sm font-bold text-bitcoin">
          {rightTitle}
        </div>
      </div>

      {/* Rows */}
      {items.map((item, i) => (
        <div
          key={i}
          className="grid grid-cols-3 border-b border-border last:border-b-0"
        >
          <div
            className={`p-3 text-center text-sm ${
              (flipped ? item.advantage === "right" : item.advantage === "left")
                ? "text-text-primary font-medium"
                : "text-text-muted"
            }`}
          >
            {flipped ? item.right : item.left}
          </div>
          <div className="flex items-center justify-center border-x border-border p-3 text-xs text-text-muted">
            {item.label}
          </div>
          <div
            className={`p-3 text-center text-sm ${
              (flipped ? item.advantage === "left" : item.advantage === "right")
                ? "text-text-primary font-medium"
                : "text-text-muted"
            }`}
          >
            {flipped ? item.left : item.right}
          </div>
        </div>
      ))}
    </motion.div>
  );
}
