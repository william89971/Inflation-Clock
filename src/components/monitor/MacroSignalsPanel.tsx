import type { MacroSignalsData } from "@/types/monitor";
import SignalBadge from "./SignalBadge";
import Sparkline from "./Sparkline";

interface Props {
  data: MacroSignalsData | null;
  locale: string;
}

interface SignalCardProps {
  name: string;
  nameEs: string;
  description: string;
  descriptionEs: string;
  status: string;
  value?: string;
  sparkline?: number[];
  sparklineColor?: string;
  locale: string;
}

function SignalCard({
  name,
  nameEs,
  description,
  descriptionEs,
  status,
  value,
  sparkline,
  sparklineColor = "#F7931A",
  locale,
}: SignalCardProps) {
  return (
    <div className="rounded-xl bg-bg-primary/60 px-4 py-3 flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-text-heading">
          {locale === "es" ? nameEs : name}
        </p>
        <SignalBadge status={status} />
      </div>
      {value && (
        <p className="text-sm font-bold text-text-heading tabular-nums">
          {value}
        </p>
      )}
      {sparkline && sparkline.length > 1 && (
        <Sparkline data={sparkline} color={sparklineColor} width={100} height={20} />
      )}
      <p className="text-[10px] text-text-muted leading-snug">
        {locale === "es" ? descriptionEs : description}
      </p>
    </div>
  );
}

function formatNum(v: number | undefined | null, suffix = "%"): string {
  if (v === undefined || v === null) return "N/A";
  const sign = v > 0 ? "+" : "";
  return `${sign}${v.toFixed(1)}${suffix}`;
}

export default function MacroSignalsPanel({ data, locale }: Props) {
  if (!data || data.unavailable) {
    return (
      <div className="card-warm rounded-2xl p-6">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">
          {locale === "es" ? "Senales Macro" : "Macro Signals"}
        </h3>
        <p className="text-sm text-text-muted">
          {locale === "es"
            ? "Datos no disponibles en este momento."
            : "Data unavailable at this time."}
        </p>
      </div>
    );
  }

  const { signals, verdict, bullishCount, totalCount } = data;

  return (
    <div className="card-warm rounded-2xl p-6">
      {/* Header with verdict */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            {locale === "es" ? "Senales Macro" : "Macro Signals"}
          </h3>
          <p className="text-xs text-text-muted mt-0.5">
            {bullishCount}/{totalCount}{" "}
            {locale === "es" ? "senales alcistas" : "signals bullish"}
          </p>
        </div>
        <div
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 font-[var(--font-heading)] text-lg font-extrabold ${
            verdict === "BUY"
              ? "bg-positive/15 text-positive"
              : verdict === "CASH"
                ? "bg-negative/15 text-negative"
                : "bg-text-muted/10 text-text-muted"
          }`}
        >
          {verdict === "BUY"
            ? locale === "es" ? "ACUMULAR" : "ACCUMULATE"
            : verdict === "CASH"
              ? locale === "es" ? "CAUTELA" : "CAUTION"
              : "—"}
        </div>
      </div>

      {/* Signal grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <SignalCard
          name="Liquidity"
          nameEs="Liquidez"
          description="JPY 30d trend. Squeeze = tightening global liquidity."
          descriptionEs="Tendencia JPY 30d. Squeeze = liquidez global restringida."
          status={signals.liquidity.status}
          value={formatNum(signals.liquidity.value)}
          sparkline={signals.liquidity.sparkline}
          sparklineColor="#4fc3f7"
          locale={locale}
        />
        <SignalCard
          name="Flow Structure"
          nameEs="Flujo de Capital"
          description="BTC vs QQQ 5d return gap. Aligned = healthy correlation."
          descriptionEs="Diferencia de retorno BTC vs QQQ 5d. Alineado = correlacion saludable."
          status={signals.flowStructure.status}
          value={
            signals.flowStructure.btcReturn5 !== undefined
              ? `BTC ${formatNum(signals.flowStructure.btcReturn5)} / QQQ ${formatNum(signals.flowStructure.qqqReturn5)}`
              : undefined
          }
          locale={locale}
        />
        <SignalCard
          name="Macro Regime"
          nameEs="Regimen Macro"
          description="Growth (QQQ) vs defensive (XLP) rotation."
          descriptionEs="Rotacion entre crecimiento (QQQ) y defensivo (XLP)."
          status={signals.macroRegime.status}
          value={
            signals.macroRegime.qqqRoc20 !== undefined
              ? `QQQ ${formatNum(signals.macroRegime.qqqRoc20)} / XLP ${formatNum(signals.macroRegime.xlpRoc20)}`
              : undefined
          }
          locale={locale}
        />
        <SignalCard
          name="Technical Trend"
          nameEs="Tendencia Tecnica"
          description="Price vs SMA-50/200. Mayer Multiple indicates cycle position."
          descriptionEs="Precio vs SMA-50/200. Mayer Multiple indica posicion del ciclo."
          status={signals.technicalTrend.status}
          value={
            signals.technicalTrend.mayerMultiple !== undefined
              ? `Mayer: ${signals.technicalTrend.mayerMultiple.toFixed(2)}`
              : undefined
          }
          sparkline={signals.technicalTrend.sparkline}
          sparklineColor="#F7931A"
          locale={locale}
        />
        <SignalCard
          name="Hash Rate"
          nameEs="Tasa de Hash"
          description="Mining power trend. Growing = miners confident."
          descriptionEs="Tendencia del poder minero. Creciendo = mineros confiados."
          status={signals.hashRate.status}
          value={formatNum(signals.hashRate.change30d)}
          locale={locale}
        />
        <SignalCard
          name="Price Momentum"
          nameEs="Impulso del Precio"
          description="Mayer Multiple zones: Strong > 1.0, Moderate 0.8-1.0."
          descriptionEs="Zonas Mayer: Fuerte > 1.0, Moderado 0.8-1.0."
          status={signals.priceMomentum.status}
          locale={locale}
        />
        <SignalCard
          name="Fear & Greed"
          nameEs="Miedo y Codicia"
          description="Market sentiment. Extreme fear often = buying opportunity."
          descriptionEs="Sentimiento del mercado. Miedo extremo = oportunidad de compra."
          status={signals.fearGreed.status}
          value={
            signals.fearGreed.value !== undefined
              ? `${signals.fearGreed.value}/100`
              : undefined
          }
          locale={locale}
        />
      </div>

      <p className="mt-4 text-[11px] text-text-muted leading-relaxed">
        {locale === "es"
          ? "Estas senales no son consejos financieros. Son indicadores educativos para entender el contexto del mercado."
          : "These signals are not financial advice. They are educational indicators to help understand market context."}
      </p>
    </div>
  );
}
