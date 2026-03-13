"use client";

import { useState, useEffect, useCallback } from "react";

/* ── Types ─────────────────────────────────────────────────────────── */

interface UsersData {
  total_subscribers: number;
  subscribers: {
    email: string;
    country: string | null;
    language: string | null;
    source: string | null;
    created_at: string;
  }[];
  referral_leaderboard: { code: string; referrals: number }[];
  total_sessions: number;
  top_users: {
    session_id: string;
    country: string | null;
    language: string;
    device_type: string;
    referral_source: string | null;
    first_seen: string;
    last_seen: string;
    event_count: number;
  }[];
  language_breakdown: { language: string; count: number }[];
}

/* ── Cookie helper ─────────────────────────────────────────────────── */

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}

/* ── Page ──────────────────────────────────────────────────────────── */

export default function AdminUsersPage() {
  const [data, setData] = useState<UsersData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const token = getCookie("admin_token");
      const url = search
        ? `/api/admin/users?search=${encodeURIComponent(search)}`
        : "/api/admin/users";
      const res = await fetch(url, {
        headers: token ? { "x-admin-password": token } : {},
      });
      if (!res.ok) throw new Error("Failed to fetch user data");
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
  };

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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Users</h1>
        <p className="text-sm text-text-muted mt-1">Newsletter subscribers, sessions, and referrals</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blood/10 border border-blood/20">
              <svg className="w-5 h-5 text-blood" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-text-muted">Newsletter Subscribers</p>
              <p className="text-2xl font-bold text-text-primary">{data.total_subscribers.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-surface-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blood/10 border border-blood/20">
              <svg className="w-5 h-5 text-blood" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-text-muted">Total Sessions</p>
              <p className="text-2xl font-bold text-text-primary">{data.total_sessions.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-surface-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-bitcoin/10 border border-bitcoin/20">
              <svg className="w-5 h-5 text-bitcoin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-text-muted">Referral Codes</p>
              <p className="text-2xl font-bold text-text-primary">{data.referral_leaderboard.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Newsletter subscribers */}
        <div className="bg-surface-card border border-border rounded-xl p-6 lg:col-span-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <h2 className="text-lg font-semibold text-text-primary">Newsletter Subscribers</h2>
            <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-auto">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by email..."
                className="flex-1 sm:w-64 px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-blood/50 focus:ring-1 focus:ring-blood/25"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blood hover:bg-blood-dark text-white text-sm font-medium rounded-lg transition-colors"
              >
                Search
              </button>
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setSearchInput("");
                  }}
                  className="px-3 py-2 bg-surface-hover text-text-secondary text-sm rounded-lg hover:text-text-primary transition-colors"
                >
                  Clear
                </button>
              )}
            </form>
          </div>

          {data.subscribers.length === 0 ? (
            <div className="text-center py-8">
              <svg className="w-12 h-12 mx-auto text-text-muted mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
              <p className="text-text-muted text-sm">
                {search ? "No subscribers match your search" : "No newsletter subscribers yet"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 text-text-muted font-medium">Email</th>
                    <th className="text-left py-3 px-2 text-text-muted font-medium">Country</th>
                    <th className="text-left py-3 px-2 text-text-muted font-medium">Language</th>
                    <th className="text-left py-3 px-2 text-text-muted font-medium">Source</th>
                    <th className="text-right py-3 px-2 text-text-muted font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.subscribers.map((sub, i) => (
                    <tr key={i} className="border-b border-border last:border-0 hover:bg-surface-hover transition-colors">
                      <td className="py-3 px-2 text-text-primary font-medium">{sub.email}</td>
                      <td className="py-3 px-2 text-text-secondary">{sub.country || "--"}</td>
                      <td className="py-3 px-2 text-text-secondary">{sub.language || "--"}</td>
                      <td className="py-3 px-2 text-text-secondary">{sub.source || "--"}</td>
                      <td className="py-3 px-2 text-right text-text-muted">
                        {new Date(sub.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Referral leaderboard */}
        <div className="bg-surface-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Referral Leaderboard</h2>
          {data.referral_leaderboard.length === 0 ? (
            <p className="text-text-muted text-sm">No referral data yet</p>
          ) : (
            <div className="space-y-2">
              {data.referral_leaderboard.map((ref, i) => (
                <div
                  key={ref.code}
                  className="flex items-center gap-3 py-2.5 px-3 rounded-lg bg-surface hover:bg-surface-hover transition-colors"
                >
                  <span
                    className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
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
                  <span className="flex-1 text-sm text-text-primary font-mono">{ref.code}</span>
                  <span className="text-sm text-text-secondary font-medium">
                    {ref.referrals} referral{ref.referrals !== 1 ? "s" : ""}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Language breakdown */}
        <div className="bg-surface-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Language Breakdown</h2>
          {data.language_breakdown.length === 0 ? (
            <p className="text-text-muted text-sm">No language data yet</p>
          ) : (
            <div className="space-y-3">
              {data.language_breakdown.map((lang) => {
                const total = data.language_breakdown.reduce((sum, l) => sum + l.count, 0);
                const pct = total > 0 ? ((lang.count / total) * 100).toFixed(1) : "0";
                return (
                  <div key={lang.language} className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-text-primary font-medium uppercase">{lang.language}</span>
                      <span className="text-text-secondary">
                        {lang.count.toLocaleString()} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 bg-surface rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blood to-blood-glow rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Most active sessions */}
      <div className="bg-surface-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Most Active Sessions</h2>
        <p className="text-sm text-text-muted mb-4">Top 50 sessions by event count</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-2 text-text-muted font-medium">Session ID</th>
                <th className="text-left py-3 px-2 text-text-muted font-medium">Country</th>
                <th className="text-left py-3 px-2 text-text-muted font-medium">Device</th>
                <th className="text-left py-3 px-2 text-text-muted font-medium">Source</th>
                <th className="text-right py-3 px-2 text-text-muted font-medium">Events</th>
                <th className="text-right py-3 px-2 text-text-muted font-medium">First Seen</th>
                <th className="text-right py-3 px-2 text-text-muted font-medium">Last Seen</th>
              </tr>
            </thead>
            <tbody>
              {data.top_users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-text-muted">
                    No session data yet
                  </td>
                </tr>
              ) : (
                data.top_users.map((user) => (
                  <tr key={user.session_id} className="border-b border-border last:border-0 hover:bg-surface-hover transition-colors">
                    <td className="py-3 px-2 text-text-primary font-mono text-xs">
                      {user.session_id.slice(0, 8)}...
                    </td>
                    <td className="py-3 px-2 text-text-secondary">{user.country || "--"}</td>
                    <td className="py-3 px-2 text-text-secondary capitalize">{user.device_type}</td>
                    <td className="py-3 px-2 text-text-secondary">{user.referral_source || "--"}</td>
                    <td className="py-3 px-2 text-right text-text-primary font-medium">{user.event_count}</td>
                    <td className="py-3 px-2 text-right text-text-muted text-xs">
                      {new Date(user.first_seen).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-2 text-right text-text-muted text-xs">
                      {new Date(user.last_seen).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
