import { CountryCode, getInflationRate } from "@/data/inflation";

export interface GenerationalLoss {
  name: string;
  relationship: string;
  birth_year: number;
  country: CountryCode;
  current_age: number;
  purchasing_power_lost_percent: number;
  estimated_lifetime_loss: number;
  color: string;
}

export interface HistoricalComparison {
  year: number;
  avg_monthly_rent: number;
  avg_home_price: number;
  milk_gallon: number;
  bread_loaf: number;
  eggs_dozen: number;
  gas_gallon: number;
  min_wage_hourly: number;
  median_income_monthly: number;
  college_yearly: number;
  currency: string;
  source: string;
}

export function calculateGenerationalLoss(member: {
  name: string;
  birth_year: number;
  relationship: string;
  country?: CountryCode;
  monthly_income?: number;
}): GenerationalLoss {
  const country: CountryCode = member.country || "US";
  const currentYear = new Date().getFullYear();
  const currentAge = currentYear - member.birth_year;

  let cumulativeMultiplier = 1;
  for (let year = member.birth_year + 1; year <= currentYear; year++) {
    const rate = getInflationRate(country, year);
    cumulativeMultiplier *= 1 + rate / 100;
  }

  const purchasingPowerRemaining = 1 / cumulativeMultiplier;
  const lostPercent = (1 - purchasingPowerRemaining) * 100;
  const lifetimeLoss = member.monthly_income
    ? member.monthly_income * 12 * (1 - purchasingPowerRemaining)
    : 0;

  let color = "#2dd4bf"; // teal
  if (lostPercent > 80) color = "#ff6b6b"; // coral
  else if (lostPercent > 50) color = "#fbbf24"; // yellow

  return {
    name: member.name,
    relationship: member.relationship,
    birth_year: member.birth_year,
    country,
    current_age: Math.max(0, currentAge),
    purchasing_power_lost_percent: lostPercent,
    estimated_lifetime_loss: lifetimeLoss,
    color,
  };
}

export function generateFamilyTimeline(
  members: {
    name: string;
    birth_year: number;
    relationship: string;
    country?: CountryCode;
    monthly_income?: number;
  }[]
): GenerationalLoss[] {
  return members
    .map((m) => calculateGenerationalLoss(m))
    .sort((a, b) => a.birth_year - b.birth_year);
}

export async function loadHistoricalData(
  country: CountryCode
): Promise<HistoricalComparison[]> {
  try {
    const data = await import(
      `@/data/historical/${country.toLowerCase()}-cost-of-living.json`
    );
    return data.default || data;
  } catch {
    return [];
  }
}

export function getHistoricalForYear(
  data: HistoricalComparison[],
  year: number
): HistoricalComparison | null {
  if (data.length === 0) return null;
  let closest = data[0];
  let minDiff = Math.abs(data[0].year - year);
  for (const entry of data) {
    const diff = Math.abs(entry.year - year);
    if (diff < minDiff) {
      minDiff = diff;
      closest = entry;
    }
  }
  return closest;
}
