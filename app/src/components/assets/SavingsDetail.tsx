"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n/context";
import { formatCop, formatUsd, daysUntil } from "@/lib/calculations";
import type { FullSnapshot } from "@/lib/types";
import type { TranslationKey } from "@/lib/i18n/translations";
import { Clock, Wallet, Calendar } from "lucide-react";

interface Props {
  data: FullSnapshot;
}

export default function SavingsDetail({ data }: Props) {
  const { t } = useI18n();
  const { snapshot, savings } = data;
  const trm = Number(snapshot.trm);

  const totalCop = savings.reduce((s, a) => s + Number(a.balance_cop), 0);
  const totalDailyInterest = savings.reduce(
    (s, a) => s + Number(a.daily_interest),
    0
  );
  const totalMonthlyInterest = savings.reduce(
    (s, a) => s + Number(a.monthly_interest),
    0
  );
  const totalAnnualInterest = savings.reduce(
    (s, a) => s + Number(a.annual_interest),
    0
  );

  // Group by bank
  const banks = [...new Set(savings.map((s) => s.bank).filter(Boolean))];
  const ungrouped = savings.filter((s) => !s.bank);

  return (
    <div className="space-y-4 pt-4">
      {/* Summary */}
      <div className="text-center">
        <p className="text-sm text-zinc-500">{t("savingsAndCdts")}</p>
        <p className="text-2xl font-bold">{formatCop(totalCop)}</p>
        <p className="text-sm text-zinc-500">{formatUsd(totalCop / trm)}</p>
      </div>

      {/* Interest Summary */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-zinc-900 p-3 text-center">
          <p className="text-[10px] text-zinc-500">{t("interestDaily")}</p>
          <p className="text-sm font-bold text-emerald-400">
            {formatCop(totalDailyInterest)}
          </p>
          <p className="text-[10px] text-zinc-600">
            {formatUsd(totalDailyInterest / trm)}
          </p>
        </div>
        <div className="rounded-lg bg-zinc-900 p-3 text-center">
          <p className="text-[10px] text-zinc-500">{t("interestMonthly")}</p>
          <p className="text-sm font-bold text-emerald-400">
            {formatCop(totalMonthlyInterest)}
          </p>
          <p className="text-[10px] text-zinc-600">
            {formatUsd(totalMonthlyInterest / trm)}
          </p>
        </div>
        <div className="rounded-lg bg-zinc-900 p-3 text-center">
          <p className="text-[10px] text-zinc-500">{t("interestAnnual")}</p>
          <p className="text-sm font-bold text-emerald-400">
            {formatCop(totalAnnualInterest)}
          </p>
          <p className="text-[10px] text-zinc-600">
            {formatUsd(totalAnnualInterest / trm)}
          </p>
        </div>
      </div>

      {/* Grouped by bank */}
      {banks.map((bank) => {
        const bankSavings = savings.filter((s) => s.bank === bank);
        return (
          <div key={bank} className="space-y-3">
            <Badge
              variant="outline"
              className="border-amber-500/30 text-amber-400"
            >
              {bank}
            </Badge>
            {bankSavings.map((s) => (
              <SavingsCard key={s.name} s={s} trm={trm} t={t} />
            ))}
          </div>
        );
      })}

      {/* Ungrouped (legacy or no bank) */}
      {ungrouped.map((s) => (
        <SavingsCard key={s.name} s={s} trm={trm} t={t} />
      ))}
    </div>
  );
}

function SavingsCard({
  s,
  trm,
  t,
}: {
  s: FullSnapshot["savings"][number];
  trm: number;
  t: (key: TranslationKey) => string;
}) {
  const days = s.maturity_date ? daysUntil(s.maturity_date) : null;
  const isCdt = s.account_type === "cdt";

  return (
    <Card className="border-zinc-800 bg-zinc-900">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            {isCdt ? (
              <Clock className="h-4 w-4 text-blue-400" />
            ) : (
              <Wallet className="h-4 w-4 text-amber-400" />
            )}
            {s.name}
          </div>
          <Badge
            variant="outline"
            className="border-zinc-700 text-[10px]"
          >
            {(Number(s.rate_ea) * 100).toFixed(2)}% EA
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between">
          <span className="text-sm text-zinc-400">{t("balance")}</span>
          <div className="text-right">
            <p className="font-medium">
              {formatCop(Number(s.balance_cop))}
            </p>
            <p className="text-xs text-zinc-500">
              {formatUsd(Number(s.balance_cop) / trm)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 rounded-lg bg-zinc-800/50 p-2 text-center">
          <div>
            <p className="text-[10px] text-zinc-500">
              {t("interestDaily")}
            </p>
            <p className="text-xs font-medium text-emerald-400">
              {formatCop(Number(s.daily_interest))}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-zinc-500">
              {t("interestMonthly")}
            </p>
            <p className="text-xs font-medium text-emerald-400">
              {formatCop(Number(s.monthly_interest))}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-zinc-500">
              {t("interestAnnual")}
            </p>
            <p className="text-xs font-medium text-emerald-400">
              {formatCop(Number(s.annual_interest))}
            </p>
          </div>
        </div>

        {isCdt && s.maturity_date && days !== null && (
          <div className="flex items-center justify-between rounded-lg bg-blue-500/10 px-3 py-2">
            <div className="flex items-center gap-2 text-sm text-blue-400">
              <Calendar className="h-4 w-4" />
              <span>{t("maturityDate")}: {s.maturity_date}</span>
            </div>
            <Badge
              className={`${days <= 7 ? "bg-red-500" : days <= 30 ? "bg-amber-500" : "bg-blue-500"} text-white`}
            >
              {days}d
            </Badge>
          </div>
        )}

        {s.term && (
          <div className="flex justify-between text-xs text-zinc-500">
            <span>{t("term")}</span>
            <span>{s.term}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
