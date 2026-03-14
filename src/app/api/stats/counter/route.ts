import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET(req: Request) {
  const limited = rateLimit(`counter:${getClientIp(req)}`, { maxRequests: 30, windowMs: 60_000 });
  if (limited) return limited;
  const sb = getSupabaseServer();
  if (!sb) {
    return NextResponse.json({
      total_calculations: 0,
      country_count: 0,
      countries: [],
    });
  }

  try {
    // Count total inflation clock calculations
    const { count: totalCalcs } = await sb
      .from("analytics_events")
      .select("*", { count: "exact", head: true })
      .eq("event_type", "inflation_clock_result");

    // Get distinct countries
    const { data: countryRows } = await sb
      .from("analytics_events")
      .select("country")
      .eq("event_type", "inflation_clock_result")
      .not("country", "is", null);

    const uniqueCountries = Array.from(
      new Set(countryRows?.map((c) => c.country).filter(Boolean))
    );

    return NextResponse.json({
      total_calculations: totalCalcs ?? 0,
      country_count: uniqueCountries.length,
      countries: uniqueCountries,
    });
  } catch {
    return NextResponse.json({
      total_calculations: 0,
      country_count: 0,
      countries: [],
    });
  }
}
