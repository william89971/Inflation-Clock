import type { CountryCode } from "./inflation";

export type RegionOption = {
  value: string;
  label: string;
  label_es?: string;
};

export const REGIONS: Record<CountryCode, RegionOption[]> = {
  US: [
    { value: "los-angeles", label: "Los Angeles", label_es: "Los Angeles" },
    { value: "new-york", label: "New York", label_es: "Nueva York" },
    { value: "houston", label: "Houston" },
    { value: "chicago", label: "Chicago" },
    { value: "miami", label: "Miami" },
    { value: "phoenix", label: "Phoenix" },
  ],
  MX: [
    { value: "cdmx", label: "Mexico City (CDMX)", label_es: "Ciudad de Mexico (CDMX)" },
    { value: "guadalajara", label: "Guadalajara" },
    { value: "monterrey", label: "Monterrey" },
  ],
  SV: [
    { value: "san-salvador", label: "San Salvador" },
  ],
  AR: [
    { value: "buenos-aires", label: "Buenos Aires" },
  ],
  BR: [],
  CO: [],
  VE: [],
};
