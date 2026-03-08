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
import { formatCop } from "@/lib/calculations";
import type { Snapshot } from "@/lib/types";

interface Props {
  snapshots: Snapshot[];
}

export default function TrmChart({ snapshots }: Props) {
  const { t } = useI18n();

  const data = [...snapshots]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((s) => ({
      date: new Date(s.date + "T12:00:00").toLocaleDateString("es-CO", {
        month: "short",
        day: "numeric",
      }),
      trm: Number(s.trm),
    }));

  if (data.length < 2) {
    return (
      <div className="py-8 text-center text-sm text-zinc-500">
        {t("noDataForPeriod")}
      </div>
    );
  }

  const minTrm = Math.min(...data.map((d) => d.trm)) * 0.998;
  const maxTrm = Math.max(...data.map((d) => d.trm)) * 1.002;

  return (
    <div>
      <h3 className="mb-3 text-sm font-medium text-zinc-400">
        {t("trmEvolution")}
      </h3>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorTrm" x1="0" y1="0" x2="0" y2="1">
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
            <YAxis
              domain={[minTrm, maxTrm]}
              tick={{ fontSize: 10, fill: "#71717a" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => v.toFixed(0)}
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
                formatCop(value ?? 0),
                "TRM",
              ]}
            />
            <Area
              type="monotone"
              dataKey="trm"
              stroke="#f59e0b"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorTrm)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
