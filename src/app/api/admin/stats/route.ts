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
    // All counts run as DB-side aggregations — no row-fetching into memory.
    // Requires admin-stats-functions.sql migration to be applied.
    const [
      distinctSessionsResult,
      recentSessionsResult,
      topCountriesResult,
      totalCalculationsResult,
      totalAffiliateClicksResult,
      landedResult,
      calculatedResult,
      startedLearningResult,
      clickedAffiliateResult,
      recentEventsResult,
    ] = await Promise.all([
      sb.rpc("get_distinct_session_count"),
      sb.rpc("get_recent_session_count", { days_ago: 7 }),
      sb.rpc("get_top_countries", { limit_n: 5 }),
      sb
        .from("analytics_events")
        .select("*", { count: "exact", head: true })
        .eq("event_type", "inflation_clock_result"),
      sb
        .from("affiliate_clicks")
        .select("*", { count: "exact", head: true }),
      sb
        .from("analytics_events")
        .select("*", { count: "exact", head: true })
        .eq("event_type", "page_view"),
      sb
        .from("analytics_events")
        .select("*", { count: "exact", head: true })
        .eq("event_type", "inflation_clock_result"),
      sb
        .from("analytics_events")
        .select("*", { count: "exact", head: true })
        .eq("event_type", "module_start"),
      sb
        .from("analytics_events")
        .select("*", { count: "exact", head: true })
        .eq("event_type", "affiliate_click"),
      sb
        .from("analytics_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    const topCountries = (topCountriesResult.data ?? []).map(
      (row: { country: string; sessions: number }) => ({
        country: row.country,
        sessions: Number(row.sessions),
      })
    );

    return NextResponse.json({
      total_sessions: Number(distinctSessionsResult.data ?? 0),
      total_calculations: totalCalculationsResult.count ?? 0,
      active_users_7d: Number(recentSessionsResult.data ?? 0),
      top_countries: topCountries,
      total_affiliate_clicks: totalAffiliateClicksResult.count ?? 0,
      funnel_data: {
        landed: landedResult.count ?? 0,
        calculated: calculatedResult.count ?? 0,
        started_learning: startedLearningResult.count ?? 0,
        clicked_affiliate: clickedAffiliateResult.count ?? 0,
      },
      recent_events: recentEventsResult.data ?? [],
    });
  } catch (err) {
    console.error("Admin stats error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
