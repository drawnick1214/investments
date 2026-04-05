"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useI18n } from "@/lib/i18n/context";
import {
  getPortfolioConfig,
  getLatestSnapshot,
  getSnapshotByDate,
  getRecentSnapshotDates,
  saveSnapshot,
  addInstrumentToConfig,
} from "@/lib/supabase/queries";
import { isSharesBased, usesVolumeEntry } from "@/lib/calculations";
import type {
  PortfolioConfig,
  EntryFormData,
  InstrumentEntry,
  InstrumentType,
  EntryMode,
  SavingsEntry,
} from "@/lib/types";
import XtbSection from "@/components/entry/XtbSection";
import TriiSection from "@/components/entry/TriiSection";
import SavingsSection from "@/components/entry/SavingsSection";
import { RefreshCw, Save, Zap } from "lucide-react";
import { toast } from "sonner";

function configToInstrument(
  c: PortfolioConfig,
  overridePrice?: number
): InstrumentEntry {
  const instrType =
    (c.instrument_type as InstrumentType) ||
    (c.category === "xtb_plan"
      ? "plan"
      : c.category === "trii_fund"
        ? "fund"
        : (c.asset_type as InstrumentType));

  const entryMode: EntryMode =
    (c.entry_mode as EntryMode) ||
    (isSharesBased(instrType) ? "shares" : "value");

  return {
    id: c.id,
    asset: c.asset,
    ticker: c.ticker,
    instrument_type: instrType,
    entry_mode: entryMode,
    platform: c.platform,
    currency: c.currency,
    shares: c.shares || 0,
    avg_cost: c.avg_cost || 0,
    current_price: overridePrice || 0,
    invested: c.invested || 0,
  };
}

function configToSaving(c: PortfolioConfig, overrideBalance?: number): SavingsEntry {
  return {
    id: c.id,
    bank: c.bank || "",
    product_type: c.asset_type || "ahorro",
    name: c.asset,
    balance_cop: overrideBalance || 0,
    rate_ea: c.rate_ea || 0,
    term: c.term,
    maturity_date: c.maturity_date,
  };
}

function EntryForm() {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editDate = searchParams.get("date");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fetchingPrices, setFetchingPrices] = useState(false);
  const [fetchingTrm, setFetchingTrm] = useState(false);

  const [date, setDate] = useState(
    editDate || new Date().toISOString().split("T")[0]
  );
  const [trm, setTrm] = useState(0);
  const [xtbMargin, setXtbMargin] = useState(0);
  const [xtbCash, setXtbCash] = useState(0);
  const [triiCash, setTriiCash] = useState(0);
  const [xtbInstruments, setXtbInstruments] = useState<InstrumentEntry[]>([]);
  const [triiInstruments, setTriiInstruments] = useState<InstrumentEntry[]>([]);
  const [savingsEntries, setSavingsEntries] = useState<SavingsEntry[]>([]);
  const [autoFetched, setAutoFetched] = useState<Set<string>>(new Set());
  const [recentDates, setRecentDates] = useState<string[]>([]);
  const [configsRef, setConfigsRef] = useState<{
    xtb: PortfolioConfig[];
    trii: PortfolioConfig[];
    savings: PortfolioConfig[];
  }>({ xtb: [], trii: [], savings: [] });

  const fetchPrices = useCallback(
    async (instruments: InstrumentEntry[], targetDate?: string) => {
      const tickers = instruments
        .map((i) => i.ticker)
        .filter(Boolean)
        .join(",");
      if (!tickers) return;

      setFetchingPrices(true);
      try {
        const dateParam = targetDate ? `&date=${targetDate}` : '';
        const res = await fetch(`/api/stocks?tickers=${tickers}${dateParam}`, {
          cache: 'no-store'
        });
        const data = await res.json();
        if (data.prices) {
          const priceMap: Record<string, number> = {};
          const fetched = new Set<string>();
          let successCount = 0;
          for (const p of data.prices) {
            if (p.price !== null) {
              priceMap[p.ticker] = p.price;
              fetched.add(p.ticker);
              successCount++;
            }
          }

          if (successCount > 0) {
            const dateLabel = targetDate ? ` (${targetDate})` : '';
            toast.success(`${successCount} precios actualizados${dateLabel}`);
          }

          // Update both xtb and trii instruments
          setXtbInstruments((prev) =>
            prev.map((inst) =>
              inst.ticker && priceMap[inst.ticker]
                ? { ...inst, current_price: priceMap[inst.ticker] }
                : inst
            )
          );
          setTriiInstruments((prev) =>
            prev.map((inst) =>
              inst.ticker && priceMap[inst.ticker]
                ? { ...inst, current_price: priceMap[inst.ticker] }
                : inst
            )
          );
          setAutoFetched((prev) => {
            const next = new Set(prev);
            instruments.forEach((inst) => {
              if (inst.ticker && fetched.has(inst.ticker)) {
                next.add(inst.asset);
              }
            });
            return next;
          });
        }
      } catch (err) {
        console.error("Error fetching prices:", err);
      } finally {
        setFetchingPrices(false);
      }
    },
    []
  );

  const fetchTrm = useCallback(async (targetDate?: string) => {
    setFetchingTrm(true);
    try {
      const dateParam = targetDate ? `?date=${targetDate}` : '';
      const res = await fetch(`/api/trm${dateParam}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.trm) {
        setTrm(data.trm);
        const dateLabel = targetDate ? ` (${targetDate})` : '';
        toast.success(`TRM: ${data.trm.toFixed(2)} (${data.source})${dateLabel}`);
      } else {
        toast.error("No se pudo obtener el TRM");
      }
    } catch (err) {
      console.error("Error fetching TRM:", err);
      toast.error("Error al obtener el TRM");
    } finally {
      setFetchingTrm(false);
    }
  }, []);

  const loadSnapshotTemplate = useCallback(
    async (
      templateDate: string,
      xtbConfigs: PortfolioConfig[],
      triiConfigs: PortfolioConfig[],
      savingsConfigs: PortfolioConfig[]
    ) => {
      const snapshot = await getSnapshotByDate(templateDate);
      if (!snapshot) return;

      const snap = snapshot.snapshot;
      setTrm(Number(snap.trm));
      setXtbMargin(Number(snap.xtb_margin) || 0);
      setXtbCash(Number(snap.xtb_cash) || 0);
      setTriiCash(Number(snap.trii_cash) || 0);

      // Load instruments DIRECTLY from snapshot positions
      const xtbInsts: InstrumentEntry[] = [];
      const triiInsts: InstrumentEntry[] = [];

      for (const pos of snapshot.positions) {
        const instrType = (pos.instrument_type as InstrumentType) || "stock";

        // Auto-detect entry mode from snapshot data:
        // If shares/avg_cost are 0 but invested > 0, it's value-based
        // Otherwise, use the default for the instrument type
        const hasShares = Number(pos.shares || 0) > 0 || Number(pos.avg_cost || 0) > 0;
        const hasInvested = Number(pos.invested || 0) > 0;
        const entryMode: EntryMode =
          hasInvested && !hasShares ? "value" :
          isSharesBased(instrType) ? "shares" : "value";

        const volumeBased = usesVolumeEntry(instrType, entryMode);

        const entry: InstrumentEntry = {
          id: `snapshot_${pos.asset}`, // Temporary ID from snapshot
          asset: pos.asset,
          ticker: pos.ticker || null,
          instrument_type: instrType,
          entry_mode: entryMode,
          platform: pos.platform,
          currency: pos.currency,
          shares: volumeBased ? Number(pos.shares || 0) : 0,
          avg_cost: volumeBased ? Number(pos.avg_cost || 0) : 0,
          current_price: Number(pos.current_price),
          invested: Number(pos.invested || 0),
        };

        if (pos.platform === "xtb") {
          xtbInsts.push(entry);
        } else if (pos.platform === "trii") {
          triiInsts.push(entry);
        }
      }

      setXtbInstruments(xtbInsts);
      setTriiInstruments(triiInsts);

      // Load savings DIRECTLY from snapshot
      const savingsEnts: SavingsEntry[] = snapshot.savings.map((s) => ({
        id: `snapshot_${s.name}`, // Temporary ID from snapshot
        bank: s.bank || "",
        product_type: s.account_type || "ahorro",
        name: s.name,
        balance_cop: Number(s.balance_cop),
        rate_ea: Number(s.rate_ea || 0),
        term: s.term,
        maturity_date: s.maturity_date,
      }));

      setSavingsEntries(savingsEnts);
    },
    []
  );

  useEffect(() => {
    async function init() {
      try {
        const cfg = await getPortfolioConfig();

        // Build instrument arrays from config
        const xtbConfigs = cfg.filter(
          (c) =>
            c.platform === "xtb" &&
            (c.category === "xtb_position" || c.category === "xtb_plan")
        );
        const triiConfigs = cfg.filter(
          (c) =>
            c.platform === "trii" &&
            (c.category === "trii_stock" || c.category === "trii_fund")
        );
        const savingsConfigs = cfg.filter((c) => c.category === "savings");

        // Store configs for template loading
        setConfigsRef({ xtb: xtbConfigs, trii: triiConfigs, savings: savingsConfigs });

        if (editDate) {
          // Edit mode: load exact snapshot
          const snapshot = await getSnapshotByDate(editDate);
          if (snapshot) {
            await loadSnapshotTemplate(editDate, xtbConfigs, triiConfigs, savingsConfigs);
            setDate(snapshot.snapshot.date);
          } else {
            setXtbInstruments(xtbConfigs.map((c) => configToInstrument(c)));
            setTriiInstruments(triiConfigs.map((c) => configToInstrument(c)));
            setSavingsEntries(savingsConfigs.map((c) => configToSaving(c)));
          }
        } else {
          // New mode: start EMPTY — user adds instruments manually or loads a template
          setXtbInstruments([]);
          setTriiInstruments([]);
          setSavingsEntries([]);

          // Load recent snapshot dates for template dropdown
          const dates = await getRecentSnapshotDates(3);
          setRecentDates(dates);

          // Auto-fetch TRM
          fetchTrm();
        }
      } catch (err) {
        console.error("Error loading config:", err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [editDate, fetchPrices, fetchTrm, loadSnapshotTemplate]);

  const handleSave = async () => {
    if (trm <= 0) {
      toast.error("TRM es requerido");
      return;
    }

    setSaving(true);
    try {
      // Persist any new instruments to portfolio_config (including snapshot-loaded ones)
      for (const inst of [...xtbInstruments, ...triiInstruments]) {
        if (inst.id.startsWith("new_") || inst.id.startsWith("snapshot_")) {
          const volumeBased = usesVolumeEntry(inst.instrument_type, inst.entry_mode);
          const category =
            inst.platform === "xtb"
              ? isSharesBased(inst.instrument_type)
                ? "xtb_position"
                : "xtb_plan"
              : isSharesBased(inst.instrument_type)
                ? "trii_stock"
                : "trii_fund";

          const saved = await addInstrumentToConfig({
            category,
            asset: inst.asset,
            ticker: inst.ticker,
            platform: inst.platform,
            currency: inst.currency,
            asset_type: inst.instrument_type,
            instrument_type: inst.instrument_type,
            entry_mode: inst.entry_mode,
            shares: volumeBased ? inst.shares : null,
            avg_cost: volumeBased ? inst.avg_cost : null,
            invested: !volumeBased ? inst.invested : null,
          });

          // Update the ID in local state
          if (inst.platform === "xtb") {
            setXtbInstruments((prev) =>
              prev.map((i) => (i.id === inst.id ? { ...i, id: saved.id } : i))
            );
          } else {
            setTriiInstruments((prev) =>
              prev.map((i) => (i.id === inst.id ? { ...i, id: saved.id } : i))
            );
          }
        }
      }

      // Persist new savings entries (including snapshot-loaded ones)
      for (const entry of savingsEntries) {
        if (entry.id.startsWith("new_") || entry.id.startsWith("snapshot_")) {
          const saved = await addInstrumentToConfig({
            category: "savings",
            asset: entry.name,
            ticker: null,
            platform: "savings",
            currency: "COP",
            asset_type: entry.product_type,
            instrument_type: "savings",
            shares: null,
            avg_cost: null,
            invested: null,
            bank: entry.bank,
          });

          // Update the ID in local state
          setSavingsEntries((prev) =>
            prev.map((s) => (s.id === entry.id ? { ...s, id: saved.id } : s))
          );
        }
      }

      const formData: EntryFormData = {
        date,
        trm,
        xtb_margin: xtbMargin,
        xtb_cash: xtbCash,
        trii_cash: triiCash,
        positions: [...xtbInstruments, ...triiInstruments].map((inst) => ({
          asset: inst.asset,
          platform: inst.platform,
          asset_type: inst.instrument_type,
          instrument_type: inst.instrument_type,
          entry_mode: inst.entry_mode,
          ticker: inst.ticker,
          currency: inst.currency,
          shares: inst.shares,
          avg_cost: inst.avg_cost,
          current_price: inst.current_price,
          invested: inst.invested,
        })),
        savings: savingsEntries.map((s) => ({
          name: s.name,
          account_type: s.product_type,
          bank: s.bank,
          balance_cop: s.balance_cop,
          rate_ea: s.rate_ea,
          term: s.term,
          maturity_date: s.maturity_date,
        })),
      };

      await saveSnapshot(formData);
      toast.success(t("saved"));
      router.push("/");
    } catch (err: unknown) {
      console.error("Error saving:", err);
      const msg = err instanceof Error
        ? err.message
        : typeof err === "object" && err !== null && "message" in err
          ? String((err as Record<string, unknown>).message)
          : JSON.stringify(err);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw className="h-6 w-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4 px-4 py-4">
      <h2 className="text-xl font-bold">
        {editDate ? t("editEntry") : t("dailyEntry")}
      </h2>

      {/* Load from previous snapshot */}
      {!editDate && recentDates.length > 0 && (
        <Select
          onValueChange={async (templateDate) => {
            await loadSnapshotTemplate(
              templateDate,
              configsRef.xtb,
              configsRef.trii,
              configsRef.savings
            );
          }}
        >
          <SelectTrigger className="border-zinc-700 bg-zinc-800 text-zinc-300">
            <SelectValue placeholder={t("loadFromSnapshot")} />
          </SelectTrigger>
          <SelectContent className="border-zinc-700 bg-zinc-900">
            {recentDates.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Date & TRM */}
      <Card className="border-zinc-800 bg-zinc-900">
        <CardContent className="grid grid-cols-2 gap-3 pt-4">
          <div>
            <Label className="text-zinc-400">{t("date")}</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 border-zinc-700 bg-zinc-800"
            />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <Label className="text-zinc-400">TRM (COP/USD)</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => fetchTrm(date)}
                disabled={fetchingTrm}
                className="h-6 px-2 text-xs text-emerald-400 hover:text-emerald-300"
              >
                {fetchingTrm ? (
                  <>
                    <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
                    {t("loading")}
                  </>
                ) : (
                  <>
                    <Zap className="mr-1 h-3 w-3" />
                    Auto
                  </>
                )}
              </Button>
            </div>
            <Input
              type="number"
              step="0.01"
              value={trm || ""}
              onChange={(e) => setTrm(parseFloat(e.target.value) || 0)}
              className="mt-1 border-zinc-700 bg-zinc-800"
              placeholder="4,200"
            />
          </div>
        </CardContent>
      </Card>

      {/* XTB Section */}
      <XtbSection
        instruments={xtbInstruments}
        setInstruments={setXtbInstruments}
        xtbMargin={xtbMargin}
        setXtbMargin={setXtbMargin}
        xtbCash={xtbCash}
        setXtbCash={setXtbCash}
        autoFetched={autoFetched}
        fetchingPrices={fetchingPrices}
        onFetchPrices={() =>
          fetchPrices([...xtbInstruments, ...triiInstruments], date)
        }
      />

      {/* Trii Section */}
      <TriiSection
        instruments={triiInstruments}
        setInstruments={setTriiInstruments}
        triiCash={triiCash}
        setTriiCash={setTriiCash}
        autoFetched={autoFetched}
        fetchingPrices={fetchingPrices}
        onFetchPrices={() =>
          fetchPrices([...xtbInstruments, ...triiInstruments], date)
        }
      />

      {/* Savings Section */}
      <SavingsSection
        entries={savingsEntries}
        setEntries={setSavingsEntries}
      />

      {/* Save Button */}
      <Button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-emerald-500 py-6 text-base font-semibold text-black hover:bg-emerald-400"
      >
        {saving ? (
          <>
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            {t("saving")}
          </>
        ) : (
          <>
            <Save className="mr-2 h-4 w-4" />
            {t("save")}
          </>
        )}
      </Button>
    </div>
  );
}

export default function EntryPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <RefreshCw className="h-6 w-6 animate-spin text-zinc-500" />
        </div>
      }
    >
      <EntryForm />
    </Suspense>
  );
}
