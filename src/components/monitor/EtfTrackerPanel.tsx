import type { EtfFlowsData } from "@/types/monitor";
import SignalBadge from "./SignalBadge";

interface Props {
  data: EtfFlowsData | null;
  locale: string;
}

function formatVolume(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
  return n.toFixed(0);
}

function formatFlow(n: number): string {
  const sign = n >= 0 ? "+" : "";
  if (Math.abs(n) >= 1e9) return `${sign}$${(n / 1e9).toFixed(1)}B`;
  if (Math.abs(n) >= 1e6) return `${sign}$${(n / 1e6).toFixed(1)}M`;
  if (Math.abs(n) >= 1e3) return `${sign}$${(n / 1e3).toFixed(0)}K`;
  return `${sign}$${n.toFixed(0)}`;
}

export default function EtfTrackerPanel({ data, locale }: Props) {
  if (!data || data.etfs.length === 0) {
    return (
      <div className="card-warm rounded-2xl p-6">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">
          {locale === "es" ? "Flujos de ETF" : "ETF Flows"}
        </h3>
        <p className="text-sm text-text-muted">
          {locale === "es"
            ? "Datos no disponibles. Los mercados pueden estar cerrados."
            : "Data unavailable. Markets may be closed."}
        </p>
      </div>
    );
  }

  const { summary, etfs } = data;

  return (
    <div className="card-warm rounded-2xl p-6">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-4">
        {locale === "es" ? "Flujos de ETF de Bitcoin" : "Bitcoin ETF Flows"}
      </h3>

      {/* Summary row */}
      <div className="flex flex-wrap items-center gap-3 mb-4 rounded-xl bg-bg-primary/60 px-4 py-3">
        <SignalBadge status={summary.netDirection} />
        <span className="text-sm font-bold text-text-heading tabular-nums">
          {formatFlow(summary.totalEstFlow)}
        </span>
        <span className="text-xs text-text-muted">
          {locale === "es" ? "estimado" : "est."}
        </span>
        <span className="ml-auto text-xs text-text-muted">
          <span className="text-positive font-semibold">
            ↑{summary.inflowCount}
          </span>{" "}
          /{" "}
          <span className="text-negative font-semibold">
            ↓{summary.outflowCount}
          </span>
        </span>
      </div>

      {/* ETF table */}
      <div className="overflow-x-auto -mx-2">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-text-muted text-[10px] uppercase tracking-wider">
              <th className="px-2 py-1.5 text-left font-medium">
                {locale === "es" ? "Ticker" : "Ticker"}
              </th>
              <th className="px-2 py-1.5 text-left font-medium">
                {locale === "es" ? "Emisor" : "Issuer"}
              </th>
              <th className="px-2 py-1.5 text-right font-medium">
                {locale === "es" ? "Precio" : "Price"}
              </th>
              <th className="px-2 py-1.5 text-right font-medium">
                {locale === "es" ? "Cambio" : "Change"}
              </th>
              <th className="px-2 py-1.5 text-right font-medium hidden sm:table-cell">
                {locale === "es" ? "Volumen" : "Volume"}
              </th>
              <th className="px-2 py-1.5 text-right font-medium">
                {locale === "es" ? "Flujo" : "Flow"}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {etfs.map((etf) => (
              <tr key={etf.ticker} className="hover:bg-bg-primary/40 transition-colors">
                <td className="px-2 py-2 font-bold text-text-heading">
                  {etf.ticker}
                </td>
                <td className="px-2 py-2 text-text-secondary">
                  {etf.issuer}
                </td>
                <td className="px-2 py-2 text-right tabular-nums text-text-heading">
                  ${etf.price.toFixed(2)}
                </td>
                <td
                  className={`px-2 py-2 text-right tabular-nums font-semibold ${
                    etf.priceChange >= 0 ? "text-positive" : "text-negative"
                  }`}
                >
                  {etf.priceChange >= 0 ? "+" : ""}
                  {etf.priceChange.toFixed(2)}%
                </td>
                <td className="px-2 py-2 text-right tabular-nums text-text-secondary hidden sm:table-cell">
                  {formatVolume(etf.volume)}
                  {etf.volumeRatio > 1.5 && (
                    <span className="ml-1 text-bitcoin" title="Above average volume">
                      🔥
                    </span>
                  )}
                </td>
                <td className="px-2 py-2 text-right">
                  <SignalBadge status={etf.direction} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-[11px] text-text-muted leading-relaxed">
        {locale === "es"
          ? "Flujos estimados basados en volumen y cambio de precio. No son datos oficiales de flujo."
          : "Estimated flows based on volume and price change. Not official flow data."}
      </p>
    </div>
  );
}
