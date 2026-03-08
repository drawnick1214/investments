"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { formatCop } from "@/lib/calculations";
import type { SavingsEntry, Language } from "@/lib/types";
import { COLOMBIAN_BANKS, SAVINGS_PRODUCT_TYPES } from "@/data/colombian-banks";
import { useState } from "react";
import { Plus, X, Wallet, Clock } from "lucide-react";

interface Props {
  entries: SavingsEntry[];
  setEntries: (entries: SavingsEntry[]) => void;
}

function getProductLabel(id: string, lang: Language): string {
  const product = SAVINGS_PRODUCT_TYPES.find((p) => p.id === id);
  if (!product) return id;
  return lang === "es" ? product.name_es : product.name_en;
}

export default function SavingsSection({ entries, setEntries }: Props) {
  const { t, lang } = useI18n();
  const [addDialog, setAddDialog] = useState(false);
  const [newBank, setNewBank] = useState("");
  const [newProductType, setNewProductType] = useState("ahorro");
  const [newName, setNewName] = useState("");
  const [newBalance, setNewBalance] = useState(0);
  const [newRate, setNewRate] = useState(0);
  const [newTerm, setNewTerm] = useState("");
  const [newMaturity, setNewMaturity] = useState("");

  const updateBalance = (id: string, balance: number) => {
    setEntries(
      entries.map((e) => (e.id === id ? { ...e, balance_cop: balance } : e))
    );
  };

  const removeEntry = (id: string) => {
    setEntries(entries.filter((e) => e.id !== id));
  };

  const handleAdd = () => {
    const bankObj = COLOMBIAN_BANKS.find((b) => b.id === newBank);
    const entry: SavingsEntry = {
      id: `new_${Date.now()}`,
      bank: bankObj?.name || newBank,
      product_type: newProductType,
      name: newName,
      balance_cop: newBalance,
      rate_ea: newRate,
      term: newTerm || null,
      maturity_date: newMaturity || null,
    };
    setEntries([...entries, entry]);
    setAddDialog(false);
    setNewBank("");
    setNewProductType("ahorro");
    setNewName("");
    setNewBalance(0);
    setNewRate(0);
    setNewTerm("");
    setNewMaturity("");
  };

  // Group by bank
  const banks = [...new Set(entries.map((e) => e.bank))];

  return (
    <>
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t("savingsAndCdts")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {banks.map((bank) => {
            const bankEntries = entries.filter((e) => e.bank === bank);
            return (
              <div key={bank} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="border-amber-500/30 text-amber-400 text-[10px]"
                  >
                    {bank}
                  </Badge>
                </div>
                {bankEntries.map((entry) => {
                  const isCdt = entry.product_type === "cdt";
                  return (
                    <div key={entry.id} className="space-y-1 pl-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {isCdt ? (
                            <Clock className="h-3 w-3 text-blue-400" />
                          ) : (
                            <Wallet className="h-3 w-3 text-amber-400" />
                          )}
                          <Label className="text-sm text-zinc-300">
                            {entry.name}
                          </Label>
                          <span className="text-[10px] text-zinc-500">
                            {(entry.rate_ea * 100).toFixed(2)}% EA
                            {entry.term ? ` - ${entry.term}` : ""}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-zinc-600 hover:text-red-400"
                          onClick={() => removeEntry(entry.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <Input
                        type="number"
                        step="1"
                        value={entry.balance_cop || ""}
                        onChange={(e) =>
                          updateBalance(
                            entry.id,
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="border-zinc-700 bg-zinc-800"
                        placeholder={t("balance") + " (COP)"}
                      />
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* Entries without a bank group (shouldn't happen but handle gracefully) */}
          {entries.filter((e) => !e.bank).map((entry) => (
            <div key={entry.id} className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-sm text-zinc-300">{entry.name}</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-zinc-600 hover:text-red-400"
                  onClick={() => removeEntry(entry.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <Input
                type="number"
                step="1"
                value={entry.balance_cop || ""}
                onChange={(e) =>
                  updateBalance(entry.id, parseFloat(e.target.value) || 0)
                }
                className="border-zinc-700 bg-zinc-800"
                placeholder={t("balance") + " (COP)"}
              />
            </div>
          ))}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setAddDialog(true)}
            className="w-full border-dashed border-zinc-700 text-zinc-400 hover:border-amber-500/50 hover:text-amber-400"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t("addAccount")}
          </Button>
        </CardContent>
      </Card>

      {/* Add Account Dialog */}
      <Dialog open={addDialog} onOpenChange={setAddDialog}>
        <DialogContent className="border-zinc-700 bg-zinc-900">
          <DialogHeader>
            <DialogTitle>{t("addAccount")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-zinc-400">{t("bank")}</Label>
              <Select value={newBank} onValueChange={setNewBank}>
                <SelectTrigger className="mt-1 border-zinc-700 bg-zinc-800">
                  <SelectValue placeholder={t("selectBank")} />
                </SelectTrigger>
                <SelectContent className="border-zinc-700 bg-zinc-900">
                  {COLOMBIAN_BANKS.map((bank) => (
                    <SelectItem key={bank.id} value={bank.id}>
                      {bank.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-zinc-400">{t("productType")}</Label>
              <Select value={newProductType} onValueChange={setNewProductType}>
                <SelectTrigger className="mt-1 border-zinc-700 bg-zinc-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-zinc-700 bg-zinc-900">
                  {SAVINGS_PRODUCT_TYPES.map((pt) => (
                    <SelectItem key={pt.id} value={pt.id}>
                      {getProductLabel(pt.id, lang)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-zinc-400">{t("instruments")}</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="mt-1 border-zinc-700 bg-zinc-800"
                placeholder="e.g. Cuenta Ahorro Nequi"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-zinc-400">{t("balance")} (COP)</Label>
                <Input
                  type="number"
                  step="1"
                  value={newBalance || ""}
                  onChange={(e) =>
                    setNewBalance(parseFloat(e.target.value) || 0)
                  }
                  className="mt-1 border-zinc-700 bg-zinc-800"
                />
              </div>
              <div>
                <Label className="text-zinc-400">{t("rate")} EA (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newRate ? newRate * 100 : ""}
                  onChange={(e) =>
                    setNewRate((parseFloat(e.target.value) || 0) / 100)
                  }
                  className="mt-1 border-zinc-700 bg-zinc-800"
                  placeholder="11.5"
                />
              </div>
            </div>

            {newProductType === "cdt" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-zinc-400">{t("term")}</Label>
                  <Input
                    value={newTerm}
                    onChange={(e) => setNewTerm(e.target.value)}
                    className="mt-1 border-zinc-700 bg-zinc-800"
                    placeholder="180 dias"
                  />
                </div>
                <div>
                  <Label className="text-zinc-400">{t("maturityDate")}</Label>
                  <Input
                    type="date"
                    value={newMaturity}
                    onChange={(e) => setNewMaturity(e.target.value)}
                    className="mt-1 border-zinc-700 bg-zinc-800"
                  />
                </div>
              </div>
            )}

            <div className="text-xs text-zinc-500">
              {newBalance > 0 && newRate > 0 && (
                <span>
                  {t("interestDaily")}: ~{formatCop(Math.round(newBalance * (Math.pow(1 + newRate, 1 / 365) - 1)))}
                </span>
              )}
            </div>

            <Button
              onClick={handleAdd}
              disabled={!newBank || !newName}
              className="w-full bg-amber-500 text-black hover:bg-amber-400"
            >
              {t("addAccount")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
