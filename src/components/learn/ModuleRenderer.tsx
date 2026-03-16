"use client";

import { motion } from "framer-motion";
import { ModuleSection } from "@/content/modules";
import { ELI5Button } from "./ELI5Button";

interface ModuleRendererProps {
  section: ModuleSection;
}

export function ModuleRenderer({ section }: ModuleRendererProps) {
  // Split content by double newlines into paragraphs
  const paragraphs = section.content.split("\n\n").filter(Boolean);

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="prose-custom"
    >
      <h2 className="mb-6 font-[var(--font-heading)] text-2xl font-bold text-primary sm:text-3xl">
        {section.title}
      </h2>

      <div className="space-y-6">
        {paragraphs.map((paragraph, i) => {
          // Check if it's a subheading (starts with ##)
          if (paragraph.startsWith("## ")) {
            return (
              <h3
                key={i}
                className="mt-10 mb-3 font-[var(--font-heading)] text-xl font-bold text-text-heading"
              >
                {paragraph.replace("## ", "")}
              </h3>
            );
          }

          // Check if it's a blockquote (starts with >)
          if (paragraph.startsWith("> ")) {
            return (
              <blockquote
                key={i}
                className="rounded-r-[12px] border-l-4 border-bitcoin bg-bitcoin-soft/50 py-3 pl-4 pr-4 italic text-text-secondary"
              >
                {paragraph.replace(/^>\s?/gm, "")}
              </blockquote>
            );
          }

          // Check if it's a bullet list
          if (paragraph.startsWith("- ") || paragraph.startsWith("* ")) {
            const items = paragraph.split("\n").filter(Boolean);
            return (
              <ul key={i} className="ml-1 space-y-3">
                {items.map((item, j) => (
                  <li
                    key={j}
                    className="flex items-start gap-2 text-text-secondary leading-relaxed"
                  >
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-bitcoin" />
                    <span>{item.replace(/^[-*]\s/, "")}</span>
                  </li>
                ))}
              </ul>
            );
          }

          // Render bold markers **text** as React <strong> elements (no dangerouslySetInnerHTML)
          const parts = paragraph.split(/\*\*(.*?)\*\*/g);
          return (
            <p key={i} className="text-lg leading-relaxed text-text-secondary">
              {parts.map((part, j) =>
                j % 2 === 1 ? (
                  <strong key={j} className="text-text-primary font-semibold">
                    {part}
                  </strong>
                ) : (
                  part
                )
              )}
            </p>
          );
        })}
      </div>

      {section.eli5Available && (
        <ELI5Button
          sectionTitle={section.title}
          sectionContent={section.content}
        />
      )}
    </motion.article>
  );
}
