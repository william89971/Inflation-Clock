import {
  CountryCode,
  COUNTRIES,
  getInflationRate,
} from "@/data/inflation";

export interface YearlyBreakdown {
  year: number;
  inflationRate: number;
  cumulativeMultiplier: number; // how much $1 from birth year is worth now
  purchasingPower: number; // value of $1 from birth year in this year's dollars
}

export interface InflationResults {
  birthYear: number;
  currentYear: number;
  country: CountryCode;
  monthlyIncome: number;
  yearlyBreakdown: YearlyBreakdown[];
  lifetimeLoss: number;
  totalCumulativeInflation: number;
  currentPurchasingPower: number; // what $1 from birth year is worth today
  incomeAtBirth: number; // what today's income would have been worth at birth
  birthIncomeToday: number; // what birth-year income would be worth today
  dailyLoss: number;
  monthlyLoss: number;
  yearlyLoss: number;
  lossPerSecond: number;
}

export function calculateInflation(
  birthYear: number,
  country: CountryCode,
  monthlyIncome: number
): InflationResults {
  const currentYear = new Date().getFullYear();
  const yearlyBreakdown: YearlyBreakdown[] = [];

  let cumulativeMultiplier = 1;

  for (let year = birthYear; year <= currentYear; year++) {
    const rate = getInflationRate(country, year);
    if (year > birthYear) {
      cumulativeMultiplier *= 1 + rate / 100;
    }

    yearlyBreakdown.push({
      year,
      inflationRate: rate,
      cumulativeMultiplier,
      purchasingPower: 1 / cumulativeMultiplier,
    });
  }

  const currentPurchasingPower = 1 / cumulativeMultiplier;
  const annualIncome = monthlyIncome * 12;

  // What today's income would've been worth at birth (in birth-year dollars)
  const incomeAtBirth = monthlyIncome / cumulativeMultiplier;

  // What the same nominal income at birth would be worth today
  const birthIncomeToday = monthlyIncome * cumulativeMultiplier;

  // Current year inflation rate for loss calculations
  const currentRate = getInflationRate(country, currentYear);
  const yearlyLoss = annualIncome * (currentRate / 100);
  const monthlyLoss = yearlyLoss / 12;
  const dailyLoss = yearlyLoss / 365;
  const lossPerSecond = yearlyLoss / (365 * 24 * 3600);

  // Lifetime loss: sum of purchasing power lost each year
  // This represents the total "hidden tax" of inflation over the person's lifetime
  const lifetimeLoss = annualIncome * (1 - currentPurchasingPower);

  return {
    birthYear,
    currentYear,
    country,
    monthlyIncome,
    yearlyBreakdown,
    lifetimeLoss,
    totalCumulativeInflation: (cumulativeMultiplier - 1) * 100,
    currentPurchasingPower,
    incomeAtBirth,
    birthIncomeToday,
    dailyLoss,
    monthlyLoss,
    yearlyLoss,
    lossPerSecond,
  };
}

export interface BtcOverlayPoint {
  year: number;
  btcValue: number; // total portfolio value in current dollars
  totalInvested: number; // total fiat invested
}

export function calculateBtcOverlay(
  birthYear: number,
  monthlyIncome: number,
  btcPrices: Record<number, number>
): BtcOverlayPoint[] {
  const currentYear = new Date().getFullYear();
  const results: BtcOverlayPoint[] = [];

  // Assume saving 10% of monthly income as DCA into Bitcoin
  const monthlySavings = monthlyIncome * 0.1;
  let totalBtc = 0;
  let totalInvested = 0;

  // Bitcoin only existed from 2009
  const btcStartYear = Math.max(birthYear, 2009);

  for (let year = birthYear; year <= currentYear; year++) {
    if (year >= btcStartYear && btcPrices[year]) {
      const yearlyInvestment = monthlySavings * 12;
      const btcBought = yearlyInvestment / btcPrices[year];
      totalBtc += btcBought;
      totalInvested += yearlyInvestment;
    }

    const latestKnownYear = Math.max(...Object.keys(btcPrices).map(Number));
    const currentBtcPrice = btcPrices[currentYear] || btcPrices[latestKnownYear] || 85000;
    results.push({
      year,
      btcValue: totalBtc * currentBtcPrice,
      totalInvested,
    });
  }

  return results;
}

export function formatCurrency(
  amount: number,
  country: CountryCode
): string {
  const config = COUNTRIES[country];

  // For very large numbers (hyperinflation countries), use compact notation
  if (Math.abs(amount) >= 1e9) {
    return `${config.currencySymbol}${(amount / 1e9).toFixed(1)}B`;
  }
  if (Math.abs(amount) >= 1e6) {
    return `${config.currencySymbol}${(amount / 1e6).toFixed(1)}M`;
  }

  try {
    return new Intl.NumberFormat(config.locale, {
      style: "currency",
      currency: config.currency,
      minimumFractionDigits: amount < 1 ? 4 : 2,
      maximumFractionDigits: amount < 1 ? 6 : 2,
    }).format(amount);
  } catch {
    return `${config.currencySymbol}${amount.toFixed(2)}`;
  }
}
