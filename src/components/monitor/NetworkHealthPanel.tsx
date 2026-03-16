import type { NetworkHealthData } from "@/types/monitor";
import Sparkline from "./Sparkline";
import SignalBadge from "./SignalBadge";

interface Props {
  data: NetworkHealthData | null;
  locale: string;
}

export default function NetworkHealthPanel({ data, locale }: Props) {
  if (!data) {
    return (
      <div className="card-warm rounded-2xl p-6 animate-pulse">
        <div className="h-4 w-32 rounded bg-border/30 mb-4" />
        <div className="h-16 rounded bg-border/30" />
      </div>
    );
  }

  const hashLabel =
    data.hashRate.change30d > 3
      ? "GROWING"
      : data.hashRate.change30d < -3
        ? "DECLINING"
        : "STABLE";

  return (
    <div className="card-warm rounded-2xl p-6">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-4">
        {locale === "es" ? "Salud de la Red" : "Network Health"}
      </h3>

      <div className="flex flex-col gap-4">
        {/* Hash Rate */}
        <div className="rounded-xl bg-bg-primary/60 px-4 py-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[11px] font-medium text-text-muted">
              {locale === "es" ? "Tasa de Hash" : "Hash Rate"}
            </p>
            <SignalBadge status={hashLabel} />
          </div>
          <p className="font-[var(--font-heading)] text-lg font-bold text-text-heading tabular-nums">
            {data.hashRate.current > 0
              ? `${data.hashRate.current.toFixed(0)} EH/s`
              : "—"}
          </p>
          <div className="flex items-center justify-between mt-1">
            <span
              className={`text-xs font-semibold ${
                data.hashRate.change30d >= 0
                  ? "text-positive"
                  : "text-negative"
              }`}
            >
              {data.hashRate.change30d >= 0 ? "+" : ""}
              {data.hashRate.change30d.toFixed(1)}% 30d
            </span>
            {data.hashRate.sparkline.length > 1 && (
              <Sparkline
                data={data.hashRate.sparkline}
                color="#2EC4B6"
                width={60}
                height={16}
              />
            )}
          </div>
        </div>

        {/* Difficulty */}
        <div className="rounded-xl bg-bg-primary/60 px-4 py-3">
          <p className="text-[11px] font-medium text-text-muted mb-1">
            {locale === "es" ? "Ajuste de Dificultad" : "Difficulty Adjustment"}
          </p>
          <p className="font-[var(--font-heading)] text-lg font-bold text-text-heading tabular-nums">
            {data.difficulty.current !== 0
              ? `${data.difficulty.current >= 0 ? "+" : ""}${data.difficulty.current.toFixed(1)}%`
              : "—"}
          </p>
          <p className="text-[10px] text-text-muted mt-0.5">
            {data.difficulty.nextAdjustment > 0
              ? `${data.difficulty.nextAdjustment.toFixed(0)}% ${locale === "es" ? "progreso" : "progress"}`
              : ""}
          </p>
        </div>

        {/* Lightning */}
        <div className="rounded-xl bg-bg-primary/60 px-4 py-3">
          <p className="text-[11px] font-medium text-text-muted mb-1">
            Lightning Network ⚡
          </p>
          <p className="font-[var(--font-heading)] text-lg font-bold text-bitcoin tabular-nums">
            {data.lightning.capacityBtc > 0
              ? `${data.lightning.capacityBtc.toLocaleString("en-US", { maximumFractionDigits: 0 })} BTC`
              : "—"}
          </p>
          <p className="text-[10px] text-text-muted mt-0.5">
            {data.lightning.channels > 0
              ? `${data.lightning.channels.toLocaleString()} ${locale === "es" ? "canales" : "channels"} · ${data.lightning.nodes.toLocaleString()} ${locale === "es" ? "nodos" : "nodes"}`
              : ""}
          </p>
        </div>
      </div>
    </div>
  );
}
