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
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
          <XAxis
            dataKey="year"
            stroke="#737373"
            tick={{ fill: "#737373", fontSize: 12 }}
          />
          <YAxis
            stroke="#737373"
            tick={{ fill: "#737373", fontSize: 12 }}
            tickFormatter={yAxisFormat}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1e1e1e",
              border: "1px solid #2a2a2a",
              borderRadius: "8px",
              color: "#f5f5f5",
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
