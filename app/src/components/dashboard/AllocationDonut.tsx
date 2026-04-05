"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { formatUsd, formatPercent } from "@/lib/calculations";
import { useI18n } from "@/lib/i18n/context";
import type { FullSnapshot } from "@/lib/types";

interface Props {
  data: FullSnapshot;
}

const COLORS = [
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
];

export default function AllocationDonut({ data }: Props) {
  const { t } = useI18n();
  const { snapshot, positions, plans, savings, funds } = data;
  const trm = snapshot.trm;

  const segments: { name: string; value: number }[] = [];

  // XTB positions (unified — includes stocks, CFDs, plans, ETFs)
  const xtbPositions = positions.filter((p) => p.platform === "xtb");
  const xtbStocksValue = xtbPositions
    .filter((p) => p.instrument_type !== "plan" && p.instrument_type !== "fund")
    .reduce((s, p) => s + p.market_value, 0);
  const xtbPlansValue = xtbPositions
    .filter((p) => p.instrument_type === "plan" || p.instrument_type === "fund")
    .reduce((s, p) => s + p.market_value, 0);

  // Legacy plans (from snapshot_plans table for backward compat)
  const legacyPlans = plans.reduce((s, p) => s + p.current_value, 0);

  if (xtbStocksValue > 0)
    segments.push({ name: "XTB Stocks/CFDs", value: xtbStocksValue });
  if (xtbPlansValue + legacyPlans > 0)
    segments.push({ name: "XTB Plans", value: xtbPlansValue + legacyPlans });

  // Trii positions (unified)
  const triiPositions = positions.filter((p) => p.platform === "trii");
  const triiStocksValue = triiPositions
    .filter((p) => p.instrument_type !== "fund")
    .reduce((s, p) => s + p.market_value, 0);
  const triiFundsValue = triiPositions
    .filter((p) => p.instrument_type === "fund")
    .reduce((s, p) => s + p.market_value, 0);

  // Legacy funds (from snapshot_funds table)
  const legacyFunds = funds.reduce((s, f) => s + f.current_value, 0);

  if (triiStocksValue > 0)
    segments.push({ name: "Trii Stocks", value: triiStocksValue / trm });
  if (triiFundsValue + legacyFunds > 0)
    segments.push({
      name: "Trii Fund",
      value: (triiFundsValue + legacyFunds) / trm,
    });

  // Savings
  for (const s of savings) {
    if (s.balance_cop > 0) {
      segments.push({ name: s.name, value: s.balance_cop / trm });
    }
  }

  const total = segments.reduce((s, seg) => s + seg.value, 0);

  return (
    <div className="px-4 py-3">
      <h3 className="mb-3 text-sm font-medium text-zinc-400">
        {t("allocation")}
      </h3>
      <div className="flex items-center gap-4">
        <div className="h-40 w-40 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={segments}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={2}
                dataKey="value"
              >
                {segments.map((_, i) => (
                  <Cell
                    key={i}
                    fill={COLORS[i % COLORS.length]}
                    stroke="transparent"
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#18181b",
                  border: "1px solid #3f3f46",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(value: unknown) => formatUsd(typeof value === "number" ? value : 0)}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-col gap-1.5 text-xs">
          {segments.map((seg, i) => (
            <div key={seg.name} className="flex items-center gap-2">
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: COLORS[i % COLORS.length] }}
              />
              <span className="text-zinc-400">{seg.name}</span>
              <span className="ml-auto font-medium">
                {formatPercent((seg.value / total) * 100).replace("+", "")}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
