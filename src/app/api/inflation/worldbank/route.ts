import { NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { CountryCode, INFLATION_RATES } from "@/data/inflation";

const WORLD_BANK_API =
  "https://api.worldbank.org/v2/country/{codes}/indicator/FP.CPI.TOTL.ZG?format=json&per_page=500";

// World Bank uses ISO 3166-1 alpha-3 codes
const WB_TO_APP: Record<string, CountryCode> = {
  MEX: "MX",
  SLV: "SV",
  ARG: "AR",
  BRA: "BR",
  COL: "CO",
  VEN: "VE",
};

const WB_COUNTRY_CODES = Object.keys(WB_TO_APP).join(";");

interface WBDataPoint {
  country: { id: string; value: string };
  date: string;
  value: number | null;
}

export async function GET(req: Request) {
  const ip = getClientIp(req);
  const limited = rateLimit(`worldbank:${ip}`, {
    maxRequests: 30,
    windowMs: 60_000,
  });
  if (limited) return limited;

  try {
    const url = WORLD_BANK_API.replace("{codes}", WB_COUNTRY_CODES);

    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 86400 },
    });

    if (!res.ok) {
      return fallbackResponse();
    }

    const json = await res.json();

    // World Bank API returns [metadata, data[]] array
    if (!Array.isArray(json) || json.length < 2 || !Array.isArray(json[1])) {
      return fallbackResponse();
    }

    const dataPoints: WBDataPoint[] = json[1];
    const rates: Record<string, Record<number, number>> = {};

    for (const point of dataPoints) {
      if (point.value === null) continue;

      const countryCode = WB_TO_APP[point.country.id];
      if (!countryCode) continue;

      const year = parseInt(point.date, 10);
      if (isNaN(year)) continue;

      if (!rates[countryCode]) rates[countryCode] = {};
      rates[countryCode][year] = parseFloat(point.value.toFixed(2));
    }

    // Merge with fallback — API data takes precedence
    const mergedRates: Partial<Record<CountryCode, Record<number, number>>> = {};
    for (const [wbCode, appCode] of Object.entries(WB_TO_APP)) {
      void wbCode;
      const apiData = rates[appCode] || {};
      const fallbackData = INFLATION_RATES[appCode] || {};
      mergedRates[appCode] = { ...fallbackData, ...apiData };
    }

    return NextResponse.json({
      rates: mergedRates,
      source: "worldbank",
    });
  } catch {
    return fallbackResponse();
  }
}

function fallbackResponse() {
  const fallbackRates: Partial<Record<CountryCode, Record<number, number>>> = {};
  for (const code of Object.values(WB_TO_APP)) {
    fallbackRates[code] = INFLATION_RATES[code];
  }
  return NextResponse.json({
    rates: fallbackRates,
    source: "fallback",
  });
}
