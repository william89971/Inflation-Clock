import { CountryCode } from "@/data/inflation";

// Category CPI data type
type CategoryCPI = {
  food: Record<string, number>;
  housing: Record<string, number>;
  transport: Record<string, number>;
  healthcare: Record<string, number>;
  education: Record<string, number>;
  energy: Record<string, number>;
  general: Record<string, number>;
};

// Map expense categories to CPI categories
const EXPENSE_TO_CPI: Record<string, keyof CategoryCPI> = {
  monthly_rent: "housing",
  monthly_groceries: "food",
  monthly_transport: "transport",
  monthly_utilities: "energy",
  monthly_healthcare: "healthcare",
  monthly_education: "education",
  monthly_other: "general",
};

export interface ExpenseAnalysis {
  category: string;
  label: string;
  label_es: string;
  emoji: string;
  current_monthly: number;
  amount_1yr_ago: number;
  amount_5yr_ago: number;
  amount_10yr_ago: number;
  projected_1yr: number;
  projected_5yr: number;
  projected_10yr: number;
  category_inflation_rate: number;
  increase_dollar_5yr: number;
  increase_percent_5yr: number;
}

export interface ExpenseImpactResult {
  analyses: ExpenseAnalysis[];
  total_current: number;
  total_5yr_ago: number;
  total_increase_yearly: number;
  total_projected_5yr: number;
}

// Labels for expense categories
const CATEGORY_META: Record<string, { label: string; label_es: string; emoji: string }> = {
  monthly_rent: { label: "Rent / Housing", label_es: "Renta / Vivienda", emoji: "\u{1F3E0}" },
  monthly_groceries: { label: "Groceries & Food", label_es: "Comida y Abarrotes", emoji: "\u{1F6D2}" },
  monthly_transport: { label: "Transportation", label_es: "Transporte", emoji: "\u26FD" },
  monthly_utilities: { label: "Utilities", label_es: "Servicios", emoji: "\u26A1" },
  monthly_healthcare: { label: "Healthcare", label_es: "Salud", emoji: "\u{1F3E5}" },
  monthly_education: { label: "Education", label_es: "Educaci\u00F3n", emoji: "\u{1F4DA}" },
  monthly_other: { label: "Other", label_es: "Otros", emoji: "\u{1F4E6}" },
};

// Load CPI data for a country (dynamic import)
async function loadCategoryCPI(country: CountryCode): Promise<CategoryCPI> {
  try {
    const data = await import(`@/data/cpi-categories/${country.toLowerCase()}.json`);
    return data.default || data;
  } catch {
    // Fallback: use general rate for all categories
    return {
      food: {}, housing: {}, transport: {}, healthcare: {},
      education: {}, energy: {}, general: {},
    };
  }
}

// Get the average rate for a CPI category over the last N years
function getAverageRate(cpiData: Record<string, number>, yearsBack: number): number {
  const currentYear = new Date().getFullYear();
  let sum = 0;
  let count = 0;
  for (let y = currentYear - yearsBack + 1; y <= currentYear; y++) {
    const rate = cpiData[String(y)];
    if (rate !== undefined) {
      sum += rate;
      count++;
    }
  }
  return count > 0 ? sum / count : 3.0; // fallback 3%
}

// Calculate what an amount would have cost N years ago given category-specific inflation
function deflate(currentAmount: number, annualRate: number, years: number): number {
  return currentAmount / Math.pow(1 + annualRate / 100, years);
}

// Project what an amount will cost N years from now
function inflate(currentAmount: number, annualRate: number, years: number): number {
  return currentAmount * Math.pow(1 + annualRate / 100, years);
}

// Main function: calculate expense impact
export async function calculateExpenseImpact(
  expenses: Record<string, number>,
  country: CountryCode
): Promise<ExpenseImpactResult> {
  const cpiData = await loadCategoryCPI(country);
  const analyses: ExpenseAnalysis[] = [];

  for (const [key, amount] of Object.entries(expenses)) {
    if (!amount || amount <= 0) continue;
    const cpiKey = EXPENSE_TO_CPI[key];
    if (!cpiKey) continue;

    const meta = CATEGORY_META[key];
    if (!meta) continue;

    const categoryRates = cpiData[cpiKey] || cpiData.general || {};

    // Get recent rate (average of last 2 years for stability)
    const recentRate = getAverageRate(categoryRates, 2);
    // Get 5-year average rate
    const avg5yrRate = getAverageRate(categoryRates, 5);
    // Get 10-year average rate
    const avg10yrRate = getAverageRate(categoryRates, 10);

    const amount_1yr_ago = deflate(amount, recentRate, 1);
    const amount_5yr_ago = deflate(amount, avg5yrRate, 5);
    const amount_10yr_ago = deflate(amount, avg10yrRate, 10);

    const projected_1yr = inflate(amount, recentRate, 1);
    const projected_5yr = inflate(amount, avg5yrRate, 5);
    const projected_10yr = inflate(amount, avg10yrRate, 10);

    analyses.push({
      category: key,
      label: meta.label,
      label_es: meta.label_es,
      emoji: meta.emoji,
      current_monthly: amount,
      amount_1yr_ago,
      amount_5yr_ago,
      amount_10yr_ago,
      projected_1yr,
      projected_5yr,
      projected_10yr,
      category_inflation_rate: recentRate,
      increase_dollar_5yr: (amount - amount_5yr_ago) * 12,
      increase_percent_5yr: ((amount / amount_5yr_ago) - 1) * 100,
    });
  }

  // Sort by increase_percent_5yr descending (most impactful first)
  analyses.sort((a, b) => b.increase_percent_5yr - a.increase_percent_5yr);

  const total_current = analyses.reduce((sum, a) => sum + a.current_monthly, 0);
  const total_5yr_ago = analyses.reduce((sum, a) => sum + a.amount_5yr_ago, 0);
  const total_increase_yearly = (total_current - total_5yr_ago) * 12;
  const total_projected_5yr = analyses.reduce((sum, a) => sum + a.projected_5yr, 0);

  return {
    analyses,
    total_current,
    total_5yr_ago,
    total_increase_yearly,
    total_projected_5yr,
  };
}

// Calculate Bitcoin DCA alternative for expense tool
export function calculateBtcSavings(
  monthlyAmount: number,
  months: number,
  inflationRate: number
): { mattressReal: number; savingsReal: number; totalSaved: number } {
  const savingsAPY = 0.005; // 0.5% typical savings rate
  const monthlyInflation = inflationRate / 100 / 12;
  const monthlySavingsRate = savingsAPY / 12;

  let mattressNominal = 0;
  let mattressReal = 0;
  let savingsNominal = 0;

  for (let m = 0; m < months; m++) {
    mattressNominal += monthlyAmount;
    // Real value decreases each month due to inflation
    mattressReal = mattressNominal / Math.pow(1 + monthlyInflation, m + 1);

    savingsNominal = (savingsNominal + monthlyAmount) * (1 + monthlySavingsRate);
  }

  const savingsReal = savingsNominal / Math.pow(1 + monthlyInflation, months);

  return {
    mattressReal,
    savingsReal,
    totalSaved: monthlyAmount * months,
  };
}
