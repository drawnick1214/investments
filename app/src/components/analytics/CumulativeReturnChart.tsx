"use client";

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
import { formatPercent } from "@/lib/calculations";
import type { Snapshot } from "@/lib/types";

interface Props {
  snapshots: Snapshot[];
}

export default function CumulativeReturnChart({ snapshots }: Props) {
  const { t } = useI18n();

  const sorted = [...snapshots].sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  if (sorted.length < 2) {
    return (
      <div className="py-8 text-center text-sm text-zinc-500">
        {t("noDataForPeriod")}
      </div>
    );
  }

  const baseValue = Number(sorted[0].total_usd);
  const data = sorted.map((s) => {
    const current = Number(s.total_usd);
    const cumReturn = baseValue !== 0 ? ((current - baseValue) / baseValue) * 100 : 0;
    return {
      date: new Date(s.date + "T12:00:00").toLocaleDateString("es-CO", {
        month: "short",
        day: "numeric",
      }),
      cumReturn: Math.round(cumReturn * 100) / 100,
    };
  });

  const lastReturn = data[data.length - 1]?.cumReturn ?? 0;
  const isPositive = lastReturn >= 0;
  const color = isPositive ? "#10b981" : "#ef4444";

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-zinc-400">
          {t("cumulativeReturn")}
        </h3>
        <span
          className={`text-sm font-bold ${isPositive ? "text-emerald-400" : "text-red-400"}`}
        >
          {formatPercent(lastReturn)}
        </span>
      </div>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorCum" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
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
              tickFormatter={(v) => `${v}%`}
              width={45}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#18181b",
                border: "1px solid #3f3f46",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              formatter={(value: unknown) => [
                formatPercent(typeof value === "number" ? value : 0),
                t("cumulativeReturn"),
              ]}
            />
            <Area
              type="monotone"
              dataKey="cumReturn"
              stroke={color}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorCum)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
