import { Metadata } from "next";
import { CountryCode } from "@/data/inflation";
import { CountryPage } from "@/components/inflation/CountryPage";

const COUNTRY_NAMES: Record<string, string> = {
  US: "United States",
  SV: "El Salvador",
  MX: "Mexico",
  AR: "Argentina",
  BR: "Brazil",
  CO: "Colombia",
  VE: "Venezuela",
};

const COUNTRY_CODES = ["US", "SV", "MX", "AR", "BR", "CO", "VE"];

export function generateStaticParams() {
  return COUNTRY_CODES.map((country) => ({ country }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ country: string; locale: string }>;
}): Promise<Metadata> {
  const { country } = await params;
  const code = country.toUpperCase();
  const name = COUNTRY_NAMES[code] || country;
  const currentYear = new Date().getFullYear();

  return {
    title: `Inflation in ${name} ${currentYear} | The Inflation Clock`,
    description: `See how inflation has eroded purchasing power in ${name}. Current rates, historical data, and what it means for your money.`,
    openGraph: {
      title: `Inflation in ${name} ${currentYear} | The Inflation Clock`,
      description: `See how inflation has eroded purchasing power in ${name}. Current rates, historical data, and what it means for your money.`,
      type: "website",
    },
  };
}

export default function CountryInflationPage() {
  return <CountryPage />;
}
