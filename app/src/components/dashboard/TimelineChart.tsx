"use client";

import { useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { useI18n } from "@/lib/i18n/context";
import { formatUsd } from "@/lib/calculations";
import type { Snapshot } from "@/lib/types";

interface Props {
  snapshots: Snapshot[];
}

type Range = "7d" | "30d" | "all";

export default function TimelineChart({ snapshots }: Props) {
  const { t } = useI18n();
  const [range, setRange] = useState<Range>("30d");

  const now = new Date();
  const filtered = snapshots.filter((s) => {
    if (range === "all") return true;
    const days = range === "7d" ? 7 : 30;
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - days);
    return new Date(s.date) >= cutoff;
  });

  const chartData = filtered
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((s) => ({
      date: s.date,
      label: new Date(s.date + "T12:00:00").toLocaleDateString("es-CO", {
        month: "short",
        day: "numeric",
      }),
      value: Number(s.total_usd),
    }));

  if (chartData.length < 2) {
    return (
      <div className="px-4 py-8 text-center text-sm text-zinc-500">
        {chartData.length === 0
          ? t("noSnapshots")
          : "Se necesitan al menos 2 registros para mostrar el grafico"}
      </div>
    );
  }

  const minVal = Math.min(...chartData.map((d) => d.value)) * 0.995;
  const maxVal = Math.max(...chartData.map((d) => d.value)) * 1.005;

  return (
    <div className="px-4 py-3">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-zinc-400">
          {t("portfolioTimeline")}
        </h3>
        <div className="flex gap-1">
          {(["7d", "30d", "all"] as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
                range === r
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {r === "7d"
                ? t("last7Days")
                : r === "30d"
                  ? t("last30Days")
                  : t("allTime")}
            </button>
          ))}
        </div>
      </div>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "#71717a" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[minVal, maxVal]}
              tick={{ fontSize: 10, fill: "#71717a" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `$${v.toFixed(0)}`}
              width={55}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#18181b",
                border: "1px solid #3f3f46",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              formatter={(value: unknown) => [formatUsd(typeof value === "number" ? value : 0), "Total"]}
              labelStyle={{ color: "#a1a1aa" }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#10b981"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorValue)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
