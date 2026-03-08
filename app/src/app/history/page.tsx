"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useI18n } from "@/lib/i18n/context";
import {
  getAllSnapshots,
  deleteSnapshot,
  exportAllData,
} from "@/lib/supabase/queries";
import { formatUsd, formatPercent } from "@/lib/calculations";
import type { Snapshot } from "@/lib/types";
import {
  RefreshCw,
  Download,
  Pencil,
  Trash2,
  TrendingUp,
  TrendingDown,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import Papa from "papaparse";

export default function HistoryPage() {
  const { t } = useI18n();
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [deleteDate, setDeleteDate] = useState<string | null>(null);

  const loadSnapshots = async () => {
    setLoading(true);
    try {
      const data = await getAllSnapshots();
      setSnapshots(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSnapshots();
  }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      const data = await exportAllData();
      const csv = Papa.unparse(data);
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `portfolio_${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CSV exported");
    } catch (err) {
      console.error(err);
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDate) return;
    try {
      await deleteSnapshot(deleteDate);
      setSnapshots((prev) => prev.filter((s) => s.date !== deleteDate));
      setDeleteDate(null);
      toast.success("Deleted");
    } catch (err) {
      console.error(err);
      toast.error("Delete failed");
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
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">{t("snapshotHistory")}</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={exporting || snapshots.length === 0}
          className="border-zinc-700 text-zinc-300"
        >
          {exporting ? (
            <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
          ) : (
            <Download className="mr-1 h-3 w-3" />
          )}
          {t("exportCsv")}
        </Button>
      </div>

      {snapshots.length === 0 ? (
        <div className="py-20 text-center text-zinc-500">
          {t("noSnapshots")}
        </div>
      ) : (
        <div className="space-y-2">
          {snapshots.map((snap) => {
            const change = Number(snap.daily_change) || 0;
            const pct = Number(snap.daily_pct) || 0;
            const isPositive = change >= 0;

            return (
              <Card key={snap.date} className="border-zinc-800 bg-zinc-900">
                <CardContent className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800">
                      <Calendar className="h-4 w-4 text-zinc-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{snap.date}</p>
                      <p className="text-xs text-zinc-500">
                        TRM: {Number(snap.trm).toLocaleString("es-CO")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {formatUsd(Number(snap.total_usd))}
                      </p>
                      {snap.daily_change !== null && (
                        <p
                          className={`flex items-center justify-end gap-1 text-xs font-medium ${isPositive ? "text-emerald-400" : "text-red-400"}`}
                        >
                          {isPositive ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
                          )}
                          {formatUsd(change)} ({formatPercent(pct)})
                        </p>
                      )}
                    </div>

                    <div className="flex gap-1">
                      <Link href={`/entry?date=${snap.date}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-zinc-400 hover:text-zinc-200"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                      <Dialog
                        open={deleteDate === snap.date}
                        onOpenChange={(open) =>
                          setDeleteDate(open ? snap.date : null)
                        }
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-zinc-400 hover:text-red-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="border-zinc-800 bg-zinc-900">
                          <DialogHeader>
                            <DialogTitle>{t("delete")}</DialogTitle>
                            <DialogDescription>
                              {t("confirmDelete")}
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter className="gap-2">
                            <Button
                              variant="outline"
                              onClick={() => setDeleteDate(null)}
                              className="border-zinc-700"
                            >
                              {t("cancel")}
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={handleDelete}
                            >
                              {t("delete")}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
