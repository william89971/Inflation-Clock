"use client";

import { useEffect, useState } from "react";
import { useCurrentLocale } from "@/locales/client";
import { motion } from "framer-motion";
import { CountryCode } from "@/data/inflation";

interface LocalPrice {
  item: string;
  item_label: { en: string; es: string };
  emoji: string;
  unit: string;
  current_price: number;
  price_5yr_ago: number | null;
  change_5yr_pct: number | null;
}

interface LocalPriceCardProps {
  country: CountryCode;
  region?: string;
  currencySymbol?: string;
}

export function LocalPriceCard({ country, region, currencySymbol = "$" }: LocalPriceCardProps) {
  const locale = useCurrentLocale();
  const [prices, setPrices] = useState<LocalPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!region) {
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const res = await fetch(`/api/prices/local?country=${country.toLowerCase()}&region=${encodeURIComponent(region!)}`);
        if (!res.ok) {
          setError(true);
          setLoading(false);
          return;
        }
        const data = await res.json();
        setPrices((data.prices || []).slice(0, 6));
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [country, region]);

  if (loading) {
    return (
      <div className="mt-6 flex items-center justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-bitcoin border-t-transparent" />
      </div>
    );
  }

  if (error || !region || prices.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
      className="mt-8"
    >
      <h3 className="mb-4 font-[var(--font-heading)] text-lg font-bold text-text-heading">
        {locale === "es" ? "Precios Locales" : "Local Prices"}
        <span className="ml-2 text-sm font-normal text-text-muted">
          {region.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}
        </span>
      </h3>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {prices.map((item, i) => (
          <motion.div
            key={item.item}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i }}
            className="card-warm rounded-xl p-4"
          >
            <div className="mb-2 text-2xl">{item.emoji}</div>
            <p className="text-sm font-medium text-text-heading">
              {locale === "es" ? item.item_label.es : item.item_label.en}
            </p>
            <p className="mt-1 font-[var(--font-heading)] text-lg font-bold text-text-heading">
              {currencySymbol}{Number(item.current_price).toFixed(2)}
            </p>
            {item.price_5yr_ago != null && item.change_5yr_pct != null && (
              <div className="mt-1 flex items-center gap-1">
                <span className="text-xs text-text-muted">
                  {locale === "es" ? "hace 5a" : "5yr ago"}: {currencySymbol}{Number(item.price_5yr_ago).toFixed(2)}
                </span>
                <span className={`text-xs font-semibold ${Number(item.change_5yr_pct) > 0 ? "text-negative" : "text-positive"}`}>
                  {Number(item.change_5yr_pct) > 0 ? "+" : ""}{Number(item.change_5yr_pct).toFixed(0)}%
                </span>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
