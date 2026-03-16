interface SignalBadgeProps {
  status: string;
  className?: string;
}

function getBadgeStyle(status: string): { bg: string; text: string } {
  const s = status.toUpperCase();
  const bullish = [
    "BULLISH",
    "BUY",
    "RISK-ON",
    "GROWING",
    "ALIGNED",
    "NORMAL",
    "STRONG",
    "EXTREME GREED",
    "GREED",
    "INFLOW",
    "NET INFLOW",
  ];
  const bearish = [
    "BEARISH",
    "CASH",
    "DEFENSIVE",
    "DECLINING",
    "SQUEEZE",
    "PASSIVE GAP",
    "WEAK",
    "EXTREME FEAR",
    "FEAR",
    "OUTFLOW",
    "NET OUTFLOW",
  ];

  if (bullish.includes(s))
    return { bg: "bg-positive/15", text: "text-positive" };
  if (bearish.includes(s))
    return { bg: "bg-negative/15", text: "text-negative" };
  return { bg: "bg-text-muted/10", text: "text-text-muted" };
}

export default function SignalBadge({ status, className = "" }: SignalBadgeProps) {
  const { bg, text } = getBadgeStyle(status);
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${bg} ${text} ${className}`}
    >
      {status}
    </span>
  );
}
