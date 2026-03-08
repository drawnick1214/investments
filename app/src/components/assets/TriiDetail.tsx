"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useI18n } from "@/lib/i18n/context";
import { formatCop, formatUsd, formatPercent, isSharesBased } from "@/lib/calculations";
import type { FullSnapshot } from "@/lib/types";
import { TrendingUp, TrendingDown } from "lucide-react";

interface Props {
  data: FullSnapshot;
}

export default function TriiDetail({ data }: Props) {
  const { t } = useI18n();
  const { snapshot, positions, funds } = data;
  const trm = Number(snapshot.trm);

  const triiPositions = positions.filter((p) => p.platform === "trii");

  // Legacy funds
  const legacyFundsValue = funds.reduce((s, f) => s + Number(f.current_value), 0);
  const legacyFundsPnl = funds.reduce((s, f) => s + Number(f.pnl), 0);

  const totalCop =
    triiPositions.reduce((s, p) => s + Number(p.market_value), 0) +
    legacyFundsValue;
  const totalPnlCop =
    triiPositions.reduce((s, p) => s + Number(p.pnl), 0) +
    legacyFundsPnl;
  const totalUsd = totalCop / trm;

  // Group by instrument type
  const sharesBased = triiPositions.filter(
    (p) => isSharesBased(p.instrument_type || p.asset_type)
  );
  const fundBased = triiPositions.filter(
    (p) => !isSharesBased(p.instrument_type || p.asset_type)
  );

  return (
    <div className="space-y-4 pt-4">
      {/* Summary */}
      <div className="text-center">
        <p className="text-sm text-zinc-500">Trii Total</p>
        <p className="text-2xl font-bold">{formatCop(totalCop)}</p>
        <p className="text-sm text-zinc-500">{formatUsd(totalUsd)}</p>
        <div
          className={`text-sm font-medium ${totalPnlCop >= 0 ? "text-emerald-400" : "text-red-400"}`}
        >
          {t("pnl")}: {formatCop(totalPnlCop)}
        </div>
      </div>

      {/* Shares-based Positions */}
      {sharesBased.length > 0 && (
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("positions")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {sharesBased.map((pos) => {
              const pnl = Number(pos.pnl);
              const isPositive = pnl >= 0;
              return (
                <div key={pos.asset}>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">{pos.asset}</span>
                      <Badge
                        variant="outline"
                        className="ml-2 text-[10px] border-zinc-700"
                      >
                        {(pos.instrument_type || pos.asset_type).toUpperCase()}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {formatCop(Number(pos.market_value))}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {formatUsd(Number(pos.market_value) / trm)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-1 flex justify-between text-xs text-zinc-500">
                    <span>
                      {pos.shares} @ {formatCop(Number(pos.avg_cost))}
                    </span>
                    <span
                      className={`flex items-center gap-1 font-medium ${isPositive ? "text-emerald-400" : "text-red-400"}`}
                    >
                      {isPositive ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {formatCop(pnl)} ({formatPercent(Number(pos.pnl_percent))})
                    </span>
                  </div>
                  <Separator className="mt-3 bg-zinc-800" />
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Fund-based instruments + legacy funds */}
      {(fundBased.length > 0 || funds.length > 0) && (
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("fund")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {fundBased.map((pos) => {
              const pnl = Number(pos.pnl);
              const isPositive = pnl >= 0;
              return (
                <div key={pos.asset}>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">{pos.asset}</span>
                      <Badge
                        variant="outline"
                        className="ml-2 text-[10px] border-zinc-700"
                      >
                        {(pos.instrument_type || "FUND").toUpperCase()}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {formatCop(Number(pos.market_value))}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {formatUsd(Number(pos.market_value) / trm)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-1 flex justify-between text-xs text-zinc-500">
                    <span>
                      {t("invested")}: {formatCop(Number(pos.invested || 0))}
                    </span>
                    <span
                      className={`font-medium ${isPositive ? "text-emerald-400" : "text-red-400"}`}
                    >
                      {formatCop(pnl)} ({formatPercent(Number(pos.pnl_percent))})
                    </span>
                  </div>
                </div>
              );
            })}
            {/* Legacy funds */}
            {funds.map((fund) => {
              const pnl = Number(fund.pnl);
              const isPositive = pnl >= 0;
              return (
                <div key={fund.name}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{fund.name}</span>
                    <div className="text-right">
                      <p className="font-medium">
                        {formatCop(Number(fund.current_value))}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {formatUsd(Number(fund.current_value) / trm)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-1 flex justify-between text-xs text-zinc-500">
                    <span>
                      {t("invested")}: {formatCop(Number(fund.invested))}
                    </span>
                    <span
                      className={`font-medium ${isPositive ? "text-emerald-400" : "text-red-400"}`}
                    >
                      {formatCop(pnl)} ({formatPercent(Number(fund.pnl_percent))})
                    </span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
