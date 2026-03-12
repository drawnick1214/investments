"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useI18n } from "@/lib/i18n/context";
import { formatCop, isSharesBased, usesVolumeEntry } from "@/lib/calculations";
import type { InstrumentEntry, InstrumentType, EntryMode, YahooSearchResult } from "@/lib/types";
import { useState, useEffect, useRef } from "react";
import { RefreshCw, Zap, X, Plus, Search, Trash2 } from "lucide-react";

interface Props {
  instruments: InstrumentEntry[];
  setInstruments: (instruments: InstrumentEntry[]) => void;
  triiCash: number;
  setTriiCash: (v: number) => void;
  autoFetched: Set<string>;
  fetchingPrices: boolean;
  onFetchPrices: () => void;
}

export default function TriiSection({
  instruments,
  setInstruments,
  triiCash,
  setTriiCash,
  autoFetched,
  fetchingPrices,
  onFetchPrices,
}: Props) {
  const { t } = useI18n();
  const [addDialog, setAddDialog] = useState(false);

  // Dialog state
  const [selectedType, setSelectedType] = useState<InstrumentType>("fund");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<YahooSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState<{ symbol: string; name: string } | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualTicker, setManualTicker] = useState("");
  const [newEntryMode, setNewEntryMode] = useState<EntryMode>("shares");
  const [newShares, setNewShares] = useState(0);
  const [newAvgCost, setNewAvgCost] = useState(0);
  const [newInvested, setNewInvested] = useState(0);
  const [newProfitability, setNewProfitability] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  // Search Yahoo when query changes
  useEffect(() => {
    if (searchQuery.length < 1 || manualMode) {
      setSearchResults([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(`/api/instruments/search?q=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        setSearchResults(data.results || []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchQuery, manualMode]);

  const resetDialog = () => {
    setSelectedType("fund");
    setNewEntryMode("shares");
    setSearchQuery("");
    setSearchResults([]);
    setSelectedSymbol(null);
    setManualMode(false);
    setManualName("");
    setManualTicker("");
    setNewShares(0);
    setNewAvgCost(0);
    setNewInvested(0);
    setNewProfitability(0);
  };

  const openDialog = () => {
    resetDialog();
    setAddDialog(true);
  };

  const updateProfitability = (id: string, percentage: number) => {
    setInstruments(
      instruments.map((inst) =>
        inst.id === id
          ? { ...inst, current_price: inst.invested * (1 + percentage / 100) }
          : inst
      )
    );
  };

  const updatePrice = (id: string, price: number) => {
    setInstruments(
      instruments.map((inst) =>
        inst.id === id ? { ...inst, current_price: price } : inst
      )
    );
  };

  const removeInstrument = (id: string) => {
    setInstruments(instruments.filter((inst) => inst.id !== id));
  };

  const handleConfirmAdd = () => {
    const name = manualMode ? manualName : selectedSymbol?.name || "";
    const ticker = manualMode ? manualTicker || null : selectedSymbol?.symbol || null;

    if (!name) return;

    const entryMode: EntryMode = isSharesBased(selectedType)
      ? newEntryMode
      : "value";
    const volumeBased = usesVolumeEntry(selectedType, entryMode);
    const invested = volumeBased ? newShares * newAvgCost : newInvested;

    const entry: InstrumentEntry = {
      id: `new_${Date.now()}`,
      asset: name,
      ticker,
      instrument_type: selectedType,
      entry_mode: entryMode,
      platform: "trii",
      currency: "COP",
      shares: volumeBased ? newShares : 0,
      avg_cost: volumeBased ? newAvgCost : 0,
      current_price: volumeBased ? 0 : invested * (1 + newProfitability / 100),
      invested,
    };

    setInstruments([...instruments, entry]);
    setAddDialog(false);
  };

  const canConfirm = manualMode ? !!manualName : !!selectedSymbol;

  return (
    <>
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-base">
            <span>Trii - {t("instruments")}</span>
            <div className="flex items-center gap-1">
              {instruments.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setInstruments([]); setTriiCash(0); }}
                  className="h-7 text-xs text-red-400 hover:text-red-300"
                >
                  <Trash2 className="mr-1 h-3 w-3" />
                  {t("clearAll")}
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onFetchPrices}
                disabled={fetchingPrices}
                className="h-7 text-xs text-emerald-400"
              >
                {fetchingPrices ? (
                  <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
                ) : (
                  <Zap className="mr-1 h-3 w-3" />
                )}
                {fetchingPrices ? t("fetchingPrices") : "Auto-fetch"}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {instruments.map((inst) => {
            const volumeBased = usesVolumeEntry(inst.instrument_type, inst.entry_mode);
            const price = inst.current_price || 0;

            if (volumeBased) {
              // Stocks/ETFs by volume: shares × price
              const mktVal = inst.shares * price;
              const isAuto = autoFetched.has(inst.asset);

              return (
                <div key={inst.id} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm text-zinc-300">{inst.asset}</Label>
                      <Badge variant="outline" className="border-zinc-700 text-[9px]">
                        {inst.instrument_type.toUpperCase()}
                      </Badge>
                      {inst.ticker && (
                        <span className="text-[10px] text-zinc-600">{inst.ticker}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {isAuto && (
                        <Badge
                          variant="outline"
                          className="border-emerald-500/30 text-emerald-400 text-[10px]"
                        >
                          {t("autoFetched")}
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-zinc-600 hover:text-red-400"
                        onClick={() => removeInstrument(inst.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-xs text-zinc-500">
                    {inst.shares} @ {formatCop(inst.avg_cost)}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      step="1"
                      value={price || ""}
                      onChange={(e) =>
                        updatePrice(inst.id, parseFloat(e.target.value) || 0)
                      }
                      className="border-zinc-700 bg-zinc-800"
                      placeholder={t("currentPrice") + " (COP)"}
                    />
                    <div className="flex min-w-[100px] items-center justify-end text-sm font-medium text-zinc-400">
                      {formatCop(mktVal)}
                    </div>
                  </div>
                </div>
              );
            }

            // Value-based: invested × (1 + pct/100)
            const profitabilityPct = inst.invested !== 0
              ? ((price - inst.invested) / inst.invested) * 100
              : 0;
            const pnlColor = profitabilityPct >= 0 ? "text-emerald-400" : "text-red-400";

            return (
              <div key={inst.id} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-zinc-300">{inst.asset}</Label>
                    <Badge variant="outline" className="border-zinc-700 text-[9px]">
                      {inst.instrument_type.toUpperCase()}
                    </Badge>
                    {inst.ticker && (
                      <span className="text-[10px] text-zinc-600">{inst.ticker}</span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-zinc-600 hover:text-red-400"
                    onClick={() => removeInstrument(inst.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <div className="text-xs text-zinc-500">
                  {t("invested")}: {formatCop(inst.invested)}
                </div>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    step="0.01"
                    value={profitabilityPct ? parseFloat(profitabilityPct.toFixed(2)) : ""}
                    onChange={(e) =>
                      updateProfitability(inst.id, parseFloat(e.target.value) || 0)
                    }
                    className="border-zinc-700 bg-zinc-800"
                    placeholder={t("profitability")}
                  />
                  <div className="flex min-w-[100px] flex-col items-end justify-center">
                    <span className="text-sm font-medium text-zinc-400">
                      {formatCop(price)}
                    </span>
                    <span className={`text-[10px] font-medium ${pnlColor}`}>
                      {profitabilityPct >= 0 ? "+" : ""}{profitabilityPct.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          <Button
            variant="outline"
            size="sm"
            onClick={openDialog}
            className="w-full border-dashed border-zinc-700 text-zinc-400 hover:border-emerald-500/50 hover:text-emerald-400"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t("addInstrument")}
          </Button>

          <Separator className="bg-zinc-700" />

          <div>
            <Label className="text-sm text-zinc-400">
              {t("availableCash")} (COP)
            </Label>
            <Input
              type="number"
              step="1"
              value={triiCash || ""}
              onChange={(e) =>
                setTriiCash(parseFloat(e.target.value) || 0)
              }
              className="mt-1 border-zinc-700 bg-zinc-800"
            />
          </div>
        </CardContent>
      </Card>

      {/* Add Instrument Dialog */}
      <Dialog open={addDialog} onOpenChange={setAddDialog}>
        <DialogContent className="border-zinc-700 bg-zinc-900 max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("addInstrument")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Step 1: Instrument Type */}
            <div>
              <Label className="text-zinc-400">{t("instrumentType")}</Label>
              <Select
                value={selectedType}
                onValueChange={(v) => {
                  setSelectedType(v as InstrumentType);
                  setSelectedSymbol(null);
                  setSearchQuery("");
                  setSearchResults([]);
                }}
              >
                <SelectTrigger className="mt-1 border-zinc-700 bg-zinc-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-zinc-700 bg-zinc-900">
                  <SelectItem value="stock">{t("stock")}</SelectItem>
                  <SelectItem value="etf">{t("etf")}</SelectItem>
                  <SelectItem value="fund">{t("fundType")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Step 2: Search or Manual */}
            {!manualMode ? (
              <div>
                <Label className="text-zinc-400">{t("searchInstrument")}</Label>
                <div className="relative mt-1">
                  <div className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-3">
                    <Search className="h-4 w-4 shrink-0 text-zinc-500" />
                    <input
                      type="text"
                      placeholder="ECO, PFBCOLOM, ISA..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-9 w-full bg-transparent text-sm text-zinc-200 placeholder:text-zinc-500 outline-none"
                    />
                  </div>
                  {searchLoading && (
                    <div className="mt-1 rounded-lg border border-zinc-700 bg-zinc-800 py-3 text-center text-xs text-zinc-500">
                      <Search className="mx-auto mb-1 h-4 w-4 animate-pulse" />
                      {t("loading")}
                    </div>
                  )}
                  {!searchLoading && searchQuery.length > 0 && searchResults.length === 0 && (
                    <div className="mt-1 rounded-lg border border-zinc-700 bg-zinc-800 py-3 text-center text-xs text-zinc-500">
                      {t("noResults")}
                    </div>
                  )}
                  {searchResults.length > 0 && (
                    <div className="mt-1 max-h-[200px] overflow-y-auto rounded-lg border border-zinc-700 bg-zinc-800">
                      {searchResults.map((r) => (
                        <button
                          key={r.symbol}
                          type="button"
                          onClick={() => {
                            setSelectedSymbol({
                              symbol: r.symbol,
                              name: r.shortname || r.longname || r.symbol,
                            });
                            setSearchQuery("");
                            setSearchResults([]);
                          }}
                          className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-zinc-700 active:bg-zinc-600"
                        >
                          <div>
                            <span className="font-medium text-sm text-zinc-200">{r.symbol}</span>
                            <span className="ml-2 text-xs text-zinc-500">
                              {r.shortname || r.longname}
                            </span>
                          </div>
                          <span className="text-[10px] text-zinc-600">
                            {r.exchange}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {selectedSymbol && (
                  <div className="mt-2 flex items-center gap-2">
                    <Badge className="bg-emerald-500/20 text-emerald-400">
                      {selectedSymbol.symbol}
                    </Badge>
                    <span className="text-sm text-zinc-300">{selectedSymbol.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-auto h-5 w-5 p-0 text-zinc-500 hover:text-red-400"
                      onClick={() => setSelectedSymbol(null)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}

                <Button
                  variant="link"
                  size="sm"
                  className="mt-1 h-auto p-0 text-xs text-zinc-500 hover:text-zinc-300"
                  onClick={() => setManualMode(true)}
                >
                  {t("manualEntry")}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <Label className="text-zinc-400">{t("instruments")}</Label>
                  <Input
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    className="mt-1 border-zinc-700 bg-zinc-800"
                    placeholder="e.g. Fondo Trii"
                  />
                </div>
                <div>
                  <Label className="text-zinc-400">Ticker</Label>
                  <Input
                    value={manualTicker}
                    onChange={(e) => setManualTicker(e.target.value)}
                    className="mt-1 border-zinc-700 bg-zinc-800"
                    placeholder="e.g. ECO.CL"
                  />
                </div>
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-xs text-zinc-500 hover:text-zinc-300"
                  onClick={() => { setManualMode(false); setManualName(""); setManualTicker(""); }}
                >
                  {t("searchInstrument")}
                </Button>
              </div>
            )}

            {/* Step 3: Entry mode + details */}
            {(selectedSymbol || manualMode) && (
              <>
                <Separator className="bg-zinc-700" />

                {/* Entry mode toggle for shares-based types */}
                {isSharesBased(selectedType) && (
                  <div>
                    <Label className="text-zinc-400">{t("entryMode")}</Label>
                    <div className="mt-1 flex gap-1 rounded-md bg-zinc-800 p-0.5">
                      <button
                        type="button"
                        onClick={() => setNewEntryMode("shares")}
                        className={`flex-1 rounded px-2 py-1.5 text-xs ${
                          newEntryMode === "shares"
                            ? "bg-zinc-700 text-zinc-200"
                            : "text-zinc-500"
                        }`}
                      >
                        {t("byVolume")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewEntryMode("value")}
                        className={`flex-1 rounded px-2 py-1.5 text-xs ${
                          newEntryMode === "value"
                            ? "bg-zinc-700 text-zinc-200"
                            : "text-zinc-500"
                        }`}
                      >
                        {t("byValue")}
                      </button>
                    </div>
                  </div>
                )}

                {usesVolumeEntry(selectedType, isSharesBased(selectedType) ? newEntryMode : "value") ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-zinc-400">{t("shares")}</Label>
                      <Input
                        type="number"
                        step="0.001"
                        value={newShares || ""}
                        onChange={(e) =>
                          setNewShares(parseFloat(e.target.value) || 0)
                        }
                        className="mt-1 border-zinc-700 bg-zinc-800"
                      />
                    </div>
                    <div>
                      <Label className="text-zinc-400">
                        {t("avgCost")} (COP)
                      </Label>
                      <Input
                        type="number"
                        step="1"
                        value={newAvgCost || ""}
                        onChange={(e) =>
                          setNewAvgCost(parseFloat(e.target.value) || 0)
                        }
                        className="mt-1 border-zinc-700 bg-zinc-800"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-zinc-400">
                        {t("invested")} (COP)
                      </Label>
                      <Input
                        type="number"
                        step="1"
                        value={newInvested || ""}
                        onChange={(e) =>
                          setNewInvested(parseFloat(e.target.value) || 0)
                        }
                        className="mt-1 border-zinc-700 bg-zinc-800"
                      />
                    </div>
                    <div>
                      <Label className="text-zinc-400">
                        {t("profitability")}
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={newProfitability || ""}
                        onChange={(e) =>
                          setNewProfitability(parseFloat(e.target.value) || 0)
                        }
                        className="mt-1 border-zinc-700 bg-zinc-800"
                        placeholder="ej. 3.5 o -2.1"
                      />
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleConfirmAdd}
                  disabled={!canConfirm}
                  className="w-full bg-emerald-500 text-black hover:bg-emerald-400"
                >
                  {t("addInstrument")}
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
