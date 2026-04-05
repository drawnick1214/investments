"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useI18n } from "@/lib/i18n/context";
import {
  getSnapshotsInRange,
  getPositionsInRange,
} from "@/lib/supabase/queries";
import { getAllCashFlows } from "@/lib/supabase/cash-flows";
import type { Snapshot, SnapshotPosition, CashFlow } from "@/lib/types";
import {
  getWtdComparison,
  getMtdComparison,
  getDodComparison,
} from "@/lib/analytics-helpers";
import PeriodSelector, {
  getPeriodStartDate,
  type Period,
} from "@/components/analytics/PeriodSelector";
import PeriodSummary from "@/components/analytics/PeriodSummary";
import PortfolioCopChart from "@/components/analytics/PortfolioCopChart";
import DailyReturnsChart from "@/components/analytics/DailyReturnsChart";
import CumulativeReturnChart from "@/components/analytics/CumulativeReturnChart";
import WeeklyMonthlyChart from "@/components/analytics/WeeklyMonthlyChart";
import AssetPerformanceChart from "@/components/analytics/AssetPerformanceChart";
import TrmChart from "@/components/analytics/TrmChart";
import PeriodComparison from "@/components/analytics/PeriodComparison";
import CashFlowsPerformance from "@/components/analytics/CashFlowsPerformance";

interface ComparisonEntry {
  current: Snapshot[];
  previous: Snapshot[];
}

interface ComparisonData {
  dod: ComparisonEntry;
  wtd: ComparisonEntry;
  mtd: ComparisonEntry;
}

export default function AnalyticsPage() {
  const { t } = useI18n();
  const [period, setPeriod] = useState<Period>("30d");
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [positions, setPositions] = useState<SnapshotPosition[]>([]);
  const [cashFlows, setCashFlows] = useState<CashFlow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCop, setShowCop] = useState(false);

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const defaultStart = new Date();
  defaultStart.setDate(defaultStart.getDate() - 30);

  const [customStartDate, setCustomStartDate] = useState(
    defaultStart.toISOString().split("T")[0]
  );
  const [customEndDate, setCustomEndDate] = useState(todayStr);

  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(
    null
  );

  // Load main chart data
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const startDate =
          period === "custom"
            ? customStartDate
            : getPeriodStartDate(period);
        const endDate = period === "custom" ? customEndDate : todayStr;

        const [snaps, pos, flows] = await Promise.all([
          getSnapshotsInRange(startDate, endDate),
          getPositionsInRange(startDate, endDate),
          getAllCashFlows().catch(() => []), // Graceful fallback if table doesn't exist
        ]);

        setSnapshots(snaps);
        setPositions(pos);
        setCashFlows(flows);
      } catch (err) {
        console.error("Error loading analytics:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [period, customStartDate, customEndDate, todayStr]);

  // Load comparison data (independent of period selector)
  useEffect(() => {
    async function loadComparisons() {
      try {
        const now = new Date();
        const dod = getDodComparison(now);
        const wtd = getWtdComparison(now);
        const mtd = getMtdComparison(now);

        const [
          dodCurrent,
          dodPrevious,
          wtdCurrent,
          wtdPrevious,
          mtdCurrent,
          mtdPrevious,
        ] = await Promise.all([
          getSnapshotsInRange(dod.current.startDate, dod.current.endDate),
          getSnapshotsInRange(dod.previous.startDate, dod.previous.endDate),
          getSnapshotsInRange(wtd.current.startDate, wtd.current.endDate),
          getSnapshotsInRange(wtd.previous.startDate, wtd.previous.endDate),
          getSnapshotsInRange(mtd.current.startDate, mtd.current.endDate),
          getSnapshotsInRange(mtd.previous.startDate, mtd.previous.endDate),
        ]);

        setComparisonData({
          dod: { current: dodCurrent, previous: dodPrevious },
          wtd: { current: wtdCurrent, previous: wtdPrevious },
          mtd: { current: mtdCurrent, previous: mtdPrevious },
        });
      } catch (err) {
        console.error("Error loading comparisons:", err);
      }
    }
    loadComparisons();
  }, []);

  const avgTrm = snapshots.length > 0
    ? snapshots.reduce((sum, s) => sum + Number(s.trm), 0) / snapshots.length
    : 3691.87;

  return (
    <div className="space-y-5 px-4 py-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">{t("analytics")}</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCop(false)}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              !showCop
                ? "bg-emerald-600 text-white"
                : "bg-zinc-800 text-zinc-400 hover:text-zinc-300"
            }`}
          >
            USD
          </button>
          <button
            onClick={() => setShowCop(true)}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              showCop
                ? "bg-emerald-600 text-white"
                : "bg-zinc-800 text-zinc-400 hover:text-zinc-300"
            }`}
          >
            COP
          </button>
        </div>
      </div>

      <PeriodSelector
        selected={period}
        onChange={setPeriod}
        customStartDate={customStartDate}
        customEndDate={customEndDate}
        onCustomStartChange={setCustomStartDate}
        onCustomEndChange={setCustomEndDate}
      />

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <RefreshCw className="h-6 w-6 animate-spin text-zinc-500" />
        </div>
      ) : snapshots.length === 0 ? (
        <div className="py-20 text-center text-sm text-zinc-500">
          {t("noDataForPeriod")}
        </div>
      ) : (
        <>
          <CashFlowsPerformance
            snapshots={snapshots}
            cashFlows={cashFlows}
            showCop={showCop}
            trm={avgTrm}
          />

          <Separator className="bg-zinc-800" />
          <PeriodSummary
            snapshots={snapshots}
            cashFlows={cashFlows}
            showCop={showCop}
            trm={avgTrm}
          />

          <Separator className="bg-zinc-800" />
          <PortfolioCopChart snapshots={snapshots} />

          <Separator className="bg-zinc-800" />
          <CumulativeReturnChart snapshots={snapshots} />

          <Separator className="bg-zinc-800" />
          <DailyReturnsChart snapshots={snapshots} />

          <Separator className="bg-zinc-800" />
          <WeeklyMonthlyChart snapshots={snapshots} />

          <Separator className="bg-zinc-800" />
          <AssetPerformanceChart positions={positions} />

          <Separator className="bg-zinc-800" />
          <TrmChart snapshots={snapshots} />
        </>
      )}

      {comparisonData && (
        <>
          <Separator className="bg-zinc-800" />
          <PeriodComparison
            dod={comparisonData.dod}
            wtd={comparisonData.wtd}
            mtd={comparisonData.mtd}
          />
        </>
      )}
    </div>
  );
}
