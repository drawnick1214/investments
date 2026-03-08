"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useI18n } from "@/lib/i18n/context";
import {
  formatUsd,
  formatPercent,
  getMarginColor,
  getMarginLabel,
  isSharesBased,
} from "@/lib/calculations";
import type { FullSnapshot } from "@/lib/types";
import { AlertTriangle, Shield, TrendingUp, TrendingDown } from "lucide-react";

interface Props {
  data: FullSnapshot;
}

export default function XtbDetail({ data }: Props) {
  const { t, lang } = useI18n();
  const { snapshot, positions, plans } = data;

  const xtbPositions = positions.filter((p) => p.platform === "xtb");
  const totalPnl = xtbPositions.reduce((s, p) => s + Number(p.pnl), 0);
  const totalValue = xtbPositions.reduce((s, p) => s + Number(p.market_value), 0);

  // Legacy plans (backward compat)
  const plansTotalValue = plans.reduce((s, p) => s + Number(p.current_value), 0);
  const plansTotalPnl = plans.reduce((s, p) => s + Number(p.pnl), 0);

  const margin = Number(snapshot.xtb_margin) || 0;
  const cash = Number(snapshot.xtb_cash) || 0;

  const grandTotal = totalValue + plansTotalValue + cash;

  // Group positions by instrument_type
  const sharesBased = xtbPositions.filter(
    (p) => isSharesBased(p.instrument_type || p.asset_type)
  );
  const fundBased = xtbPositions.filter(
    (p) => !isSharesBased(p.instrument_type || p.asset_type)
  );

  return (
    <div className="space-y-4 pt-4">
      {/* Summary */}
      <div className="text-center">
        <p className="text-sm text-zinc-500">XTB Total</p>
        <p className="text-2xl font-bold">{formatUsd(grandTotal)}</p>
        <div
          className={`text-sm font-medium ${totalPnl + plansTotalPnl >= 0 ? "text-emerald-400" : "text-red-400"}`}
        >
          {t("pnl")}: {formatUsd(totalPnl + plansTotalPnl)}
        </div>
      </div>

      {/* Margin Alert */}
      <Card
        className={`border-zinc-800 ${margin < 108 ? "border-red-500/50 bg-red-950/30" : margin < 150 ? "border-yellow-500/50 bg-yellow-950/20" : "bg-zinc-900"}`}
      >
        <CardContent className="flex items-center justify-between py-3">
          <div className="flex items-center gap-2">
            <Shield className={`h-5 w-5 ${getMarginColor(margin)}`} />
            <span className="text-sm text-zinc-400">{t("marginLevel")}</span>
          </div>
          <div className="text-right">
            <span className={`text-lg font-bold ${getMarginColor(margin)}`}>
              {margin.toFixed(2)}%
            </span>
            {getMarginLabel(margin, lang) && (
              <p className="text-xs text-red-400">
                <AlertTriangle className="mr-1 inline h-3 w-3" />
                {getMarginLabel(margin, lang)}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Cash */}
      <div className="flex items-center justify-between rounded-lg bg-zinc-900 px-4 py-2 text-sm">
        <span className="text-zinc-400">{t("availableCash")}</span>
        <span className="font-medium">{formatUsd(cash)}</span>
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
                    <span className="font-medium">
                      {formatUsd(Number(pos.market_value))}
                    </span>
                  </div>
                  <div className="mt-1 flex justify-between text-xs text-zinc-500">
                    <span>
                      {pos.shares} {t("shares")} @ {formatUsd(Number(pos.avg_cost))}
                    </span>
                    <span
                      className={`flex items-center gap-1 font-medium ${isPositive ? "text-emerald-400" : "text-red-400"}`}
                    >
                      {isPositive ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {formatUsd(pnl)} ({formatPercent(Number(pos.pnl_percent))})
                    </span>
                  </div>
                  <Separator className="mt-3 bg-zinc-800" />
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Fund/Plan-based instruments */}
      {(fundBased.length > 0 || plans.length > 0) && (
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("investmentPlans")}</CardTitle>
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
                        {(pos.instrument_type || pos.asset_type).toUpperCase()}
                      </Badge>
                    </div>
                    <span className="font-medium">
                      {formatUsd(Number(pos.market_value))}
                    </span>
                  </div>
                  <div className="mt-1 flex justify-between text-xs text-zinc-500">
                    <span>
                      {t("invested")}: {formatUsd(Number(pos.invested || 0))}
                    </span>
                    <span
                      className={`font-medium ${isPositive ? "text-emerald-400" : "text-red-400"}`}
                    >
                      {formatUsd(pnl)} ({formatPercent(Number(pos.pnl_percent))})
                    </span>
                  </div>
                </div>
              );
            })}
            {/* Legacy plans */}
            {plans.map((plan) => {
              const pnl = Number(plan.pnl);
              const isPositive = pnl >= 0;
              return (
                <div key={plan.name}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{plan.name}</span>
                    <span className="font-medium">
                      {formatUsd(Number(plan.current_value))}
                    </span>
                  </div>
                  <div className="mt-1 flex justify-between text-xs text-zinc-500">
                    <span>
                      {t("invested")}: {formatUsd(Number(plan.invested))}
                    </span>
                    <span
                      className={`font-medium ${isPositive ? "text-emerald-400" : "text-red-400"}`}
                    >
                      {formatUsd(pnl)} ({formatPercent(Number(plan.pnl_percent))})
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
