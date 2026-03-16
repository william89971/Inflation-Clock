import adoptionData from "@/data/bitcoin-adoption.json";

interface Props {
  locale: string;
}

type AdoptionStatus = "legal_tender" | "legal" | "restricted" | "banned";

interface CountryInfo {
  status: AdoptionStatus;
  name: string;
}

const STATUS_COLORS: Record<AdoptionStatus, string> = {
  legal_tender: "#F7931A",
  legal: "#2EC4B6",
  restricted: "#FFB347",
  banned: "#FF6B6B",
};

const STATUS_LABELS: Record<AdoptionStatus, { en: string; es: string }> = {
  legal_tender: { en: "Legal Tender", es: "Moneda de Curso Legal" },
  legal: { en: "Legal / Regulated", es: "Legal / Regulado" },
  restricted: { en: "Restricted", es: "Restringido" },
  banned: { en: "Banned", es: "Prohibido" },
};

export default function AdoptionMapPanel({ locale }: Props) {
  const data = adoptionData as Record<string, CountryInfo>;
  const grouped: Record<AdoptionStatus, string[]> = {
    legal_tender: [],
    legal: [],
    restricted: [],
    banned: [],
  };

  for (const [, info] of Object.entries(data)) {
    grouped[info.status]?.push(info.name);
  }

  return (
    <div className="card-warm rounded-2xl p-6">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-4">
        {locale === "es"
          ? "Adopcion Global de Bitcoin"
          : "Global Bitcoin Adoption"}
      </h3>

      {/* Legend + Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {(
          Object.entries(grouped) as [AdoptionStatus, string[]][]
        ).map(([status, countries]) => (
          <div
            key={status}
            className="rounded-xl bg-bg-primary/60 px-4 py-3 border-l-4"
            style={{ borderLeftColor: STATUS_COLORS[status] }}
          >
            <p className="text-[11px] font-medium text-text-muted">
              {locale === "es"
                ? STATUS_LABELS[status].es
                : STATUS_LABELS[status].en}
            </p>
            <p
              className="font-[var(--font-heading)] text-2xl font-bold"
              style={{ color: STATUS_COLORS[status] }}
            >
              {countries.length}
            </p>
            <p className="text-[10px] text-text-muted">
              {locale === "es" ? "paises" : "countries"}
            </p>
          </div>
        ))}
      </div>

      {/* Country lists */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {(
          Object.entries(grouped) as [AdoptionStatus, string[]][]
        ).map(([status, countries]) =>
          countries.length > 0 ? (
            <div key={status}>
              <h4
                className="text-[11px] font-bold uppercase tracking-wider mb-2"
                style={{ color: STATUS_COLORS[status] }}
              >
                {locale === "es"
                  ? STATUS_LABELS[status].es
                  : STATUS_LABELS[status].en}
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {countries.sort().map((name) => (
                  <span
                    key={name}
                    className="inline-block rounded-full px-2.5 py-0.5 text-[10px] font-medium"
                    style={{
                      backgroundColor: `${STATUS_COLORS[status]}15`,
                      color: STATUS_COLORS[status],
                    }}
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>
          ) : null
        )}
      </div>

      <p className="mt-4 text-[11px] text-text-muted leading-relaxed">
        {locale === "es"
          ? "Estado regulatorio a marzo 2026. La clasificacion puede variar por jurisdiccion."
          : "Regulatory status as of March 2026. Classification may vary by jurisdiction."}
      </p>
    </div>
  );
}
