"use client";

import { useState, useEffect, useRef } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n/context";
import type { YahooSearchResult } from "@/lib/types";
import { Plus, Search, Edit3 } from "lucide-react";

function mapQuoteType(quoteType: string): string {
  switch (quoteType) {
    case "EQUITY":
      return "stock";
    case "ETF":
      return "etf";
    case "CURRENCY":
      return "forex";
    case "MUTUALFUND":
      return "fund";
    default:
      return "stock";
  }
}

interface Props {
  platform: string;
  onSelect: (instrument: {
    symbol: string;
    name: string;
    quoteType: string;
    instrumentType: string;
    exchange: string;
  }) => void;
  onManualEntry: () => void;
  excludeTickers: string[];
}

export default function InstrumentSearch({
  platform,
  onSelect,
  onManualEntry,
  excludeTickers,
}: Props) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<YahooSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    if (query.length < 1) {
      setResults([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/instruments/search?q=${encodeURIComponent(query)}`
        );
        const data = await res.json();
        setResults(
          (data.results || []).filter(
            (r: YahooSearchResult) => !excludeTickers.includes(r.symbol)
          )
        );
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, excludeTickers]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-full border-dashed border-zinc-700 text-zinc-400 hover:border-emerald-500/50 hover:text-emerald-400"
        >
          <Plus className="mr-2 h-4 w-4" />
          {t("addInstrument")}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[340px] border-zinc-700 bg-zinc-900 p-0"
        align="start"
      >
        <Command className="bg-transparent" shouldFilter={false}>
          <CommandInput
            placeholder={t("searchInstrument") + "..."}
            value={query}
            onValueChange={setQuery}
            className="border-zinc-700"
          />
          <CommandList>
            {loading && (
              <div className="py-4 text-center text-xs text-zinc-500">
                <Search className="mx-auto mb-1 h-4 w-4 animate-pulse" />
                {t("loading")}
              </div>
            )}
            {!loading && query.length > 0 && results.length === 0 && (
              <CommandEmpty className="py-4 text-center text-xs text-zinc-500">
                {t("noResults")}
              </CommandEmpty>
            )}
            {results.length > 0 && (
              <CommandGroup heading={platform.toUpperCase()}>
                {results.map((r) => (
                  <CommandItem
                    key={r.symbol}
                    value={r.symbol}
                    onSelect={() => {
                      onSelect({
                        symbol: r.symbol,
                        name: r.shortname || r.longname || r.symbol,
                        quoteType: r.quoteType,
                        instrumentType: mapQuoteType(r.quoteType),
                        exchange: r.exchange,
                      });
                      setOpen(false);
                      setQuery("");
                      setResults([]);
                    }}
                    className="cursor-pointer"
                  >
                    <div className="flex w-full items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{r.symbol}</span>
                          <Badge
                            variant="outline"
                            className="border-zinc-700 text-[9px]"
                          >
                            {mapQuoteType(r.quoteType).toUpperCase()}
                          </Badge>
                        </div>
                        <p className="truncate text-xs text-zinc-500">
                          {r.shortname || r.longname}
                        </p>
                      </div>
                      <span className="ml-2 text-[10px] text-zinc-600">
                        {r.exchange}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  onManualEntry();
                  setOpen(false);
                  setQuery("");
                }}
                className="cursor-pointer"
              >
                <Edit3 className="mr-2 h-4 w-4 text-zinc-400" />
                <span className="text-zinc-400">{t("manualEntry")}</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
