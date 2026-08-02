import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  MapPin, Calendar, Sparkles, Search, Compass,
  RefreshCw, ChevronsDown, Globe, Map,
  X, Settings, Palette, Check, Plus, Trash2, Star, Coffee, Bell, BellOff, Moon, Navigation, BookOpen, Heart, Play, Square
} from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMoon as faMoonSolid, faSun, faStar } from "@fortawesome/free-solid-svg-icons";
import { fetchPrayerTimes, getPrayerTimesFallback, PrayerTime, PRAYER_METHODS } from "./utils/prayerHelper";
import { Location } from "./types";
import { TURKEY_PROVINCES, PAKISTAN_CITIES } from "./utils/weatherHelper";
import {
  NotificationSettings, DEFAULT_NOTIFICATION_SETTINGS,
  requestNotificationPermission, checkNotificationPermission,
  schedulePrayerNotifications, cancelAllNotifications,
  saveNotificationSettings, loadNotificationSettings,
  PRAYER_LABELS,
} from "./utils/notificationHelper";
import { t, detectLanguage, LangCode } from "./utils/i18n";
import { calcQiblaDirection, requestCompassPermission, attachCompassListener } from "./utils/qiblaHelper";
import { getCurrentEsmaSaati, PLANET_LABELS, SEGMENT_LABELS } from "./utils/esmaHelper";
import { calcMoonPhase, MoonPhase } from "./utils/astronomyHelper";
import { requestLocationPermission, getCurrentPosition } from "./utils/locationHelper";

export const THEMES = {
  gece: {
    label: "Gece Mavisi", preview: ["#020617","#0ea5e9","#818cf8"],
    bg: "bg-[#020617]", card: "bg-slate-900/40 border-slate-800/80",
    cardHover: "hover:border-slate-700/60", header: "border-slate-800/80",
    accent: "text-sky-400", accent2: "text-indigo-400", accent3: "text-amber-300",
    prayerActive: "bg-gradient-to-b from-amber-500/10 to-amber-500/25 border-amber-500/30 text-amber-300 ring-amber-500/20",
    clockGrad: "from-white to-slate-200", secColor: "text-sky-400",
    blob1: "bg-indigo-500/5", blob2: "bg-sky-500/5",
    textPrimary: "text-slate-100", textSecondary: "text-slate-400", textMuted: "text-slate-500",
    hijriAccent: "text-amber-400", settingsCard: "bg-slate-900/95 border-slate-700",
  },
  alacakaranlik: {
    label: "Alacakaranlık", preview: ["#1a0a2e","#e879f9","#f59e0b"],
    bg: "bg-[#1a0a2e]", card: "bg-purple-950/30 border-purple-900/30",
    cardHover: "hover:border-purple-700/40", header: "border-purple-900/40",
    accent: "text-fuchsia-400", accent2: "text-purple-400", accent3: "text-amber-300",
    prayerActive: "bg-gradient-to-b from-fuchsia-500/10 to-fuchsia-500/25 border-fuchsia-500/30 text-fuchsia-300 ring-fuchsia-500/20",
    clockGrad: "from-fuchsia-100 to-purple-200", secColor: "text-fuchsia-400",
    blob1: "bg-fuchsia-500/5", blob2: "bg-purple-500/5",
    textPrimary: "text-slate-100", textSecondary: "text-slate-400", textMuted: "text-slate-500",
    hijriAccent: "text-fuchsia-400", settingsCard: "bg-purple-950/95 border-purple-700",
  },
  orman: {
    label: "Orman Yeşili", preview: ["#051a0f","#34d399","#a3e635"],
    bg: "bg-[#051a0f]", card: "bg-emerald-950/30 border-emerald-900/30",
    cardHover: "hover:border-emerald-700/40", header: "border-emerald-900/40",
    accent: "text-emerald-400", accent2: "text-lime-400", accent3: "text-amber-300",
    prayerActive: "bg-gradient-to-b from-emerald-500/10 to-emerald-500/25 border-emerald-500/30 text-emerald-300 ring-emerald-500/20",
    clockGrad: "from-emerald-100 to-lime-200", secColor: "text-emerald-400",
    blob1: "bg-emerald-500/5", blob2: "bg-lime-500/5",
    textPrimary: "text-slate-100", textSecondary: "text-slate-400", textMuted: "text-slate-500",
    hijriAccent: "text-lime-400", settingsCard: "bg-emerald-950/95 border-emerald-700",
  },
  altin: {
    label: "Altın Çöl", preview: ["#160d00","#f59e0b","#fb923c"],
    bg: "bg-[#160d00]", card: "bg-amber-950/30 border-amber-900/30",
    cardHover: "hover:border-amber-700/40", header: "border-amber-900/40",
    accent: "text-amber-400", accent2: "text-orange-400", accent3: "text-yellow-300",
    prayerActive: "bg-gradient-to-b from-amber-500/10 to-amber-500/25 border-amber-500/30 text-amber-300 ring-amber-500/20",
    clockGrad: "from-amber-100 to-orange-200", secColor: "text-amber-400",
    blob1: "bg-amber-500/5", blob2: "bg-orange-500/5",
    textPrimary: "text-slate-100", textSecondary: "text-slate-400", textMuted: "text-slate-500",
    hijriAccent: "text-orange-400", settingsCard: "bg-amber-950/95 border-amber-700",
  },
  ramazan: {
    label: "Ramazan", preview: ["#0d0a1a","#c084fc","#fde68a"],
    bg: "bg-[#0d0a1a]", card: "bg-violet-950/30 border-violet-900/30",
    cardHover: "hover:border-violet-700/40", header: "border-violet-900/40",
    accent: "text-violet-300", accent2: "text-yellow-300", accent3: "text-rose-300",
    prayerActive: "bg-gradient-to-b from-violet-500/10 to-violet-500/25 border-violet-500/30 text-violet-200 ring-violet-500/20",
    clockGrad: "from-violet-100 to-yellow-200", secColor: "text-violet-300",
    blob1: "bg-violet-500/5", blob2: "bg-yellow-500/5",
    textPrimary: "text-slate-100", textSecondary: "text-slate-400", textMuted: "text-slate-500",
    hijriAccent: "text-yellow-300", settingsCard: "bg-violet-950/95 border-violet-800",
  },
  kabe: {
    label: "Kâbe", preview: ["#0a0a0a","#d4af37","#ffffff"],
    bg: "bg-[#0a0a0a]", card: "bg-neutral-900/60 border-neutral-800/60",
    cardHover: "hover:border-neutral-700/50", header: "border-neutral-800/60",
    accent: "text-yellow-500", accent2: "text-yellow-300", accent3: "text-white",
    prayerActive: "bg-gradient-to-b from-yellow-500/10 to-yellow-500/20 border-yellow-500/30 text-yellow-300 ring-yellow-500/20",
    clockGrad: "from-yellow-200 to-white", secColor: "text-yellow-500",
    blob1: "bg-yellow-500/3", blob2: "bg-white/3",
    textPrimary: "text-slate-100", textSecondary: "text-slate-400", textMuted: "text-slate-500",
    hijriAccent: "text-yellow-400", settingsCard: "bg-neutral-900/95 border-neutral-700",
  },
  turkuaz: {
    label: "Turkuaz Deniz", preview: ["#010f14","#06b6d4","#67e8f9"],
    bg: "bg-[#010f14]", card: "bg-cyan-950/30 border-cyan-900/30",
    cardHover: "hover:border-cyan-700/40", header: "border-cyan-900/40",
    accent: "text-cyan-400", accent2: "text-teal-400", accent3: "text-sky-200",
    prayerActive: "bg-gradient-to-b from-cyan-500/10 to-cyan-500/25 border-cyan-500/30 text-cyan-300 ring-cyan-500/20",
    clockGrad: "from-cyan-100 to-teal-200", secColor: "text-cyan-400",
    blob1: "bg-cyan-500/5", blob2: "bg-teal-500/5",
    textPrimary: "text-slate-100", textSecondary: "text-slate-400", textMuted: "text-slate-500",
    hijriAccent: "text-teal-400", settingsCard: "bg-cyan-950/95 border-cyan-800",
  },
  bordo: {
    label: "Bordo Kadife", preview: ["#1a0008","#f43f5e","#fda4af"],
    bg: "bg-[#1a0008]", card: "bg-rose-950/30 border-rose-900/30",
    cardHover: "hover:border-rose-700/40", header: "border-rose-900/40",
    accent: "text-rose-400", accent2: "text-pink-400", accent3: "text-orange-300",
    prayerActive: "bg-gradient-to-b from-rose-500/10 to-rose-500/25 border-rose-500/30 text-rose-300 ring-rose-500/20",
    clockGrad: "from-rose-100 to-pink-200", secColor: "text-rose-400",
    blob1: "bg-rose-500/5", blob2: "bg-pink-500/5",
    textPrimary: "text-slate-100", textSecondary: "text-slate-400", textMuted: "text-slate-500",
    hijriAccent: "text-pink-400", settingsCard: "bg-rose-950/95 border-rose-800",
  },
  gunes: {
    label: "Gün Batımı", preview: ["#1a0d00","#f97316","#fbbf24"],
    bg: "bg-[#1a0d00]", card: "bg-orange-950/30 border-orange-900/30",
    cardHover: "hover:border-orange-700/40", header: "border-orange-900/40",
    accent: "text-orange-400", accent2: "text-amber-300", accent3: "text-yellow-200",
    prayerActive: "bg-gradient-to-b from-orange-500/10 to-orange-500/25 border-orange-500/30 text-orange-300 ring-orange-500/20",
    clockGrad: "from-orange-100 to-amber-200", secColor: "text-orange-400",
    blob1: "bg-orange-500/5", blob2: "bg-amber-500/5",
    textPrimary: "text-slate-100", textSecondary: "text-slate-400", textMuted: "text-slate-500",
    hijriAccent: "text-amber-300", settingsCard: "bg-orange-950/95 border-orange-800",
  },
  safir: {
    label: "Safir Gece", preview: ["#00051a","#3b82f6","#a5b4fc"],
    bg: "bg-[#00051a]", card: "bg-blue-950/30 border-blue-900/30",
    cardHover: "hover:border-blue-700/40", header: "border-blue-900/40",
    accent: "text-blue-400", accent2: "text-indigo-300", accent3: "text-sky-200",
    prayerActive: "bg-gradient-to-b from-blue-500/10 to-blue-500/25 border-blue-500/30 text-blue-300 ring-blue-500/20",
    clockGrad: "from-blue-100 to-indigo-200", secColor: "text-blue-400",
    blob1: "bg-blue-500/5", blob2: "bg-indigo-500/5",
    textPrimary: "text-slate-100", textSecondary: "text-slate-400", textMuted: "text-slate-500",
    hijriAccent: "text-indigo-300", settingsCard: "bg-blue-950/95 border-blue-800",
  },
  seher: {
    label: "Beyaz Seher", preview: ["#fefce8","#d97706","#92400e"],
    bg: "bg-[#fefce8]", card: "bg-white/70 border-amber-200/80",
    cardHover: "hover:border-amber-300/60", header: "border-amber-200/60",
    accent: "text-amber-700", accent2: "text-orange-600", accent3: "text-amber-900",
    prayerActive: "bg-gradient-to-b from-amber-400/20 to-amber-400/35 border-amber-500/40 text-amber-800 ring-amber-400/30",
    clockGrad: "from-amber-900 to-orange-800", secColor: "text-amber-600",
    blob1: "bg-amber-300/20", blob2: "bg-orange-200/20",
    textPrimary: "text-amber-950", textSecondary: "text-amber-800", textMuted: "text-amber-600",
    hijriAccent: "text-orange-700", settingsCard: "bg-white/98 border-amber-200",
  },
  gul: {
    label: "Gül Bahçesi", preview: ["#fff1f2","#e11d48","#9f1239"],
    bg: "bg-[#fff1f2]", card: "bg-white/70 border-rose-200/80",
    cardHover: "hover:border-rose-300/60", header: "border-rose-200/60",
    accent: "text-rose-600", accent2: "text-pink-600", accent3: "text-rose-800",
    prayerActive: "bg-gradient-to-b from-rose-400/20 to-rose-400/35 border-rose-500/40 text-rose-700 ring-rose-400/30",
    clockGrad: "from-rose-900 to-pink-800", secColor: "text-rose-500",
    blob1: "bg-rose-300/20", blob2: "bg-pink-200/20",
    textPrimary: "text-rose-950", textSecondary: "text-rose-700", textMuted: "text-rose-500",
    hijriAccent: "text-rose-700", settingsCard: "bg-white/98 border-rose-200",
  },
  nane: {
    label: "Nane Yeşili", preview: ["#f0fdf4","#16a34a","#14532d"],
    bg: "bg-[#f0fdf4]", card: "bg-white/70 border-green-200/80",
    cardHover: "hover:border-green-300/60", header: "border-green-200/60",
    accent: "text-green-700", accent2: "text-emerald-600", accent3: "text-green-900",
    prayerActive: "bg-gradient-to-b from-green-400/20 to-green-400/35 border-green-500/40 text-green-800 ring-green-400/30",
    clockGrad: "from-green-900 to-emerald-800", secColor: "text-green-600",
    blob1: "bg-green-300/20", blob2: "bg-emerald-200/20",
    textPrimary: "text-green-950", textSecondary: "text-green-700", textMuted: "text-green-500",
    hijriAccent: "text-emerald-700", settingsCard: "bg-white/98 border-green-200",
  },
};
export type ThemeKey = keyof typeof THEMES;

function guessTimezone(lng: number): string {
  const offset = Math.round(lng / 15);
  const MAP: Record<string, string> = {
    "-12":"Etc/GMT+12","-11":"Pacific/Midway","-10":"Pacific/Honolulu","-9":"America/Anchorage",
    "-8":"America/Los_Angeles","-7":"America/Denver","-6":"America/Chicago","-5":"America/New_York",
    "-4":"America/Halifax","-3":"America/Sao_Paulo","-2":"Atlantic/South_Georgia","-1":"Atlantic/Azores",
    "0":"Europe/London","1":"Europe/Berlin","2":"Europe/Helsinki","3":"Europe/Istanbul",
    "4":"Asia/Dubai","5":"Asia/Karachi","6":"Asia/Dhaka","7":"Asia/Bangkok",
    "8":"Asia/Singapore","9":"Asia/Tokyo","10":"Australia/Sydney","11":"Pacific/Noumea","12":"Pacific/Auckland",
  };
  return MAP[String(offset)] || "Europe/London";
}

const APP_VERSION = "1.0.22";

const DEFAULT_LOCATION: Location = {
  name: "İstanbul", country: "Türkiye",
  latitude: 41.0082, longitude: 28.9784,
  timezone: "Europe/Istanbul", admin1: "Marmara"
};

  const MOON_PHASE_ICONS: Record<MoonPhase, React.ReactNode> = {
  newMoon: <FontAwesomeIcon icon={faMoonSolid} />, waxingCrescent: <FontAwesomeIcon icon={faMoonSolid} />, firstQuarter: <FontAwesomeIcon icon={faMoonSolid} />,
  waxingGibbous: <FontAwesomeIcon icon={faMoonSolid} />, fullMoon: <FontAwesomeIcon icon={faMoonSolid} />, waningGibbous: <FontAwesomeIcon icon={faMoonSolid} />,
  thirdQuarter: <FontAwesomeIcon icon={faMoonSolid} />, waningCrescent: <FontAwesomeIcon icon={faMoonSolid} />,
};

function ThemePreviewCard({ themeKey }: { themeKey: ThemeKey }) {
  const th = THEMES[themeKey];
  const isLight = ["seher","gul","nane"].includes(themeKey);
  const prayers = [
    { name:"İmsak", time:"04:32" }, { name:"Güneş", time:"06:10" }, { name:"Öğle", time:"13:15" },
    { name:"İkindi", time:"17:02" }, { name:"Akşam", time:"20:18" }, { name:"Yatsı", time:"22:01" },
  ];
  const activeIdx = 4;
  const bg0 = th.preview[0];
  const acc = th.preview[1];
  const acc2 = th.preview[2];
  const txtPrimary = isLight ? "#1a0a00" : "rgba(255,255,255,0.92)";
  const txtSecondary = isLight ? acc : "rgba(255,255,255,0.55)";
  const txtMuted = isLight ? acc + "99" : "rgba(255,255,255,0.30)";
  const cardBg = isLight ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.05)";
  const cardBorder = isLight ? acc + "30" : "rgba(255,255,255,0.08)";
  const activeBg = acc + "33";
  const activeBorder = acc + "77";
  const divider = isLight ? acc + "25" : "rgba(255,255,255,0.07)";
  const blob1 = acc + "12";
  const blob2 = acc2 + "10";
  const RENDER_W = 340;
  const SCALE = 0.50;
  const DISPLAY_W = RENDER_W * SCALE;
  const RENDER_H = 420;
  const DISPLAY_H = RENDER_H * SCALE;

  return (
    <div style={{ width: DISPLAY_W, height: DISPLAY_H, overflow: "hidden", borderRadius: 14, margin: "0 auto", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
      <div style={{
        width: RENDER_W, height: RENDER_H,
        transform: `scale(${SCALE})`, transformOrigin: "top left",
        background: bg0, position: "relative", overflow: "hidden",
        borderRadius: 28, padding: 16, display: "flex", flexDirection: "column", gap: 10,
      }}>
        <div style={{ position:"absolute", top:"-20%", left:"-10%", width:200, height:200, background:blob1, borderRadius:"50%", filter:"blur(60px)", pointerEvents:"none" }} />
        <div style={{ position:"absolute", bottom:"-20%", right:"-10%", width:220, height:220, background:blob2, borderRadius:"50%", filter:"blur(70px)", pointerEvents:"none" }} />
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", borderBottom:`1px solid ${divider}`, paddingBottom:8, position:"relative", zIndex:1 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <div style={{ width:22, height:22, borderRadius:8, background:acc+"22", border:`1px solid ${acc}44`, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <div style={{ width:10, height:10, borderRadius:3, border:`1.5px solid ${acc}`, opacity:0.8 }} />
            </div>
            <div>
              <div style={{ fontSize:8, fontWeight:900, color:txtPrimary, lineHeight:1.2 }}>Meccanen Namaz Vakti</div>
              <div style={{ fontSize:6, color:txtMuted }}>Reklamsız</div>
            </div>
          </div>
          <div style={{ fontSize:7, fontWeight:700, color:acc, background:acc+"18", border:`1px solid ${acc}33`, padding:"2px 6px", borderRadius:20 }}>İstanbul</div>
        </div>
        <div style={{ background:cardBg, border:`1px solid ${cardBorder}`, borderRadius:18, padding:"10px 12px", position:"relative", zIndex:1 }}>
          <div style={{ textAlign:"center", marginBottom:6 }}>
            <div style={{ display:"flex", alignItems:"baseline", justifyContent:"center", gap:3 }}>
              <span style={{ fontSize:28, fontWeight:800, fontFamily:"monospace", color:txtPrimary, lineHeight:1 }}>20:18</span>
              <span style={{ fontSize:14, fontWeight:300, color:acc, lineHeight:1 }}>:45</span>
            </div>
            <div style={{ fontSize:7, color:txtSecondary, marginTop:2 }}>Cuma</div>
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", borderTop:`1px solid ${divider}`, paddingTop:7, marginTop:4 }}>
            <div>
              <div style={{ fontSize:6, fontWeight:900, textTransform:"uppercase", letterSpacing:1, color:acc2, marginBottom:2 }}>Miladi</div>
              <div style={{ fontSize:16, fontWeight:900, color:txtPrimary, lineHeight:1 }}>11</div>
              <div style={{ fontSize:6, color:txtSecondary, marginTop:1 }}>Haziran 2026</div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:6, fontWeight:900, textTransform:"uppercase", letterSpacing:1, color:acc, marginBottom:2 }}>Hicri</div>
              <div style={{ fontSize:16, fontWeight:900, color:acc, lineHeight:1 }}>14</div>
              <div style={{ fontSize:6, color:txtSecondary, marginTop:1 }}>Zilhicce (1447 AH)</div>
            </div>
          </div>
        </div>
        <div style={{ background:cardBg, border:`1px solid ${cardBorder}`, borderRadius:18, padding:"10px 12px", position:"relative", zIndex:1 }}>
          <div style={{ fontSize:6, fontWeight:900, textTransform:"uppercase", letterSpacing:1, color:acc, marginBottom:7, display:"flex", alignItems:"center", gap:3 }}>
            <FontAwesomeIcon icon={faStar} style={{ color:"#f59e0b" }} /> Diyanet Vakitleri
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:4 }}>
            {prayers.map(({ name, time }, i) => (
              <div key={name} style={{
                display:"flex", flexDirection:"column", alignItems:"center",
                padding:"5px 3px", borderRadius:10,
                background: i === activeIdx ? activeBg : "rgba(0,0,0,0.12)",
                border: `1.5px solid ${i === activeIdx ? activeBorder : "transparent"}`,
              }}>
                <div style={{ fontSize:6, fontWeight:900, textTransform:"uppercase", letterSpacing:0.5, marginBottom:3,
                  color: i === activeIdx ? acc : txtMuted }}>{name}</div>
                <div style={{ fontSize:9, fontFamily:"monospace", fontWeight:700,
                  color: i === activeIdx ? acc : txtSecondary }}>{time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function LocationPermissionPrompt({ onAllow, onDeny, lang }: {
  onAllow: () => void;
  onDeny: () => void;
  lang: LangCode;
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" onClick={onDeny}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
      <div className="relative w-full max-w-sm rounded-[28px] border border-white/10 bg-slate-900/98 p-6 shadow-2xl text-center" onClick={e => e.stopPropagation()}>
        <Navigation className="w-10 h-10 text-sky-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-100 mb-2">{t("locationPermission", lang)}</h3>
        <p className="text-sm text-slate-400 mb-5 leading-relaxed">{t("locationPermissionDesc", lang)}</p>
        <div className="flex gap-3">
          <button onClick={onDeny}
            className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-300 font-semibold text-sm hover:bg-white/5 transition-all cursor-pointer">
            {t("deny", lang)}
          </button>
          <button onClick={onAllow}
            className="flex-1 py-2.5 rounded-xl bg-sky-500 text-white font-semibold text-sm hover:bg-sky-400 transition-all cursor-pointer">
            {t("allow", lang)}
          </button>
        </div>
      </div>
    </div>
  );
}

function SettingsPanel({
  theme, setTheme, location, setLocation,
  savedLocations, setSavedLocations,
  prayerMethod, setPrayerMethod,
  onClose, t: th,
  notificationSettings, setNotificationSettings,
  prayerTimes,
  lang, setLang,
  onFindLocation,
  isDetectingLocation,
  autoLocationEnabled,
  onToggleAutoLocation,
  initialTab,
}: {
  theme: ThemeKey; setTheme: (k: ThemeKey) => void;
  location: Location; setLocation: (l: Location) => void;
  savedLocations: Location[]; setSavedLocations: (locs: Location[]) => void;
  prayerMethod: number; setPrayerMethod: (m: number) => void;
  onClose: () => void; t: typeof THEMES[ThemeKey];
  notificationSettings: NotificationSettings;
  setNotificationSettings: (s: NotificationSettings) => void;
  prayerTimes: { key: string; name: string; time: string }[];
  lang: LangCode; setLang: (l: LangCode) => void;
  onFindLocation: () => void;
  isDetectingLocation: boolean;
  autoLocationEnabled: boolean;
  onToggleAutoLocation: (val: boolean) => void;
  initialTab?: "genel"|"konum"|"metot"|"bildirim"|"dil"|"hakkinda";
}) {
  const [tab, setTab] = useState<"genel"|"konum"|"metot"|"bildirim"|"dil"|"hakkinda">(initialTab || "genel");
  const [playingEzanPreview, setPlayingEzanPreview] = useState<string | null>(null);
  const ezanPreviewAudioRef = useRef<HTMLAudioElement | null>(null);

  const toggleEzanPreview = (prayerKey: string) => {
    const current = ezanPreviewAudioRef.current;
    if (current) {
      current.pause();
      current.currentTime = 0;
      ezanPreviewAudioRef.current = null;
    }
    if (playingEzanPreview === prayerKey) {
      setPlayingEzanPreview(null);
      return;
    }
    const audio = new Audio(`/sounds/ezan_${prayerKey}.mp3`);
    audio.onended = () => setPlayingEzanPreview(null);
    audio.onerror = () => setPlayingEzanPreview(null);
    ezanPreviewAudioRef.current = audio;
    audio.play().catch(() => setPlayingEzanPreview(null));
    setPlayingEzanPreview(prayerKey);
  };

  useEffect(() => {
    return () => { ezanPreviewAudioRef.current?.pause(); };
  }, []);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Location[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [notification, setNotification] = useState("");
  const MAX_LOCATIONS = 33;

  const notify = (msg: string) => { setNotification(msg); setTimeout(() => setNotification(""), 3000); };

  const performSearch = async () => {
    const q = searchQuery.trim();
    if (!q) return;
    setIsSearching(true); setSearchError(""); setSearchResults([]);
    try {
      // Open-meteo geocoding API UR (Urduca) desteklemiyor → UR için AR kullan
      const apiLang = lang === "ur" ? "ar" : lang;
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=6&language=${apiLang}`);
      const data = await res.json();
      if (data.results?.length) {
        setSearchResults(data.results.map((r: any) => ({
          name: r.name, country: r.country || t("unknown", lang),
          latitude: r.latitude, longitude: r.longitude,
          timezone: r.timezone && r.timezone !== "GMT" && r.timezone !== "UTC"
            ? r.timezone : guessTimezone(r.longitude),
          admin1: r.admin1 || ""
        })));
      } else setSearchError(t("noResults", lang));
    } catch { setSearchError(t("searchError", lang)); }
    finally { setIsSearching(false); }
  };

  const addAndSelectCity = (loc: Location) => {
    const exists = savedLocations.some(l =>
      l.latitude.toFixed(2) === loc.latitude.toFixed(2) &&
      l.longitude.toFixed(2) === loc.longitude.toFixed(2)
    );
    if (!exists && savedLocations.length >= MAX_LOCATIONS) {
      notify(t("maxLocations", lang, { n: String(MAX_LOCATIONS) }));
      return;
    }
    const newList = exists ? savedLocations : [...savedLocations, loc];
    setSavedLocations(newList);
    setLocation(loc);
    // Manuel şehir seçilince otomatik konum takibini kapat.
    localStorage.setItem("mnv_auto_location", "false");
    setAutoLocationEnabled(false);
    setSearchResults([]); setSearchQuery("");
    notify(t("citySelected", lang, { city: loc.name, country: loc.country }));
  };

  const selectSaved = (loc: Location) => { setLocation(loc); notify(t("citySelected", lang, { city: loc.name, country: loc.country })); };

  const deleteSaved = (idx: number) => {
    const next = savedLocations.filter((_, i) => i !== idx);
    setSavedLocations(next);
    if (location.latitude === savedLocations[idx].latitude) setLocation(next[0] || DEFAULT_LOCATION);
  };

  const selectProvince = (name: string) => {
    const p = TURKEY_PROVINCES.find(x => x.name === name);
    if (!p) return;
    addAndSelectCity({ name: p.name, country: "Türkiye", latitude: p.latitude, longitude: p.longitude, timezone: "Europe/Istanbul", admin1: "Türkiye" });
  };

  const selectPakistanCity = (id: number) => {
    const p = PAKISTAN_CITIES.find(x => x.id === id);
    if (!p) return;
    addAndSelectCity({ name: p.urdu, country: "پاکستان", latitude: p.latitude, longitude: p.longitude, timezone: "Asia/Karachi", admin1: "Pakistan" });
  };

  const handleThemeClick = (key: ThemeKey) => {
    const th = THEMES[key];
    setTheme(key);
    notify(t(`theme_${key}`, lang));
  };

  const LANGUAGES: { code: LangCode; label: string }[] = [
    { code: "tr", label: "Türkçe" },
    { code: "en", label: "English" },
    { code: "ar", label: "العربية" },
    { code: "de", label: "Deutsch" },
    { code: "ur", label: "اردو" },
  ];

  const tabs = [
    { key: "genel" as const, label: t("general", lang) },
    { key: "konum" as const, label: t("location", lang) },
    { key: "metot" as const, label: t("methodTab", lang) },
    { key: "bildirim" as const, label: t("notifications", lang) },
    { key: "dil" as const, label: t("language", lang) },
    { key: "hakkinda" as const, label: t("about", lang) },
  ];
  type TabKey = "genel" | "konum" | "metot" | "bildirim" | "dil" | "hakkinda";

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-4 px-3 pb-3 sm:pt-8 sm:px-4" onClick={onClose}>
        <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
        <div
          className={`relative w-full max-w-lg max-h-[92vh] overflow-hidden rounded-[28px] border shadow-2xl flex flex-col glass-strong ${th.settingsCard}`}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex justify-between items-center px-6 pt-5 pb-3 shrink-0">
            <div className="flex items-center gap-3">
              <span className={`text-xl sm:text-2xl font-extrabold tracking-widest ${th.accent}`}>MECCANEN</span>
              <span className={`text-base sm:text-lg font-bold ${th.textSecondary} opacity-60`}>·</span>
              <h2 className={`text-base sm:text-lg font-bold ${th.accent}`}>{t("settings", lang)}</h2>
            </div>
            <button onClick={onClose} className="p-2.5 rounded-full hover:bg-white/10 transition-all cursor-pointer">
              <X className="w-6 h-6 text-slate-400" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 px-4 sm:px-6 pb-3 shrink-0">
            {tabs.map(tb => (
              <button key={tb.key} onClick={() => setTab(tb.key)}
                className={`px-2 py-3.5 rounded-2xl text-base sm:text-lg font-extrabold transition-all duration-200 cursor-pointer text-center leading-tight border-2 ${tab === tb.key ? `${th.accent} border-current bg-white/15 shadow-md` : `border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-slate-100`}`}>
                {tb.label}
              </button>
            ))}
          </div>

          <div className="overflow-y-auto flex-1 min-h-0 px-6 pb-6">

            {tab === "genel" && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold tracking-wide text-slate-400 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5" />{t("themeSelection", lang)}
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.entries(THEMES) as [ThemeKey, typeof THEMES[ThemeKey]][]).map(([key, th]) => {
                    const isActive = theme === key;
                    return (
                      <button key={key} onClick={() => handleThemeClick(key)}
                        className={`relative flex items-center gap-2.5 p-3 rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden
                          ${isActive ? "border-white/30 bg-white/10" : "border-white/5 bg-white/5 hover:bg-white/10"}`}>
                        <div className="flex gap-0.5 shrink-0">
                          {th.preview.map((c, i) => <div key={i} className="w-3.5 h-3.5 rounded-full ring-1 ring-white/10" style={{ backgroundColor: c }} />)}
                        </div>
                        <span className="text-sm font-bold text-slate-200 leading-tight">{t(`theme_${key}`, lang)}</span>
                        {isActive && <Check className="w-3.5 h-3.5 text-white absolute right-2.5 top-1/2 -translate-y-1/2" />}
                      </button>
                    );
                  })}
                </div>

                <div className={`border-t ${th.header} pt-4 flex gap-2`}>
                  <a
                    href="https://ko-fi.com/meccanen"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 text-amber-400 font-semibold text-sm hover:bg-amber-500/20 transition-all duration-200 cursor-pointer"
                  >
                    <Coffee className="w-4 h-4" />
                    Ko-fi
                  </a>
                  <a
                    href="https://paypal.me/bulentt"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border border-sky-500/20 bg-sky-500/10 text-sky-400 font-semibold text-sm hover:bg-sky-500/20 transition-all duration-200 cursor-pointer"
                  >
                    <Heart className="w-4 h-4" />
                    PayPal
                  </a>
                </div>
              </div>
            )}

            {tab === "dil" && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold tracking-wide text-slate-400 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" />{t("language", lang)}
                </h3>
                <div className="grid grid-cols-2 gap-2.5">
                  {LANGUAGES.map(l => (
                    <button key={l.code} onClick={() => setLang(l.code)}
                      className={`py-4 rounded-2xl border-2 text-lg font-bold transition-all duration-200 cursor-pointer ${lang === l.code ? "border-current bg-white/15 text-slate-100 shadow-md" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"}`}>
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {tab === "konum" && (
              <div className="space-y-4">
                {/* Otomatik konum toggle — her zaman görünür, tıklanınca açılır/kapanır */}
                <div className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${autoLocationEnabled ? "bg-sky-500/10 border-sky-500/20" : "bg-white/5 border-white/5"}`}>
                  <div className="flex items-center gap-2">
                    <Navigation className={`w-4 h-4 shrink-0 ${autoLocationEnabled ? "text-sky-400" : "text-slate-500"}`} />
                    <div>
                      <div className={`text-xs font-bold ${autoLocationEnabled ? "text-sky-400" : "text-slate-400"}`}>
                        {t("autoLocationToggleLabel", lang)}
                      </div>
                      <div className="text-sm text-slate-500">
                        {autoLocationEnabled ? t("autoLocationDesc", lang) : t("autoLocationOffDesc", lang)}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => {
                    const next = !autoLocationEnabled;
                    localStorage.setItem("mnv_auto_location", String(next));
                    onToggleAutoLocation(next);
                  }}
                    className={`relative w-12 h-6 rounded-full transition-all duration-300 cursor-pointer border-2 shrink-0 ${autoLocationEnabled ? "bg-sky-500 border-sky-400" : "bg-slate-700 border-slate-600 hover:border-slate-500"}`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${autoLocationEnabled ? "left-6" : "left-0.5"}`} />
                  </button>
                </div>

                <button onClick={onFindLocation} disabled={isDetectingLocation}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-sky-500/30 bg-sky-500/10 text-sky-400 font-bold text-sm hover:bg-sky-500/20 transition-all duration-200 cursor-pointer">
                  <Navigation className={`w-4 h-4 ${isDetectingLocation ? "animate-spin" : ""}`} />
                  {isDetectingLocation ? t("detecting", lang) : t("findMyLocation", lang)}
                </button>

                {savedLocations.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold tracking-wide text-slate-400 flex items-center gap-1.5 mb-2">
                      <Star className="w-3.5 h-3.5" />{t("location", lang)} ({savedLocations.length}/{MAX_LOCATIONS})
                    </h3>
                    <div className="space-y-1.5">
                      {savedLocations.map((loc, idx) => {
                        const isActive = location.latitude.toFixed(3) === loc.latitude.toFixed(3);
                        return (
                          <div key={idx} className={`flex items-center gap-2 p-3 rounded-2xl border transition-all duration-200 ${isActive ? "bg-white/10 border-white/20" : "bg-black/20 border-white/5"}`}>
                            <button onClick={() => selectSaved(loc)} className="flex-1 text-left cursor-pointer">
                              <div className="flex items-center gap-2">
                                {isActive && <div className={`w-2 h-2 rounded-full ${th.accent.replace("text-","bg-")} shrink-0`} />}
                                <span className={`text-sm font-bold ${isActive ? th.accent : "text-slate-200"}`}>{loc.name}</span>
                                <span className="text-sm text-slate-500">{loc.country}</span>
                              </div>
                              <div className="text-sm text-slate-600 font-mono mt-0.5">{loc.latitude.toFixed(2)}°N {loc.longitude.toFixed(2)}°E</div>
                            </button>
                            <button onClick={() => deleteSaved(idx)} className="p-1.5 text-slate-600 hover:text-red-400 transition-all cursor-pointer shrink-0">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-bold tracking-wide text-slate-400 flex items-center gap-1.5 mb-2">
                    <Search className="w-3.5 h-3.5" />{t("searchCity", lang)}
                  </h3>
                  <div className="relative mb-2">
                    <input type="text" value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && performSearch()}
                      placeholder={t("searchCity", lang)}
                      className="w-full bg-black/30 border border-white/10 focus:border-white/30 focus:ring-1 focus:ring-white/20 rounded-2xl pl-10 pr-20 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none transition-all duration-200" />
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <button onClick={performSearch} disabled={isSearching}
                      className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 rounded-xl text-xs font-extrabold uppercase cursor-pointer disabled:opacity-50 text-slate-900 bg-white/80">
                      {isSearching ? t("updating", lang) : t("search", lang)}
                    </button>
                  </div>
                  {searchResults.length > 0 && (
                    <div className="bg-black/40 border border-white/10 rounded-2xl p-2 max-h-44 overflow-y-auto space-y-1 mb-2">
                      {searchResults.map((r, i) => (
                        <button key={i} onClick={() => addAndSelectCity(r)}
                          className="w-full hover:bg-white/10 rounded-xl p-2.5 text-left text-sm text-slate-300 flex justify-between items-center transition-all cursor-pointer">
                          <div>
                            <span className="font-bold text-slate-100">{r.name}</span>
                            {r.admin1 && <span className="text-slate-500 ml-1.5 text-sm">({r.admin1})</span>}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${th.accent} bg-white/5 border border-white/10`}>{r.country}</span>
                            <Plus className="w-3.5 h-3.5 text-slate-500" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {searchError && <p className="text-sm text-amber-500 mb-2">{searchError}</p>}
                  {lang === "tr" && (
                  <div>
                    <label className="text-sm text-slate-500 font-bold uppercase tracking-wide flex items-center gap-1 mb-1.5">
                      <Map className="w-3 h-3" />{t("turkeyProvinces", lang)}
                    </label>
                    <div className="relative">
                      <select onChange={e => { if (e.target.value) { selectProvince(e.target.value); e.target.value = ""; } }}
                        className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none cursor-pointer appearance-none">
                        <option value="">{t("select", lang)}</option>
                        {TURKEY_PROVINCES.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                      </select>
                      <ChevronsDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                    </div>
                  </div>
                  )}
                  {lang === "ur" && (
                  <div dir="rtl">
                    <label className="text-sm text-slate-500 font-bold uppercase tracking-wide flex items-center gap-1 mb-1.5">
                      <Map className="w-3 h-3" />{t("pakistanCities", lang)}
                    </label>
                    <div className="relative">
                      <select onChange={e => { if (e.target.value) { selectPakistanCity(Number(e.target.value)); e.target.value = ""; } }}
                        className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none cursor-pointer appearance-none"
                        dir="rtl">
                        <option value="">{t("select", lang)}</option>
                        {PAKISTAN_CITIES.map(p => <option key={p.id} value={p.id}>{p.urdu}</option>)}
                      </select>
                      <ChevronsDown className="absolute left-3 right-auto top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                    </div>
                  </div>
                  )}
                </div>
              </div>
            )}

            {tab === "metot" && (
              <div className="space-y-2">
                <h3 className="text-sm font-bold tracking-wide text-slate-400 flex items-center gap-1.5 mb-3">
                  <Sparkles className="w-3.5 h-3.5" />{t("prayerMethod", lang)}
                </h3>
                {PRAYER_METHODS.map(m => (
                  <button key={m.id} onClick={() => setPrayerMethod(m.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all duration-200 cursor-pointer text-left ${prayerMethod === m.id ? "border-white/30 bg-white/10" : "border-white/5 bg-white/5 hover:bg-white/10"}`}>
                    <div>
                      <div className={`text-xs font-bold ${th.textPrimary}`}>{m.label[lang] || m.label.en}</div>
                      <div className={`text-sm ${th.textMuted} mt-0.5`}>{m.description[lang] || m.description.en}</div>
                    </div>
                    {prayerMethod === m.id && <Check className={`w-4 h-4 ${th.accent} shrink-0 ml-2`} />}
                  </button>
                ))}
              </div>
            )}

            {tab === "bildirim" && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold tracking-wide text-slate-400 flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5" />{t("notificationHeader", lang)}
                </h3>
                <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-200 ${notificationSettings.enabled ? "border-amber-500/30 bg-amber-500/10" : "border-white/5 bg-white/5 hover:bg-white/10"}`}>
                  <div className="flex items-center gap-3">
                    {notificationSettings.enabled ? <Bell className="w-5 h-5 text-amber-400" /> : <BellOff className="w-5 h-5 text-slate-500" />}
                    <div>
                      <div className={`text-sm font-bold ${notificationSettings.enabled ? "text-amber-400" : "text-slate-300"}`}>
                        {notificationSettings.enabled ? t("notificationsOn", lang) : t("notificationsOff", lang)}
                      </div>
                      <div className="text-sm text-slate-500">{t("notificationHeader", lang)}</div>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      const next = !notificationSettings.enabled;
                      if (next) {
                        const granted = await requestNotificationPermission();
                        if (!granted) { notify(t("notifyPermissionDenied", lang)); return; }
                      } else { await cancelAllNotifications(); }
                      const updated = { ...notificationSettings, enabled: next };
                      setNotificationSettings(updated);
                      saveNotificationSettings(updated);
                      if (next) {
                        await schedulePrayerNotifications(prayerTimes, updated, "", lang);
                        notify(t("notifyActive", lang));
                      } else { notify(t("notifyOff", lang)); }
                    }}
                    className={`relative w-12 h-6 rounded-full transition-all duration-300 cursor-pointer border-2 ${notificationSettings.enabled ? "bg-amber-500 border-amber-400" : "bg-slate-700 border-slate-600 hover:border-slate-500"}`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${notificationSettings.enabled ? "left-6" : "left-0.5"}`} />
                  </button>
                </div>

                {notificationSettings.enabled && (
                  <>
                    <div>
                      <div className="text-sm font-bold tracking-wide text-slate-400 mb-2">{t("minutesBefore", lang)}</div>
                      <div className="flex gap-2 flex-wrap">
                        {[0, 5, 10, 15, 20, 30].map(min => (
                          <button key={min} onClick={async () => {
                            const updated = { ...notificationSettings, minutesBefore: min };
                            setNotificationSettings(updated);
                            saveNotificationSettings(updated);
                            await schedulePrayerNotifications(prayerTimes, updated, "", lang);
                            notify(min === 0 ? t("minutesOff", lang) : t("notifyMinutes", lang, { min: String(min) }));
                          }}
                            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all duration-200 cursor-pointer border ${notificationSettings.minutesBefore === min ? "border-amber-500/50 bg-amber-500/20 text-amber-400" : "border-white/5 bg-white/5 text-slate-400 hover:bg-white/10"}`}>
                            {min === 0 ? t("minutesOff", lang) : t("minutes", lang, { min: String(min) })}
                          </button>
                        ))}
                      </div>
                      {notificationSettings.minutesBefore === 0 && !notificationSettings.notifyAtVakit && (
                        <p className="text-sm text-amber-500/80 mt-2 leading-relaxed">{t("minutesOffWarning", lang)}</p>
                      )}
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-2xl border border-white/5 bg-white/5">
                      <div>
                        <div className="text-xs font-bold text-slate-200">{t("notifyAtVakitLabel", lang)}</div>
                        <div className="text-sm text-slate-500">{t("notifyAtVakitDesc", lang)}</div>
                      </div>
                      <button onClick={async () => {
                        const updated = { ...notificationSettings, notifyAtVakit: !notificationSettings.notifyAtVakit };
                        setNotificationSettings(updated);
                        saveNotificationSettings(updated);
                        await schedulePrayerNotifications(prayerTimes, updated, "", lang);
                      }}
                        className={`relative w-12 h-6 rounded-full transition-all duration-300 cursor-pointer border-2 shrink-0 ${notificationSettings.notifyAtVakit ? "bg-amber-500 border-amber-400" : "bg-slate-700 border-slate-600 hover:border-slate-500"}`}>
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${notificationSettings.notifyAtVakit ? "left-6" : "left-0.5"}`} />
                      </button>
                    </div>

                    {notificationSettings.minutesBefore > 0 && (
                      <div>
                        <div className="text-sm font-bold tracking-wide text-slate-400 mb-2">{t("soundTypeBeforeLabel", lang)}</div>
                        <div className="flex gap-2">
                          {(["default", "ezan"] as const).map(st => (
                            <button key={st} onClick={async () => {
                              const updated = { ...notificationSettings, soundTypeBefore: st };
                              setNotificationSettings(updated);
                              saveNotificationSettings(updated);
                              await schedulePrayerNotifications(prayerTimes, updated, "", lang);
                            }}
                              className={`flex-1 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 cursor-pointer border ${notificationSettings.soundTypeBefore === st ? "border-amber-500/50 bg-amber-500/20 text-amber-400" : "border-white/5 bg-white/5 text-slate-400 hover:bg-white/10"}`}>
                              {st === "ezan" ? t("soundEzan", lang) : t("soundDefault", lang)}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {notificationSettings.notifyAtVakit && (
                      <div>
                        <div className="text-sm font-bold tracking-wide text-slate-400 mb-2">{t("soundTypeAtVakitLabel", lang)}</div>
                        <div className="flex gap-2">
                          {(["default", "ezan"] as const).map(st => (
                            <button key={st} onClick={async () => {
                              const updated = { ...notificationSettings, soundTypeAtVakit: st };
                              setNotificationSettings(updated);
                              saveNotificationSettings(updated);
                              await schedulePrayerNotifications(prayerTimes, updated, "", lang);
                            }}
                              className={`flex-1 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 cursor-pointer border ${notificationSettings.soundTypeAtVakit === st ? "border-amber-500/50 bg-amber-500/20 text-amber-400" : "border-white/5 bg-white/5 text-slate-400 hover:bg-white/10"}`}>
                              {st === "ezan" ? t("soundEzan", lang) : t("soundDefault", lang)}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <div className="text-sm font-bold tracking-wide text-slate-400 mb-2">{t("whichPrayers", lang)}</div>
                      <div className="space-y-2">
                        {(Object.entries(notificationSettings.prayers) as [keyof typeof notificationSettings.prayers, boolean][]).map(([key, isOn]) => (
                          <div key={key} className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${isOn ? "border-amber-500/20 bg-amber-500/8" : "border-white/5 bg-white/5"}`}>
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${isOn ? "bg-amber-400" : "bg-slate-600"}`} />
                              <span className={`text-sm font-bold ${isOn ? "text-slate-100" : "text-slate-500"}`}>{t(`prayer_${key}`, lang)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {key !== "gunes" && (
                                <button onClick={() => toggleEzanPreview(key)}
                                  title={t("listenEzan", lang)}
                                  className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all cursor-pointer shrink-0 ${playingEzanPreview === key ? "border-amber-500/50 bg-amber-500/20 text-amber-400" : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200"}`}>
                                  {playingEzanPreview === key ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                                </button>
                              )}
                              <button onClick={async () => {
                                const updated = { ...notificationSettings, prayers: { ...notificationSettings.prayers, [key]: !isOn } };
                                setNotificationSettings(updated);
                                saveNotificationSettings(updated);
                                await schedulePrayerNotifications(prayerTimes, updated, "", lang);
                              }}
                                className={`relative w-10 h-5 rounded-full transition-all cursor-pointer border ${isOn ? "bg-amber-500 border-amber-400" : "bg-slate-700 border-slate-600"}`}>
                                <div className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow transition-all ${isOn ? "left-5" : "left-0.5"}`} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                  <p className="text-sm text-blue-300 leading-relaxed">{t("infoNote", lang)}</p>
                </div>
              </div>
            )}

            {/* ── HAKKINDA ── */}
            {tab === "hakkinda" && (
              <div className="space-y-4">
                <div className="flex flex-col items-center text-center py-4">
                  <div className={`text-3xl sm:text-4xl font-extrabold tracking-widest ${th.accent} mb-2`}>MECCANEN</div>
                  <p className={`text-base font-semibold ${th.textSecondary}`}>{t("appName", lang)}</p>
                  <p className="text-sm text-slate-500 mt-1">v{APP_VERSION}</p>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {t("aboutDesc1", lang)}
                  </p>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {t("aboutDesc2", lang)}
                  </p>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {t("aboutDesc3", lang)}
                  </p>
                </div>

                <div className="space-y-2">
                  <a href="https://github.com/Meccanen/Meccanen-Namaz-Vakti-Reklams-z"
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all cursor-pointer">
                    <span className="text-xs font-semibold text-slate-200">GitHub</span>
                    <span className="text-sm text-slate-500">→</span>
                  </a>
                  <a href="https://ko-fi.com/meccanen"
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-all cursor-pointer">
                    <span className="text-xs font-semibold text-amber-400 flex items-center gap-2">
                      <Coffee className="w-3.5 h-3.5" />Ko-fi
                    </span>
                    <span className="text-sm text-amber-500/70">→</span>
                  </a>
                  <a href="https://paypal.me/bulentt"
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all cursor-pointer">
                    <span className="text-xs font-semibold text-slate-200">PayPal</span>
                    <span className="text-sm text-slate-500">→</span>
                  </a>
                  <a href="mailto:meccanen@meccanen.xyz"
                    className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all cursor-pointer">
                    <span className="text-xs font-semibold text-slate-200">{t("email", lang)}</span>
                    <span className="text-sm text-slate-500">meccanen@meccanen.xyz</span>
                  </a>
                </div>

                <p className="text-center text-sm text-slate-600">© 2026 Meccanen</p>
              </div>
            )}
          </div>

          {notification && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 px-4 py-2 rounded-full text-xs font-semibold text-slate-100 shadow-xl whitespace-nowrap z-10">
              {notification}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function App() {
  const [themeKey, setThemeKey] = useState<ThemeKey>(() => {
    const saved = localStorage.getItem("mnv_theme") as ThemeKey;
    if (saved && THEMES[saved]) return saved;
    return "nane";
  });
  const [lang, setLangState] = useState<LangCode>(() => {
    return (localStorage.getItem("mnv_lang") as LangCode) || detectLanguage();
  });
  const setLang = (l: LangCode) => { setLangState(l); localStorage.setItem("mnv_lang", l); };
  const [notificationSettings, setNotificationSettingsState] = useState<NotificationSettings>(loadNotificationSettings);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<"genel"|"konum"|"metot"|"bildirim">("genel");
  const [location, setLocation] = useState<Location>(() => {
    try { const s = localStorage.getItem("mnv_location"); return s ? JSON.parse(s) : DEFAULT_LOCATION; }
    catch { return DEFAULT_LOCATION; }
  });
  const [savedLocations, setSavedLocationsState] = useState<Location[]>(() => {
    try { const s = localStorage.getItem("mnv_saved_locations"); return s ? JSON.parse(s) : [DEFAULT_LOCATION]; }
    catch { return [DEFAULT_LOCATION]; }
  });
  const [prayerMethod, setPrayerMethodState] = useState<number>(() =>
    parseInt(localStorage.getItem("mnv_prayer_method") || "13")
  );
  const [date, setDate] = useState(new Date());
  const [prayerTimes, setPrayerTimes] = useState<PrayerTime[]>(() =>
    getPrayerTimesFallback(DEFAULT_LOCATION.latitude, DEFAULT_LOCATION.longitude, new Date(), DEFAULT_LOCATION.timezone!)
  );
  const [prayerLoading, setPrayerLoading] = useState(false);
  const [nextPrayerStr, setNextPrayerStr] = useState("");
  const [compassHeading, setCompassHeading] = useState<number | null>(null);
  const [qiblaDir, setQiblaDir] = useState(0);
  const [compassListening, setCompassListening] = useState(false);
  const [compassUnsupported, setCompassUnsupported] = useState(false);
  const [showLocationPrompt, setShowLocationPrompt] = useState(
    () => !localStorage.getItem("mnv_location_prompted")
  );
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  // Kullanıcı "Konumu Bul" seçtiyse bu flag localStorage'da true kalır.
  // Bu sayede: (1) uygulama her açılışında, (2) her 30 dakikada bir konum otomatik güncellenir.
  const [autoLocationEnabled, setAutoLocationEnabled] = useState<boolean>(
    () => localStorage.getItem("mnv_auto_location") === "true"
  );

  const moonPhase = useMemo(() => calcMoonPhase(date), [date]);
  const tTheme = THEMES[themeKey];
  const isLight = ["seher","gul","nane"].includes(themeKey);

  // Header buton stilleri
  const hdrBtnBg     = isLight ? "bg-black/10 hover:bg-black/20 border-black/15" : "bg-black/30 hover:bg-white/10 border-white/10";
  const hdrBtnText   = isLight ? "text-slate-700 hover:text-slate-900" : "text-slate-300 hover:text-white";
  const hdrBtnTextSm = isLight ? "text-slate-600 hover:text-slate-900" : "text-slate-400 hover:text-white";

  const setTheme = (key: ThemeKey) => { setThemeKey(key); localStorage.setItem("mnv_theme", key); };
  const setNotificationSettings = (s: NotificationSettings) => { setNotificationSettingsState(s); saveNotificationSettings(s); };
  const setLocationAndSave = (loc: Location) => { setLocation(loc); localStorage.setItem("mnv_location", JSON.stringify(loc)); };
  const setSavedLocations = (locs: Location[]) => { setSavedLocationsState(locs); localStorage.setItem("mnv_saved_locations", JSON.stringify(locs)); };
  const setPrayerMethod = (m: number) => { setPrayerMethodState(m); localStorage.setItem("mnv_prayer_method", String(m)); };

  useEffect(() => { const i = setInterval(() => setDate(new Date()), 1000); return () => clearInterval(i); }, []);

  const lastFetchKey = useRef("");
  const loadPrayerTimes = async (loc: Location, method: number, dt: Date, force = false) => {
    const key = `${loc.latitude.toFixed(2)}_${loc.longitude.toFixed(2)}_${dt.getDate()}_${dt.getMonth()}_${dt.getFullYear()}_${method}`;
    if (!force && lastFetchKey.current === key) return;
    lastFetchKey.current = key;
    setPrayerLoading(true);
    try {
      const times = await fetchPrayerTimes(loc.latitude, loc.longitude, dt, loc.timezone || "Europe/Istanbul", method);
      setPrayerTimes(times);
    } catch {
      setPrayerTimes(getPrayerTimesFallback(loc.latitude, loc.longitude, dt, loc.timezone || "Europe/Istanbul"));
    } finally { setPrayerLoading(false); }
  };

  useEffect(() => {
    if (prayerTimes.length > 0 && notificationSettings.enabled) {
      schedulePrayerNotifications(prayerTimes, notificationSettings, location.name, lang)
        .then(r => console.log("[Meccanen] Bildirim planlama sonucu:", r));
    }
  }, [prayerTimes, notificationSettings.enabled]);

  useEffect(() => { loadPrayerTimes(location, prayerMethod, date); }, [location.latitude, location.longitude, date.getDate(), date.getMonth(), prayerMethod]);
  const handleRefresh = () => { lastFetchKey.current = ""; loadPrayerTimes(location, prayerMethod, date, true); };

  useEffect(() => {
    setQiblaDir(calcQiblaDirection(location.latitude, location.longitude));
  }, [location.latitude, location.longitude]);

  useEffect(() => {
    if (!compassListening) return;
    requestCompassPermission();
    setCompassUnsupported(false);
    const detach = attachCompassListener((h) => setCompassHeading(h));

    // Bazı cihazlarda (manyetometre çipi olmayan veya sisteme erişilemeyen eski/bütçe
    // Android telefon ve tabletler) yön sensörü hiç veri döndürmez — tarayıcı bunu
    // belirtmek için tek seferlik, tüm alanları boş bir olay gönderir ve bir daha
    // hiç tetiklenmez. Bu durumda ibreyi sonsuza dek "bekleniyor" gösterip kullanıcıyı
    // yanıltmak yerine, birkaç saniye içinde gerçek veri gelmezse uyarı gösteriyoruz.
    const unsupportedTimer = setTimeout(() => {
      setCompassHeading(prev => {
        if (prev === null) setCompassUnsupported(true);
        return prev;
      });
    }, 2500);

    return () => {
      detach();
      clearTimeout(unsupportedTimer);
    };
  }, [compassListening]);

  useEffect(() => {
    if (!prayerTimes.length) { setNextPrayerStr(""); return; }

    const tz = location.timezone || "Europe/Istanbul";

    // Timezone'daki mevcut saat:dakika:saniyeyi bul
    let h=0, m=0, s=0;
    try {
      const tp = new Intl.DateTimeFormat("en-US", {
        timeZone: tz, hour:"2-digit", minute:"2-digit", second:"2-digit", hour12:false
      }).formatToParts(date);
      h = parseInt(tp.find(p=>p.type==="hour")?.value||"0");
      m = parseInt(tp.find(p=>p.type==="minute")?.value||"0");
      s = parseInt(tp.find(p=>p.type==="second")?.value||"0");
    } catch {}

    const nowSeconds = h * 3600 + m * 60 + s;

    // Bir sonraki vakti bul
    let nextIdx = -1;
    for (let i = 0; i < prayerTimes.length; i++) {
      const [ph, pm] = prayerTimes[i].time.split(":").map(Number);
      if (nowSeconds < ph * 3600 + pm * 60) { nextIdx = i; break; }
    }

    let diffSeconds: number;
    let nextName: string;

    if (nextIdx === -1) {
      // Tüm vakitler geçti → yarınki ilk vakte (imsak) kalan süre
      const [ph, pm] = prayerTimes[0].time.split(":").map(Number);
      const nextDaySeconds = ph * 3600 + pm * 60;
      diffSeconds = (86400 - nowSeconds) + nextDaySeconds;
      nextName = prayerTimes[0].name;
    } else {
      const [ph, pm] = prayerTimes[nextIdx].time.split(":").map(Number);
      diffSeconds = (ph * 3600 + pm * 60) - nowSeconds;
      nextName = prayerTimes[nextIdx].name;
    }

    if (diffSeconds < 0) diffSeconds = 0;
    const hours = Math.floor(diffSeconds / 3600);
    const mins  = Math.floor((diffSeconds % 3600) / 60);
    const secs  = diffSeconds % 60;
    setNextPrayerStr(`${nextName}: ${String(hours).padStart(2,"0")}:${String(mins).padStart(2,"0")}:${String(secs).padStart(2,"0")}`);
  }, [prayerTimes, date, location.timezone]);

  const handleFindLocation = async () => {
    // Kullanıcı "Konumu Bul"a bastı → otomatik güncellemeyi aktif et ve kaydet.
    localStorage.setItem("mnv_auto_location", "true");
    setAutoLocationEnabled(true);
    setShowLocationPrompt(true);
  };

  const handleToggleAutoLocation = (val: boolean) => {
    localStorage.setItem("mnv_auto_location", String(val));
    setAutoLocationEnabled(val);
    // Açılıyorsa hemen bir konum tespiti yap.
    if (val) detectAndUpdateLocation();
  };

  const handleLocationAllowed = async () => {
    setShowLocationPrompt(false);
    localStorage.setItem("mnv_location_prompted", "true");
    setIsDetectingLocation(true);
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      setIsDetectingLocation(false);
      alert(t("locationDenied", lang) || "Konum izni alınamadı. Lütfen telefon ayarlarından izin verin.");
      return;
    }
    await detectAndUpdateLocation();
  };

  // Konum tespiti ve güncelleme — hem manuel hem otomatik tarafından kullanılır.
  const detectAndUpdateLocation = async () => {
    setIsDetectingLocation(true);
    try {
      const coords = await getCurrentPosition();

      // Mevcut konumla karşılaştır — çok yakınsa (0.05° ≈ 5km) gereksiz API çağrısı yapma.
      const latDiff = Math.abs(coords.latitude - location.latitude);
      const lonDiff = Math.abs(coords.longitude - location.longitude);
      if (latDiff < 0.05 && lonDiff < 0.05) {
        setIsDetectingLocation(false);
        return;
      }

      // Koordinatları HEMEN kaydet — böylece şehir adı sorgusu (reverse geocoding) başarısız
      // olsa bile (ağ hatası, zaman aşımı, DNS engeli vb.) namaz vakitleri ve kıble doğru
      // koordinatlara göre güncellenir. Önceden bu sorgu başarısız olduğunda tüm konum
      // güncellemesi sessizce iptal oluyordu — GPS'ten doğru koordinat alınmasına rağmen.
      let name = `${coords.latitude.toFixed(2)}°N ${coords.longitude.toFixed(2)}°E`;
      let country = t("unknown", lang);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json&accept-language=${lang === "ur" ? "ar" : lang}`,
          { headers: { "Accept": "application/json" } }
        );
        const data = await res.json();
        if (data?.address) {
          const addr = data.address;
          name = addr.city || addr.town || addr.village || addr.county || addr.state || name;
          country = addr.country || country;
        }
      } catch (geoErr) {
        console.log("[Meccanen] Reverse geocoding failed, koordinatlarla devam ediliyor:", geoErr);
      }

      const newLoc: Location = {
        name, country,
        latitude: coords.latitude, longitude: coords.longitude,
        timezone: guessTimezone(coords.longitude),
      };
      setLocationAndSave(newLoc);
      const exists = savedLocations.some(l =>
        l.latitude.toFixed(2) === newLoc.latitude.toFixed(2)
      );
      if (!exists) setSavedLocations([...savedLocations, newLoc]);
    } catch (e) {
      console.log("[Meccanen] Location detection error:", e);
    }
    setIsDetectingLocation(false);
  };

  // Uygulama açılışında otomatik konum güncelleme
  useEffect(() => {
    if (autoLocationEnabled) {
      detectAndUpdateLocation();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Sadece mount'ta çalışır

  // Her 30 dakikada bir otomatik konum güncelleme
  useEffect(() => {
    if (!autoLocationEnabled) return;
    const interval = setInterval(() => {
      detectAndUpdateLocation();
    }, 30 * 60 * 1000); // 30 dakika
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoLocationEnabled]);

  const handleLocationDenied = () => {
    setShowLocationPrompt(false);
    localStorage.setItem("mnv_location_prompted", "true");
  };

  const localTime = useMemo(() => {
    const tz = location.timezone || "Europe/Istanbul";
    let hour="--", min="--", sec="--", weekday="—", gregDay="--", gregMonthYear="— —";
    let hijriDay="--", hijriMonth="—", hijriYear="----";
    try {
      const LOCALE_MAP: Record<string, string> = {
        tr: "tr-TR", en: "en-US", ar: "ar-SA", de: "de-DE", ur: "ur-PK",
      };
      const locale = LOCALE_MAP[lang] || "en-US";
      const tp = new Intl.DateTimeFormat("en-US",{timeZone:tz,hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false}).formatToParts(date);
      hour=tp.find(p=>p.type==="hour")?.value||"--";
      min=tp.find(p=>p.type==="minute")?.value||"--";
      sec=tp.find(p=>p.type==="second")?.value||"--";
      weekday=new Intl.DateTimeFormat(locale,{timeZone:tz,weekday:"long"}).format(date);
      gregDay=new Intl.DateTimeFormat(locale,{timeZone:tz,day:"numeric"}).format(date);
      gregMonthYear=new Intl.DateTimeFormat(locale,{timeZone:tz,month:"long",year:"numeric"}).format(date);
      const HIJRI_MONTHS: Record<string, string[]> = {
        tr: ["Muharrem","Safer","Rebiülevvel","Rebiülahir","Cemaziyelevvel","Cemaziyelahir","Recep","Şaban","Ramazan","Şevval","Zilkade","Zilhicce"],
        en: ["Muharram","Safar","Rabi al-Awwal","Rabi al-Thani","Jumada al-Ula","Jumada al-Thania","Rajab","Sha'ban","Ramadan","Shawwal","Dhu al-Qi'dah","Dhu al-Hijjah"],
        ar: ["محرم","صفر","ربيع الأول","ربيع الثاني","جمادى الأولى","جمادى الآخرة","رجب","شعبان","رمضان","شوال","ذو القعدة","ذو الحجة"],
        de: ["Muharram","Safar","Rabi al-Awwal","Rabi ath-Thani","Dschumada l-ula","Dschumada th-thaniya","Radschab","Scha'ban","Ramadan","Schawwal","Dhu l-Qa'da","Dhu l-Hijja"],
        ur: ["محرم","صفر","ربیع الاول","ربیع الثانی","جمادی الاول","جمادی الثانی","رجب","شعبان","رمضان","شوال","ذوالقعدہ","ذوالحجہ"],
      };
      const months = HIJRI_MONTHS[lang] || HIJRI_MONTHS.en;
      const hp=new Intl.DateTimeFormat("en-u-ca-islamic-umalqura",{timeZone:tz,day:"numeric",month:"numeric",year:"numeric"}).formatToParts(date);
      hijriDay=hp.find(p=>p.type==="day")?.value||"--";
      hijriMonth=months[parseInt(hp.find(p=>p.type==="month")?.value||"1")-1]||"—";
      hijriYear=hp.find(p=>p.type==="year")?.value||"----";
    } catch {}
    return {hour,min,sec,weekday,gregDay,gregMonthYear,hijriDay,hijriMonth,hijriYear};
  }, [date, location.timezone, lang]);

  const activePrayerIndex = useMemo(() => {
    let h=0, m=0;
    try {
      const tp=new Intl.DateTimeFormat("en-US",{timeZone:location.timezone||"Europe/Istanbul",hour:"2-digit",minute:"2-digit",hour12:false}).formatToParts(date);
      h=parseInt(tp.find(p=>p.type==="hour")?.value||"0");
      m=parseInt(tp.find(p=>p.type==="minute")?.value||"0");
    } catch {}
    const now=`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
    for(let i=prayerTimes.length-1;i>=0;i--) if(now>=prayerTimes[i].time) return i;
    return 5;
  }, [prayerTimes, date, location.timezone]);

  const esmaSaati = useMemo(() => {
    return getCurrentEsmaSaati(date, prayerTimes, null);
  }, [prayerTimes, date]);


  const currentMethod = PRAYER_METHODS.find(m => m.id === prayerMethod) || PRAYER_METHODS[0];

  return (
    <div dir={lang === "ar" || lang === "ur" ? "rtl" : "ltr"} className={`min-h-screen ${tTheme.bg} ${tTheme.textPrimary} flex flex-col relative overflow-hidden p-3 sm:p-6 md:p-8 transition-colors duration-700`}>
      {showLocationPrompt && (
        <LocationPermissionPrompt
          onAllow={handleLocationAllowed}
          onDeny={handleLocationDenied}
          lang={lang}
        />
      )}

      {settingsOpen && (
        <SettingsPanel
          theme={themeKey} setTheme={setTheme}
          location={location} setLocation={setLocationAndSave}
          savedLocations={savedLocations} setSavedLocations={setSavedLocations}
          prayerMethod={prayerMethod} setPrayerMethod={setPrayerMethod}
          notificationSettings={notificationSettings}
          setNotificationSettings={setNotificationSettings}
          prayerTimes={prayerTimes}
          onClose={() => setSettingsOpen(false)} t={tTheme}
          lang={lang} setLang={setLang}
          onFindLocation={handleFindLocation}
          isDetectingLocation={isDetectingLocation}
          autoLocationEnabled={autoLocationEnabled}
          onToggleAutoLocation={handleToggleAutoLocation}
          initialTab={settingsInitialTab}
        />
      )}

      <div className="w-full max-w-2xl mx-auto flex flex-col gap-4 sm:gap-5 relative z-10 animate-fadeIn">

        <header className="flex flex-col gap-2 pb-4">
          {/* 1. Satır: Marka + Konum + Ayarlar */}
          <div className="flex justify-between items-center">
            <button onClick={() => { setSettingsInitialTab("genel"); setSettingsOpen(true); }}
              className="cursor-pointer select-none hover:opacity-75 transition-opacity duration-200 text-left">
              <div className={`text-2xl sm:text-3xl font-extrabold tracking-widest ${tTheme.accent} leading-none`}>
                MECCANEN
              </div>
            </button>
            <div className="flex items-center gap-2">
              {savedLocations.length > 1 ? (
                <button onClick={() => {
                  const idx = savedLocations.findIndex(l =>
                    l.latitude.toFixed(3) === location.latitude.toFixed(3) &&
                    l.longitude.toFixed(3) === location.longitude.toFixed(3)
                  );
                  const next = savedLocations[(idx + 1) % savedLocations.length];
                  setLocationAndSave(next);
                }}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 border rounded-full text-sm font-bold ${tTheme.accent} ${hdrBtnBg} transition-all cursor-pointer`}>
                  <MapPin className="w-4 h-4" />{location.name}<ChevronsDown className="w-3.5 h-3.5 -rotate-90" />
                </button>
              ) : (
                <span className={`inline-flex items-center gap-1.5 px-4 py-2 border rounded-full text-sm font-bold ${tTheme.accent} ${hdrBtnBg}`}>
                  <MapPin className="w-4 h-4" />{location.name}
                </span>
              )}
              <button onClick={() => { setSettingsInitialTab("genel"); setSettingsOpen(true); }}
                className={`p-2.5 border rounded-full transition-all cursor-pointer ${hdrBtnBg} ${hdrBtnText}`}>
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 2. Satır: Uygulama adı + Reklamsız + Dil + Tema */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className={`text-sm sm:text-base font-semibold ${tTheme.textSecondary}`}>{t("appName", lang)}</span>
              <span className={isLight ? "text-slate-400" : "text-slate-600"}>·</span>
              <span className={`text-sm sm:text-base font-bold flex items-center gap-1.5 ${tTheme.accent}`}>
                {t("adFree", lang)}
                {notificationSettings.enabled && <Bell className="w-3.5 h-3.5 text-amber-500" />}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => {
                  const order: LangCode[] = ["tr", "en", "ar", "de", "ur"];
                  const next = order[(order.indexOf(lang) + 1) % order.length];
                  setLang(next);
                }}
                className={`px-4 py-1.5 text-sm font-bold border rounded-full transition-all cursor-pointer ${hdrBtnBg} ${hdrBtnText}`}>
                {lang.toUpperCase()}
              </button>
              <button onClick={() => { setSettingsInitialTab("genel"); setSettingsOpen(true); }}
                className={`flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold border rounded-full transition-all cursor-pointer ${hdrBtnBg} ${hdrBtnTextSm}`}>
                <Palette className="w-3.5 h-3.5" />{t("theme", lang)}
              </button>
            </div>
          </div>
        </header>

        <section className={`${tTheme.card} border rounded-3xl p-6 sm:p-7 transition-all duration-300 shadow-2xl`}>
          <div className="flex items-baseline justify-center font-mono select-none mb-1">
            <span className={`text-6xl sm:text-7xl md:text-8xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b ${tTheme.clockGrad} tracking-tight`}>
              {localTime.hour}:{localTime.min}
            </span>
            <span className={`text-2xl sm:text-3xl font-light ${tTheme.secColor} ml-2 animate-pulse`}>:{localTime.sec}</span>
          </div>
          <p className={`text-center text-sm sm:text-base font-medium ${tTheme.textSecondary} mb-4`}>{localTime.weekday}</p>

          {nextPrayerStr && (
            <div className={`mb-5 p-4 rounded-2xl border-2 ${tTheme.prayerActive} flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 shadow-lg`}>
              <span className="text-sm sm:text-base font-semibold uppercase tracking-wide text-center opacity-80">
                {lang === "tr" ? "Sonraki Vakte Kalan Süre:" : `${t("nextPrayer", lang)} ${t("in", lang)}`}
              </span>
              <span className="text-3xl sm:text-4xl font-mono font-extrabold">{nextPrayerStr.split(": ")[1] || nextPrayerStr}</span>
            </div>
          )}

          <div className={`border-t pt-5 flex justify-between items-start gap-4 ${tTheme.header}`}>
            <div>
              <div className={`text-sm sm:text-base font-semibold tracking-wide ${tTheme.accent2} mb-2 flex items-center gap-2`}>
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />{t("gregorian", lang)}
              </div>
              <div className={`text-4xl sm:text-5xl font-bold ${tTheme.textPrimary}`}>{localTime.gregDay}</div>
              <div className={`text-base sm:text-lg ${tTheme.textSecondary} mt-1`}>{localTime.gregMonthYear}</div>
            </div>
            <div className="text-right">
              <div className={`text-sm sm:text-base font-semibold tracking-wide ${tTheme.hijriAccent} mb-2 flex items-center justify-end gap-2`}>
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />{t("hijri", lang)}
              </div>
              <div className={`text-4xl sm:text-5xl font-bold ${tTheme.hijriAccent} flex items-center justify-end gap-2`}>
                {localTime.hijriDay}
                <span className="text-3xl sm:text-4xl" title={t(moonPhase.phase, lang)}>{MOON_PHASE_ICONS[moonPhase.phase]}</span>
              </div>
              <div className={`text-base sm:text-lg mt-1 ${tTheme.hijriAccent} opacity-80`}>{localTime.hijriMonth} ({localTime.hijriYear} AH)</div>
              <div className={`text-sm sm:text-base mt-1.5 ${tTheme.hijriAccent} opacity-60`}>{t(moonPhase.phase, lang)} · %{moonPhase.illumination}</div>
            </div>
          </div>
        </section>

        <section className={`${tTheme.card} border rounded-2xl p-6 sm:p-7 transition-all duration-300 shadow-xl`}>
          <div className="flex justify-between items-center mb-5">
            <button onClick={() => { setSettingsInitialTab("metot"); setSettingsOpen(true); }}
              className={`text-sm sm:text-base font-semibold tracking-wide ${tTheme.accent} flex items-center gap-2 cursor-pointer hover:opacity-80 transition-all`}>
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />{currentMethod.label[lang] || currentMethod.label.en}
            </button>
            <span className={`text-xs sm:text-sm ${tTheme.textMuted} font-mono`}>{location.name}, {location.country}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-3">
            {prayerTimes.map((item, idx) => (
              <div key={item.key}
                className={`flex flex-col items-center py-5 sm:py-6 px-3 rounded-xl border transition-all duration-200 ${activePrayerIndex === idx ? `${tTheme.prayerActive} ring-2` : "border-transparent bg-black/20"}`}>
                <div className={`text-lg sm:text-xl font-semibold tracking-wide mb-2 text-center leading-tight ${activePrayerIndex === idx ? "" : tTheme.textMuted}`}>{t(`prayer_${item.key}`, lang) || item.name}</div>
                <div className={`text-2xl sm:text-3xl font-mono font-bold ${activePrayerIndex === idx ? "" : tTheme.textSecondary}`}>{item.time}</div>
              </div>
            ))}
          </div>

          {prayerLoading && (
            <div className="flex items-center justify-center gap-2 mt-4 text-sm text-slate-500">
              <RefreshCw className="w-4 h-4 animate-spin" />{t("updating", lang)}
            </div>
          )}
        </section>

        {esmaSaati && (
          <section className={`${tTheme.card} border rounded-xl p-6 sm:p-8 transition-all duration-300 shadow-md`}>
            <div className="text-base sm:text-lg font-semibold tracking-wide text-slate-400 flex items-center gap-2 mb-5">
              <BookOpen className={`w-6 h-6 sm:w-7 sm:h-7 ${tTheme.accent}`} />{t("esmaTitle", lang)}
            </div>
            <div className="flex flex-col items-center gap-3.5 text-center">
              <div className={`text-base sm:text-lg font-semibold px-4 py-2 rounded-full border border-white/10 ${tTheme.textSecondary}`}>
                {SEGMENT_LABELS[esmaSaati.segment][lang] || SEGMENT_LABELS[esmaSaati.segment].en}
                {" · "}
                {PLANET_LABELS[esmaSaati.planet][lang] || PLANET_LABELS[esmaSaati.planet].en}
              </div>
              <div className={`text-5xl sm:text-7xl font-bold ${tTheme.accent}`} dir="rtl">{esmaSaati.meaning.arabic}</div>
              <div className="text-2xl sm:text-3xl font-bold">
                {esmaSaati.meaning.transliteration}
              </div>
              <div className={`text-lg sm:text-xl ${tTheme.textSecondary} max-w-md leading-relaxed`}>
                {esmaSaati.meaning[lang] || esmaSaati.meaning.en}
              </div>
              <div className={`text-base sm:text-lg font-bold px-5 py-2.5 rounded-full border border-white/10 ${tTheme.accent} mt-1`}>
                {t("esmaRecite", lang)}: {esmaSaati.item.count !== null ? t("esmaTimes", lang, { n: String(esmaSaati.item.count) }) : t("esmaCountUnknown", lang)}
              </div>
              <div className={`text-sm sm:text-base ${tTheme.textMuted} opacity-70 mt-2 max-w-md leading-relaxed`}>
                {t("esmaSourceCitation", lang)}
              </div>
            </div>
          </section>
        )}

        <section className={`${tTheme.card} border rounded-xl p-6 sm:p-7 transition-all duration-300 shadow-md`}>
          <div className="flex justify-between items-center">
            <div className="text-base sm:text-lg font-semibold tracking-wide text-slate-400 flex items-center gap-2">
              <Globe className={`w-5 h-5 sm:w-6 sm:h-6 ${tTheme.accent}`} />{t("location", lang)}
            </div>
            <button onClick={() => { setSettingsInitialTab("konum"); setSettingsOpen(true); }}
              className={`text-base sm:text-lg font-semibold ${tTheme.accent} cursor-pointer hover:opacity-80 transition-all`}>
              {t("change", lang)} →
            </button>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <div>
              <div className="text-sm sm:text-base text-slate-500 tracking-wide font-medium">{t("city", lang)}</div>
              <div className={`text-2xl sm:text-3xl font-bold ${tTheme.accent}`}>{location.name}, {location.country}</div>
            </div>
            <div className="ml-auto text-right">
              <div className="text-sm sm:text-base text-slate-500 tracking-wide font-medium">{t("coordinates", lang)}</div>
              <div className={`text-base sm:text-lg font-mono ${tTheme.textSecondary}`}>{location.latitude.toFixed(4)}°N {location.longitude.toFixed(4)}°E</div>
              <div className="text-sm sm:text-base text-slate-600">{location.timezone}</div>
            </div>
          </div>
        </section>

        <section className={`${tTheme.card} border rounded-xl p-6 sm:p-7 transition-all duration-300 shadow-md`}>
          <div className="text-base sm:text-lg font-semibold tracking-wide text-slate-400 flex items-center gap-2 mb-4">
            <Compass className={`w-6 h-6 sm:w-7 sm:h-7 ${tTheme.accent}`} />{t("qibla", lang)}
          </div>
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-40 h-40 sm:w-48 sm:h-48">
              <svg viewBox="0 0 200 200" className="w-full h-full">
                <defs>
                  <radialGradient id="compassBg" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.07)" />
                    <stop offset="75%" stopColor="rgba(255,255,255,0.02)" />
                    <stop offset="100%" stopColor="rgba(255,255,255,0.00)" />
                  </radialGradient>
                  <linearGradient id="needleTip" x1="0" y1="1" x2="0" y2="0">
                    <stop offset="0%" stopColor="#d97706" />
                    <stop offset="100%" stopColor="#fbbf24" />
                  </linearGradient>
                </defs>

                {/* Dış çerçeve + zemin */}
                <circle cx="100" cy="100" r="94" fill="url(#compassBg)" stroke="rgba(255,255,255,0.14)" strokeWidth="1.5" />
                <circle cx="100" cy="100" r="70" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />

                {/* Derece çentikleri (dekoratif) */}
                {Array.from({ length: 24 }).map((_, i) => {
                  const angle = i * 15;
                  const isMajor = angle % 90 === 0;
                  const isMid = angle % 30 === 0;
                  const len = isMajor ? 15 : isMid ? 9 : 4;
                  const rad = ((angle - 90) * Math.PI) / 180;
                  const r1 = 94, r2 = 94 - len;
                  return (
                    <line key={i}
                      x1={100 + r1 * Math.cos(rad)} y1={100 + r1 * Math.sin(rad)}
                      x2={100 + r2 * Math.cos(rad)} y2={100 + r2 * Math.sin(rad)}
                      stroke={isMajor ? "#f59e0b" : isMid ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.2)"}
                      strokeWidth={isMajor ? 2.5 : isMid ? 1.5 : 1} strokeLinecap="round" opacity={isMajor ? 0.9 : 1} />
                  );
                })}

                {/* Kıble ibresi — hesaplama App'in geri kalanıyla birebir aynı, sadece görsel değişti */}
                <g style={{
                  transform: `rotate(${compassHeading !== null ? qiblaDir - compassHeading : qiblaDir}deg)`,
                  transformOrigin: "100px 100px",
                  transition: "transform 0.3s ease-out",
                }}>
                  <polygon points="100,22 109,100 100,88 91,100" fill="url(#needleTip)" />
                  <polygon points="100,155 109,100 100,112 91,100" fill="rgba(255,255,255,0.22)" />
                  <g transform="translate(100,22)">
                    <rect x="-9" y="-17" width="18" height="15" rx="1.5" fill="#1c1917" stroke="#f59e0b" strokeWidth="1.2" />
                    <rect x="-9" y="-17" width="18" height="4.5" fill="#f59e0b" />
                  </g>
                </g>

                <circle cx="100" cy="100" r="10" fill="rgba(15,23,42,0.85)" stroke="#f59e0b" strokeWidth="1.5" />
                <circle cx="100" cy="100" r="3.5" fill="#f59e0b" />
              </svg>
            </div>
            <button
              onClick={() => setCompassListening(!compassListening)}
              className={`text-sm sm:text-base font-bold px-4 py-2 rounded-full border transition-all cursor-pointer ${compassListening ? "bg-sky-500/20 border-sky-500/30 text-sky-400" : "border-white/10 text-slate-400 hover:bg-white/5"}`}>
              {compassListening ? `${Math.round(qiblaDir)}° ${t("qibla", lang)}` : t("qiblaDesc", lang)}
            </button>
            {compassListening && compassUnsupported && (
              <div className={`text-xs sm:text-sm text-center leading-snug px-2 ${tTheme.textMuted}`}>
                {t("compassNoSensor", lang)}
              </div>
            )}
          </div>
        </section>

        <footer className={`text-center pt-5 pb-3 text-xs sm:text-sm text-slate-600 border-t ${tTheme.header} space-y-3`}>
          <div>&copy; {date.getFullYear()} Meccanen Bilişim — {t("appName", lang)}</div>
          <div className="flex flex-col items-center gap-2">
            <div className={`text-[11px] sm:text-xs ${tTheme.textMuted}`}>{t("supportUs", lang)}</div>
            <div className="flex items-center gap-2">
              <a href="https://ko-fi.com/meccanen" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 text-amber-400 text-xs font-semibold hover:bg-amber-500/20 transition-all cursor-pointer">
                <Coffee className="w-3.5 h-3.5" />Ko-fi
              </a>
              <a href="https://paypal.me/bulentt" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-sky-500/20 bg-sky-500/10 text-sky-400 text-xs font-semibold hover:bg-sky-500/20 transition-all cursor-pointer">
                <Heart className="w-3.5 h-3.5" />PayPal
              </a>
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
}
