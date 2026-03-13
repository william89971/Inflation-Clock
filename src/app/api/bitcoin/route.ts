import { NextResponse } from "next/server";
import { BTC_PRICES_FALLBACK } from "@/lib/bitcoin";

export async function GET() {
  try {
    // CoinGecko free API - get BTC market chart for max range
    const res = await fetch(
      "https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=max&interval=daily",
      {
        headers: { Accept: "application/json" },
        next: { revalidate: 86400 }, // cache for 24h
      }
    );

    if (!res.ok) {
      return NextResponse.json({ prices: BTC_PRICES_FALLBACK });
    }

    const data = await res.json();
    const yearlyPrices: Record<number, number> = {};

    // Group by year and take the average price
    const yearSums: Record<number, { sum: number; count: number }> = {};

    for (const [timestamp, price] of data.prices) {
      const year = new Date(timestamp).getFullYear();
      if (!yearSums[year]) yearSums[year] = { sum: 0, count: 0 };
      yearSums[year].sum += price;
      yearSums[year].count++;
    }

    for (const [year, { sum, count }] of Object.entries(yearSums)) {
      yearlyPrices[Number(year)] = Math.round(sum / count);
    }

    // Merge with fallback for early years
    const merged = { ...BTC_PRICES_FALLBACK, ...yearlyPrices };
    return NextResponse.json({ prices: merged });
  } catch {
    return NextResponse.json({ prices: BTC_PRICES_FALLBACK });
  }
}
