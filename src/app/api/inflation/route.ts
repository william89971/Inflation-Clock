export const revalidate = 3600; // 1-hour ISR cache

const FALLBACK_RATE = 2.80; // matches INFLATION_RATES.US[2025]

export async function GET() {
  const apiKey = process.env.FRED_API_KEY;

  if (!apiKey) {
    return Response.json({ rate: FALLBACK_RATE, source: "fallback", asOf: "" });
  }

  try {
    // Fetch last 13 monthly CPIAUCSL observations (ascending) to compute 12-month YoY rate
    const url = new URL(
      "https://api.stlouisfed.org/fred/series/observations"
    );
    url.searchParams.set("series_id", "CPIAUCSL");
    url.searchParams.set("api_key", apiKey);
    url.searchParams.set("file_type", "json");
    url.searchParams.set("sort_order", "desc");
    url.searchParams.set("limit", "13");

    const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error(`FRED responded ${res.status}`);

    const data = await res.json();
    const observations: Array<{ date: string; value: string }> =
      data.observations ?? [];

    // Filter out placeholder values (FRED uses "." for missing data)
    const valid = observations.filter((o) => o.value !== ".");

    if (valid.length < 13) {
      return Response.json({ rate: FALLBACK_RATE, source: "fallback", asOf: "" });
    }

    // desc order: valid[0] = latest, valid[12] = 12 months ago
    const latest = parseFloat(valid[0].value);
    const yearAgo = parseFloat(valid[12].value);

    if (!isFinite(latest) || !isFinite(yearAgo) || yearAgo === 0) {
      return Response.json({ rate: FALLBACK_RATE, source: "fallback", asOf: "" });
    }

    const rate = ((latest - yearAgo) / yearAgo) * 100;

    // Sanity check: reject values outside a plausible range
    if (rate < -5 || rate > 100) {
      return Response.json({ rate: FALLBACK_RATE, source: "fallback", asOf: "" });
    }

    return Response.json({
      rate: Math.round(rate * 100) / 100,
      source: "fred",
      asOf: valid[0].date,
    });
  } catch {
    return Response.json({ rate: FALLBACK_RATE, source: "fallback", asOf: "" });
  }
}
