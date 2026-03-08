import {
  startOfWeek,
  startOfMonth,
  subWeeks,
  subMonths,
  subDays,
  format,
  min,
  endOfMonth,
} from "date-fns";
import type { Snapshot } from "./types";

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface ComparisonPeriods {
  current: DateRange;
  previous: DateRange;
}

function fmt(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

export function getWtdComparison(today: Date): ComparisonPeriods {
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const prevWeekStart = subWeeks(weekStart, 1);
  const daysSoFar = Math.floor(
    (today.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24)
  );
  const prevEnd = new Date(prevWeekStart);
  prevEnd.setDate(prevEnd.getDate() + daysSoFar);

  return {
    current: { startDate: fmt(weekStart), endDate: fmt(today) },
    previous: { startDate: fmt(prevWeekStart), endDate: fmt(prevEnd) },
  };
}

export function getMtdComparison(today: Date): ComparisonPeriods {
  const monthStart = startOfMonth(today);
  const prevMonthStart = startOfMonth(subMonths(today, 1));
  const dayOfMonth = today.getDate();
  const prevMonthEnd = min([
    new Date(prevMonthStart.getFullYear(), prevMonthStart.getMonth(), dayOfMonth),
    endOfMonth(prevMonthStart),
  ]);

  return {
    current: { startDate: fmt(monthStart), endDate: fmt(today) },
    previous: { startDate: fmt(prevMonthStart), endDate: fmt(prevMonthEnd) },
  };
}

export function getDodComparison(today: Date): ComparisonPeriods {
  const yesterday = subDays(today, 1);
  return {
    current: { startDate: fmt(today), endDate: fmt(today) },
    previous: { startDate: fmt(yesterday), endDate: fmt(yesterday) },
  };
}

export interface PeriodMetrics {
  totalReturn: number;
  totalReturnPct: number;
  avgDaily: number;
  winRate: number;
  positiveDays: number;
  totalDays: number;
  lastValueUsd: number;
  lastValueCop: number;
}

export function computeMetrics(snapshots: Snapshot[]): PeriodMetrics | null {
  if (snapshots.length < 1) return null;

  const sorted = [...snapshots].sort((a, b) => a.date.localeCompare(b.date));

  const first = Number(sorted[0].total_usd ?? 0);
  const lastSnap = sorted[sorted.length - 1];
  const last = Number(lastSnap.total_usd ?? 0);
  const totalReturn = last - first;
  const totalReturnPct = first !== 0 ? (totalReturn / first) * 100 : 0;

  const dailyChanges = sorted
    .filter((s) => s.daily_change !== null)
    .map((s) => Number(s.daily_change));

  const positiveDays = dailyChanges.filter((c) => c >= 0).length;
  const totalDays = dailyChanges.length;
  const winRate = totalDays > 0 ? (positiveDays / totalDays) * 100 : 0;
  const avgDaily =
    totalDays > 0
      ? dailyChanges.reduce((s, c) => s + c, 0) / totalDays
      : 0;

  const lastValueUsd = last;
  const lastValueCop = last * Number(lastSnap.trm);

  return {
    totalReturn,
    totalReturnPct,
    avgDaily,
    winRate,
    positiveDays,
    totalDays,
    lastValueUsd,
    lastValueCop,
  };
}
