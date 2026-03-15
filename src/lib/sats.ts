/**
 * Convert a USD dollar amount to satoshis given the current BTC price.
 */
export function dollarsToSats(dollars: number, btcPrice: number): number {
  if (btcPrice <= 0) return 0;
  return Math.round((dollars / btcPrice) * 100_000_000);
}

/**
 * Format a satoshi amount for display.
 * Examples: 420 → "420 sats", 1_500_000 → "1.5M sats", 100_000_000+ → "X.XXXX BTC"
 */
export function formatSats(sats: number): string {
  if (sats >= 100_000_000) {
    return `${(sats / 100_000_000).toFixed(4)} BTC`;
  }
  if (sats >= 1_000_000) {
    return `${(sats / 1_000_000).toFixed(1)}M sats`;
  }
  return `${sats.toLocaleString()} sats`;
}
