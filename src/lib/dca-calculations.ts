export interface DCAMonthlyBreakdown {
  date: string;
  btc_price: number;
  btc_bought: number;
  cumulative_btc: number;
  portfolio_value: number;
  total_invested: number;
}

export interface DCASimulation {
  monthly_amount: number;
  months: number;
  total_invested: number;
  mattress: {
    nominal_value: number;
    real_value: number;
    purchasing_power_lost: number;
  };
  savings_account: {
    nominal_value: number;
    interest_earned: number;
    real_value: number;
    real_gain_loss: number;
  };
  bitcoin: {
    total_btc: number;
    current_value: number;
    gain_loss_dollar: number;
    gain_loss_percent: number;
    monthly_breakdown: DCAMonthlyBreakdown[];
  };
}

let btcPricesCache: Record<string, number> | null = null;

export async function loadBtcMonthlyPrices(): Promise<Record<string, number>> {
  if (btcPricesCache) return btcPricesCache;
  try {
    const data = await import("@/data/btc-monthly-prices.json");
    btcPricesCache = data.default || data;
    return btcPricesCache!;
  } catch {
    return {};
  }
}

export async function simulateDCA(
  monthlyAmount: number,
  months: number,
  annualInflationRate: number = 3.5
): Promise<DCASimulation> {
  const btcPrices = await loadBtcMonthlyPrices();
  const savingsAPY = 0.005;
  const monthlyInflation = annualInflationRate / 100 / 12;
  const monthlySavingsRate = savingsAPY / 12;

  const allDates = Object.keys(btcPrices).sort();
  const startIndex = Math.max(0, allDates.length - months);
  const dates = allDates.slice(startIndex);

  let totalBtc = 0;
  let totalInvested = 0;
  let mattressNominal = 0;
  let savingsNominal = 0;
  const breakdown: DCAMonthlyBreakdown[] = [];

  const latestDate = allDates[allDates.length - 1];
  const currentBtcPrice = btcPrices[latestDate] || 95000;

  for (const date of dates) {
    const price = btcPrices[date];
    if (!price || price <= 0) continue;

    totalInvested += monthlyAmount;
    mattressNominal += monthlyAmount;
    savingsNominal = (savingsNominal + monthlyAmount) * (1 + monthlySavingsRate);

    const btcBought = monthlyAmount / price;
    totalBtc += btcBought;

    breakdown.push({
      date,
      btc_price: price,
      btc_bought: btcBought,
      cumulative_btc: totalBtc,
      portfolio_value: totalBtc * currentBtcPrice,
      total_invested: totalInvested,
    });
  }

  const actualMonths = breakdown.length;
  const inflationMultiplier = Math.pow(1 + monthlyInflation, actualMonths);
  const mattressReal = mattressNominal / inflationMultiplier;
  const savingsReal = savingsNominal / inflationMultiplier;
  const btcCurrentValue = totalBtc * currentBtcPrice;

  return {
    monthly_amount: monthlyAmount,
    months: actualMonths,
    total_invested: totalInvested,
    mattress: {
      nominal_value: mattressNominal,
      real_value: mattressReal,
      purchasing_power_lost: mattressNominal - mattressReal,
    },
    savings_account: {
      nominal_value: savingsNominal,
      interest_earned: savingsNominal - totalInvested,
      real_value: savingsReal,
      real_gain_loss: savingsReal - totalInvested,
    },
    bitcoin: {
      total_btc: totalBtc,
      current_value: btcCurrentValue,
      gain_loss_dollar: btcCurrentValue - totalInvested,
      gain_loss_percent: totalInvested > 0 ? ((btcCurrentValue / totalInvested) - 1) * 100 : 0,
      monthly_breakdown: breakdown,
    },
  };
}

export function getDailyComparison(countryCode: string): { en: string; es: string } {
  const map: Record<string, { en: string; es: string }> = {
    US: { en: "about one less coffee at Starbucks", es: "un cafe menos en Starbucks" },
    MX: { en: "about one less Uber ride", es: "un viaje menos en Uber" },
    SV: { en: "about one less combo meal", es: "un combo menos" },
    AR: { en: "about one less empanada lunch", es: "un almuerzo de empanadas menos" },
    BR: { en: "about one less acai bowl", es: "un acai menos" },
    CO: { en: "about one less almuerzo corriente", es: "un almuerzo corriente menos" },
    VE: { en: "about one less arepa meal", es: "una comida de arepas menos" },
  };
  return map[countryCode] || { en: "a small daily purchase", es: "una compra diaria pequena" };
}
