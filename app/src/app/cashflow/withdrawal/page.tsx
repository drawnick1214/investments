"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useI18n } from "@/lib/i18n/context";
import { createCashFlow } from "@/lib/supabase/cash-flows";
import type { Currency } from "@/lib/types";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";

export default function WithdrawalPage() {
  const { t } = useI18n();
  const router = useRouter();

  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<Currency>("USD");
  const [account, setAccount] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [trm, setTrm] = useState(3691.87); // TODO: Fetch current TRM

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || parseFloat(amount) <= 0) {
      toast.error(t("amountRequired"));
      return;
    }

    if (!account) {
      toast.error(t("accountRequired"));
      return;
    }

    setSaving(true);
    try {
      await createCashFlow({
        date,
        type: "withdrawal",
        amount: parseFloat(amount),
        currency,
        account,
        notes: notes || undefined,
      });

      toast.success(t("withdrawalSaved"));
      router.push("/");
    } catch (err) {
      console.error("Error saving withdrawal:", err);
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const getConversion = () => {
    const amt = parseFloat(amount) || 0;
    if (currency === "USD") {
      return `${amt.toLocaleString("en-US", { minimumFractionDigits: 2 })} USD = ${(amt * trm).toLocaleString("es-CO", { minimumFractionDigits: 0 })} COP`;
    } else if (currency === "COP") {
      return `${amt.toLocaleString("es-CO", { minimumFractionDigits: 0 })} COP = ${(amt / trm).toLocaleString("en-US", { minimumFractionDigits: 2 })} USD`;
    }
    return "";
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <Link
          href="/new"
          className="text-zinc-400 hover:text-zinc-300 flex items-center gap-2"
        >
          ← {t("back")}
        </Link>
        <h1 className="text-xl font-bold flex items-center gap-2">
           <span className="text-red-400">{t("withdrawal")}</span>
        </h1>
        <div className="w-20"></div>
      </div>

      <Card className="border-zinc-800 bg-zinc-900">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Date */}
            <div>
              <Label className="text-zinc-400">{t("date")}</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 border-zinc-700 bg-zinc-800"
              />
            </div>

            {/* Amount & Currency */}
            <div>
              <Label className="text-zinc-400">{t("amount")}</Label>
              <div className="grid grid-cols-2 gap-3 mt-1">
                <Input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="100.00"
                  className="border-zinc-700 bg-zinc-800"
                />
                <Select
                  value={currency}
                  onValueChange={(val) => setCurrency(val as Currency)}
                >
                  <SelectTrigger className="border-zinc-700 bg-zinc-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-zinc-700 bg-zinc-900">
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="COP">COP</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Source Account */}
            <div>
              <Label className="text-zinc-400">{t("source")}</Label>
              <Select value={account} onValueChange={setAccount}>
                <SelectTrigger className="mt-1 border-zinc-700 bg-zinc-800">
                  <SelectValue placeholder={t("selectAccount")} />
                </SelectTrigger>
                <SelectContent className="border-zinc-700 bg-zinc-900">
                  <SelectItem value="xtb_cash">XTB - Cash</SelectItem>
                  <SelectItem value="trii_cash">Trii - Cash</SelectItem>
                  <SelectItem value="savings_nu">Cuenta Ahorros Nu</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div>
              <Label className="text-zinc-400">{t("notes")} ({t("optional")})</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t("withdrawalNotesPlaceholder")}
                rows={3}
                className="mt-1 border-zinc-700 bg-zinc-800 resize-none"
              />
            </div>

            {/* Conversion Info */}
            {amount && (currency === "USD" || currency === "COP") && (
              <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
                <div className="text-sm text-zinc-400 mb-1">
                  {t("autoConversion")}:
                </div>
                <div className="text-lg font-semibold">
                  {getConversion()}
                </div>
                <div className="text-xs text-zinc-500 mt-1">
                  TRM: {trm.toFixed(2)}
                </div>
              </div>
            )}

            {/* Warning */}
            <div className="bg-red-900/20 border border-red-800/50 rounded-lg p-4">
              <div className="flex gap-3">
                <div className="text-red-400 text-xl"></div>
                <div className="text-sm text-zinc-300">
                  {t("withdrawalWarning")}
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <Link href="/new" className="flex-1">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700"
                >
                  {t("cancel")}
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={saving}
                className="flex-1 bg-red-500 hover:bg-red-400 text-white font-semibold"
              >
                {saving ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    {t("saving")}
                  </>
                ) : (
                  <>✅ {t("saveWithdrawal")}</>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
