"use client";

import { useState, useEffect, useCallback } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";

/* ── Types ─────────────────────────────────────────────────────────── */

interface RevenueData {
  total_clicks: number;
  total_estimated_revenue: number;
  clicks_by_partner: {
    partner: string;
    clicks: number;
    estimated_conversion_rate: number;
    estimated_revenue: number;
  }[];
  clicks_by_country: { country: string; clicks: number }[];
  top_converting_modules: { module_slug: string; clicks: number }[];
  revenue_trend: { date: string; clicks: number }[];
}

/* ── Cookie helper ─────────────────────────────────────────────────── */

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}

/* ── Custom tooltip ────────────────────────────────────────────────── */

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; name: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-card border border-border rounded-lg p-3 shadow-xl">
      <p className="text-xs text-text-muted mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-sm font-medium text-text-primary">
          {entry.name}: {entry.value.toLocaleString()}
        </p>
      ))}
    </div>
  );
}

/* ── Page ──────────────────────────────────────────────────────────── */

export default function AdminRevenuePage() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const token = getCookie("admin_token");
      const res = await fetch("/api/admin/revenue", {
        headers: token ? { "x-admin-password": token } : {},
      });
      if (!res.ok) throw new Error("Failed to fetch revenue data");
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-bitcoin border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-blood/10 border border-blood/20 rounded-xl p-6 text-center">
        <p className="text-blood font-medium">{error || "Failed to load data"}</p>
        <button onClick={fetchData} className="mt-3 text-sm text-text-muted hover:text-text-primary underline">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Revenue</h1>
        <p className="text-sm text-text-muted mt-1">Affiliate performance and revenue estimates</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface-card border border-border rounded-xl p-5">
          <p className="text-sm text-text-muted mb-1">Total Affiliate Clicks</p>
          <p className="text-3xl font-bold text-text-primary">{data.total_clicks.toLocaleString()}</p>
        </div>
        <div className="bg-surface-card border border-border rounded-xl p-5">
          <p className="text-sm text-text-muted mb-1">Estimated Revenue</p>
          <p className="text-3xl font-bold text-bitcoin">${data.total_estimated_revenue.toLocaleString()}</p>
        </div>
        <div className="bg-surface-card border border-border rounded-xl p-5">
          <p className="text-sm text-text-muted mb-1">Active Partners</p>
          <p className="text-3xl font-bold text-text-primary">{data.clicks_by_partner.length}</p>
        </div>
      </div>

      {/* Revenue trend */}
      <div className="bg-surface-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-6">Clicks Per Day (30 days)</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.revenue_trend}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f7931a" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f7931a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis
                dataKey="date"
                tick={{ fill: "#737373", fontSize: 10 }}
                axisLine={{ stroke: "#2a2a2a" }}
                tickFormatter={(val: string) => {
                  const d = new Date(val);
                  return `${d.getMonth() + 1}/${d.getDate()}`;
                }}
                interval={4}
              />
              <YAxis tick={{ fill: "#a3a3a3", fontSize: 12 }} axisLine={{ stroke: "#2a2a2a" }} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="clicks"
                name="Clicks"
                stroke="#f7931a"
                fill="url(#revenueGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Clicks by partner */}
        <div className="bg-surface-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Clicks by Partner</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 text-text-muted font-medium">Partner</th>
                  <th className="text-right py-3 px-2 text-text-muted font-medium">Clicks</th>
                  <th className="text-right py-3 px-2 text-text-muted font-medium">Conv. Rate</th>
                  <th className="text-right py-3 px-2 text-text-muted font-medium">Est. Rev.</th>
                </tr>
              </thead>
              <tbody>
                {data.clicks_by_partner.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-text-muted">
                      No affiliate data yet
                    </td>
                  </tr>
                ) : (
                  data.clicks_by_partner.map((row) => (
                    <tr key={row.partner} className="border-b border-border last:border-0 hover:bg-surface-hover transition-colors">
                      <td className="py-3 px-2 text-text-primary font-medium capitalize">{row.partner}</td>
                      <td className="py-3 px-2 text-right text-text-secondary">{row.clicks.toLocaleString()}</td>
                      <td className="py-3 px-2 text-right text-text-secondary">
                        {(row.estimated_conversion_rate * 100).toFixed(1)}%
                      </td>
                      <td className="py-3 px-2 text-right text-bitcoin font-medium">
                        ${row.estimated_revenue.toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Clicks by country */}
        <div className="bg-surface-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Clicks by Country</h2>
          {data.clicks_by_country.length === 0 ? (
            <p className="text-text-muted text-sm">No country data available</p>
          ) : (
            <>
              <div className="h-48 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.clicks_by_country.slice(0, 8)}>
                    <XAxis
                      dataKey="country"
                      tick={{ fill: "#a3a3a3", fontSize: 11 }}
                      axisLine={{ stroke: "#2a2a2a" }}
                    />
                    <YAxis tick={{ fill: "#a3a3a3", fontSize: 11 }} axisLine={{ stroke: "#2a2a2a" }} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(247, 147, 26, 0.05)" }} />
                    <Bar dataKey="clicks" name="Clicks" fill="#f7931a" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {data.clicks_by_country.map((row, i) => (
                  <div key={row.country} className="flex items-center gap-3 text-sm">
                    <span className="w-5 text-text-muted">{i + 1}</span>
                    <span className="flex-1 text-text-primary">{row.country}</span>
                    <span className="text-text-secondary">{row.clicks.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Top converting modules */}
      <div className="bg-surface-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Top Converting Modules</h2>
        <p className="text-sm text-text-muted mb-4">
          Education modules that lead to the most affiliate clicks
        </p>
        {data.top_converting_modules.length === 0 ? (
          <p className="text-text-muted text-sm">No module conversion data yet</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.top_converting_modules.map((mod, i) => (
              <div
                key={mod.module_slug}
                className="bg-surface border border-border rounded-lg p-4 flex items-center gap-3"
              >
                <span
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                    i === 0
                      ? "bg-bitcoin/20 text-bitcoin"
                      : i === 1
                      ? "bg-text-muted/20 text-text-secondary"
                      : i === 2
                      ? "bg-amber-900/20 text-amber-600"
                      : "bg-surface-hover text-text-muted"
                  }`}
                >
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{mod.module_slug}</p>
                  <p className="text-xs text-text-muted">{mod.clicks} clicks</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
