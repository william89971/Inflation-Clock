"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { calculateInflation, formatCurrency } from "@/lib/calculations";
import { COUNTRIES, CountryCode } from "@/data/inflation";
import { trackEvent } from "@/lib/analytics";

const COUNTRY_CODES: CountryCode[] = ["US", "SV", "MX", "AR", "BR", "CO", "VE"];

const COUNTRY_NAMES: Record<CountryCode, string> = {
  US: "United States",
  SV: "El Salvador",
  MX: "Mexico",
  AR: "Argentina",
  BR: "Brazil",
  CO: "Colombia",
  VE: "Venezuela",
};

export default function EmbedPage() {
  const [country, setCountry] = useState<CountryCode>("US");
  const [age, setAge] = useState("");
  const [income, setIncome] = useState("");
  const [results, setResults] = useState<ReturnType<
    typeof calculateInflation
  > | null>(null);
  const [copied, setCopied] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  // Read query params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const qCountry = params.get("country") as CountryCode | null;
    const qTheme = params.get("theme");
    if (qCountry && COUNTRIES[qCountry]) setCountry(qCountry);
    if (qTheme === "light") setTheme("light");
    trackEvent("embed_load", { country: qCountry || "US" });
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!age || !income) return;
    const currentYear = new Date().getFullYear();
    const birthYear = currentYear - parseInt(age, 10);
    const res = calculateInflation(birthYear, country, parseFloat(income));
    setResults(res);
  }

  const isDark = theme === "dark";
  const bg = isDark ? "#111111" : "#ffffff";
  const cardBg = isDark ? "#1e1e1e" : "#f5f5f5";
  const textPrimary = isDark ? "#f5f5f5" : "#111111";
  const textSecondary = isDark ? "#a3a3a3" : "#666666";
  const borderColor = isDark ? "#2a2a2a" : "#e5e5e5";

  const embedCode = `<iframe src="${typeof window !== "undefined" ? window.location.origin : ""}/embed?country=${country}&theme=${theme}" width="400" height="500" frameborder="0" style="border-radius:16px;border:1px solid ${borderColor};"></iframe>`;

  function handleCopyEmbed() {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      style={{ backgroundColor: bg, color: textPrimary, minHeight: "100vh" }}
      className="flex flex-col items-center justify-center p-4"
    >
      <div
        style={{ backgroundColor: cardBg, borderColor }}
        className="w-full max-w-sm rounded-2xl border p-6"
      >
        {/* Branding */}
        <div className="mb-4 text-center">
          <h1
            style={{ color: "#dc2626" }}
            className="text-sm font-bold uppercase tracking-widest"
          >
            The Inflation Clock
          </h1>
        </div>

        {!results ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Country */}
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value as CountryCode)}
              style={{ backgroundColor: bg, borderColor, color: textPrimary }}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
            >
              {COUNTRY_CODES.map((code) => (
                <option key={code} value={code}>
                  {COUNTRY_NAMES[code]}
                </option>
              ))}
            </select>

            {/* Age */}
            <input
              type="number"
              min="1"
              max="120"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="Your age"
              style={{ backgroundColor: bg, borderColor, color: textPrimary }}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
              required
            />

            {/* Income */}
            <div className="relative">
              <span
                style={{ color: textSecondary }}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-sm"
              >
                {COUNTRIES[country].currencySymbol}
              </span>
              <input
                type="number"
                min="1"
                value={income}
                onChange={(e) => setIncome(e.target.value)}
                placeholder="Monthly income"
                style={{ backgroundColor: bg, borderColor, color: textPrimary }}
                className="w-full rounded-lg border py-2 pl-8 pr-3 text-sm outline-none"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-[#dc2626] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#991b1b]"
            >
              Show Me The Damage
            </button>
          </form>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <p
              style={{ color: textSecondary }}
              className="mb-2 text-xs uppercase tracking-widest"
            >
              Lifetime loss to inflation
            </p>
            <p
              style={{ color: "#dc2626" }}
              className="animate-pulse-glow mb-3 text-3xl font-black"
            >
              -{formatCurrency(results.lifetimeLoss, country)}
            </p>
            <p style={{ color: textSecondary }} className="mb-4 text-sm">
              Losing {formatCurrency(results.dailyLoss, country)}/day right now
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => setResults(null)}
                style={{ borderColor }}
                className="flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors hover:opacity-80"
              >
                Reset
              </button>
              <a
                href={`https://inflationclock.com/en/results?country=${country}&age=${age}&income=${income}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 rounded-lg bg-[#f7931a] px-3 py-2 text-xs font-bold text-black transition-colors hover:bg-[#c27614]"
              >
                Full Report
              </a>
            </div>
          </motion.div>
        )}

        {/* Powered by */}
        <div className="mt-4 text-center">
          <a
            href="https://inflationclock.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: textSecondary }}
            className="text-xs transition-colors hover:underline"
          >
            Powered by The Inflation Clock
          </a>
        </div>
      </div>

      {/* Embed code section (shown only if not in an iframe) */}
      {typeof window !== "undefined" && window === window.top && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 w-full max-w-lg"
        >
          <h2
            style={{ color: textPrimary }}
            className="mb-3 text-center text-lg font-bold"
          >
            Embed on your site
          </h2>
          <div
            style={{ backgroundColor: cardBg, borderColor }}
            className="rounded-xl border p-4"
          >
            <pre
              style={{ color: textSecondary }}
              className="mb-3 overflow-x-auto whitespace-pre-wrap text-xs"
            >
              {embedCode}
            </pre>
            <button
              onClick={handleCopyEmbed}
              className="w-full rounded-lg bg-[#f7931a] px-4 py-2 text-sm font-bold text-black transition-colors hover:bg-[#c27614]"
            >
              {copied ? "Copied!" : "Copy Embed Code"}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
