"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/context";
import {
  formatUsd,
  formatPercent,
  formatCopShort,
} from "@/lib/calculations";
import { computeMetrics, type PeriodMetrics } from "@/lib/analytics-helpers";
import type { Snapshot } from "@/lib/types";

type Tab = "dod" | "wtd" | "mtd";

interface ComparisonData {
  current: Snapshot[];
  previous: Snapshot[];
}

interface Props {
  dod: ComparisonData | null;
  wtd: ComparisonData | null;
  mtd: ComparisonData | null;
}

function MetricColumn({
  label,
  dateRange,
  metrics,
}: {
  label: string;
  dateRange: string;
  metrics: PeriodMetrics | null;
}) {
  const { t } = useI18n();

  if (!metrics) {
    return (
      <div className="flex-1">
        <p className="mb-1 text-[10px] font-medium text-zinc-500">{label}</p>
        <p className="text-xs text-zinc-600">{t("noComparisonData")}</p>
      </div>
    );
  }

  const isPositive = metrics.totalReturn >= 0;

  return (
    <div className="flex-1 space-y-1.5">
      <div>
        <p className="text-[10px] font-medium text-zinc-500">{label}</p>
        <p className="text-[9px] text-zinc-600">{dateRange}</p>
      </div>
      <div>
        <p className="text-[10px] text-zinc-500">{t("totalReturn")}</p>
        <p
          className={`text-sm font-bold ${isPositive ? "text-emerald-400" : "text-red-400"}`}
        >
          {formatUsd(metrics.totalReturn)}{" "}
          <span className="text-[10px] font-normal">
            ({formatPercent(metrics.totalReturnPct)})
          </span>
        </p>
      </div>
      <div>
        <p className="text-[10px] text-zinc-500">{t("avgDailyReturn")}</p>
        <p className="text-xs text-zinc-300">{formatUsd(metrics.avgDaily)}</p>
      </div>
      <div>
        <p className="text-[10px] text-zinc-500">{t("winRate")}</p>
        <p className="text-xs text-zinc-300">
          {metrics.winRate.toFixed(0)}% ({metrics.positiveDays}/
          {metrics.totalDays})
        </p>
      </div>
      <div>
        <p className="text-[10px] text-zinc-500">{t("usdValue")}</p>
        <p className="text-xs text-zinc-300">
          {formatUsd(metrics.lastValueUsd)}
        </p>
      </div>
      <div>
        <p className="text-[10px] text-zinc-500">{t("copValue")}</p>
        <p className="text-xs text-zinc-300">
          {formatCopShort(metrics.lastValueCop)}
        </p>
      </div>
    </div>
  );
}

function formatRange(snapshots: Snapshot[]): string {
  if (snapshots.length === 0) return "-";
  const sorted = [...snapshots].sort((a, b) => a.date.localeCompare(b.date));
  const first = sorted[0].date;
  const last = sorted[sorted.length - 1].date;
  const fmtDate = (d: string) =>
    new Date(d + "T12:00:00").toLocaleDateString("es-CO", {
      month: "short",
      day: "numeric",
    });
  if (first === last) return fmtDate(first);
  return `${fmtDate(first)} - ${fmtDate(last)}`;
}

export default function PeriodComparison({ dod, wtd, mtd }: Props) {
  const { t } = useI18n();
  const [tab, setTab] = useState<Tab>("mtd");

  const tabs: { key: Tab; label: string }[] = [
    { key: "dod", label: t("dayOverDay") },
    { key: "wtd", label: t("weekToDate") },
    { key: "mtd", label: t("monthToDate") },
  ];

  const data = tab === "dod" ? dod : tab === "wtd" ? wtd : mtd;

  const currentMetrics = data ? computeMetrics(data.current) : null;
  const previousMetrics = data ? computeMetrics(data.previous) : null;

  const deltaReturn =
    currentMetrics && previousMetrics && previousMetrics.totalReturn !== 0
      ? ((currentMetrics.totalReturn - previousMetrics.totalReturn) /
          Math.abs(previousMetrics.totalReturn)) *
        100
      : null;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-zinc-400">
          {t("periodComparison")}
        </h3>
        <div className="flex gap-1 rounded-md bg-zinc-800 p-0.5">
          {tabs.map((tb) => (
            <button
              key={tb.key}
              onClick={() => setTab(tb.key)}
              className={`rounded px-2 py-1 text-xs ${
                tab === tb.key
                  ? "bg-zinc-700 text-zinc-200"
                  : "text-zinc-500"
              }`}
            >
              {tb.label}
            </button>
          ))}
        </div>
      </div>

      {!data ||
      (data.current.length === 0 && data.previous.length === 0) ? (
        <div className="py-8 text-center text-sm text-zinc-500">
          {t("noComparisonData")}
        </div>
      ) : (
        <Card className="border-zinc-800 bg-zinc-900">
          <CardContent className="px-3 py-3">
            <div className="flex gap-4">
              <MetricColumn
                label={t("currentPeriod")}
                dateRange={formatRange(data.current)}
                metrics={currentMetrics}
              />
              <div className="w-px bg-zinc-800" />
              <MetricColumn
                label={t("previousPeriod")}
                dateRange={formatRange(data.previous)}
                metrics={previousMetrics}
              />
            </div>
            {deltaReturn !== null && (
              <div className="mt-3 border-t border-zinc-800 pt-2">
                <span className="text-[10px] text-zinc-500">
                  {t("delta")}:{" "}
                </span>
                <span
                  className={`text-xs font-bold ${
                    deltaReturn >= 0 ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {deltaReturn >= 0 ? "+" : ""}
                  {deltaReturn.toFixed(0)}%
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
