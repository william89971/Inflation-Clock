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
    // ── Clicks by partner ──────────────────────────────────────────────
    const { data: clickData } = await sb
      .from("affiliate_clicks")
      .select("platform, country, module_slug, created_at")
      .limit(100000);

    const partnerMap: Record<string, number> = {};
    const countryClickMap: Record<string, number> = {};
    const moduleClickMap: Record<string, number> = {};
    const dailyClickMap: Record<string, number> = {};

    for (const row of clickData || []) {
      // By partner
      const partner = row.platform || "unknown";
      partnerMap[partner] = (partnerMap[partner] || 0) + 1;

      // By country
      if (row.country) {
        countryClickMap[row.country] = (countryClickMap[row.country] || 0) + 1;
      }

      // By module
      if (row.module_slug) {
        moduleClickMap[row.module_slug] = (moduleClickMap[row.module_slug] || 0) + 1;
      }

      // Daily trend
      if (row.created_at) {
        const day = row.created_at.split("T")[0];
        dailyClickMap[day] = (dailyClickMap[day] || 0) + 1;
      }
    }

    // Estimated conversion rates per partner
    const partnerConversionEstimates: Record<string, number> = {
      strike: 0.04,
      river: 0.03,
      swan: 0.035,
      cashapp: 0.05,
      coinbase: 0.025,
    };

    const avgPayout: Record<string, number> = {
      strike: 10,
      river: 20,
      swan: 25,
      cashapp: 5,
      coinbase: 10,
    };

    const clicksByPartner = Object.entries(partnerMap)
      .map(([partner, clicks]) => {
        const convRate = partnerConversionEstimates[partner.toLowerCase()] || 0.03;
        const payout = avgPayout[partner.toLowerCase()] || 15;
        return {
          partner,
          clicks,
          estimated_conversion_rate: convRate,
          estimated_revenue: Math.round(clicks * convRate * payout * 100) / 100,
        };
      })
      .sort((a, b) => b.clicks - a.clicks);

    const clicksByCountry = Object.entries(countryClickMap)
      .map(([country, clicks]) => ({ country, clicks }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 15);

    const topConvertingModules = Object.entries(moduleClickMap)
      .map(([module_slug, clicks]) => ({ module_slug, clicks }))
      .sort((a, b) => b.clicks - a.clicks);

    // Build 30-day trend (fill gaps with 0)
    const revenueTrend: { date: string; clicks: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split("T")[0];
      revenueTrend.push({ date: key, clicks: dailyClickMap[key] || 0 });
    }

    const totalClicks = clickData?.length || 0;
    const totalEstimatedRevenue = clicksByPartner.reduce((sum, p) => sum + p.estimated_revenue, 0);

    return NextResponse.json({
      total_clicks: totalClicks,
      total_estimated_revenue: Math.round(totalEstimatedRevenue * 100) / 100,
      clicks_by_partner: clicksByPartner,
      clicks_by_country: clicksByCountry,
      top_converting_modules: topConvertingModules,
      revenue_trend: revenueTrend,
    });
  } catch (err) {
    console.error("Admin revenue error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
