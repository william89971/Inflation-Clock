export type AffiliatePartner = {
  id: string;
  name: string;
  logo: string;
  description: { en: string; es: string };
  countries: string[];
  affiliateBaseUrl: string;
  affiliateParam: string;
  commissionType: "cpa" | "revenue_share" | "hybrid";
  commissionRate: string;
  category: "exchange" | "wallet" | "hardware_wallet" | "service";
  priority: number;
  whyRecommend?: { en: string; es: string };
};

export const AFFILIATE_PARTNERS: AffiliatePartner[] = [
  // ── US / El Salvador ─────────────────────────────────────────────────
  {
    id: "strike",
    name: "Strike",
    logo: "\u26A1",
    description: {
      en: "Lightning-fast Bitcoin purchases. Perfect for beginners. Send money anywhere instantly.",
      es: "Compra Bitcoin al instante. Perfecto para principiantes. Env\u00eda dinero a cualquier lugar.",
    },
    countries: ["US", "SV"],
    affiliateBaseUrl: "https://strike.me",
    affiliateParam: "ref",
    commissionType: "cpa",
    commissionRate: "$10 per signup",
    category: "exchange",
    priority: 1,
  },
  {
    id: "river",
    name: "River",
    logo: "\uD83C\uDF0A",
    description: {
      en: "Bitcoin-only exchange. Recurring buys, auto-withdraw to your wallet.",
      es: "Exchange solo de Bitcoin. Compras recurrentes, retiro autom\u00e1tico a tu wallet.",
    },
    countries: ["US"],
    affiliateBaseUrl: "https://river.com",
    affiliateParam: "ref",
    commissionType: "revenue_share",
    commissionRate: "20% of fees for 12 months",
    category: "exchange",
    priority: 3,
  },
  {
    id: "swan",
    name: "Swan Bitcoin",
    logo: "\uD83E\uDDA2",
    description: {
      en: "Bitcoin-only. Automatic DCA (dollar-cost averaging). Set it and forget it.",
      es: "Solo Bitcoin. DCA autom\u00e1tico (compras programadas). Configura y olvida.",
    },
    countries: ["US"],
    affiliateBaseUrl: "https://swanbitcoin.com",
    affiliateParam: "ref",
    commissionType: "cpa",
    commissionRate: "$10 per funded account",
    category: "exchange",
    priority: 4,
  },
  {
    id: "cashapp",
    name: "Cash App",
    logo: "\uD83D\uDCB2",
    description: {
      en: "Buy Bitcoin in seconds. The easiest way to get started — you probably already have it.",
      es: "Compra Bitcoin en segundos. La forma m\u00e1s f\u00e1cil de empezar.",
    },
    countries: ["US"],
    affiliateBaseUrl: "https://cash.app",
    affiliateParam: "ref",
    commissionType: "cpa",
    commissionRate: "$5 per signup",
    category: "exchange",
    priority: 2,
  },

  // ── Latin America ────────────────────────────────────────────────────
  {
    id: "bitso",
    name: "Bitso",
    logo: "\uD83C\uDF1E",
    description: {
      en: "Latin America's largest crypto exchange. Buy Bitcoin with local currency.",
      es: "El exchange m\u00e1s grande de Latinoam\u00e9rica. Compra Bitcoin con tu moneda local.",
    },
    countries: ["MX", "AR", "BR", "CO"],
    affiliateBaseUrl: "https://bitso.com",
    affiliateParam: "ref",
    commissionType: "revenue_share",
    commissionRate: "15% of fees",
    category: "exchange",
    priority: 1,
  },
  {
    id: "buda",
    name: "Buda.com",
    logo: "\uD83C\uDFD4\uFE0F",
    description: {
      en: "Trusted LatAm exchange. Buy Bitcoin easily in Colombia.",
      es: "Exchange confiable de Latinoam\u00e9rica. Compra Bitcoin f\u00e1cilmente en Colombia.",
    },
    countries: ["CO"],
    affiliateBaseUrl: "https://buda.com",
    affiliateParam: "ref",
    commissionType: "revenue_share",
    commissionRate: "10% of fees",
    category: "exchange",
    priority: 2,
  },
  {
    id: "lemoncash",
    name: "Lemon Cash",
    logo: "\uD83C\uDF4B",
    description: {
      en: "Argentina's popular Bitcoin app. Buy, sell, and spend Bitcoin easily.",
      es: "La app de Bitcoin m\u00e1s popular de Argentina. Compra, vende y gasta Bitcoin f\u00e1cilmente.",
    },
    countries: ["AR"],
    affiliateBaseUrl: "https://lemon.me",
    affiliateParam: "ref",
    commissionType: "cpa",
    commissionRate: "$5 per signup",
    category: "exchange",
    priority: 2,
  },
  {
    id: "mercadobitcoin",
    name: "Mercado Bitcoin",
    logo: "\uD83C\uDDE7\uD83C\uDDF7",
    description: {
      en: "Brazil's largest Bitcoin exchange. Buy with Pix or bank transfer.",
      es: "El exchange de Bitcoin m\u00e1s grande de Brasil. Compra con Pix o transferencia.",
    },
    countries: ["BR"],
    affiliateBaseUrl: "https://mercadobitcoin.com.br",
    affiliateParam: "ref",
    commissionType: "revenue_share",
    commissionRate: "15% of fees",
    category: "exchange",
    priority: 2,
  },

  // ── Hardware Wallets (Global) ────────────────────────────────────────
  {
    id: "trezor",
    name: "Trezor",
    logo: "\uD83D\uDD12",
    description: {
      en: "Open-source hardware wallet. Store your Bitcoin safely offline.",
      es: "Wallet de hardware open-source. Almacena tu Bitcoin de forma segura y offline.",
    },
    countries: [
      "US",
      "SV",
      "MX",
      "AR",
      "BR",
      "CO",
      "VE",
      "GLOBAL",
    ],
    affiliateBaseUrl: "https://trezor.io",
    affiliateParam: "offer_id",
    commissionType: "revenue_share",
    commissionRate: "12-15% per sale",
    category: "hardware_wallet",
    priority: 6,
  },
  {
    id: "coldcard",
    name: "Coldcard",
    logo: "\u2744\uFE0F",
    description: {
      en: "Bitcoin-only hardware wallet. Maximum security for serious holders.",
      es: "Wallet de hardware solo para Bitcoin. M\u00e1xima seguridad para holders serios.",
    },
    countries: [
      "US",
      "SV",
      "MX",
      "AR",
      "BR",
      "CO",
      "VE",
      "GLOBAL",
    ],
    affiliateBaseUrl: "https://coldcard.com",
    affiliateParam: "ref",
    commissionType: "revenue_share",
    commissionRate: "10% per sale",
    category: "hardware_wallet",
    priority: 7,
  },
  {
    id: "ledger",
    name: "Ledger",
    logo: "\uD83D\uDEE1\uFE0F",
    description: {
      en: "Popular hardware wallet. Easy to use, supports many assets.",
      es: "Wallet de hardware popular. F\u00e1cil de usar, soporta muchos activos.",
    },
    countries: [
      "US",
      "SV",
      "MX",
      "AR",
      "BR",
      "CO",
      "VE",
      "GLOBAL",
    ],
    affiliateBaseUrl: "https://ledger.com",
    affiliateParam: "r",
    commissionType: "revenue_share",
    commissionRate: "10% per sale",
    category: "hardware_wallet",
    priority: 8,
  },
];

// ── Helper: get partners available in a country ────────────────────────
export function getPartnersForCountry(
  countryCode: string
): AffiliatePartner[] {
  return AFFILIATE_PARTNERS.filter(
    (p) =>
      p.countries.includes(countryCode) || p.countries.includes("GLOBAL")
  ).sort((a, b) => a.priority - b.priority);
}

// ── Helper: recommendation engine ─────────────────────────────────────
/**
 * Returns a sorted list of recommended partners based on:
 * - Country availability
 * - User experience level (modules completed)
 * - Device type (mobile users get mobile-first apps)
 */
export function getRecommendedPartners(
  country: string,
  modulesCompleted: number,
  isMobile: boolean
): AffiliatePartner[] {
  const available = getPartnersForCountry(country);

  // Beginner-friendly partner IDs (0-5 modules)
  const beginnerFriendly = new Set([
    "strike",
    "cashapp",
    "bitso",
    "lemoncash",
  ]);

  // Advanced partner IDs (6+ modules — Bitcoin-only exchanges & hardware wallets)
  const advancedPartners = new Set([
    "river",
    "swan",
    "trezor",
    "coldcard",
    "ledger",
  ]);

  // Mobile-first partner IDs
  const mobileFriendly = new Set([
    "strike",
    "cashapp",
    "bitso",
    "lemoncash",
    "mercadobitcoin",
  ]);

  const isBeginner = modulesCompleted <= 5;

  return available.sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;

    // Experience-level boost
    if (isBeginner) {
      if (beginnerFriendly.has(a.id)) scoreA += 10;
      if (beginnerFriendly.has(b.id)) scoreB += 10;
    } else {
      if (advancedPartners.has(a.id)) scoreA += 10;
      if (advancedPartners.has(b.id)) scoreB += 10;
    }

    // Mobile boost
    if (isMobile) {
      if (mobileFriendly.has(a.id)) scoreA += 5;
      if (mobileFriendly.has(b.id)) scoreB += 5;
    }

    // Use base priority as tiebreaker (lower number = higher priority)
    scoreA -= a.priority;
    scoreB -= b.priority;

    return scoreB - scoreA; // Higher score first
  });
}
