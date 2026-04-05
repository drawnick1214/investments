import type { Snapshot, CashFlow } from "./types";

export interface DetectedCashFlow {
  date: string;
  type: "deposit" | "withdrawal";
  amount: number;
  currency: "USD" | "COP";
  confidence: "high" | "medium" | "low";
  reason: string;
}

/**
 * Detects cash flows by comparing consecutive snapshots
 * Returns suggested deposits/withdrawals based on value changes
 */
export function detectCashFlows(
  snapshots: Snapshot[],
  existingFlows: CashFlow[]
): DetectedCashFlow[] {
  if (snapshots.length < 2) return [];

  const sorted = [...snapshots].sort((a, b) => a.date.localeCompare(b.date));
  const detected: DetectedCashFlow[] = [];

  // Create a map of existing flows by date for quick lookup
  const existingByDate = new Map<string, CashFlow[]>();
  for (const flow of existingFlows) {
    if (!existingByDate.has(flow.date)) {
      existingByDate.set(flow.date, []);
    }
    existingByDate.get(flow.date)!.push(flow);
  }

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];

    const prevTotal = Number(prev.total_usd) || 0;
    const currTotal = Number(curr.total_usd) || 0;
    const dailyChange = Number(curr.daily_change) || 0;

    // Skip if there's already a cash flow for this date
    if (existingByDate.has(curr.date)) {
      continue;
    }

    // Calculate expected change from market movements
    // (this is a simplified heuristic - real calculation would need position-level analysis)
    const threshold = 100; // $100 USD threshold for detection

    // If daily change is significantly larger than expected, likely a deposit
    if (dailyChange > threshold) {
      // Check if it could be explained by normal market movements (< 10% change)
      const expectedMaxChange = prevTotal * 0.10; // 10% max daily change from market

      if (dailyChange > expectedMaxChange) {
        const estimatedDeposit = dailyChange - expectedMaxChange;

        detected.push({
          date: curr.date,
          type: "deposit",
          amount: Math.round(estimatedDeposit * 100) / 100,
          currency: "USD",
          confidence: estimatedDeposit > threshold * 2 ? "high" : "medium",
          reason: `Cambio diario inusual: $${dailyChange.toFixed(2)} (esperado < $${expectedMaxChange.toFixed(2)})`,
        });
      }
    }

    // If daily change is significantly negative, likely a withdrawal
    if (dailyChange < -threshold) {
      const expectedMaxDrop = prevTotal * 0.10;

      if (Math.abs(dailyChange) > expectedMaxDrop) {
        const estimatedWithdrawal = Math.abs(dailyChange) - expectedMaxDrop;

        detected.push({
          date: curr.date,
          type: "withdrawal",
          amount: Math.round(estimatedWithdrawal * 100) / 100,
          currency: "USD",
          confidence: estimatedWithdrawal > threshold * 2 ? "high" : "medium",
          reason: `Cambio diario inusual: $${dailyChange.toFixed(2)} (esperado > -$${expectedMaxDrop.toFixed(2)})`,
        });
      }
    }
  }

  return detected;
}

/**
 * Calculate adjusted daily changes excluding cash flows
 */
export function getAdjustedDailyChanges(
  snapshots: Snapshot[],
  cashFlows: CashFlow[]
): Array<{ date: string; adjustedChange: number; originalChange: number }> {
  const sorted = [...snapshots].sort((a, b) => a.date.localeCompare(b.date));
  const adjusted: Array<{ date: string; adjustedChange: number; originalChange: number }> = [];

  for (const snap of sorted) {
    if (snap.daily_change === null) continue;

    const dailyChange = Number(snap.daily_change);

    // Find cash flows for this date
    const flowsOnDate = cashFlows.filter((cf) => cf.date === snap.date);

    // Calculate net cash flow for this date in USD
    let netFlowUsd = 0;
    const trm = Number(snap.trm) || 3691.87;

    for (const flow of flowsOnDate) {
      const amountUsd = flow.currency === "USD" ? flow.amount : flow.amount / trm;
      if (flow.type === "deposit") {
        netFlowUsd += amountUsd;
      } else if (flow.type === "withdrawal") {
        netFlowUsd -= amountUsd;
      }
    }

    // Adjusted change = original change - cash flows
    const adjustedChange = dailyChange - netFlowUsd;

    adjusted.push({
      date: snap.date,
      adjustedChange: Math.round(adjustedChange * 100) / 100,
      originalChange: dailyChange,
    });
  }

  return adjusted;
}
