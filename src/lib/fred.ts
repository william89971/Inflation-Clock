// Current US CPI fallback rate — matches INFLATION_RATES.US[2025] in src/data/inflation.ts
const FRED_CPI_FALLBACK = 2.80;

export interface FredCpiResult {
  rate: number;
  source: "fred" | "fallback";
  asOf: string;
}

/**
 * Fetch the live US annual CPI inflation rate from the /api/inflation endpoint.
 * Returns fallback data if the request fails or the key is missing.
 */
export async function fetchFredCpiRate(): Promise<FredCpiResult> {
  try {
    const res = await fetch("/api/inflation", { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error("API error");
    const data: FredCpiResult = await res.json();
    return data;
  } catch {
    return { rate: FRED_CPI_FALLBACK, source: "fallback", asOf: "" };
  }
}
