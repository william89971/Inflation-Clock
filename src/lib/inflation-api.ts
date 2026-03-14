import { CountryCode, INFLATION_RATES } from "@/data/inflation";

interface BLSResponse {
  overall: Record<number, number>;
  categories: {
    food: Record<number, number>;
    housing: Record<number, number>;
    transportation: Record<number, number>;
    medical: Record<number, number>;
    education: Record<number, number>;
    energy: Record<number, number>;
  };
  source: "bls" | "fallback";
}

interface WorldBankResponse {
  rates: Partial<Record<CountryCode, Record<number, number>>>;
  source: "worldbank" | "fallback";
}

export type CPICategories = BLSResponse["categories"];

/**
 * Fetch US inflation rates from BLS API route.
 * Falls back to hardcoded data on failure.
 */
export async function fetchUSInflation(): Promise<BLSResponse> {
  try {
    const res = await fetch("/api/inflation/bls");
    if (!res.ok) throw new Error(`BLS API returned ${res.status}`);
    return await res.json();
  } catch {
    return {
      overall: INFLATION_RATES.US,
      categories: {
        food: {},
        housing: {},
        transportation: {},
        medical: {},
        education: {},
        energy: {},
      },
      source: "fallback",
    };
  }
}

/**
 * Fetch international inflation rates from World Bank API route.
 * Falls back to hardcoded data on failure.
 */
export async function fetchWorldInflation(): Promise<WorldBankResponse> {
  try {
    const res = await fetch("/api/inflation/worldbank");
    if (!res.ok) throw new Error(`World Bank API returned ${res.status}`);
    return await res.json();
  } catch {
    const fallback: Partial<Record<CountryCode, Record<number, number>>> = {};
    for (const code of ["MX", "SV", "AR", "BR", "CO", "VE"] as CountryCode[]) {
      fallback[code] = INFLATION_RATES[code];
    }
    return { rates: fallback, source: "fallback" };
  }
}

/**
 * Fetch all inflation rates (US + international), merged with fallback data.
 * API data takes precedence over hardcoded values.
 */
export async function fetchInflationRates(): Promise<
  Record<CountryCode, Record<number, number>>
> {
  const [bls, wb] = await Promise.all([
    fetchUSInflation(),
    fetchWorldInflation(),
  ]);

  const merged: Record<CountryCode, Record<number, number>> = {
    US: { ...INFLATION_RATES.US, ...bls.overall },
    MX: { ...INFLATION_RATES.MX, ...(wb.rates.MX || {}) },
    SV: { ...INFLATION_RATES.SV, ...(wb.rates.SV || {}) },
    AR: { ...INFLATION_RATES.AR, ...(wb.rates.AR || {}) },
    BR: { ...INFLATION_RATES.BR, ...(wb.rates.BR || {}) },
    CO: { ...INFLATION_RATES.CO, ...(wb.rates.CO || {}) },
    VE: { ...INFLATION_RATES.VE, ...(wb.rates.VE || {}) },
  };

  return merged;
}

/**
 * Fetch CPI category breakdowns for the US.
 * Returns empty categories on failure.
 */
export async function fetchCPICategories(): Promise<CPICategories> {
  const data = await fetchUSInflation();
  return data.categories;
}
