"use client";

import { useState } from "react";
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

type Grouping = "weekly" | "monthly";

interface GroupedData {
  label: string;
  change: number;
  startValue: number;
  endValue: number;
}

function groupSnapshots(
  snapshots: Snapshot[],
  grouping: Grouping
): GroupedData[] {
  const sorted = [...snapshots].sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  const groups = new Map<string, Snapshot[]>();

  for (const snap of sorted) {
    const d = new Date(snap.date + "T12:00:00");
    let key: string;
    if (grouping === "weekly") {
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay() + 1);
      key = weekStart.toISOString().split("T")[0];
    } else {
      key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    }
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(snap);
  }

  const result: GroupedData[] = [];
  for (const [key, snaps] of groups) {
    if (snaps.length === 0) continue;
    const first = Number(snaps[0].total_usd);
    const last = Number(snaps[snaps.length - 1].total_usd);
    const change = last - first;

    let label: string;
    if (grouping === "weekly") {
      const d = new Date(key + "T12:00:00");
      label = d.toLocaleDateString("es-CO", { month: "short", day: "numeric" });
    } else {
      const [y, m] = key.split("-");
      const d = new Date(Number(y), Number(m) - 1);
      label = d.toLocaleDateString("es-CO", { month: "short", year: "2-digit" });
    }

    result.push({ label, change, startValue: first, endValue: last });
  }

  return result;
}

export default function WeeklyMonthlyChart({ snapshots }: Props) {
  const { t } = useI18n();
  const [grouping, setGrouping] = useState<Grouping>("weekly");

  const data = groupSnapshots(snapshots, grouping);

  if (data.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-zinc-500">
        {t("noDataForPeriod")}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-zinc-400">
          {t("periodReturns")}
        </h3>
        <div className="flex gap-1 rounded-md bg-zinc-800 p-0.5">
          <button
            onClick={() => setGrouping("weekly")}
            className={`rounded px-2 py-1 text-xs ${
              grouping === "weekly"
                ? "bg-zinc-700 text-zinc-200"
                : "text-zinc-500"
            }`}
          >
            {t("weeklyReturns")}
          </button>
          <button
            onClick={() => setGrouping("monthly")}
            className={`rounded px-2 py-1 text-xs ${
              grouping === "monthly"
                ? "bg-zinc-700 text-zinc-200"
                : "text-zinc-500"
            }`}
          >
            {t("monthlyReturns")}
          </button>
        </div>
      </div>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 9, fill: "#71717a" }}
              axisLine={false}
              tickLine={false}
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
            />
            <Bar dataKey="change" radius={[3, 3, 0, 0]}>
              {data.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.change >= 0 ? "#10b981" : "#ef4444"}
                  fillOpacity={0.85}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
