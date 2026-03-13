"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
} from "recharts";

/* ── Types ─────────────────────────────────────────────────────────── */

interface AnalyticsData {
  funnel: Record<string, number>;
  country_breakdown: {
    country: string;
    sessions: number;
    calculations: number;
    module_starts: number;
    affiliate_clicks: number;
  }[];
  module_popularity: {
    slug: string;
    views: number;
    completions: number;
    shares: number;
  }[];
  daily_active_users: { date: string; users: number }[];
  device_breakdown: { device: string; sessions: number }[];
}

/* ── Cookie helper ─────────────────────────────────────────────────── */

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}

/* ── Custom recharts tooltip ───────────────────────────────────────── */

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

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const token = getCookie("admin_token");
      const res = await fetch("/api/admin/analytics", {
        headers: token ? { "x-admin-password": token } : {},
      });
      if (!res.ok) throw new Error("Failed to fetch analytics");
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
        <div className="w-8 h-8 border-2 border-blood border-t-transparent rounded-full animate-spin" />
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

  // Prepare funnel chart data
  const funnelLabels: Record<string, string> = {
    page_view: "Page Views",
    inflation_clock_start: "Clock Started",
    inflation_clock_result: "Result Shown",
    module_start: "Module Started",
    module_complete: "Module Completed",
    affiliate_click: "Affiliate Click",
    newsletter_signup: "Newsletter Signup",
  };

  const funnelChartData = Object.entries(data.funnel)
    .map(([key, value]) => ({
      name: funnelLabels[key] || key,
      count: value,
    }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Analytics</h1>
        <p className="text-sm text-text-muted mt-1">Detailed event analytics and user behavior</p>
      </div>

      {/* Funnel visualization */}
      <div className="bg-surface-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-6">Conversion Funnel</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={funnelChartData} layout="vertical" margin={{ left: 20 }}>
              <XAxis type="number" tick={{ fill: "#a3a3a3", fontSize: 12 }} axisLine={{ stroke: "#2a2a2a" }} />
              <YAxis
                dataKey="name"
                type="category"
                width={130}
                tick={{ fill: "#a3a3a3", fontSize: 12 }}
                axisLine={{ stroke: "#2a2a2a" }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(220, 38, 38, 0.05)" }} />
              <Bar dataKey="count" name="Events" fill="#dc2626" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Daily active users chart */}
      <div className="bg-surface-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-6">Daily Active Users (30 days)</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.daily_active_users}>
              <defs>
                <linearGradient id="dauGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
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
                dataKey="users"
                name="Users"
                stroke="#dc2626"
                fill="url(#dauGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Country breakdown */}
        <div className="bg-surface-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Country Breakdown</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 text-text-muted font-medium">Country</th>
                  <th className="text-right py-3 px-2 text-text-muted font-medium">Sessions</th>
                  <th className="text-right py-3 px-2 text-text-muted font-medium">Calcs</th>
                  <th className="text-right py-3 px-2 text-text-muted font-medium">Modules</th>
                  <th className="text-right py-3 px-2 text-text-muted font-medium">Clicks</th>
                </tr>
              </thead>
              <tbody>
                {data.country_breakdown.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-text-muted">
                      No country data available
                    </td>
                  </tr>
                ) : (
                  data.country_breakdown.map((row) => (
                    <tr key={row.country} className="border-b border-border last:border-0 hover:bg-surface-hover transition-colors">
                      <td className="py-3 px-2 text-text-primary font-medium">{row.country}</td>
                      <td className="py-3 px-2 text-right text-text-secondary">{row.sessions.toLocaleString()}</td>
                      <td className="py-3 px-2 text-right text-text-secondary">{row.calculations.toLocaleString()}</td>
                      <td className="py-3 px-2 text-right text-text-secondary">{row.module_starts.toLocaleString()}</td>
                      <td className="py-3 px-2 text-right text-text-secondary">{row.affiliate_clicks.toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Module popularity */}
        <div className="bg-surface-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Module Popularity</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 text-text-muted font-medium">Module</th>
                  <th className="text-right py-3 px-2 text-text-muted font-medium">Views</th>
                  <th className="text-right py-3 px-2 text-text-muted font-medium">Completed</th>
                  <th className="text-right py-3 px-2 text-text-muted font-medium">Shares</th>
                </tr>
              </thead>
              <tbody>
                {data.module_popularity.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-text-muted">
                      No module data available
                    </td>
                  </tr>
                ) : (
                  data.module_popularity.map((row) => (
                    <tr key={row.slug} className="border-b border-border last:border-0 hover:bg-surface-hover transition-colors">
                      <td className="py-3 px-2 text-text-primary font-medium">{row.slug}</td>
                      <td className="py-3 px-2 text-right text-text-secondary">{row.views.toLocaleString()}</td>
                      <td className="py-3 px-2 text-right text-text-secondary">{row.completions.toLocaleString()}</td>
                      <td className="py-3 px-2 text-right text-text-secondary">{row.shares.toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Device breakdown */}
      <div className="bg-surface-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Device Breakdown</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {data.device_breakdown.map((d) => {
            const total = data.device_breakdown.reduce((sum, x) => sum + x.sessions, 0);
            const pct = total > 0 ? ((d.sessions / total) * 100).toFixed(1) : "0";
            const icons: Record<string, string> = { mobile: "M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3", tablet: "M10.5 19.5h3m-6.75 2.25h10.5a2.25 2.25 0 002.25-2.25v-15a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 4.5v15a2.25 2.25 0 002.25 2.25z", desktop: "M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25z" };
            return (
              <div key={d.device} className="bg-surface border border-border rounded-lg p-4 text-center">
                <svg className="w-8 h-8 mx-auto mb-2 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={icons[d.device] || icons.desktop} />
                </svg>
                <p className="text-sm font-medium text-text-primary capitalize">{d.device}</p>
                <p className="text-2xl font-bold text-text-primary mt-1">{d.sessions.toLocaleString()}</p>
                <p className="text-xs text-text-muted">{pct}% of total</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
