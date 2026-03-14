import { NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { INFLATION_RATES } from "@/data/inflation";

const BLS_API_URL = "https://api.bls.gov/publicAPI/v2/timeseries/data/";

// CPI-U series IDs
const SERIES_IDS = {
  overall: "CUUR0000SA0",
  food: "CUUR0000SAF1",
  housing: "CUUR0000SAH1",
  transportation: "CUUR0000SAT",
  medical: "CUUR0000SAM",
  education: "CUUR0000SAE",
  energy: "CUUR0000SA0E",
} as const;

type Category = keyof typeof SERIES_IDS;

interface BLSSeriesData {
  seriesID: string;
  data: Array<{
    year: string;
    period: string;
    periodName: string;
    value: string;
  }>;
}

interface BLSResponse {
  status: string;
  Results?: {
    series: BLSSeriesData[];
  };
}

/**
 * Compute YoY inflation % from annual average CPI index values.
 * BLS returns monthly CPI values; we average each year then compute % change.
 */
function computeInflationRates(
  series: BLSSeriesData
): Record<number, number> {
  // Group by year and compute annual averages
  const yearlyValues: Record<number, { sum: number; count: number }> = {};

  for (const point of series.data) {
    // Only use monthly data (M01-M12), skip annual averages (M13)
    if (point.period === "M13") continue;

    const year = parseInt(point.year, 10);
    const value = parseFloat(point.value);
    if (isNaN(year) || isNaN(value)) continue;

    if (!yearlyValues[year]) yearlyValues[year] = { sum: 0, count: 0 };
    yearlyValues[year].sum += value;
    yearlyValues[year].count++;
  }

  const annualAverages: Record<number, number> = {};
  for (const [year, { sum, count }] of Object.entries(yearlyValues)) {
    annualAverages[Number(year)] = sum / count;
  }

  // Compute YoY % change
  const rates: Record<number, number> = {};
  const years = Object.keys(annualAverages)
    .map(Number)
    .sort((a, b) => a - b);

  for (let i = 1; i < years.length; i++) {
    const prevAvg = annualAverages[years[i - 1]];
    const currAvg = annualAverages[years[i]];
    rates[years[i]] = parseFloat(
      (((currAvg - prevAvg) / prevAvg) * 100).toFixed(2)
    );
  }

  return rates;
}

export async function GET(req: Request) {
  const ip = getClientIp(req);
  const limited = rateLimit(`bls:${ip}`, {
    maxRequests: 30,
    windowMs: 60_000,
  });
  if (limited) return limited;

  try {
    // BLS API v2 allows up to 20 years per request and multiple series
    // We fetch in two chunks to cover 1913–present
    const currentYear = new Date().getFullYear();
    const startYear = 1913;

    // BLS v2 allows max 20-year spans per request
    const chunks: Array<{ start: number; end: number }> = [];
    for (let y = startYear; y <= currentYear; y += 20) {
      chunks.push({ start: y, end: Math.min(y + 19, currentYear) });
    }

    const allSeriesIds = Object.values(SERIES_IDS);
    const apiKey = process.env.BLS_API_KEY;

    // Accumulate data across all chunks
    const seriesDataMap: Record<string, BLSSeriesData["data"]> = {};
    for (const id of allSeriesIds) {
      seriesDataMap[id] = [];
    }

    for (const chunk of chunks) {
      const body: Record<string, unknown> = {
        seriesid: allSeriesIds,
        startyear: String(chunk.start),
        endyear: String(chunk.end),
        annualaverage: false,
      };
      if (apiKey) {
        body.registrationkey = apiKey;
      }

      const res = await fetch(BLS_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        next: { revalidate: 86400 },
      });

      if (!res.ok) continue;

      const json: BLSResponse = await res.json();
      if (json.status !== "REQUEST_SUCCEEDED" || !json.Results) continue;

      for (const series of json.Results.series) {
        if (seriesDataMap[series.seriesID]) {
          seriesDataMap[series.seriesID].push(...series.data);
        }
      }
    }

    // Check if we got any data at all
    const overallData = seriesDataMap[SERIES_IDS.overall];
    if (!overallData || overallData.length === 0) {
      return NextResponse.json({
        overall: INFLATION_RATES.US,
        categories: {},
        source: "fallback",
      });
    }

    // Build result
    const result: Record<string, Record<number, number>> = {};
    for (const [category, seriesId] of Object.entries(SERIES_IDS)) {
      const data = seriesDataMap[seriesId];
      if (data && data.length > 0) {
        result[category] = computeInflationRates({
          seriesID: seriesId,
          data,
        });
      }
    }

    return NextResponse.json({
      overall: result.overall || INFLATION_RATES.US,
      categories: {
        food: result.food || {},
        housing: result.housing || {},
        transportation: result.transportation || {},
        medical: result.medical || {},
        education: result.education || {},
        energy: result.energy || {},
      },
      source: "bls",
    });
  } catch {
    return NextResponse.json({
      overall: INFLATION_RATES.US,
      categories: {},
      source: "fallback",
    });
  }
}
