"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ChartDataPoint {
  year: number;
  [key: string]: number;
}

interface DataSeries {
  key: string;
  label: string;
  color: string;
  defaultVisible?: boolean;
}

interface InteractiveChartProps {
  title: string;
  data: ChartDataPoint[];
  series: DataSeries[];
  yAxisFormat?: (val: number) => string;
}

export function InteractiveChart({
  title,
  data,
  series,
  yAxisFormat = (val) => String(val),
}: InteractiveChartProps) {
  const [visible, setVisible] = useState<Set<string>>(
    new Set(
      series.filter((s) => s.defaultVisible !== false).map((s) => s.key)
    )
  );

  function toggleSeries(key: string) {
    setVisible((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="my-6 rounded-2xl border border-border bg-surface-card p-6"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h4 className="font-bold text-text-primary">{title}</h4>
        <div className="flex flex-wrap gap-2">
          {series.map((s) => (
            <button
              key={s.key}
              onClick={() => toggleSeries(s.key)}
              aria-label={`Toggle ${s.label} visibility`}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                visible.has(s.key)
                  ? "text-black"
                  : "border border-border text-text-muted"
              }`}
              style={
                visible.has(s.key)
                  ? { backgroundColor: s.color }
                  : undefined
              }
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(229, 221, 211, 0.5)" />
          <XAxis
            dataKey="year"
            stroke="#9CA3AF"
            tick={{ fill: "#9CA3AF", fontSize: 12 }}
          />
          <YAxis
            stroke="#9CA3AF"
            tick={{ fill: "#9CA3AF", fontSize: 12 }}
            tickFormatter={yAxisFormat}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#FFFBF5",
              border: "1px solid #E5DDD3",
              borderRadius: "8px",
              color: "#2D3047",
            }}
          />
          {series.map(
            (s) =>
              visible.has(s.key) && (
                <Area
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  stroke={s.color}
                  fill={s.color}
                  fillOpacity={0.1}
                  strokeWidth={2}
                  name={s.label}
                />
              )
          )}
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
