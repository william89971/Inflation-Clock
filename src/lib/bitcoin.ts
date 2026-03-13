// Historical yearly average BTC prices (USD)
// Used as fallback when CoinGecko API is unavailable
export const BTC_PRICES_FALLBACK: Record<number, number> = {
  2009: 0.001, 2010: 0.06, 2011: 5.27, 2012: 5.39, 2013: 140.0,
  2014: 525.0, 2015: 272.0, 2016: 567.0, 2017: 4000.0, 2018: 7500.0,
  2019: 7200.0, 2020: 11000.0, 2021: 47000.0, 2022: 28000.0,
  2023: 29000.0, 2024: 62000.0, 2025: 85000.0,
};

export async function fetchBtcPrices(): Promise<Record<number, number>> {
  try {
    const response = await fetch("/api/bitcoin", { next: { revalidate: 3600 } });
    if (!response.ok) throw new Error("API error");
    const data = await response.json();
    return data.prices;
  } catch {
    return BTC_PRICES_FALLBACK;
  }
}
