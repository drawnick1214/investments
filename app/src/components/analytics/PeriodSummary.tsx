"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/context";
import { formatUsd, formatPercent } from "@/lib/calculations";
import type { Snapshot } from "@/lib/types";
import { TrendingUp, TrendingDown, Target, BarChart3 } from "lucide-react";

interface Props {
  snapshots: Snapshot[];
}

export default function PeriodSummary({ snapshots }: Props) {
  const { t } = useI18n();

  if (snapshots.length < 2) {
    return null;
  }

  const sorted = [...snapshots].sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  const first = Number(sorted[0].total_usd);
  const last = Number(sorted[sorted.length - 1].total_usd);
  const totalReturn = last - first;
  const totalReturnPct = first !== 0 ? (totalReturn / first) * 100 : 0;

  const dailyChanges = sorted
    .filter((s) => s.daily_change !== null)
    .map((s) => ({
      date: s.date,
      change: Number(s.daily_change),
      pct: Number(s.daily_pct),
    }));

  const positiveDays = dailyChanges.filter((d) => d.change >= 0).length;
  const winRate =
    dailyChanges.length > 0
      ? (positiveDays / dailyChanges.length) * 100
      : 0;

  const avgDaily =
    dailyChanges.length > 0
      ? dailyChanges.reduce((s, d) => s + d.change, 0) / dailyChanges.length
      : 0;

  const best = dailyChanges.reduce(
    (max, d) => (d.change > max.change ? d : max),
    dailyChanges[0] || { date: "-", change: 0, pct: 0 }
  );

  const worst = dailyChanges.reduce(
    (min, d) => (d.change < min.change ? d : min),
    dailyChanges[0] || { date: "-", change: 0, pct: 0 }
  );

  const isPositiveReturn = totalReturn >= 0;

  const stats = [
    {
      label: t("totalReturn"),
      value: formatUsd(totalReturn),
      sub: formatPercent(totalReturnPct),
      icon: isPositiveReturn ? TrendingUp : TrendingDown,
      color: isPositiveReturn ? "text-emerald-400" : "text-red-400",
    },
    {
      label: t("avgDailyReturn"),
      value: formatUsd(avgDaily),
      sub: `${sorted.length} ${t("date").toLowerCase()}s`,
      icon: BarChart3,
      color: avgDaily >= 0 ? "text-emerald-400" : "text-red-400",
    },
    {
      label: t("bestDay"),
      value: formatUsd(best.change),
      sub: best.date,
      icon: TrendingUp,
      color: "text-emerald-400",
    },
    {
      label: t("worstDay"),
      value: formatUsd(worst.change),
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
