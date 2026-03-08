"use client";

import { useI18n } from "@/lib/i18n/context";

export default function LanguageToggle() {
  const { lang, setLang } = useI18n();

  return (
    <button
      onClick={() => setLang(lang === "es" ? "en" : "es")}
      className="rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-200"
    >
      {lang === "es" ? "EN" : "ES"}
    </button>
  );
}
