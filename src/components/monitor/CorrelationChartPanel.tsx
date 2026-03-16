"use client";

import { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { CorrelationPoint } from "@/types/monitor";

interface Props {
  data: CorrelationPoint[];
  locale: string;
}

type TimeRange = "1y" | "5y" | "10y" | "all";

export default function CorrelationChartPanel({ data, locale }: Props) {
  const [range, setRange] = useState<TimeRange>("5y");
  const [showM2, setShowM2] = useState(true);
  const [showBtc, setShowBtc] = useState(true);

  const filtered = useMemo(() => {
    if (!data.length) return [];
    const now = new Date();
    let cutoff = "2010-01";
    if (range === "1y") {
      cutoff = `${now.getFullYear() - 1}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    } else if (range === "5y") {
      cutoff = `${now.getFullYear() - 5}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    } else if (range === "10y") {
      cutoff = `${now.getFullYear() - 10}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    }
    return data.filter((d) => d.date >= cutoff);
  }, [data, range]);

  if (!data.length) {
    return (
      <div className="card-warm rounded-2xl p-6">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">
          {locale === "es" ? "Correlacion" : "Correlation"}
        </h3>
        <p className="text-sm text-text-muted">
          {locale === "es" ? "Cargando datos..." : "Loading data..."}
        </p>
      </div>
    );
  }

  const ranges: TimeRange[] = ["1y", "5y", "10y", "all"];

  return (
    <div className="card-warm rounded-2xl p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            {locale === "es"
              ? "Bitcoin vs Oferta Monetaria"
              : "Bitcoin vs Money Supply"}
          </h3>
          <p className="text-[10px] text-text-muted mt-0.5">
            {locale === "es"
              ? "Cuando imprimen dinero, Bitcoin responde"
              : "When they print money, Bitcoin responds"}
          </p>
        </div>
        <div className="flex gap-1">
          {ranges.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                range === r
                  ? "bg-bitcoin text-white"
                  : "text-text-muted hover:bg-bg-primary"
              }`}
            >
              {r.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Series toggles */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setShowBtc(!showBtc)}
          className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${
            showBtc
              ? "bg-bitcoin/20 text-bitcoin"
              : "border border-border text-text-muted"
          }`}
        >
          Bitcoin
        </button>
        <button
          onClick={() => setShowM2(!showM2)}
          className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${
            showM2
              ? "bg-positive/20 text-positive"
              : "border border-border text-text-muted"
          }`}
        >
          M2 {locale === "es" ? "Oferta" : "Supply"}
        </button>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={filtered}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #E5DDD3)" opacity={0.5} />
          <XAxis
            dataKey="date"
            stroke="#9CA3AF"
            tick={{ fill: "#9CA3AF", fontSize: 10 }}
            tickFormatter={(v) => {
              const [y, m] = v.split("-");
              return m === "01" ? y : "";
            }}
          />
          {showBtc && (
            <YAxis
              yAxisId="btc"
              orientation="left"
              stroke="#F7931A"
              tick={{ fill: "#F7931A", fontSize: 10 }}
              tickFormatter={(v) =>
                v >= 1000 ? `$${(v / 1000).toFixed(0)}K` : `$${v}`
              }
            />
          )}
          {showM2 && (
            <YAxis
              yAxisId="m2"
              orientation="right"
              stroke="#2EC4B6"
              tick={{ fill: "#2EC4B6", fontSize: 10 }}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}T`}
            />
          )}
          <Tooltip
            contentStyle={{
              backgroundColor: "#FFFBF5",
              border: "1px solid #E5DDD3",
              borderRadius: "12px",
              fontSize: "12px",
            }}
            formatter={(value: unknown, name: unknown) => {
              const v = Number(value);
              const n = String(name);
              if (n === "btcPrice")
                return [`$${v.toLocaleString()}`, "Bitcoin"];
              if (n === "m2Supply")
                return [`$${(v / 1000).toFixed(1)}T`, "M2 Supply"];
              return [String(v), n];
            }}
            labelFormatter={(label) => label}
          />
          {showBtc && (
            <Area
              yAxisId="btc"
              type="monotone"
              dataKey="btcPrice"
              stroke="#F7931A"
              fill="#F7931A"
              fillOpacity={0.08}
              strokeWidth={2}
              name="btcPrice"
              connectNulls
            />
          )}
          {showM2 && (
            <Area
              yAxisId="m2"
              type="monotone"
              dataKey="m2Supply"
              stroke="#2EC4B6"
              fill="#2EC4B6"
              fillOpacity={0.08}
              strokeWidth={2}
              name="m2Supply"
              connectNulls
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
