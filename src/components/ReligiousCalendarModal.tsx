import React, { useEffect, useState } from "react";
import { X, Crown } from "lucide-react";
import { t, LangCode, isRTL, getLocale } from "../utils/i18n";
import type { ThemeTokens } from "./Onboarding";
import { getReligiousEvents, ReligiousEvent } from "../utils/religiousHelper";

interface Props {
  theme: ThemeTokens;
  isLight: boolean;
  lang: LangCode;
  tz: string;
  onClose: () => void;
}

export default function ReligiousCalendarModal({ theme, isLight, lang, tz, onClose }: Props) {
  const [events, setEvents] = useState<ReligiousEvent[]>([]);
  const [firstToday, setFirstToday] = useState<ReligiousEvent | null>(null);

  useEffect(() => {
    const ev = getReligiousEvents(tz, lang);
    setEvents(ev);
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const next = ev.find((e) => e.date >= todayStr);
    if (next) setFirstToday(next);
  }, [lang, tz]);

  const daysUntil = (e: ReligiousEvent) => {
    const d = new Date();
    const dt = new Date(Date.UTC(e.date.split("-").map(Number)[0], e.date.split("-").map(Number)[1] - 1, e.date.split("-").map(Number)[2]));
    return Math.round((dt.getTime() - new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())).getTime()) / 86400000);
  };

  const fdate = (iso: string) => {
    const [y, m, d] = iso.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    // Dini gün tarihleri Miladi'dir; fa/ar yerellerinde varsayılan takvim
    // kaymasın diye Gregoryen açıkça sabitlenir.
    return dt.toLocaleDateString(getLocale(lang), {
      day: "numeric", month: "long", year: "numeric", calendar: "gregory", timeZone: "UTC",
    });
  };

  const row = (e: ReligiousEvent) => {
    const days = daysUntil(e);
    const today = days === 0;
    const past = days < 0;
    const rowBg = past ? (isLight ? "border-black/5 bg-black/[0.02] opacity-60" : "border-white/5 bg-black/25 opacity-55")
      : today ? theme.prayerActive
      : isLight ? "border-black/10 bg-black/[0.04]" : "border-white/10 bg-black/40";
    return (
      <div key={`${e.date}-${e.nameKey}`} className={`flex items-center justify-between gap-3 rounded-xl border-2 px-3.5 py-3 mb-2 ${rowBg}`}>
        <div className="flex flex-col min-w-0">
          <div className={`font-bold text-base sm:text-lg truncate ${past ? "line-through decoration-2" : ""} ${past ? "opacity-80" : theme.textPrimary}`}>{t(e.nameKey, lang)}</div>
          <div className={`text-sm truncate ${past ? "line-through decoration-1" : ""} ${theme.textSecondary}`}>{fdate(e.date)}{e.hijriLabel ? ` · ${e.hijriLabel}` : ""}</div>
        </div>
        <div className={`shrink-0 text-right`}>
          {today ? (
            <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-black ${isLight ? "bg-black text-white" : "bg-amber-500 text-black"}`}>{t("relToday", lang)}</span>
          ) : days > 0 ? (
            <span className={`text-sm font-black tabular-nums ${theme.textSecondary}`}>{days}<span className="text-xs ml-1">{t("relDaysLeft", lang)}</span></span>
          ) : (
            <span className={`text-xs font-bold ${theme.textMuted}`}>{t("relPast", lang)}</span>
          )}
        </div>
      </div>
    );
  };

  const [year1, setYear1] = useState<ReligiousEvent[]>([]);
  const [year2, setYear2] = useState<ReligiousEvent[]>([]);
  useEffect(() => {
    setYear1(events.filter((e) => e.date.startsWith("2026")));
    setYear2(events.filter((e) => e.date.startsWith("2027")));
  }, [events]);

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto p-4 sm:p-6 bg-black/60 backdrop-blur-sm" onClick={onClose} dir={isRTL(lang) ? "rtl" : "ltr"} style={{ scrollBehavior: "auto" }}>
      <div onClick={(e) => e.stopPropagation()} className={`w-full max-w-2xl mx-auto my-auto max-h-[92dvh] overflow-y-auto rounded-3xl border-2 p-5 sm:p-8 shadow-2xl ring-2 ring-black/30 ${theme.card}`}>
        <div className="relative flex flex-col items-center gap-1 mb-5">
          <button onClick={onClose} aria-label={t("relTitle", lang)} className={`absolute right-0 top-0 p-2.5 rounded-full border transition-all cursor-pointer ${isLight ? "bg-black/10 border-black/20" : "bg-black/30 border-white/10"}`}>
            <X className="w-7 h-7" />
          </button>
          <h2 className={`font-extrabold text-2xl ${theme.textPrimary}`}>{t("relTitle", lang)}</h2>
          <div className={`text-sm font-medium ${theme.textSecondary}`}>{t("relPeriod", lang)}</div>
        </div>

        {firstToday && (
          <div className={`rounded-2xl border-2 p-4 mb-5 ${isLight ? "border-black/15 bg-black/[0.04]" : "border-white/10 bg-black/40"}`}>
            <div className={`flex items-center gap-2 mb-2`}>
              <Crown className={`w-5 h-5 ${theme.accent}`} />
              <div className={`text-base font-black uppercase tracking-widest ${theme.textPrimary}`}>{t("relNext", lang)}</div>
            </div>
            <div className={`text-xl sm:text-2xl font-black ${theme.textPrimary}`}>{t(firstToday.nameKey, lang)}</div>
            <div className={`text-base ${theme.textSecondary}`}>{fdate(firstToday.date)}{firstToday.hijriLabel ? ` · ${firstToday.hijriLabel}` : ""}</div>
          </div>
        )}

        <div className={`rounded-2xl border-2 p-4 mb-5 ${isLight ? "border-black/15 bg-black/[0.04]" : "border-white/10 bg-black/40"}`}>
          <div className={`text-base font-black uppercase tracking-widest mb-3 ${theme.textPrimary}`}>2026</div>
          {year1.length === 0 ? (
            <div className={`text-base font-medium ${theme.textSecondary}`}>{t("relEmpty", lang)}</div>
          ) : (
            year1.map(row)
          )}
        </div>

        <div className={`rounded-2xl border-2 p-4 mb-5 ${isLight ? "border-black/15 bg-black/[0.04]" : "border-white/10 bg-black/40"}`}>
          <div className={`text-base font-black uppercase tracking-widest mb-3 ${theme.textPrimary}`}>2027</div>
          {year2.length === 0 ? (
            <div className={`text-base font-medium ${theme.textSecondary}`}>{t("relEmpty", lang)}</div>
          ) : (
            year2.map(row)
          )}
        </div>

        <div className={`text-xs text-center font-medium mb-2 ${theme.textSecondary}`}>{t("relNote", lang)}</div>

        <div className="flex gap-4 mt-4">
          <button onClick={onClose} className={`flex-1 text-lg font-bold py-5 rounded-2xl border transition-all cursor-pointer ${theme.prayerActive}`}>
            {t("relTitle", lang)}
          </button>
        </div>
      </div>
    </div>
  );
}