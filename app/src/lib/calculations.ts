export function calcDailyRate(rateEA: number): number {
  return Math.pow(1 + rateEA, 1 / 365) - 1;
}

export function calcDailyInterest(balance: number, rateEA: number): number {
  return balance * calcDailyRate(rateEA);
}

export function calcMonthlyInterest(balance: number, rateEA: number): number {
  return calcDailyInterest(balance, rateEA) * 30;
}

export function calcAnnualInterest(balance: number, rateEA: number): number {
  return balance * rateEA;
}

export function calcPnl(
  shares: number,
  avgCost: number,
  currentPrice: number
): { marketValue: number; pnl: number; pnlPercent: number } {
  const marketValue = shares * currentPrice;
  const costBasis = shares * avgCost;
  const pnl = marketValue - costBasis;
  const pnlPercent = costBasis !== 0 ? (pnl / costBasis) * 100 : 0;
  return { marketValue, pnl, pnlPercent };
}

export function calcPlanPnl(
  currentValue: number,
  invested: number
): { pnl: number; pnlPercent: number } {
  const pnl = currentValue - invested;
  const pnlPercent = invested !== 0 ? (pnl / invested) * 100 : 0;
  return { pnl, pnlPercent };
}

export function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
}

export function formatCop(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCopShort(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

export function formatPercent(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function formatNumber(value: number, decimals = 2): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function daysUntil(dateStr: string): number {
  const target = new Date(dateStr + "T00:00:00");
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function getMarginColor(margin: number): string {
  if (margin >= 150) return "text-green-400";
  if (margin >= 108) return "text-yellow-400";
  return "text-red-400";
}

export function isSharesBased(instrumentType: string): boolean {
  return ['stock', 'cfd', 'etf', 'etn', 'etc', 'forex'].includes(instrumentType);
}

/** Returns true if this position uses shares × price calculation (volume-based).
 *  Returns false if it uses invested → current_value (value-based).
 *  entry_mode overrides the default behavior for shares-based types. */
export function usesVolumeEntry(
  instrumentType: string,
  entryMode?: string | null
): boolean {
  if (entryMode === 'value') return false;
  if (entryMode === 'shares') return true;
  return isSharesBased(instrumentType);
}

export function getMarginLabel(
  margin: number,
  lang: "es" | "en"
): string | null {
  if (margin >= 150) return null;
  if (margin >= 108)
    return lang === "es" ? "Precaucion: margen bajo" : "Warning: low margin";
  return lang === "es"
    ? "Peligro: riesgo de margin call"
    : "Danger: margin call risk";
}
