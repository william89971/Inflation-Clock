"use client";

import { useI18n } from "@/locales/client";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  const t = useI18n();

  return (
    <div className="mx-auto mb-8 w-full max-w-md">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t("learn.hub.search")}
        className="w-full rounded-[12px] border border-border bg-white px-4 py-3 text-primary placeholder-text-muted outline-none transition-colors focus:border-bitcoin focus:ring-2 focus:ring-bitcoin/20"
      />
    </div>
  );
}
