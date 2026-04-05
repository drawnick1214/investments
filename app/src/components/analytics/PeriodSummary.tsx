"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/context";
import { formatUsd, formatPercent, formatCop } from "@/lib/calculations";
import type { Snapshot, CashFlow } from "@/lib/types";
import { getAdjustedDailyChanges } from "@/lib/cash-flow-detection";
import { TrendingUp, TrendingDown, Target, BarChart3 } from "lucide-react";

interface Props {
  snapshots: Snapshot[];
  cashFlows: CashFlow[];
  showCop: boolean;
  trm: number;
}

export default function PeriodSummary({ snapshots, cashFlows, showCop, trm }: Props) {
  const { t } = useI18n();

  if (snapshots.length < 2) {
    return null;
  }

  const formatValue = (usdValue: number) => showCop ? formatCop(usdValue * trm) : formatUsd(usdValue);

  const sorted = [...snapshots].sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  // Get adjusted daily changes (excluding cash flows)
  const adjustedChanges = getAdjustedDailyChanges(sorted, cashFlows);

  // Calculate total return excluding cash flows
  const first = Number(sorted[0].total_usd);
  const last = Number(sorted[sorted.length - 1].total_usd);

  // Calculate net cash flows in USD
  let netCashFlows = 0;
  for (const flow of cashFlows) {
    const trm = 3691.87; // TODO: Use actual TRM
    const amountUsd = flow.currency === "USD" ? flow.amount : flow.amount / trm;
    if (flow.type === "deposit") netCashFlows += amountUsd;
    else if (flow.type === "withdrawal") netCashFlows -= amountUsd;
  }

  // Total Return excluding cash flows:
  // Real Return = (Value End - Value Start) - Net Deposits
  const totalReturn = (last - first) - netCashFlows;

  // Return % = Real Return / Initial Investment
  // If no cash flows, initial investment = first snapshot value
  const initialInvestment = first;
  const totalReturnPct = initialInvestment !== 0 ? (totalReturn / initialInvestment) * 100 : 0;

  const positiveDays = adjustedChanges.filter((d) => d.adjustedChange >= 0).length;
  const winRate =
    adjustedChanges.length > 0
      ? (positiveDays / adjustedChanges.length) * 100
      : 0;

  const avgDaily =
    adjustedChanges.length > 0
      ? adjustedChanges.reduce((s, d) => s + d.adjustedChange, 0) / adjustedChanges.length
      : 0;

  const best = adjustedChanges.reduce(
    (max, d) => (d.adjustedChange > max.adjustedChange ? d : max),
    adjustedChanges[0] || { date: "-", adjustedChange: 0 }
  );

  const worst = adjustedChanges.reduce(
    (min, d) => (d.adjustedChange < min.adjustedChange ? d : min),
    adjustedChanges[0] || { date: "-", adjustedChange: 0 }
  );

  const isPositiveReturn = totalReturn >= 0;

  const dailyChanges = adjustedChanges.map(ac => ({
    date: ac.date,
    change: ac.adjustedChange,
    pct: 0, // TODO: Calculate percentage
  }));

  const stats = [
    {
      label: t("totalReturn"),
      value: formatValue(totalReturn),
      sub: formatPercent(totalReturnPct),
      icon: isPositiveReturn ? TrendingUp : TrendingDown,
      color: isPositiveReturn ? "text-emerald-400" : "text-red-400",
    },
    {
      label: t("avgDailyReturn"),
      value: formatValue(avgDaily),
      sub: `${adjustedChanges.length} días`,
      icon: BarChart3,
      color: avgDaily >= 0 ? "text-emerald-400" : "text-red-400",
    },
    {
      label: t("bestDay"),
      value: formatValue(best.adjustedChange),
      sub: best.date,
      icon: TrendingUp,
      color: "text-emerald-400",
    },
    {
      label: t("worstDay"),
      value: formatValue(worst.adjustedChange),
      sub: worst.date,
      icon: TrendingDown,
      color: "text-red-400",
    },
    {
      label: t("winRate"),
      value: `${winRate.toFixed(0)}%`,
      sub: `${positiveDays}/${dailyChanges.length}`,
      icon: Target,
      color: winRate >= 50 ? "text-emerald-400" : "text-red-400",
    },
  ];

  return (
    <div>
      <h3 className="mb-3 text-sm font-medium text-zinc-400">
        {t("periodSummary")}
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {stats.map((stat) => (
          <Card
            key={stat.label}
            className="border-zinc-800 bg-zinc-900"
          >
            <CardContent className="px-3 py-3">
              <div className="flex items-center gap-2">
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                <span className="text-[11px] text-zinc-500">{stat.label}</span>
              </div>
              <p className={`mt-1 text-lg font-bold ${stat.color}`}>
                {stat.value}
              </p>
              <p className="text-[10px] text-zinc-600">{stat.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
