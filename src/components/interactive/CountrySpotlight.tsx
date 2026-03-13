"use client";

import { motion } from "framer-motion";
import { getUserData } from "@/lib/user-context";
import { COUNTRIES, CountryCode } from "@/data/inflation";

interface CountryData {
  [key: string]: {
    flag: string;
    stats: { label: string; value: string }[];
  };
}

interface CountrySpotlightProps {
  data: CountryData;
}

export function CountrySpotlight({ data }: CountrySpotlightProps) {
  const userData = getUserData();
  const country = userData.country;
  const countryData = data[country] || data["US"];
  const config = COUNTRIES[country];

  if (!countryData) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="my-6 rounded-2xl border border-bitcoin/20 bg-gradient-to-br from-bitcoin/5 to-surface-card p-6"
    >
      <div className="mb-4 flex items-center gap-3">
        <span className="text-3xl">{countryData.flag}</span>
        <div>
          <h4 className="font-bold text-text-primary">Your Country Spotlight</h4>
          <p className="text-sm text-text-muted">{config.currency}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {countryData.stats.map((stat, i) => (
          <div key={i} className="rounded-lg bg-surface p-3">
            <p className="text-lg font-bold text-bitcoin">{stat.value}</p>
            <p className="text-xs text-text-muted">{stat.label}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
