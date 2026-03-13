import { NextRequest } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

interface PriceEntry {
  category: string;
  item: string;
  item_label: { en: string; es: string };
  emoji: string;
  unit?: string;
  currency?: string;
  source?: string;
  prices: Record<string, number> | Array<{ date: string; price: number }>;
}

function normalizePrices(prices: Record<string, number> | Array<{ date: string; price: number }>): Record<string, number> {
  if (Array.isArray(prices)) {
    const map: Record<string, number> = {};
    for (const entry of prices) {
      map[entry.date] = entry.price;
    }
    return map;
  }
  return prices;
}

// Whitelist of valid country/region combinations to prevent path traversal
const VALID_REGIONS: Record<string, string[]> = {
  us: ["los-angeles", "new-york"],
  mx: ["cdmx", "guadalajara"],
  sv: ["san-salvador"],
  ar: ["buenos-aires"],
};

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const limited = rateLimit(`prices:${ip}`, { maxRequests: 30, windowMs: 60_000 });
  if (limited) return limited;

  const { searchParams } = new URL(req.url);
  const country = (searchParams.get("country") || "us").toLowerCase().replace(/[^a-z]/g, "");
  const region = (searchParams.get("region") || "").toLowerCase().replace(/[^a-z0-9-]/g, "");
  const category = searchParams.get("category"); // optional filter

  if (!country || !region) {
    return Response.json({ error: "country and region are required" }, { status: 400 });
  }

  // Validate against whitelist to prevent path traversal
  if (!VALID_REGIONS[country]?.includes(region)) {
    return Response.json({ error: "No price data available for this region" }, { status: 404 });
  }

  let data: PriceEntry[];
  try {
    const mod = await import(`@/data/prices/${country}/${region}.json`);
    data = mod.default || mod;
  } catch {
    return Response.json({ error: "No price data available for this region" }, { status: 404 });
  }

  // Optional category filter
  if (category) {
    data = data.filter((item: PriceEntry) => item.category === category);
  }

  // Format comparison data
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const oneYearAgo = `${now.getFullYear() - 1}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const fiveYearsAgo = `${now.getFullYear() - 5}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const tenYearsAgo = `${now.getFullYear() - 10}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const formatted = data.map((item: PriceEntry) => {
    const prices = normalizePrices(item.prices || {});
    const sortedDates = Object.keys(prices).sort();
    const latestDate = sortedDates[sortedDates.length - 1] || currentMonth;
    const current = prices[latestDate] || prices[sortedDates[sortedDates.length - 1]] || 0;

    // Find closest available price to target dates
    function findClosest(target: string): number | null {
      if (prices[target]) return prices[target];
      const targetDate = new Date(target + "-01").getTime();
      let closest: string | null = null;
      let minDiff = Infinity;
      for (const d of sortedDates) {
        const diff = Math.abs(new Date(d + "-01").getTime() - targetDate);
        if (diff < minDiff) { minDiff = diff; closest = d; }
      }
      return closest ? prices[closest] : null;
    }

    const price1yr = findClosest(oneYearAgo);
    const price5yr = findClosest(fiveYearsAgo);
    const price10yr = findClosest(tenYearsAgo);

    return {
      ...item,
      current_price: current,
      price_1yr_ago: price1yr,
      price_5yr_ago: price5yr,
      price_10yr_ago: price10yr,
      change_1yr_pct: price1yr ? ((current - price1yr) / price1yr) * 100 : null,
      change_5yr_pct: price5yr ? ((current - price5yr) / price5yr) * 100 : null,
      change_10yr_pct: price10yr ? ((current - price10yr) / price10yr) * 100 : null,
    };
  });

  return Response.json({ prices: formatted, region, country });
}
