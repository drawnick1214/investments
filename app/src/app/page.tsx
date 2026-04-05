"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import HeroTotal from "@/components/dashboard/HeroTotal";
import PlatformBreakdown from "@/components/dashboard/PlatformBreakdown";
import TimelineChart from "@/components/dashboard/TimelineChart";
import AllocationDonut from "@/components/dashboard/AllocationDonut";
import { useI18n } from "@/lib/i18n/context";
import {
  getLatestSnapshot,
  getAllSnapshots,
} from "@/lib/supabase/queries";
import { getAllCashFlows } from "@/lib/supabase/cash-flows";
import type { FullSnapshot, Snapshot, CashFlow } from "@/lib/types";

export default function DashboardPage() {
  const { t } = useI18n();
  const [latest, setLatest] = useState<FullSnapshot | null>(null);
  const [allSnapshots, setAllSnapshots] = useState<Snapshot[]>([]);
  const [cashFlows, setCashFlows] = useState<CashFlow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCop, setShowCop] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [latestData, all, flows] = await Promise.all([
        getLatestSnapshot(),
        getAllSnapshots(),
        getAllCashFlows().catch(() => []), // Graceful fallback if table doesn't exist yet
      ]);
      setLatest(latestData);
      setAllSnapshots(all);
      setCashFlows(flows);
    } catch (err) {
      console.error("Error loading dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw className="h-6 w-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (!latest) {
    return (
      <div className="flex flex-col items-center gap-4 px-4 py-20">
        <p className="text-zinc-500">{t("noSnapshots")}</p>
        <Link href="/new">
          <Button className="bg-emerald-500 text-black hover:bg-emerald-400">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Registro
          </Button>
        </Link>
      </div>
    );
  }

  const today = new Date().toISOString().split("T")[0];
  const isToday = latest.snapshot.date === today;

  return (
    <div className="space-y-1">
      {!isToday && (
        <div className="mx-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-center text-sm text-amber-400">
          {t("noEntryToday")}
        </div>
      )}

      <HeroTotal
        totalUsd={Number(latest.snapshot.total_usd) || 0}
        trm={Number(latest.snapshot.trm)}
        dailyChange={
          latest.snapshot.daily_change
            ? Number(latest.snapshot.daily_change)
            : null
        }
        dailyPct={
          latest.snapshot.daily_pct
            ? Number(latest.snapshot.daily_pct)
            : null
        }
        date={latest.snapshot.date}
        showCop={showCop}
      />

      <div className="flex justify-center">
        <button
          onClick={() => setShowCop(!showCop)}
          className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-400 transition-colors hover:border-zinc-500"
        >
          {showCop ? "USD" : "COP"}
        </button>
      </div>

      <Separator className="bg-zinc-800" />
      <PlatformBreakdown data={latest} />
      <Separator className="bg-zinc-800" />
      <TimelineChart snapshots={allSnapshots} />
      <Separator className="bg-zinc-800" />
      <AllocationDonut data={latest} />

      {/* Recent Records */}
      <div className="px-4 pb-4">
        <h3 className="text-lg font-semibold mb-3">Registros Recientes</h3>
        <div className="space-y-2">
          {(() => {
            // Combine snapshots and cash flows, sort by date
            const combined = [
              ...allSnapshots.slice(0, 3).map(s => ({ type: 'snapshot' as const, date: s.date, data: s })),
              ...cashFlows.slice(0, 3).map(cf => ({ type: 'cashflow' as const, date: cf.date, data: cf })),
            ].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

            return combined.map((item, i) => (
              <div
                key={i}
                className={`flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer ${
                  item.type === 'snapshot'
                    ? 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                    : item.data.type === 'deposit'
                    ? 'bg-zinc-950 border-emerald-900/50 hover:border-emerald-800'
                    : 'bg-zinc-950 border-red-900/50 hover:border-red-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    item.type === 'snapshot'
                      ? 'bg-zinc-500'
                      : item.data.type === 'deposit'
                      ? 'bg-emerald-400'
                      : 'bg-red-400'
                  }`}></div>
                  <div>
                    <div className={`font-medium ${
                      item.type === 'cashflow'
                        ? item.data.type === 'deposit'
                          ? 'text-emerald-400'
                          : 'text-red-400'
                        : ''
                    }`}>
                      {item.type === 'snapshot'
                        ? 'Snapshot Diario'
                        : item.data.type === 'deposit'
                        ? `Depósito $${item.data.amount}`
                        : `Retiro $${item.data.amount}`}
                    </div>
                    <div className="text-sm text-zinc-500">
                      {item.date}
                      {item.type === 'cashflow' && ` · ${item.data.account}`}
                    </div>
                  </div>
                </div>
                <div className="text-zinc-500">→</div>
              </div>
            ));
          })()}
        </div>
      </div>
    </div>
  );
}
