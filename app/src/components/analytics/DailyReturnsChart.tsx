"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import { useI18n } from "@/lib/i18n/context";
import { formatUsd } from "@/lib/calculations";
import type { Snapshot } from "@/lib/types";

interface Props {
  snapshots: Snapshot[];
}

export default function DailyReturnsChart({ snapshots }: Props) {
  const { t } = useI18n();

  const data = snapshots
    .filter((s) => s.daily_change !== null)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((s) => ({
      date: new Date(s.date + "T12:00:00").toLocaleDateString("es-CO", {
        month: "short",
        day: "numeric",
      }),
      fullDate: s.date,
      change: Number(s.daily_change),
      pct: Number(s.daily_pct),
    }));

  if (data.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-zinc-500">
        {t("noDataForPeriod")}
      </div>
    );
  }

  return (
    <div>
      <h3 className="mb-3 text-sm font-medium text-zinc-400">
        {t("dailyReturns")}
      </h3>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 9, fill: "#71717a" }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#71717a" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `$${v.toFixed(0)}`}
              width={50}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#18181b",
                border: "1px solid #3f3f46",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              formatter={(value: number | undefined) => [
                formatUsd(value ?? 0),
                t("change"),
              ]}
              labelFormatter={(label) => label}
            />
            <Bar dataKey="change" radius={[2, 2, 0, 0]}>
              {data.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.change >= 0 ? "#10b981" : "#ef4444"}
                  fillOpacity={0.8}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
