"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { useI18n } from "@/lib/i18n/context";
import { formatPercent } from "@/lib/calculations";
import type { SnapshotPosition } from "@/lib/types";

interface Props {
  positions: SnapshotPosition[];
}

const COLORS = [
  "#10b981",
  "#3b82f6",
  "#f59e0b",
  "#8b5cf6",
  "#ef4444",
  "#ec4899",
  "#06b6d4",
];

export default function AssetPerformanceChart({ positions }: Props) {
  const { t } = useI18n();

  // Get unique assets and dates
  const assets = [...new Set(positions.map((p) => p.asset))];
  const dates = [...new Set(positions.map((p) => p.snapshot_date))].sort();

  if (dates.length < 2 || assets.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-zinc-500">
        {t("noDataForPeriod")}
      </div>
    );
  }

  // Build baseline values (first date)
  const baselines: Record<string, number> = {};
  for (const asset of assets) {
    const first = positions.find(
      (p) => p.asset === asset && p.snapshot_date === dates[0]
    );
    baselines[asset] = first ? Number(first.market_value) : 0;
  }

  // Build chart data: each date has a % return per asset
  const data = dates.map((date) => {
    const row: Record<string, string | number> = {
      date: new Date(date + "T12:00:00").toLocaleDateString("es-CO", {
        month: "short",
        day: "numeric",
      }),
    };
    for (const asset of assets) {
      const pos = positions.find(
        (p) => p.asset === asset && p.snapshot_date === date
      );
      const base = baselines[asset];
      if (pos && base && base !== 0) {
        row[asset] =
          Math.round(
            ((Number(pos.market_value) - base) / base) * 100 * 100
          ) / 100;
      } else {
        row[asset] = 0;
      }
    }
    return row;
  });

  return (
    <div>
      <h3 className="mb-3 text-sm font-medium text-zinc-400">
        {t("assetPerformance")} (%)
      </h3>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
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
                fontSize: "11px",
              }}
              formatter={(value: unknown, name: unknown) => [
                formatPercent(typeof value === "number" ? value : 0),
                typeof name === "string" ? name : "",
              ]}
            />
            <Legend
              wrapperStyle={{ fontSize: "11px", color: "#a1a1aa" }}
            />
            {assets.map((asset, i) => (
              <Line
                key={asset}
                type="monotone"
                dataKey={asset}
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 3 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
