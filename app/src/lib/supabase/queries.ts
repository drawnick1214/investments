import { supabase } from "./client";
import type {
  Snapshot,
  SnapshotPosition,
  SnapshotPlan,
  SnapshotSaving,
  SnapshotFund,
  FullSnapshot,
  PortfolioConfig,
  EntryFormData,
  CashFlow,
  CashFlowFormData,
} from "../types";
import {
  calcPnl,
  calcPlanPnl,
  calcDailyInterest,
  calcMonthlyInterest,
  calcAnnualInterest,
  isSharesBased,
  usesVolumeEntry,
} from "../calculations";

// Portfolio Config
export async function getPortfolioConfig(): Promise<PortfolioConfig[]> {
  const { data, error } = await supabase
    .from("portfolio_config")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");
  if (error) throw error;
  return data || [];
}

export async function addInstrumentToConfig(instrument: {
  category: string;
  asset: string;
  ticker: string | null;
  platform: string;
  currency: string;
  asset_type: string;
  instrument_type: string;
  entry_mode?: string;
  shares: number | null;
  avg_cost: number | null;
  invested: number | null;
  bank?: string | null;
}): Promise<PortfolioConfig> {
  // Check if instrument already exists (same platform + asset)
  const { data: existingInstrument } = await supabase
    .from("portfolio_config")
    .select("*")
    .eq("platform", instrument.platform)
    .eq("asset", instrument.asset)
    .maybeSingle();

  // If exists, update it and return
  if (existingInstrument) {
    const { data: updated, error: updateError } = await supabase
      .from("portfolio_config")
      .update({
        ticker: instrument.ticker,
        currency: instrument.currency,
        asset_type: instrument.asset_type,
        instrument_type: instrument.instrument_type,
        entry_mode: instrument.entry_mode,
        shares: instrument.shares,
        avg_cost: instrument.avg_cost,
        invested: instrument.invested,
        bank: instrument.bank,
        is_active: true,
      })
      .eq("id", existingInstrument.id)
      .select()
      .single();

    if (updateError) throw new Error(`Update existing instrument: ${updateError.message}`);
    return updated as PortfolioConfig;
  }

  // Get max sort_order for new instrument
  const { data: existing } = await supabase
    .from("portfolio_config")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextOrder = (existing?.[0]?.sort_order || 0) + 1;

  const { data, error } = await supabase
    .from("portfolio_config")
    .insert({
      ...instrument,
      is_active: true,
      sort_order: nextOrder,
    })
    .select()
    .single();

  if (error) throw new Error(`Insert new instrument: ${error.message}`);
  return data as PortfolioConfig;
}

export async function deactivateInstrument(id: string): Promise<void> {
  const { error } = await supabase
    .from("portfolio_config")
    .update({ is_active: false })
    .eq("id", id);
  if (error) throw error;
}

export async function updateInstrumentConfig(
  id: string,
  updates: Partial<Pick<PortfolioConfig, "shares" | "avg_cost" | "invested" | "rate_ea" | "term" | "maturity_date" | "bank">>
): Promise<void> {
  const { error } = await supabase
    .from("portfolio_config")
    .update(updates)
    .eq("id", id);
  if (error) throw error;
}

// Recent snapshot dates (for template dropdown)
export async function getRecentSnapshotDates(limit = 3): Promise<string[]> {
  const { data, error } = await supabase
    .from("snapshots")
    .select("date")
    .order("date", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []).map((d) => d.date);
}

// Snapshots
export async function getLatestSnapshot(): Promise<FullSnapshot | null> {
  const { data: snapshots } = await supabase
    .from("snapshots")
    .select("*")
    .order("date", { ascending: false })
    .limit(1);

  if (!snapshots || snapshots.length === 0) return null;
  return getFullSnapshot(snapshots[0].date);
}

export async function getSnapshotByDate(
  date: string
): Promise<FullSnapshot | null> {
  const { data: snapshots } = await supabase
    .from("snapshots")
    .select("*")
    .eq("date", date)
    .limit(1);

  if (!snapshots || snapshots.length === 0) return null;
  return getFullSnapshot(date);
}

async function getFullSnapshot(date: string): Promise<FullSnapshot> {
  const [snapshotRes, positionsRes, plansRes, savingsRes, fundsRes] =
    await Promise.all([
      supabase.from("snapshots").select("*").eq("date", date).single(),
      supabase.from("snapshot_positions").select("*").eq("snapshot_date", date),
      supabase.from("snapshot_plans").select("*").eq("snapshot_date", date),
      supabase.from("snapshot_savings").select("*").eq("snapshot_date", date),
      supabase.from("snapshot_funds").select("*").eq("snapshot_date", date),
    ]);

  return {
    snapshot: snapshotRes.data as Snapshot,
    positions: (positionsRes.data || []) as SnapshotPosition[],
    plans: (plansRes.data || []) as SnapshotPlan[],
    savings: (savingsRes.data || []) as SnapshotSaving[],
    funds: (fundsRes.data || []) as SnapshotFund[],
  };
}

export async function getAllSnapshots(): Promise<Snapshot[]> {
  const { data, error } = await supabase
    .from("snapshots")
    .select("*")
    .order("date", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getSnapshotsInRange(
  startDate: string,
  endDate: string
): Promise<Snapshot[]> {
  const { data, error } = await supabase
    .from("snapshots")
    .select("*")
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: true });
  if (error) throw error;
  return data || [];
}

// Save snapshot (upsert)
export async function saveSnapshot(formData: EntryFormData): Promise<void> {
  const { date, trm, xtb_margin, xtb_cash, trii_cash, positions, savings } = formData;

  // Calculate position values — unified for all instrument types
  const positionRows: SnapshotPosition[] = positions.map((p) => {
    const volumeBased = usesVolumeEntry(p.instrument_type, p.entry_mode);

    if (volumeBased) {
      const { marketValue, pnl, pnlPercent } = calcPnl(
        p.shares,
        p.avg_cost,
        p.current_price
      );
      return {
        snapshot_date: date,
        platform: p.platform,
        asset: p.asset,
        asset_type: p.asset_type,
        instrument_type: p.instrument_type,
        ticker: p.ticker,
        invested: Math.round(p.shares * p.avg_cost * 100) / 100,
        currency: p.currency,
        shares: p.shares,
        avg_cost: p.avg_cost,
        current_price: p.current_price,
        market_value: Math.round(marketValue * 100) / 100,
        pnl: Math.round(pnl * 100) / 100,
        pnl_percent: Math.round(pnlPercent * 1000) / 1000,
      };
    } else {
      // Fund or plan type: current_price = current_value, invested = cost basis
      const { pnl, pnlPercent } = calcPlanPnl(p.current_price, p.invested);
      return {
        snapshot_date: date,
        platform: p.platform,
        asset: p.asset,
        asset_type: p.asset_type,
        instrument_type: p.instrument_type,
        ticker: p.ticker,
        invested: p.invested,
        currency: p.currency,
        shares: p.shares,
        avg_cost: p.avg_cost,
        current_price: p.current_price,
        market_value: Math.round(p.current_price * 100) / 100,
        pnl: Math.round(pnl * 100) / 100,
        pnl_percent: Math.round(pnlPercent * 1000) / 1000,
      };
    }
  });

  // Calculate savings with interest
  const savingRows: SnapshotSaving[] = savings.map((s) => ({
    snapshot_date: date,
    name: s.name,
    account_type: s.account_type,
    bank: s.bank,
    balance_cop: s.balance_cop,
    rate_ea: s.rate_ea,
    term: s.term,
    maturity_date: s.maturity_date,
    daily_interest: Math.round(calcDailyInterest(s.balance_cop, s.rate_ea)),
    monthly_interest: Math.round(
      calcMonthlyInterest(s.balance_cop, s.rate_ea)
    ),
    annual_interest: Math.round(calcAnnualInterest(s.balance_cop, s.rate_ea)),
  }));

  // Calculate totals
  const xtbPositionsUsd = positionRows
    .filter((p) => p.platform === "xtb")
    .reduce((sum, p) => sum + p.market_value, 0);
  const triiPositionsCop = positionRows
    .filter((p) => p.platform === "trii")
    .reduce((sum, p) => sum + p.market_value, 0);
  const savingsCop = savingRows.reduce((sum, s) => sum + s.balance_cop, 0);

  const totalUsd =
    xtbPositionsUsd +
    xtb_cash +
    (triiPositionsCop + trii_cash + savingsCop) / trm;

  // Get previous day total for daily change
  const { data: prevSnapshots } = await supabase
    .from("snapshots")
    .select("total_usd")
    .lt("date", date)
    .order("date", { ascending: false })
    .limit(1);

  const prevTotal = prevSnapshots?.[0]?.total_usd || null;
  const dailyChange = prevTotal ? totalUsd - prevTotal : null;
  const dailyPct =
    prevTotal && prevTotal !== 0 ? (dailyChange! / prevTotal) * 100 : null;

  // Delete existing data for this date (upsert approach)
  const { error: delPosErr } = await supabase.from("snapshot_positions").delete().eq("snapshot_date", date);
  if (delPosErr) throw new Error(`Delete positions: ${delPosErr.message}`);
  const { error: delSavErr } = await supabase.from("snapshot_savings").delete().eq("snapshot_date", date);
  if (delSavErr) throw new Error(`Delete savings: ${delSavErr.message}`);

  // Upsert snapshot
  const { error: snapError } = await supabase.from("snapshots").upsert(
    {
      date,
      trm,
      xtb_margin,
      xtb_cash,
      trii_cash,
      total_usd: Math.round(totalUsd * 100) / 100,
      daily_change: dailyChange ? Math.round(dailyChange * 100) / 100 : null,
      daily_pct: dailyPct ? Math.round(dailyPct * 1000) / 1000 : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "date" }
  );
  if (snapError) throw new Error(`Upsert snapshot: ${snapError.message}`);

  // Insert related data
  const inserts = [];
  if (positionRows.length > 0) {
    inserts.push(
      supabase.from("snapshot_positions").insert(positionRows)
    );
  }
  if (savingRows.length > 0) {
    inserts.push(supabase.from("snapshot_savings").insert(savingRows));
  }

  const results = await Promise.all(inserts);
  for (const result of results) {
    if (result.error) throw new Error(`Insert data: ${result.error.message}`);
  }
}

export async function getPositionsInRange(
  startDate: string,
  endDate: string
): Promise<SnapshotPosition[]> {
  const { data, error } = await supabase
    .from("snapshot_positions")
    .select("*")
    .gte("snapshot_date", startDate)
    .lte("snapshot_date", endDate)
    .order("snapshot_date", { ascending: true });
  if (error) throw error;
  return (data || []) as SnapshotPosition[];
}

export async function deleteSnapshot(date: string): Promise<void> {
  const { error } = await supabase.from("snapshots").delete().eq("date", date);
  if (error) throw error;
}

// Export all data as flat objects for CSV
export async function exportAllData(): Promise<Record<string, unknown>[]> {
  const snapshots = await getAllSnapshots();
  const rows: Record<string, unknown>[] = [];

  for (const snap of snapshots) {
    const full = await getFullSnapshot(snap.date);
    const row: Record<string, unknown> = {
      date: snap.date,
      trm: snap.trm,
      xtb_margin: snap.xtb_margin,
      xtb_cash: snap.xtb_cash,
      total_usd: snap.total_usd,
      daily_change: snap.daily_change,
      daily_pct: snap.daily_pct,
    };

    for (const pos of full.positions) {
      const prefix = `${pos.platform}_${pos.asset}`.replace(/\s/g, "_");
      row[`${prefix}_price`] = pos.current_price;
      row[`${prefix}_value`] = pos.market_value;
      row[`${prefix}_pnl`] = pos.pnl;
    }

    for (const plan of full.plans) {
      const prefix = plan.name.replace(/\s/g, "_");
      row[`${prefix}_value`] = plan.current_value;
      row[`${prefix}_pnl`] = plan.pnl;
    }

    for (const fund of full.funds) {
      const prefix = fund.name.replace(/\s/g, "_");
      row[`${prefix}_value`] = fund.current_value;
      row[`${prefix}_pnl`] = fund.pnl;
    }

    for (const saving of full.savings) {
      const prefix = saving.name.replace(/\s/g, "_");
      row[`${prefix}_balance`] = saving.balance_cop;
      row[`${prefix}_daily_interest`] = saving.daily_interest;
    }

    rows.push(row);
  }

  return rows;
}
