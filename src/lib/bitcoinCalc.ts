// Historical BTC annual average prices (USD)
const BTC_ANNUAL_PRICES: Record<number, number> = {
  2013: 150,
  2014: 525,
  2015: 300,
  2016: 567,
  2017: 4000,
  2018: 7500,
  2019: 7200,
  2020: 11000,
  2021: 47000,
  2022: 29000,
  2023: 28000,
  2024: 60000,
  2025: 84000,
};

const CURRENT_BTC_PRICE = 84000;
const CURRENT_YEAR = 2025;

// Average annual inflation rates by country (as decimal, e.g. 0.038 = 3.8%)
const COUNTRY_INFLATION_RATES: Record<string, number> = {
  US: 0.038,
  SV: 0.042,
  MX: 0.051,
  AR: 1.33,
  BR: 0.061,
  CO: 0.093,
  VE: 1.90,
};

// Get BTC price for a given year using linear interpolation for missing years
function getBtcPrice(year: number): number {
  if (BTC_ANNUAL_PRICES[year]) return BTC_ANNUAL_PRICES[year];

  // Find surrounding known years
  const knownYears = Object.keys(BTC_ANNUAL_PRICES).map(Number).sort((a, b) => a - b);
  const lowerYear = knownYears.filter((y) => y < year).pop();
  const upperYear = knownYears.find((y) => y > year);

  if (lowerYear === undefined) return BTC_ANNUAL_PRICES[knownYears[0]];
  if (upperYear === undefined) return BTC_ANNUAL_PRICES[knownYears[knownYears.length - 1]];

  const ratio = (year - lowerYear) / (upperYear - lowerYear);
  return BTC_ANNUAL_PRICES[lowerYear] + ratio * (BTC_ANNUAL_PRICES[upperYear] - BTC_ANNUAL_PRICES[lowerYear]);
}

export interface BitcoinScenario {
  year: number;
  totalInvested: number;
  currentValue: number;
  returnMultiple: number;
  roi: number;
  btcAccumulated: number;
}

export interface BitcoinCalculationResult {
  scenarios: BitcoinScenario[];
  cashSavingsToday: number;
  cashLost: number;
  bestScenario: BitcoinScenario;
  spinSpeed: number;
}

export function calculateBitcoinScenarios(
  monthlyIncome: number,
  _currentAge: number,
  country: string
): BitcoinCalculationResult {
  const entryYears = [2015, 2019, 2022];
  const amountPerMonth = monthlyIncome * 0.10;

  const scenarios: BitcoinScenario[] = entryYears.map((entryYear) => {
    const yearsInvesting = CURRENT_YEAR - entryYear;
    const totalInvested = amountPerMonth * yearsInvesting * 12;

    // Accumulate BTC year by year
    let btcAccumulated = 0;
    for (let y = entryYear; y < CURRENT_YEAR; y++) {
      const yearlyInvestment = amountPerMonth * 12;
      const price = getBtcPrice(y);
      btcAccumulated += yearlyInvestment / price;
    }

    const currentValue = btcAccumulated * CURRENT_BTC_PRICE;
    const returnMultiple = totalInvested > 0 ? currentValue / totalInvested : 0;
    const roi = totalInvested > 0 ? ((currentValue - totalInvested) / totalInvested) * 100 : 0;

    return {
      year: entryYear,
      totalInvested,
      currentValue,
      returnMultiple,
      roi,
      btcAccumulated,
    };
  });

  // Longest scenario (2015 entry) for cash comparison
  const longestScenario = scenarios[0]; // 2015
  const yearsLongest = CURRENT_YEAR - 2015;
  const annualRate = COUNTRY_INFLATION_RATES[country] ?? COUNTRY_INFLATION_RATES["US"];

  // Purchasing power of total invested (treat as lump sum, worst case)
  const cashSavingsToday = longestScenario.totalInvested / Math.pow(1 + annualRate, yearsLongest);
  const cashLost = longestScenario.totalInvested - cashSavingsToday;

  const bestScenario = scenarios.reduce((best, s) =>
    s.returnMultiple > best.returnMultiple ? s : best
  );

  const spinSpeed = Math.min(8, Math.max(0.5, bestScenario.returnMultiple / 10));

  return {
    scenarios,
    cashSavingsToday,
    cashLost,
    bestScenario,
    spinSpeed,
  };
}
