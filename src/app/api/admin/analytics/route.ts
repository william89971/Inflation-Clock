import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import { isAdminAuthorized } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sb = getSupabaseServer();
  if (!sb) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  try {
    // ── Funnel data ────────────────────────────────────────────────────
    const funnelTypes = [
      "page_view",
      "inflation_clock_start",
      "inflation_clock_result",
      "module_start",
      "module_complete",
      "affiliate_click",
      "newsletter_signup",
    ];

    const funnelCounts: Record<string, number> = {};
    for (const eventType of funnelTypes) {
      const { count } = await sb
        .from("analytics_events")
        .select("*", { count: "exact", head: true })
        .eq("event_type", eventType);
      funnelCounts[eventType] = count || 0;
    }

    // ── Country breakdown ──────────────────────────────────────────────
    const { data: allEvents } = await sb
      .from("analytics_events")
      .select("country, event_type, session_id")
      .not("country", "is", null)
      .limit(100000);

    const countryMap: Record<
      string,
      { sessions: Set<string>; calculations: number; module_starts: number; affiliate_clicks: number }
    > = {};

    for (const row of allEvents || []) {
      if (!row.country) continue;
      if (!countryMap[row.country]) {
        countryMap[row.country] = {
          sessions: new Set(),
          calculations: 0,
          module_starts: 0,
          affiliate_clicks: 0,
        };
      }
      countryMap[row.country].sessions.add(row.session_id);
      if (row.event_type === "inflation_clock_result") countryMap[row.country].calculations++;
      if (row.event_type === "module_start") countryMap[row.country].module_starts++;
      if (row.event_type === "affiliate_click") countryMap[row.country].affiliate_clicks++;
    }

    const countryBreakdown = Object.entries(countryMap)
      .map(([country, data]) => ({
        country,
        sessions: data.sessions.size,
        calculations: data.calculations,
        module_starts: data.module_starts,
        affiliate_clicks: data.affiliate_clicks,
      }))
      .sort((a, b) => b.sessions - a.sessions)
      .slice(0, 20);

    // ── Module popularity ──────────────────────────────────────────────
    const { data: moduleEvents } = await sb
      .from("analytics_events")
      .select("event_type, event_data")
      .in("event_type", ["module_start", "module_complete", "share_click"])
      .limit(50000);

    const moduleMap: Record<string, { views: number; completions: number; shares: number }> = {};
    for (const row of moduleEvents || []) {
      const slug =
        (row.event_data as Record<string, unknown>)?.module_slug as string ||
        (row.event_data as Record<string, unknown>)?.moduleSlug as string ||
        "unknown";
      if (!moduleMap[slug]) moduleMap[slug] = { views: 0, completions: 0, shares: 0 };
      if (row.event_type === "module_start") moduleMap[slug].views++;
      if (row.event_type === "module_complete") moduleMap[slug].completions++;
      if (row.event_type === "share_click") moduleMap[slug].shares++;
    }

    const modulePopularity = Object.entries(moduleMap)
      .map(([slug, data]) => ({ slug, ...data }))
      .sort((a, b) => b.views - a.views);

    // ── Daily active users (last 30 days) ──────────────────────────────
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: dailyData } = await sb
      .from("analytics_events")
      .select("session_id, created_at")
      .gte("created_at", thirtyDaysAgo)
      .limit(100000);

    const dailyMap: Record<string, Set<string>> = {};
    for (const row of dailyData || []) {
      const day = row.created_at.split("T")[0];
      if (!dailyMap[day]) dailyMap[day] = new Set();
      dailyMap[day].add(row.session_id);
    }

    // Fill in missing days with 0
    const dailyActiveUsers: { date: string; users: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split("T")[0];
      dailyActiveUsers.push({
        date: key,
        users: dailyMap[key]?.size || 0,
      });
    }

    // ── Device breakdown ───────────────────────────────────────────────
    const { data: deviceData } = await sb
      .from("analytics_events")
      .select("device_type, session_id")
      .limit(100000);

    const deviceMap: Record<string, Set<string>> = {};
    for (const row of deviceData || []) {
      const device = row.device_type || "unknown";
      if (!deviceMap[device]) deviceMap[device] = new Set();
      deviceMap[device].add(row.session_id);
    }

    const deviceBreakdown = Object.entries(deviceMap)
      .map(([device, sessions]) => ({ device, sessions: sessions.size }))
      .sort((a, b) => b.sessions - a.sessions);

    return NextResponse.json({
      funnel: funnelCounts,
      country_breakdown: countryBreakdown,
      module_popularity: modulePopularity,
      daily_active_users: dailyActiveUsers,
      device_breakdown: deviceBreakdown,
    });
  } catch (err) {
    console.error("Admin analytics error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
