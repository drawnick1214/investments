"use client";

import { useI18n } from "@/lib/i18n/context";

interface Props {
  startDate: string;
  endDate: string;
  onStartChange: (date: string) => void;
  onEndChange: (date: string) => void;
}

export default function DateRangePicker({
  startDate,
  endDate,
  onStartChange,
  onEndChange,
}: Props) {
  const { t } = useI18n();
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="grid grid-cols-2 gap-2">
      <div>
        <label className="mb-1 block text-[10px] text-zinc-500">
          {t("from")}
        </label>
        <input
          type="date"
          value={startDate}
          max={endDate || today}
          onChange={(e) => onStartChange(e.target.value)}
          className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-xs text-zinc-200"
          style={{ colorScheme: "dark" }}
        />
      </div>
      <div>
        <label className="mb-1 block text-[10px] text-zinc-500">
          {t("to")}
        </label>
        <input
          type="date"
          value={endDate}
          min={startDate}
          max={today}
          onChange={(e) => onEndChange(e.target.value)}
          className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-xs text-zinc-200"
          style={{ colorScheme: "dark" }}
        />
      </div>
    </div>
  );
}
