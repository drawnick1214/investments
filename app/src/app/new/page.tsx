"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/context";

export default function NewRecordPage() {
  const { t } = useI18n();

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <Link
          href="/"
          className="text-zinc-400 hover:text-zinc-300 flex items-center gap-2 mb-4 transition-colors"
        >
          ← {t("back")}
        </Link>
        <h1 className="text-2xl font-bold text-center">
          {t("selectRecordType")}
        </h1>
      </div>

      <div className="space-y-4">
        {/* Daily Snapshot */}
        <Link href="/entry" className="block group">
          <Card className="border-zinc-800 bg-zinc-900 hover:border-zinc-700 hover:bg-zinc-800 transition-all">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 mb-3">
                    DS
                  </div>
                  <h2 className="text-xl font-semibold mb-2">
                    {t("dailySnapshot")}
                  </h2>
                  <p className="text-zinc-400 mb-3">
                    {t("dailySnapshotDesc")}
                  </p>
                  <ul className="text-sm text-zinc-500 space-y-1">
                    <li>• {t("instrumentPrices")}</li>
                    <li>• {t("fundValues")}</li>
                    <li>• {t("accountBalances")}</li>
                  </ul>
                </div>
                <div className="text-zinc-500 group-hover:text-emerald-400 transition-colors text-2xl">
                  →
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Deposit */}
        <Link href="/cashflow/deposit" className="block group">
          <Card className="border-emerald-900/50 bg-zinc-900 hover:border-emerald-700 hover:bg-zinc-800 transition-all">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="w-12 h-12 rounded-full bg-emerald-900/30 flex items-center justify-center text-emerald-400 mb-3 font-bold">
                    +
                  </div>
                  <h2 className="text-xl font-semibold mb-2 text-emerald-400">
                    {t("deposit")}
                  </h2>
                  <p className="text-zinc-400 mb-3">{t("depositDesc")}</p>
                  <ul className="text-sm text-zinc-500 space-y-1">
                    <li>• {t("bankTransfer")}</li>
                    <li>• {t("cashDeposit")}</li>
                    <li>• {t("newInvestment")}</li>
                  </ul>
                </div>
                <div className="text-zinc-500 group-hover:text-emerald-400 transition-colors text-2xl">
                  →
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Withdrawal */}
        <Link href="/cashflow/withdrawal" className="block group">
          <Card className="border-red-900/50 bg-zinc-900 hover:border-red-700 hover:bg-zinc-800 transition-all">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="w-12 h-12 rounded-full bg-red-900/30 flex items-center justify-center text-red-400 mb-3 font-bold">
                    -
                  </div>
                  <h2 className="text-xl font-semibold mb-2 text-red-400">
                    {t("withdrawal")}
                  </h2>
                  <p className="text-zinc-400 mb-3">{t("withdrawalDesc")}</p>
                  <ul className="text-sm text-zinc-500 space-y-1">
                    <li>• {t("bankTransfer")}</li>
                    <li>• {t("cashWithdrawal")}</li>
                    <li>• {t("partialLiquidation")}</li>
                  </ul>
                </div>
                <div className="text-zinc-500 group-hover:text-red-400 transition-colors text-2xl">
                  →
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
