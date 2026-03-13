"use client";

import { useState, useEffect, useCallback } from "react";

/* ── Types ─────────────────────────────────────────────────────────── */

interface StatsData {
  total_sessions: number;
  total_calculations: number;
  active_users_7d: number;
  top_countries: { country: string; sessions: number }[];
  total_affiliate_clicks: number;
  funnel_data: {
    landed: number;
    calculated: number;
    started_learning: number;
    clicked_affiliate: number;
  };
  recent_events: {
    id: string;
    session_id: string;
    event_type: string;
    event_data: Record<string, unknown>;
    country: string | null;
    language: string;
    device_type: string;
    created_at: string;
    page_path: string | null;
  }[];
}

/* ── Cookie helper ─────────────────────────────────────────────────── */

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}

/* ── MetricCard ────────────────────────────────────────────────────── */

function MetricCard({
  label,
  value,
  icon,
  accent = "blood",
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent?: "blood" | "bitcoin";
}) {
  const accentClasses =
    accent === "bitcoin"
      ? "bg-bitcoin/10 border-bitcoin/20 text-bitcoin"
      : "bg-blood/10 border-blood/20 text-blood";

  return (
    <div className="bg-surface-card border border-border rounded-xl p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-text-muted mb-1">{label}</p>
          <p className="text-2xl font-bold text-text-primary">{typeof value === "number" ? value.toLocaleString() : value}</p>
        </div>
        <div className={`flex items-center justify-center w-10 h-10 rounded-lg border ${accentClasses}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

/* ── FunnelBar ─────────────────────────────────────────────────────── */

function FunnelBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-text-secondary">{label}</span>
        <span className="text-text-primary font-medium">{value.toLocaleString()}</span>
      </div>
      <div className="h-3 bg-surface rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blood to-blood-glow rounded-full transition-all duration-700"
          style={{ width: `${Math.max(pct, 2)}%` }}
        />
      </div>
      <p className="text-xs text-text-muted">{pct.toFixed(1)}% of total</p>
    </div>
  );
}

/* ── EventRow ──────────────────────────────────────────────────────── */

function EventRow({ event }: { event: StatsData["recent_events"][0] }) {
  const time = new Date(event.created_at);
  const relativeTime = getRelativeTime(time);

  const typeColors: Record<string, string> = {
    page_view: "bg-blue-500/10 text-blue-400",
    inflation_clock_result: "bg-blood/10 text-blood-glow",
    module_start: "bg-green-500/10 text-green-400",
    module_complete: "bg-emerald-500/10 text-emerald-400",
    affiliate_click: "bg-bitcoin/10 text-bitcoin",
    share_click: "bg-purple-500/10 text-purple-400",
    newsletter_signup: "bg-teal-500/10 text-teal-400",
  };

  const colorClass = typeColors[event.event_type] || "bg-surface-hover text-text-secondary";

  return (
    <div className="flex items-center gap-3 py-3 border-b border-border last:border-0">
      <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${colorClass}`}>
        {event.event_type.replace(/_/g, " ")}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-text-secondary truncate">
          {event.country && <span className="text-text-muted mr-2">{event.country}</span>}
          {event.page_path && <span className="text-text-muted">{event.page_path}</span>}
        </p>
      </div>
      <span className="text-xs text-text-muted whitespace-nowrap">{relativeTime}</span>
    </div>
  );
}

function getRelativeTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/* ── Page ──────────────────────────────────────────────────────────── */

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const token = getCookie("admin_token");
      const res = await fetch("/api/admin/stats", {
        headers: token ? { "x-admin-password": token } : {},
      });
      if (!res.ok) throw new Error("Failed to fetch stats");
      const data = await res.json();
      setStats(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blood border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-blood/10 border border-blood/20 rounded-xl p-6 text-center">
        <p className="text-blood font-medium">{error || "Failed to load data"}</p>
        <button onClick={fetchStats} className="mt-3 text-sm text-text-muted hover:text-text-primary underline">
          Retry
        </button>
      </div>
    );
  }

  const { funnel_data, top_countries, recent_events, total_affiliate_clicks } = stats;
  const funnelMax = Math.max(funnel_data.landed, 1);

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Overview</h1>
          <p className="text-sm text-text-muted mt-1">Real-time dashboard for Inflation Clock</p>
        </div>
        <button
          onClick={fetchStats}
          className="flex items-center gap-2 px-3 py-2 bg-surface-card border border-border rounded-lg text-sm text-text-secondary hover:text-text-primary hover:border-blood/30 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Sessions"
          value={stats.total_sessions}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          }
        />
        <MetricCard
          label="Calculations"
          value={stats.total_calculations}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25V13.5zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25V18zm2.498-6.75h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007V13.5zm0 2.25h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007V18zm2.504-6.75h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V13.5zm0 2.25h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V18zm2.498-6.75h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V13.5zM8.25 6h7.5v2.25h-7.5V6zM12 2.25c-1.892 0-3.758.11-5.593.322C5.307 2.7 4.5 3.65 4.5 4.757V19.5a2.25 2.25 0 002.25 2.25h10.5a2.25 2.25 0 002.25-2.25V4.757c0-1.108-.806-2.057-1.907-2.185A48.507 48.507 0 0012 2.25z" />
            </svg>
          }
        />
        <MetricCard
          label="Active (7 days)"
          value={stats.active_users_7d}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
          }
        />
        <MetricCard
          label="Top Country"
          value={top_countries[0]?.country || "N/A"}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
            </svg>
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue summary */}
        <div className="bg-surface-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Revenue Summary</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-border">
              <span className="text-text-secondary">Total Affiliate Clicks</span>
              <span className="text-lg font-bold text-bitcoin">{total_affiliate_clicks.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-border">
              <span className="text-text-secondary">Est. Conversion Rate</span>
              <span className="text-lg font-bold text-text-primary">2-5%</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-text-secondary">Est. Revenue</span>
              <span className="text-lg font-bold text-bitcoin">
                ${(total_affiliate_clicks * 0.03 * 15).toFixed(2)}
              </span>
            </div>
            <p className="text-xs text-text-muted">
              Based on 3% conversion rate and $15 avg affiliate payout
            </p>
          </div>
        </div>

        {/* Conversion funnel */}
        <div className="bg-surface-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Conversion Funnel</h2>
          <div className="space-y-5">
            <FunnelBar label="Landed (Page Views)" value={funnel_data.landed} max={funnelMax} />
            <FunnelBar label="Calculated Result" value={funnel_data.calculated} max={funnelMax} />
            <FunnelBar label="Started Learning" value={funnel_data.started_learning} max={funnelMax} />
            <FunnelBar label="Clicked Affiliate" value={funnel_data.clicked_affiliate} max={funnelMax} />
          </div>
        </div>
      </div>

      {/* Top countries + Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top countries */}
        <div className="bg-surface-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Top Countries</h2>
          {top_countries.length === 0 ? (
            <p className="text-text-muted text-sm">No country data yet</p>
          ) : (
            <div className="space-y-3">
              {top_countries.map((c, i) => (
                <div key={c.country} className="flex items-center gap-3">
                  <span className="w-6 text-sm font-medium text-text-muted">{i + 1}</span>
                  <span className="flex-1 text-sm text-text-primary font-medium">{c.country}</span>
                  <span className="text-sm text-text-secondary">{c.sessions.toLocaleString()} sessions</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent events */}
        <div className="bg-surface-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Recent Activity</h2>
          {recent_events.length === 0 ? (
            <p className="text-text-muted text-sm">No events recorded yet</p>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              {recent_events.map((event) => (
                <EventRow key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
