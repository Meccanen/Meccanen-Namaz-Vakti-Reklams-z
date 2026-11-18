import React, { useState } from "react";
import { Sparkles, Clock, BellRing, Compass, Moon, Calendar, CircleDot, ChevronRight, X } from "lucide-react";
import { t, LangCode, isRTL, getLocale } from "../utils/i18n";

export interface ThemeTokens {
  bg: string;
  card: string;
  header: string;
  accent: string;
  accent2: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  prayerActive: string;
}

interface Props {
  theme: ThemeTokens;
  isLight: boolean;
  lang: LangCode;
  onDone: () => void;
}

const STEPS = [
  { icon: Sparkles, titleKey: "onboardingWelcomeTitle", descKey: "onboardingWelcomeDesc" },
  { icon: Clock, titleKey: "onboardingTimesTitle", descKey: "onboardingTimesDesc" },
  { icon: BellRing, titleKey: "onboardingNotifyTitle", descKey: "onboardingNotifyDesc" },
  { icon: Compass, titleKey: "onboardingQiblaTitle", descKey: "onboardingQiblaDesc" },
  { icon: Moon, titleKey: "onboardingRamadanTitle", descKey: "onboardingRamadanDesc" },
  { icon: Calendar, titleKey: "onboardingRelTitle", descKey: "onboardingRelDesc" },
  { icon: CircleDot, titleKey: "onboardingReadyTitle", descKey: "onboardingReadyDesc" },
];

export default function Onboarding({ theme, isLight, lang, onDone }: Props) {
  const [step, setStep] = useState(0);
  const last = step === STEPS.length - 1;
  const S = STEPS[step];
  const Icon = S.icon;
  const btnBg = isLight ? "bg-black/10 hover:bg-black/20" : "bg-black/30 hover:bg-white/10";
  const border = isLight ? "border-black/15" : "border-white/10";

  return (
    <div className={`fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6 ${theme.bg} transition-colors duration-700`} dir={isRTL(lang) ? "rtl" : "ltr"}>
      <div className={`w-full max-w-sm rounded-3xl border p-6 sm:p-7 shadow-2xl backdrop-blur ${theme.card}`}>
        <div className="flex items-center justify-between mb-5">
          <div className="text-[13px] font-bold tracking-widest opacity-70">{step + 1} / {STEPS.length}</div>
          <button
            onClick={onDone}
            aria-label={t("onboardingSkip", lang)}
            className={`p-1.5 rounded-full border transition-all cursor-pointer ${btnBg} ${border}`}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div key={step} className="flex flex-col items-center text-center animate-fadeIn">
          <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mb-4 ${theme.prayerActive}`}>
            <Icon className={`w-8 h-8 ${theme.accent}`} />
          </div>
          <h1 className={`text-lg sm:text-xl font-extrabold mb-2 ${theme.textPrimary}`}>{t(S.titleKey, lang)}</h1>
          <p className={`text-sm leading-relaxed ${theme.textSecondary}`}>{t(S.descKey, lang)}</p>
        </div>

        <div className="flex items-center justify-center gap-1.5 mt-5">
          {STEPS.map((_, i) => (
            <span key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? `w-6 ${theme.accent} bg-current` : `w-1.5 ${isLight ? "bg-black/20" : "bg-white/25"}`}`} />
          ))}
        </div>

        <button
          onClick={() => (last ? onDone() : setStep(step + 1))}
          className={`mt-6 w-full flex items-center justify-center gap-2 font-extrabold py-3.5 rounded-2xl border transition-all cursor-pointer ${theme.prayerActive} ${isLight ? "text-black/80" : ""}`}>
          {t(last ? "onboardingStart" : "onboardingNext", lang)}
          <ChevronRight className={`w-5 h-5 ${last ? "rotate-90" : ""}`} />
        </button>
      </div>
    </div>
  );
}