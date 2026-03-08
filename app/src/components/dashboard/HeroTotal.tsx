"use client";

import { formatUsd, formatCop, formatPercent } from "@/lib/calculations";
import { useI18n } from "@/lib/i18n/context";
import { TrendingUp, TrendingDown } from "lucide-react";

interface Props {
  totalUsd: number;
  trm: number;
  dailyChange: number | null;
  dailyPct: number | null;
  date: string;
  showCop: boolean;
}

export default function HeroTotal({
  totalUsd,
  trm,
  dailyChange,
  dailyPct,
  date,
  showCop,
}: Props) {
  const { t } = useI18n();
  const isPositive = (dailyChange ?? 0) >= 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  return (
    <div className="px-4 py-6 text-center">
      <p className="text-sm text-zinc-500">{t("totalPortfolio")}</p>
      <p className="mt-1 text-4xl font-bold tracking-tight">
        {showCop ? formatCop(totalUsd * trm) : formatUsd(totalUsd)}
      </p>
      {showCop && (
        <p className="mt-0.5 text-sm text-zinc-500">{formatUsd(totalUsd)}</p>
      )}
      {dailyChange !== null && dailyPct !== null && (
        <div
          className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${
            isPositive
              ? "bg-emerald-500/10 text-emerald-400"
              : "bg-red-500/10 text-red-400"
          }`}
        >
          <TrendIcon className="h-4 w-4" />
          <span>
            {isPositive ? "+" : ""}
            {formatUsd(dailyChange)} ({formatPercent(dailyPct)})
          </span>
        </div>
      )}
      <div className="mt-3 flex items-center justify-center gap-3 text-xs text-zinc-500">
        <span>{date}</span>
        <span className="h-3 w-px bg-zinc-700" />
        <span>TRM: {formatCop(trm)}</span>
      </div>
    </div>
  );
}
