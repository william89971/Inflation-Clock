"use client";

import { useEffect, useState, useCallback } from "react";
import type { BitcoinVitals } from "@/types/monitor";
import { formatSats, dollarsToSats } from "@/lib/sats";

interface Props {
  initial?: BitcoinVitals | null;
  locale: string;
}

export default function BitcoinVitalsPanel({ initial, locale }: Props) {
  const [data, setData] = useState<BitcoinVitals | null>(initial ?? null);
  const [flash, setFlash] = useState<"up" | "down" | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/bitcoin-monitor?type=vitals");
      if (!res.ok) return;
      const fresh: BitcoinVitals = await res.json();
      setData((prev) => {
        if (prev && fresh.price !== prev.price) {
          setFlash(fresh.price > prev.price ? "up" : "down");
          setTimeout(() => setFlash(null), 600);
        }
        return fresh;
      });
    } catch {
      /* keep stale data */
    }
  }, []);

  useEffect(() => {
    if (!initial) refresh();
    let id = setInterval(refresh, 30_000);

    // Pause polling when tab is hidden to save API calls
    function handleVisibility() {
      clearInterval(id);
      if (!document.hidden) {
        refresh();
        id = setInterval(refresh, 30_000);
      }
    }
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [refresh, initial]);

  if (!data) {
    return (
      <div className="card-warm rounded-2xl p-6 animate-pulse">
        <div className="h-8 w-40 rounded bg-border/30 mb-3" />
        <div className="h-5 w-24 rounded bg-border/30" />
      </div>
    );
  }

  const isPositive = data.change24h >= 0;
  const sats = dollarsToSats(1, data.price);

  return (
    <div className="card-warm rounded-2xl p-6">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-4">
        {locale === "es" ? "Bitcoin en Vivo" : "Bitcoin Live"}
      </h3>

      {/* Price */}
      <div className="mb-4">
        <span
          className={`font-[var(--font-heading)] text-4xl font-extrabold tabular-nums transition-colors duration-300 ${
            flash === "up"
              ? "text-positive"
              : flash === "down"
                ? "text-negative"
                : "text-bitcoin"
          }`}
        >
          ${data.price.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
        </span>
        <span
          className={`ml-3 text-sm font-bold ${isPositive ? "text-positive" : "text-negative"}`}
        >
          {isPositive ? "+" : ""}
          {data.change24h.toFixed(2)}%
        </span>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <Stat
          label={locale === "es" ? "Sats por $1" : "Sats per $1"}
          value={formatSats(sats)}
        />
        <Stat
          label={locale === "es" ? "Altura del Bloque" : "Block Height"}
          value={data.blockHeight > 0 ? data.blockHeight.toLocaleString() : "—"}
        />
        <Stat
          label="Mempool"
          value={
            data.mempoolTxCount > 0
              ? `${(data.mempoolTxCount / 1000).toFixed(1)}K tx`
              : "—"
          }
        />
        <Stat
          label={locale === "es" ? "Proximo Halving" : "Next Halving"}
          value={
            data.halvingCountdown.blocksRemaining > 0
              ? `${(data.halvingCountdown.blocksRemaining / 1000).toFixed(0)}K blocks`
              : "—"
          }
          sublabel={
            data.halvingCountdown.currentReward > 0
              ? `${data.halvingCountdown.currentReward} BTC/block`
              : undefined
          }
        />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  sublabel,
}: {
  label: string;
  value: string;
  sublabel?: string;
}) {
  return (
    <div className="rounded-xl bg-bg-primary/60 px-3 py-2.5">
      <p className="text-[11px] font-medium text-text-muted">{label}</p>
      <p className="font-[var(--font-heading)] text-sm font-bold text-text-heading tabular-nums">
        {value}
      </p>
      {sublabel && (
        <p className="text-[10px] text-text-muted">{sublabel}</p>
      )}
    </div>
  );
}
