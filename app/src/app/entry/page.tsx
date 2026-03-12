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
import { RefreshCw, Save } from "lucide-react";
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
    async (instruments: InstrumentEntry[]) => {
      const tickers = instruments
        .map((i) => i.ticker)
        .filter(Boolean)
        .join(",");
      if (!tickers) return;

      setFetchingPrices(true);
      try {
        const res = await fetch(`/api/stocks?tickers=${tickers}`);
        const data = await res.json();
        if (data.prices) {
          const priceMap: Record<string, number> = {};
          const fetched = new Set<string>();
          for (const p of data.prices) {
            if (p.price !== null) {
              priceMap[p.ticker] = p.price;
              fetched.add(p.ticker);
            }
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

  const fetchTrm = useCallback(async () => {
    try {
      const res = await fetch("/api/trm");
      const data = await res.json();
      if (data.trm) setTrm(data.trm);
    } catch (err) {
      console.error("Error fetching TRM:", err);
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

      const priceMap: Record<string, number> = {};
      for (const pos of snapshot.positions) {
        priceMap[pos.asset] = Number(pos.current_price);
      }
      const planValueMap: Record<string, number> = {};
      for (const plan of snapshot.plans) {
        planValueMap[plan.name] = Number(plan.current_value);
      }
      const fundValueMap: Record<string, number> = {};
      for (const fund of snapshot.funds) {
        fundValueMap[fund.name] = Number(fund.current_value);
      }
      const savingsMap: Record<string, number> = {};
      for (const s of snapshot.savings) {
        savingsMap[s.name] = Number(s.balance_cop);
      }

      setXtbInstruments(
        xtbConfigs.map((c) => {
          const price = priceMap[c.asset] || planValueMap[c.asset] || 0;
          return configToInstrument(c, price);
        })
      );
      setTriiInstruments(
        triiConfigs.map((c) => {
          const price = priceMap[c.asset] || fundValueMap[c.asset] || 0;
          return configToInstrument(c, price);
        })
      );
      setSavingsEntries(
        savingsConfigs.map((c) => configToSaving(c, savingsMap[c.asset]))
      );
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
      // Persist any new instruments to portfolio_config
      for (const inst of [...xtbInstruments, ...triiInstruments]) {
        if (inst.id.startsWith("new_")) {
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

      // Persist new savings entries
      for (const entry of savingsEntries) {
        if (entry.id.startsWith("new_")) {
          await addInstrumentToConfig({
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
    } catch (err) {
      console.error("Error saving:", err);
      toast.error(String(err));
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
            <Label className="text-zinc-400">TRM (COP/USD)</Label>
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
          fetchPrices([...xtbInstruments, ...triiInstruments])
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
          fetchPrices([...xtbInstruments, ...triiInstruments])
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
