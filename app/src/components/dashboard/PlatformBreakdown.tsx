"use client";

import { formatUsd } from "@/lib/calculations";
import type { FullSnapshot } from "@/lib/types";

interface Props {
  data: FullSnapshot;
}

export default function PlatformBreakdown({ data }: Props) {
  const { snapshot, positions, plans, savings, funds } = data;
  const trm = snapshot.trm;

  // XTB: all xtb positions (new unified) + legacy plans + cash
  const xtbPositions = positions
    .filter((p) => p.platform === "xtb")
    .reduce((s, p) => s + p.market_value, 0);
  const xtbPlansLegacy = plans.reduce((s, p) => s + p.current_value, 0);
  const xtbCash = snapshot.xtb_cash || 0;
  const xtbTotal = xtbPositions + xtbPlansLegacy + xtbCash;

  // Trii: all trii positions (new unified) + legacy funds
  const triiPositions = positions
    .filter((p) => p.platform === "trii")
    .reduce((s, p) => s + p.market_value, 0);
  const triiFundsLegacy = funds.reduce((s, f) => s + f.current_value, 0);
  const triiTotal = (triiPositions + triiFundsLegacy) / trm;

  const savingsTotal =
    savings.reduce((s, a) => s + a.balance_cop, 0) / trm;

  const total = snapshot.total_usd || xtbTotal + triiTotal + savingsTotal;

  const platforms = [
    {
      name: "XTB",
      value: xtbTotal,
      pct: total ? (xtbTotal / total) * 100 : 0,
      color: "bg-emerald-500",
    },
    {
      name: "Trii",
      value: triiTotal,
      pct: total ? (triiTotal / total) * 100 : 0,
      color: "bg-blue-500",
    },
    {
      name: "Ahorros",
      value: savingsTotal,
      pct: total ? (savingsTotal / total) * 100 : 0,
      color: "bg-amber-500",
    },
  ];

  return (
    <div className="px-4 py-3">
      <div className="flex h-2 overflow-hidden rounded-full bg-zinc-800">
        {platforms.map((p) => (
          <div
            key={p.name}
            className={`${p.color} transition-all`}
            style={{ width: `${p.pct}%` }}
          />
        ))}
      </div>
      <div className="mt-3 flex justify-between text-xs">
        {platforms.map((p) => (
          <div key={p.name} className="flex items-center gap-1.5">
            <div className={`h-2 w-2 rounded-full ${p.color}`} />
            <span className="text-zinc-400">{p.name}</span>
            <span className="font-medium">{formatUsd(p.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
