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

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";

  try {
    // ── Newsletter subscribers ─────────────────────────────────────────
    // Try to fetch from newsletter_subscribers table
    let subscribers: {
      email: string;
      country: string | null;
      language: string | null;
      source: string | null;
      created_at: string;
    }[] = [];
    let totalSubscribers = 0;

    try {
      let query = sb
        .from("newsletter_subscribers")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .limit(100);

      if (search) {
        query = query.ilike("email", `%${search}%`);
      }

      const { data, count } = await query;
      subscribers = data || [];
      totalSubscribers = count || 0;
    } catch {
      // Table may not exist yet; that's fine
    }

    // ── Referral leaderboard ───────────────────────────────────────────
    // Look for referral events in analytics
    const { data: referralEvents } = await sb
      .from("analytics_events")
      .select("event_data, session_id")
      .eq("event_type", "referral_signup")
      .limit(50000);

    const referrerMap: Record<string, number> = {};
    for (const row of referralEvents || []) {
      const referrer =
        (row.event_data as Record<string, unknown>)?.referrer_code as string ||
        (row.event_data as Record<string, unknown>)?.ref as string ||
        "unknown";
      referrerMap[referrer] = (referrerMap[referrer] || 0) + 1;
    }

    const referralLeaderboard = Object.entries(referrerMap)
      .map(([code, count]) => ({ code, referrals: count }))
      .sort((a, b) => b.referrals - a.referrals)
      .slice(0, 20);

    // ── Session-based user stats ───────────────────────────────────────
    const { data: sessionStats } = await sb
      .from("analytics_events")
      .select("session_id, country, language, device_type, referral_source, created_at")
      .order("created_at", { ascending: false })
      .limit(100000);

    // Unique sessions with their first-seen data
    const sessionMap: Record<
      string,
      {
        country: string | null;
        language: string;
        device_type: string;
        referral_source: string | null;
        first_seen: string;
        last_seen: string;
        event_count: number;
      }
    > = {};

    for (const row of sessionStats || []) {
      if (!sessionMap[row.session_id]) {
        sessionMap[row.session_id] = {
          country: row.country,
          language: row.language,
          device_type: row.device_type,
          referral_source: row.referral_source,
          first_seen: row.created_at,
          last_seen: row.created_at,
          event_count: 1,
        };
      } else {
        sessionMap[row.session_id].event_count++;
        if (row.created_at < sessionMap[row.session_id].first_seen) {
          sessionMap[row.session_id].first_seen = row.created_at;
        }
        if (row.created_at > sessionMap[row.session_id].last_seen) {
          sessionMap[row.session_id].last_seen = row.created_at;
        }
      }
    }

    // Top users by activity
    const topUsers = Object.entries(sessionMap)
      .map(([session_id, data]) => ({ session_id, ...data }))
      .sort((a, b) => b.event_count - a.event_count)
      .slice(0, 50);

    // Language breakdown
    const langMap: Record<string, number> = {};
    for (const session of Object.values(sessionMap)) {
      const lang = session.language || "en";
      langMap[lang] = (langMap[lang] || 0) + 1;
    }
    const languageBreakdown = Object.entries(langMap)
      .map(([language, count]) => ({ language, count }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({
      total_subscribers: totalSubscribers,
      subscribers,
      referral_leaderboard: referralLeaderboard,
      total_sessions: Object.keys(sessionMap).length,
      top_users: topUsers,
      language_breakdown: languageBreakdown,
    });
  } catch (err) {
    console.error("Admin users error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
