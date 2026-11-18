import React, { useEffect, useRef, useState } from "react";
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";
import { RotateCcw, X, CheckCircle2 } from "lucide-react";
import { t, LangCode, isRTL, getLocale } from "../utils/i18n";
import type { ThemeTokens } from "./Onboarding";

interface Props {
  theme: ThemeTokens;
  isLight: boolean;
  lang: LangCode;
  onClose: () => void;
}

const PHRASES = [
  "dzikir_subhanallah",
  "dzikir_elhamdulillah",
  "dzikir_allahu_ekber",
  "dzikir_lailaheillallah",
  "dzikir_estagfirullah",
];
const TARGETS = [33, 99, 1000];

interface State {
  phrase: number;
  target: number;
  counts: Record<string, number>;
}

function loadState(): State {
  try {
    const s = JSON.parse(localStorage.getItem("mnv_tasbih_v2") || "null") as State | null;
    if (s && typeof s === "object") {
      return {
        phrase: Math.max(0, Math.min(PHRASES.length - 1, Number(s.phrase) || 0)),
        target: TARGETS.includes(Number(s.target)) ? Number(s.target) : 33,
        counts: s.counts && typeof s.counts === "object" ? s.counts : {},
      };
    }
  } catch { /* eslint-disable-line no-empty */ }
  return { phrase: 0, target: 33, counts: {} };
}

export default function TesbihModal({ theme, isLight, lang, onClose }: Props) {
  const [state, setState] = useState<State>(loadState);
  const [vibrate, setVibrate] = useState<boolean>(
    () => localStorage.getItem("mnv_tasbih_vibrate") !== "0"
  );
  const [flash, setFlash] = useState(false);
  const [complete, setComplete] = useState(false);
  const cancelRef = useRef(0);

  const comboKey = `${state.phrase}:${state.target}`;
  const count = state.counts[comboKey] || 0;

  useEffect(() => { localStorage.setItem("mnv_tasbih_v2", JSON.stringify(state)); }, [state]);
  useEffect(() => { localStorage.setItem("mnv_tasbih_vibrate", vibrate ? "1" : "0"); return () => window.clearTimeout(cancelRef.current); }, [vibrate]);

  const R = 70;
  const circ = 2 * Math.PI * R;
  const progress = Math.min(1, count / state.target);
  const phrase = t(PHRASES[state.phrase], lang);

  const tap = () => {
    if (vibrate) { try { void Haptics.impact({ style: ImpactStyle.Light }); } catch { /* eslint-disable-line no-empty */ } }
    setFlash(true);
    window.clearTimeout(cancelRef.current);
    cancelRef.current = window.setTimeout(() => setFlash(false), 150);
    setState((s) => ({ ...s, counts: { ...s.counts, [comboKey]: (s.counts[comboKey] || 0) + 1 } }));
    if (count + 1 >= state.target) {
      [0, 180, 360].forEach((ms) => {
        window.setTimeout(() => { try { void Haptics.impact({ style: ImpactStyle.Light }); } catch { /* eslint-disable-line no-empty */ } }, ms);
      });
      window.setTimeout(() => { try { void Haptics.vibrate({ duration: 600 }); } catch { /* eslint-disable-line no-empty */ } }, 560);
      try { void Haptics.notification({ type: NotificationType.Success }); } catch { /* eslint-disable-line no-empty */ }
      setComplete(true);
      cancelRef.current = window.setTimeout(() => setComplete(false), 3000);
    }
  };

  const reset = () => setState((s) => { const c = { ...s.counts }; delete c[comboKey]; return { ...s, counts: c }; });

  const pendingOf = (pi: number, tg: number) => {
    const c = state.counts[`${pi}:${tg}`] || 0;
    return c;
  };
  const isDone = (pi: number, tg: number) => (state.counts[`${pi}:${tg}`] || 0) >= tg;

  const chipSel = (active: boolean) =>
    `px-4 py-2.5 rounded-2xl text-base font-bold border transition-all cursor-pointer ${active ? theme.prayerActive : `${isLight ? "bg-black/5 text-black/50" : "bg-black/30 text-slate-400"} border-transparent hover:opacity-80`}`;

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto p-4 sm:p-6 bg-black/60 backdrop-blur-sm" onClick={onClose} dir={isRTL(lang) ? "rtl" : "ltr"}>
      <div onClick={(e) => e.stopPropagation()} className={`w-full max-w-lg mx-auto my-auto max-h-[92dvh] overflow-y-auto rounded-3xl border-2 p-5 sm:p-8 shadow-2xl ring-2 ring-black/30 ${theme.card}`}>
        <div className="relative flex flex-col items-center gap-1 mb-5">
          <button onClick={onClose} aria-label={t("tesbihClose", lang)} className={`absolute right-0 top-0 p-2.5 rounded-full border transition-all cursor-pointer ${isLight ? "bg-black/10 border-black/20" : "bg-black/30 border-white/10"}`}>
            <X className="w-7 h-7" />
          </button>
          <h2 className={`font-extrabold text-2xl ${theme.textPrimary}`}>{t("tesbihTitle", lang)}</h2>
        </div>

        <div className="flex justify-center mb-5">
          <button type="button" onClick={() => { setVibrate(!vibrate); if (vibrate) { try { void Haptics.impact({ style: ImpactStyle.Light }); } catch { /* eslint-disable-line no-empty */ } } }}
            className={`p-2.5 px-6 rounded-2xl border text-sm sm:text-base font-bold transition-all cursor-pointer ${vibrate ? theme.prayerActive : `${isLight ? "bg-black/5 border-black/10 text-black/40" : "bg-black/30 border-white/10 text-slate-500"}`}`}>
            {t(vibrate ? "tesbihVibrationOn" : "tesbihVibrationOff", lang)}
          </button>
        </div>

        <div className={`rounded-2xl border-2 p-4 mb-5 ${isLight ? "border-black/15 bg-black/[0.04]" : "border-white/10 bg-black/40"}`}>
          <div className="flex flex-col items-center mb-5">
            <div className={`text-lg sm:text-xl font-black uppercase tracking-widest ${theme.textPrimary}`}>{t("tesbihPhrase", lang)}</div>
            <div className={`mt-1.5 h-1.5 w-14 rounded-full ${theme.accent}`}></div>
          </div>
          <div className="flex flex-wrap justify-center gap-2.5 mb-1">
            {PHRASES.map((p, i) => {
              const pend = pendingOf(i, state.target);
              const active = i === state.phrase;
              return (
                <button key={p} onClick={() => setState((s) => ({ ...s, phrase: i }))} className={`relative ${chipSel(active)}`}>
                  {t(p, lang)}
                  {pend > 0 && !isDone(i, state.target) && (
                    <span className={`absolute -top-2 -left-2 min-w-8 h-8 px-1.5 rounded-full text-sm font-black flex items-center justify-center ${isLight ? "bg-black text-white" : "bg-amber-500 text-black"}`}>
                      {pend}
                    </span>
                  )}
                  {isDone(i, state.target) && (
                    <CheckCircle2 className={`absolute -top-2 -left-2 w-8 h-8 rounded-full bg-amber-500 text-black p-1`} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className={`h-px w-full mb-5 ${isLight ? "bg-black/20" : "bg-white/20"}`}></div>

        <div className={`rounded-2xl border-2 p-4 mb-5 ${isLight ? "border-black/15 bg-black/[0.04]" : "border-white/10 bg-black/40"}`}>
          <div className="flex flex-col items-center mb-5">
            <div className={`text-lg sm:text-xl font-black uppercase tracking-widest ${theme.textPrimary}`}>{t("tesbihTarget", lang)}</div>
            <div className={`mt-1.5 h-1.5 w-14 rounded-full ${theme.accent}`}></div>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-2.5 mb-4">
            {TARGETS.map((tg) => {
              const pend = pendingOf(state.phrase, tg);
              const active = tg === state.target;
              return (
                <button key={tg} onClick={() => setState((s) => ({ ...s, target: tg }))} className={`relative ${chipSel(active)}`}>
                  {tg}
                  {tg !== state.target && pend > 0 && !isDone(state.phrase, tg) && (
                    <span className={`absolute -top-2 -left-2 min-w-8 h-8 px-1.5 rounded-full text-sm font-black flex items-center justify-center ${isLight ? "bg-black text-white" : "bg-amber-500 text-black"}`}>
                      {pend}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <div className={`text-center text-xl font-black tabular-nums ${theme.textSecondary}`}>{count} / {state.target}</div>
        </div>

        <button
          onClick={tap}
          className={`relative w-56 h-56 sm:w-72 sm:h-72 mx-auto rounded-full flex items-center justify-center select-none cursor-pointer pointer-events-auto transition-transform ${flash ? "scale-95" : "scale-100 active:scale-95"}`}>
          <svg viewBox="0 0 160 160" className="absolute inset-0 w-full h-full -rotate-90">
            <circle cx="80" cy="80" r={R} fill="none" strokeWidth="8" className={isLight ? "stroke-black/10" : "stroke-white/10"} />
            <circle cx="80" cy="80" r={R} fill="none" strokeWidth="8" strokeLinecap="round"
              strokeDasharray={circ} strokeDashoffset={circ * (1 - progress)} className={theme.accent} />
          </svg>
          <div className={`absolute inset-0 m-auto rounded-full border-4 ${theme.prayerActive}`} style={{ width: "calc(100% - 32px)", height: "calc(100% - 32px)" }} />
          <div className={`relative rounded-full w-44 h-44 sm:w-56 sm:h-56 flex flex-col items-center justify-center border ${theme.prayerActive}`}>
            <div className={`text-5xl sm:text-7xl font-black tabular-nums ${theme.textPrimary} ${complete ? "animate-popCount" : ""}`}>{count}</div>
            <div className={`text-xl sm:text-2xl font-bold max-w-[85%] truncate ${theme.accent}`}>{phrase}</div>
          </div>
        </button>

        <div className={`text-center text-xl font-bold mt-3 h-8 ${theme.accent2} ${complete ? "opacity-100 animate-fadeIn" : "opacity-0"}`}>
          <CheckCircle2 className="inline-block w-6 h-6 mr-1.5 align-middle" />{t("tesbihComplete", lang)}
        </div>

        <div className="flex gap-4 mt-2">
          <button onClick={reset} className={`flex-1 flex items-center justify-center gap-2 text-lg font-bold py-5 rounded-2xl border transition-all cursor-pointer ${isLight ? "bg-black/10 border-black/15" : "bg-black/30 border-white/10"} ${theme.textSecondary}`}>
            <RotateCcw className="w-6 h-6" />{t("tesbihReset", lang)}
          </button>
          <button onClick={onClose} className={`flex-1 text-lg font-bold py-5 rounded-2xl border transition-all cursor-pointer ${theme.prayerActive}`}>
            {t("tesbihClose", lang)}
          </button>
        </div>
      </div>
    </div>
  );
}