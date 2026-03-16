import Sparkline from "./Sparkline";

interface FredMetric {
  label: string;
  value: string;
  change?: string;
  sparkline?: number[];
  color: string;
}

interface Props {
  m2Value?: number;
  fedRate?: number;
  cpiRate?: number;
  locale: string;
}

export default function MoneyPrinterPanel({
  m2Value,
  fedRate,
  cpiRate,
  locale,
}: Props) {
  const metrics: FredMetric[] = [
    {
      label: locale === "es" ? "Oferta Monetaria M2" : "M2 Money Supply",
      value: m2Value
        ? `$${(m2Value / 1000).toFixed(1)}T`
        : "—",
      color: "#2EC4B6",
    },
    {
      label: locale === "es" ? "Tasa de la Fed" : "Fed Funds Rate",
      value: fedRate !== undefined ? `${fedRate.toFixed(2)}%` : "—",
      color: "#F7931A",
    },
    {
      label: locale === "es" ? "Tasa de Inflacion (IPC)" : "Inflation Rate (CPI)",
      value: cpiRate !== undefined ? `${cpiRate.toFixed(1)}%` : "—",
      color: "#FF6B6B",
    },
  ];

  return (
    <div className="card-warm rounded-2xl p-6">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-4">
        {locale === "es" ? "Impresora de Dinero" : "Money Printer"}
        <span className="ml-1.5 text-base" role="img" aria-label="printer">
          🖨️
        </span>
      </h3>

      <div className="flex flex-col gap-4">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="flex items-center justify-between rounded-xl bg-bg-primary/60 px-4 py-3"
          >
            <div>
              <p className="text-[11px] font-medium text-text-muted">
                {m.label}
              </p>
              <p
                className="font-[var(--font-heading)] text-lg font-bold tabular-nums"
                style={{ color: m.color }}
              >
                {m.value}
              </p>
            </div>
            {m.sparkline && m.sparkline.length > 1 && (
              <Sparkline data={m.sparkline} color={m.color} width={60} height={20} />
            )}
          </div>
        ))}
      </div>

      <p className="mt-4 text-[11px] text-text-muted leading-relaxed">
        {locale === "es"
          ? "Cuando la oferta monetaria crece mas rapido que la economia, los precios suben. Tu dinero compra menos."
          : "When money supply grows faster than the economy, prices rise. Your money buys less."}
      </p>
    </div>
  );
}
