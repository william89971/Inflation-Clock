import { MetadataRoute } from "next";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://inflationclock.com";

const locales = ["en", "es"] as const;

const staticPages = [
  "/",
  "/results",
  "/learn",
  "/newsletter",
  "/premium",
];

const moduleSlugs = [
  "better-money",
  "your-salary",
  "food",
  "freedom",
  "human-rights",
  "equality",
  "property-rights",
  "housing",
  "politics",
  "war",
  "business",
  "crowdfunding",
  "energy",
  "environment",
  "art",
  "networks",
  "payments",
  "coding",
  "self-custody",
  "get-started",
];

const countryCodes = ["US", "SV", "MX", "AR", "BR", "CO", "VE"];

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  // Static pages in each locale
  for (const page of staticPages) {
    for (const locale of locales) {
      const path = locale === "en" ? page : `/${locale}${page}`;
      entries.push({
        url: `${BASE_URL}${path}`,
        lastModified: new Date(),
        changeFrequency: page === "/" ? "daily" : "weekly",
        priority: page === "/" ? 1.0 : 0.8,
      });
    }
  }

  // Learn module pages in each locale
  for (const slug of moduleSlugs) {
    for (const locale of locales) {
      const path =
        locale === "en"
          ? `/learn/${slug}`
          : `/${locale}/learn/${slug}`;
      entries.push({
        url: `${BASE_URL}${path}`,
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: 0.7,
      });
    }
  }

  // Country inflation pages in each locale
  for (const country of countryCodes) {
    for (const locale of locales) {
      const path =
        locale === "en"
          ? `/inflation/${country}`
          : `/${locale}/inflation/${country}`;
      entries.push({
        url: `${BASE_URL}${path}`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 0.9,
      });
    }
  }

  return entries;
}
