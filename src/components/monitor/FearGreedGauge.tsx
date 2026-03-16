interface FearGreedGaugeProps {
  value: number | null;
  label?: string;
  size?: number;
}

export default function FearGreedGauge({
  value,
  label,
  size = 120,
}: FearGreedGaugeProps) {
  if (value === null) {
    return (
      <div className="flex items-center justify-center text-text-muted text-sm">
        N/A
      </div>
    );
  }

  const v = Math.max(0, Math.min(100, value));
  const r = (size - 12) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (v / 100) * circumference;

  let color = "#FF6B6B"; // red (0-24)
  if (v >= 75) color = "#2EC4B6"; // teal/green
  else if (v >= 50) color = "#F7931A"; // bitcoin orange
  else if (v >= 25) color = "#FF8C42"; // deep orange

  return (
    <div className="flex flex-col items-center gap-2">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="drop-shadow-sm"
        role="img"
        aria-label={`Fear and Greed Index: ${v} out of 100, ${label || ""}`}
      >
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          className="text-border"
          strokeWidth="8"
          opacity="0.2"
        />
        {/* Colored arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 1s ease-out" }}
        />
        {/* Value text */}
        <text
          x={size / 2}
          y={size / 2 + 2}
          textAnchor="middle"
          dominantBaseline="central"
          fill={color}
          fontSize="24"
          fontWeight="bold"
          fontFamily="var(--font-heading)"
        >
          {v}
        </text>
      </svg>
      {label && (
        <span
          className="text-xs font-semibold uppercase tracking-wide"
          style={{ color }}
        >
          {label}
        </span>
      )}
    </div>
  );
}
