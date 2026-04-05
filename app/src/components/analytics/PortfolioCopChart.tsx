"use client";

import { useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { useI18n } from "@/lib/i18n/context";
import { formatUsd, formatCopShort, formatCop } from "@/lib/calculations";
import type { Snapshot } from "@/lib/types";

interface Props {
  snapshots: Snapshot[];
}

type View = "both" | "usd" | "cop";

export default function PortfolioCopChart({ snapshots }: Props) {
  const { t } = useI18n();
  const [view, setView] = useState<View>("both");

  const data = [...snapshots]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((s) => ({
      date: new Date(s.date + "T12:00:00").toLocaleDateString("es-CO", {
        month: "short",
        day: "numeric",
      }),
      usd: Number(s.total_usd ?? 0),
      cop: Number(s.total_usd ?? 0) * Number(s.trm),
      trm: Number(s.trm),
    }));

  if (data.length < 2) {
    return (
      <div className="py-8 text-center text-sm text-zinc-500">
        {t("noDataForPeriod")}
      </div>
    );
  }

  const showUsd = view === "both" || view === "usd";
  const showCop = view === "both" || view === "cop";

  const views: { key: View; label: string }[] = [
    { key: "both", label: "USD + COP" },
    { key: "usd", label: "USD" },
    { key: "cop", label: "COP" },
  ];

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-zinc-400">
          {t("portfolioUsdVsCop")}
        </h3>
        <div className="flex gap-1 rounded-md bg-zinc-800 p-0.5">
          {views.map((v) => (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              className={`rounded px-2 py-1 text-xs ${
                view === v.key
                  ? "bg-zinc-700 text-zinc-200"
                  : "text-zinc-500"
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data}>
            <defs>
              <linearGradient id="colorUsdPort" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorCopPort" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
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
            {showUsd && (
              <YAxis
                yAxisId="usd"
                orientation="left"
                tick={{ fontSize: 10, fill: "#71717a" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${v.toFixed(0)}`}
                width={55}
              />
            )}
            {showCop && (
              <YAxis
                yAxisId="cop"
                orientation={showUsd ? "right" : "left"}
                tick={{ fontSize: 10, fill: "#71717a" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => formatCopShort(v)}
                width={55}
              />
            )}
            <Tooltip
              contentStyle={{
                backgroundColor: "#18181b",
                border: "1px solid #3f3f46",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              formatter={(value: unknown, name: unknown) => {
                const v = typeof value === "number" ? value : 0;
                const n = typeof name === "string" ? name : "";
                if (n === "usd") return [formatUsd(v), "USD"];
                if (n === "cop") return [formatCop(v), "COP"];
                return [String(v), n];
              }}
              labelStyle={{ color: "#a1a1aa" }}
            />
            {showUsd && (
              <Area
                yAxisId="usd"
                type="monotone"
                dataKey="usd"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorUsdPort)"
              />
            )}
            {showCop && (
              <Area
                yAxisId="cop"
                type="monotone"
                dataKey="cop"
                stroke="#f59e0b"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorCopPort)"
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
