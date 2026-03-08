"use client";

import { useI18n } from "@/lib/i18n/context";
import DateRangePicker from "./DateRangePicker";

export type Period = "7d" | "30d" | "90d" | "6m" | "1y" | "all" | "custom";

interface Props {
  selected: Period;
  onChange: (period: Period) => void;
  customStartDate?: string;
  customEndDate?: string;
  onCustomStartChange?: (date: string) => void;
  onCustomEndChange?: (date: string) => void;
}

const periodKeys = {
  "7d": "last7Days2",
  "30d": "last30Days2",
  "90d": "last90Days",
  "6m": "last6Months",
  "1y": "lastYear",
  all: "allTime2",
  custom: "customRange",
} as const;

export default function PeriodSelector({
  selected,
  onChange,
  customStartDate,
  customEndDate,
  onCustomStartChange,
  onCustomEndChange,
}: Props) {
  const { t } = useI18n();

  return (
    <div className="space-y-2">
      <div className="flex gap-1 rounded-lg bg-zinc-900 p-1">
        {(Object.keys(periodKeys) as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
              selected === p
                ? "bg-emerald-500/20 text-emerald-400"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {t(periodKeys[p])}
          </button>
        ))}
      </div>
      {selected === "custom" &&
        customStartDate &&
        customEndDate &&
        onCustomStartChange &&
        onCustomEndChange && (
          <DateRangePicker
            startDate={customStartDate}
            endDate={customEndDate}
            onStartChange={onCustomStartChange}
            onEndChange={onCustomEndChange}
          />
        )}
    </div>
  );
}

export function getPeriodStartDate(period: Period): string {
  const now = new Date();
  switch (period) {
    case "7d":
      now.setDate(now.getDate() - 7);
      break;
    case "30d":
      now.setDate(now.getDate() - 30);
      break;
    case "90d":
      now.setDate(now.getDate() - 90);
      break;
    case "6m":
      now.setMonth(now.getMonth() - 6);
      break;
    case "1y":
      now.setFullYear(now.getFullYear() - 1);
      break;
    case "all":
    case "custom":
      return "2020-01-01";
  }
  return now.toISOString().split("T")[0];
}
