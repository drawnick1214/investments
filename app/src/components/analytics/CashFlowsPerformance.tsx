"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/context";
import { formatUsd, formatCop } from "@/lib/calculations";
import type { Snapshot, CashFlow } from "@/lib/types";

interface Props {
  snapshots: Snapshot[];
  cashFlows: CashFlow[];
  showCop: boolean;
  trm: number;
}

export default function CashFlowsPerformance({ snapshots, cashFlows, showCop, trm }: Props) {
  const { t } = useI18n();

  if (snapshots.length === 0) return null;

  const firstSnapshot = snapshots[0];
  const latestSnapshot = snapshots[snapshots.length - 1];
  const totalValue = Number(latestSnapshot.total_usd) || 0;
  const initialValue = Number(firstSnapshot.total_usd) || 0;

  // Calculate net cash flows in USD
  let netDeposits = 0;
  let totalDepositsUsd = 0;
  let totalWithdrawalsUsd = 0;

  for (const flow of cashFlows) {
    const trm = 3691.87; // TODO: Use actual TRM for the flow date
    const amountUsd = flow.currency === "USD" ? flow.amount : flow.amount / trm;

    if (flow.type === "deposit") {
      totalDepositsUsd += amountUsd;
      netDeposits += amountUsd;
    } else if (flow.type === "withdrawal") {
      totalWithdrawalsUsd += amountUsd;
      netDeposits -= amountUsd;
    }
  }

  // If no cash flows recorded, use first snapshot as initial deposit
  const effectiveDeposits = netDeposits > 0 ? netDeposits : initialValue;

  // Real P&L = Total Value - Effective Deposits
  const realPnl = totalValue - effectiveDeposits;
  const realReturn = effectiveDeposits > 0 ? (realPnl / effectiveDeposits) * 100 : 0;

  // Convert to COP if needed
  const formatValue = (usdValue: number) => showCop ? formatCop(usdValue * trm) : formatUsd(usdValue);
  const currency = showCop ? "COP" : "USD";

  return (
    <>
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            Performance Real
            <span className="text-xs text-zinc-500 font-normal">
              (sin depósitos/retiros)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-zinc-400 text-sm mb-1">Total Portfolio Value</div>
              <div className="text-2xl font-bold">{formatValue(totalValue)}</div>
            </div>
            <div>
              <div className="text-zinc-400 text-sm mb-1">Cash Flows (net)</div>
              <div className="text-2xl font-bold text-zinc-400">
                {formatValue(netDeposits)}
              </div>
            </div>
          </div>

          <div className="border-t border-zinc-800 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-zinc-400 text-sm mb-1">Real P&L</div>
                <div
                  className={`text-3xl font-bold ${
                    realPnl >= 0 ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {realPnl >= 0 ? "+" : ""}
                  {formatValue(realPnl)}
                </div>
              </div>
              <div>
                <div className="text-zinc-400 text-sm mb-1">Return</div>
                <div
                  className={`text-3xl font-bold ${
                    realReturn >= 0 ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {realReturn >= 0 ? "+" : ""}
                  {realReturn.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>

          {cashFlows.length > 0 && (
            <div className="border-t border-zinc-800 pt-4">
              <div className="text-zinc-400 text-sm mb-3">Cash Flows:</div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-zinc-500">Depósitos</div>
                  <div className="text-emerald-400 font-semibold">
                    +{formatValue(totalDepositsUsd)}
                  </div>
                </div>
                <div>
                  <div className="text-zinc-500">Retiros</div>
                  <div className="text-red-400 font-semibold">
                    -{formatValue(totalWithdrawalsUsd)}
                  </div>
                </div>
                <div>
                  <div className="text-zinc-500">Inversión neta</div>
                  <div className="text-white font-semibold">
                    {formatValue(netDeposits)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {cashFlows.length === 0 && (
            <div className="border-t border-zinc-800 pt-4">
              <div className="text-sm text-zinc-500 bg-zinc-950 rounded-lg p-3 border border-zinc-800">
                <div className="font-medium mb-1">Nota:</div>
                No hay cash flows registrados. El cálculo asume que el valor inicial del portafolio
                (primer snapshot: {formatValue(initialValue)}) fue tu inversión inicial.
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cash Flow History */}
      {cashFlows.length > 0 && (
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Historial de Cash Flows</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {cashFlows.slice(0, 10).map((flow) => (
                <div
                  key={flow.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    flow.type === "deposit"
                      ? "bg-emerald-900/10 border-emerald-900/50"
                      : "bg-red-900/10 border-red-900/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        flow.type === "deposit" ? "bg-emerald-400" : "bg-red-400"
                      }`}
                    ></div>
                    <div>
                      <div
                        className={`font-medium ${
                          flow.type === "deposit"
                            ? "text-emerald-400"
                            : "text-red-400"
                        }`}
                      >
                        {flow.type === "deposit" ? "+" : "-"}
                        {flow.currency === "USD" ? "$" : ""}
                        {flow.amount.toLocaleString()}
                        {flow.currency === "COP" ? " COP" : ""}
                        {flow.currency === "EUR" ? " EUR" : ""}
                      </div>
                      <div className="text-sm text-zinc-500">
                        {flow.date} · {flow.account}
                        {flow.type === "deposit" ? " (Depósito)" : " (Retiro)"}
                      </div>
                      {flow.notes && (
                        <div className="text-xs text-zinc-600 mt-1">
                          {flow.notes}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {cashFlows.length > 10 && (
              <div className="mt-3 text-center text-sm text-zinc-500">
                +{cashFlows.length - 10} más...
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
}
