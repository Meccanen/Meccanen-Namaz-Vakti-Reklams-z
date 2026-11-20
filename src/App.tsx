import React, { useState, useEffect, useLayoutEffect, useMemo, useRef, useCallback } from "react";
import {
  MapPin, Calendar, Sparkles, Compass, CircleDot,
  RefreshCw, ChevronsDown, Globe,
  X, Settings, Palette, Check, Plus, Trash2, Star, Coffee, Bell, BellOff, Navigation, BookOpen, Heart, Play, Square, Sun, Sunrise, Sunset, Ban, Clock, ExternalLink, BatteryCharging, WifiOff, Smartphone, Magnet, Download
} from "lucide-react";
import appNamazIcon from "./assets/app-namaz.png";
import appHabitIcon from "./assets/app-habit.png";
import appWeatherIcon from "./assets/app-weather.png";
import Onboarding from "./components/Onboarding";
import TesbihModal from "./components/TesbihModal";
import ReligiousCalendarModal from "./components/ReligiousCalendarModal";
import AddLocationModal, { LocationManager } from "./components/AddLocationModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMoon as faMoonSolid, faSun, faStar } from "@fortawesome/free-solid-svg-icons";
import { fetchPrayerTimes, getPrayerTimesFallback, PrayerTime, PRAYER_METHODS, PRAYER_METHODS_ORDERED, PRAYER_METHOD_DIYANET, PRAYER_METHOD_KARACHI, PRAYER_METHOD_MWL, resolveDefaultPrayerMethod, PrayerTimesSource } from "./utils/prayerHelper";
import { Location } from "./types";
import {
  NotificationSettings, DEFAULT_NOTIFICATION_SETTINGS,
  requestNotificationPermission, checkNotificationPermission,
  schedulePrayerNotifications, cancelAllNotifications,
  saveNotificationSettings, loadNotificationSettings,
  cleanupTestNotifications,
  PRAYER_LABELS, NOTIFICATION_HORIZON_DAYS,
} from "./utils/notificationHelper";
import { t, detectLanguage, LangCode, LANGUAGE_LIST, isRTL, getLocale, getHijriMonths } from "./utils/i18n";
import { calcQiblaDirection, requestCompassPermission, attachCompassListener } from "./utils/qiblaHelper";
import { watchAppUpdate, restartForUpdate } from "./utils/appUpdate";
import { magneticDeclination, magneticFieldIntensity, magneticFieldHorizontal } from "./utils/geomag";
import { isLikelyXiaomi, promptBatteryWhitelist, promptXiaomiAutostart, exactAlarmsAllowed, openExactAlarmSettings } from "./utils/batteryHelper";
import { getCurrentEsmaSaati, PLANET_LABELS, SEGMENT_LABELS } from "./utils/esmaHelper";
import { calcMoonPhase, calcSolarTimes, MoonPhase } from "./utils/astronomyHelper";
import { requestLocationPermission, getCurrentPosition, getDeviceTimezone, fetchTimezone, guessTimezone, DEFAULT_LOCATION } from "./utils/locationHelper";
import { buildWidgetPayload, syncWidgets } from "./utils/widgetBridge";
import {
  getSupporterProducts, purchaseSupporterBadge, checkIsSupporter, restoreSupporterPurchases,
  SUPPORTER_PRODUCT_IDS, type SupporterProductId,
} from "./services/billingService";

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
  vaha: {
    label: "Yeşil Vaha", preview: ["#e6fbf5","#0f766e","#3730a3"],
    bg: "bg-[#e6fbf5]", card: "bg-white/70 border-teal-200/80",
    cardHover: "hover:border-teal-300/60", header: "border-teal-200/60",
    accent: "text-indigo-700", accent2: "text-teal-600", accent3: "text-indigo-900",
    prayerActive: "bg-gradient-to-b from-indigo-400/20 to-indigo-400/35 border-indigo-500/40 text-indigo-800 ring-indigo-400/30",
    clockGrad: "from-indigo-900 to-teal-800", secColor: "text-indigo-600",
    blob1: "bg-teal-300/20", blob2: "bg-indigo-200/20",
    textPrimary: "text-teal-950", textSecondary: "text-teal-800", textMuted: "text-teal-600",
    hijriAccent: "text-indigo-700", settingsCard: "bg-white/98 border-teal-200",
  },
  nilufer: {
    label: "Nilüfer Bahçesi", preview: ["#e6fbf5","#0f766e","#e11d48"],
    bg: "bg-[#e6fbf5]", card: "bg-white/70 border-teal-200/80",
    cardHover: "hover:border-teal-300/60", header: "border-teal-200/60",
    accent: "text-rose-600", accent2: "text-teal-600", accent3: "text-rose-800",
    prayerActive: "bg-gradient-to-b from-rose-400/20 to-rose-400/35 border-rose-500/40 text-rose-700 ring-rose-400/30",
    clockGrad: "from-rose-800 to-teal-800", secColor: "text-rose-500",
    blob1: "bg-teal-300/20", blob2: "bg-rose-200/20",
    textPrimary: "text-teal-950", textSecondary: "text-teal-800", textMuted: "text-teal-600",
    hijriAccent: "text-rose-600", settingsCard: "bg-white/98 border-teal-200",
  },
  lavanta: {
    label: "Lavanta Bahçesi", preview: ["#f5f3ff","#7c3aed","#b45309"],
    bg: "bg-[#f5f3ff]", card: "bg-white/70 border-violet-200/80",
    cardHover: "hover:border-violet-300/60", header: "border-violet-200/60",
    accent: "text-violet-700", accent2: "text-amber-600", accent3: "text-violet-900",
    prayerActive: "bg-gradient-to-b from-violet-400/20 to-violet-400/35 border-violet-500/40 text-violet-800 ring-violet-400/30",
    clockGrad: "from-violet-900 to-amber-800", secColor: "text-violet-600",
    blob1: "bg-violet-300/20", blob2: "bg-amber-200/20",
    textPrimary: "text-violet-950", textSecondary: "text-violet-800", textMuted: "text-violet-600",
    hijriAccent: "text-amber-700", settingsCard: "bg-white/98 border-violet-200",
  },
};
export type ThemeKey = keyof typeof THEMES;

// Kerahat üçgenlerinin temaya özel "belirleyici" rengi (koyu temalarda parlak, açık temalarda koyu ton).
export const KERAHAT_COLORS: Record<ThemeKey, string> = {
  gece: "#38bdf8",
  alacakaranlik: "#e879f9",
  orman: "#4ade80",
  altin: "#fbbf24",
  ramazan: "#c084fc",
  kabe: "#d4af37",
  turkuaz: "#22d3ee",
  bordo: "#fb7185",
  gunes: "#fb923c",
  safir: "#60a5fa",
  seher: "#b45309",
  gul: "#be123c",
  nane: "#15803d",
  vaha: "#0f766e",
  nilufer: "#be123c",
  lavanta: "#6d28d9",
};

const APP_VERSION = "1.0.22";

  const MOON_PHASE_ICONS: Record<MoonPhase, React.ReactNode> = {
  newMoon: <FontAwesomeIcon icon={faMoonSolid} />, waxingCrescent: <FontAwesomeIcon icon={faMoonSolid} />, firstQuarter: <FontAwesomeIcon icon={faMoonSolid} />,
  waxingGibbous: <FontAwesomeIcon icon={faMoonSolid} />, fullMoon: <FontAwesomeIcon icon={faMoonSolid} />, waningGibbous: <FontAwesomeIcon icon={faMoonSolid} />,
  thirdQuarter: <FontAwesomeIcon icon={faMoonSolid} />, waningCrescent: <FontAwesomeIcon icon={faMoonSolid} />,
};

function ThemePreviewCard({ themeKey }: { themeKey: ThemeKey }) {
  const th = THEMES[themeKey];
  const isLight = ["seher","gul","nane","vaha","nilufer","lavanta"].includes(themeKey);
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

function BatteryOptimizationPrompt({ onOpen, onDismiss, lang }: {
  onOpen: () => void;
  onDismiss: () => void;
  lang: LangCode;
}) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" onClick={onDismiss}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
      <div className="relative w-full max-w-sm rounded-[28px] border border-white/10 bg-slate-900/98 p-6 shadow-2xl text-center" onClick={e => e.stopPropagation()}>
        <BatteryCharging className="w-10 h-10 text-amber-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-100 mb-2">{t("batteryWarningTitle", lang)}</h3>
        <p className="text-sm text-slate-400 mb-5 leading-relaxed">{t("batteryWarningDesc", lang)}</p>
        <div className="flex gap-3">
          <button onClick={onDismiss}
            className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-300 font-semibold text-sm hover:bg-white/5 transition-all cursor-pointer">
            {t("dismiss", lang)}
          </button>
          <button onClick={onOpen}
            className="flex-1 py-2.5 rounded-xl bg-amber-500 text-white font-semibold text-sm hover:bg-amber-400 transition-all cursor-pointer">
            {t("openSettings", lang)}
          </button>
        </div>
      </div>
    </div>
  );
}

function OfflineMethodNotice({ onOk, onChange, lang }: {
  onOk: () => void;
  onChange: () => void;
  lang: LangCode;
}) {
  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center p-4" onClick={onOk}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
      <div className="relative w-full max-w-sm rounded-[28px] border border-white/10 bg-slate-900/98 p-6 shadow-2xl text-center" onClick={e => e.stopPropagation()}>
        <WifiOff className="w-10 h-10 text-amber-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-100 mb-2">{t("offlineNoticeTitle", lang)}</h3>
        <p className="text-sm text-slate-400 mb-5 leading-relaxed">{t("offlineNoticeDesc", lang)}</p>
        <div className="flex gap-3">
          <button onClick={onOk}
            className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-300 font-semibold text-sm hover:bg-white/5 transition-all cursor-pointer">
            {t("offlineNoticeOk", lang)}
          </button>
          <button onClick={onChange}
            className="flex-1 py-2.5 rounded-xl bg-amber-500 text-white font-semibold text-sm hover:bg-amber-400 transition-all cursor-pointer">
            {t("offlineNoticeChange", lang)}
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
  activeMethod,
  onClose, t: th,
  notificationSettings, setNotificationSettings,
  prayerTimes,
  multiDayPrayerTimes,
  lang, setLang,
  onFindLocation,
  isDetectingLocation,
  autoLocationEnabled,
  onToggleAutoLocation,
  initialTab,
  isSupporterUser,
  supporterLoading,
  purchasingId,
  onSupporterPurchase,
  onSupporterRestore,
  onOpenReligious,
}: {
  theme: ThemeKey; setTheme: (k: ThemeKey) => void;
  location: Location; setLocation: (l: Location) => void;
  savedLocations: Location[]; setSavedLocations: (locs: Location[]) => void;
  prayerMethod: number; setPrayerMethod: (m: number) => void;
  activeMethod: number;
  onClose: () => void; t: typeof THEMES[ThemeKey];
  notificationSettings: NotificationSettings;
  setNotificationSettings: (s: NotificationSettings) => void;
  prayerTimes: { key: string; name: string; time: string }[];
  multiDayPrayerTimes: { key: string; name: string; time: string }[][];
  lang: LangCode; setLang: (l: LangCode) => void;
  onFindLocation: () => void;
  isDetectingLocation: boolean;
  autoLocationEnabled: boolean;
  onToggleAutoLocation: (val: boolean) => void;
  initialTab?: "genel"|"konum"|"metot"|"bildirim"|"dil"|"hakkinda"|"meccanen";
  isSupporterUser: boolean;
  supporterLoading: boolean;
  purchasingId: string | null;
  onSupporterPurchase: (productId: SupporterProductId) => void;
  onSupporterRestore: () => void;
  onOpenReligious: () => void;
}) {
  const [tab, setTab] = useState<"genel"|"konum"|"metot"|"bildirim"|"dil"|"hakkinda"|"meccanen">(initialTab || "genel");
  const [playingEzanPreview, setPlayingEzanPreview] = useState<string | null>(null);
  const ezanPreviewAudioRef = useRef<HTMLAudioElement | null>(null);

  // Dile göre önerilen varsayılan hesaplama metodu (TR→Diyanet, UR→Karachi, diğer→MWL).
  const recommendedMethodId = lang === "tr" ? PRAYER_METHOD_DIYANET : lang === "ur" ? PRAYER_METHOD_KARACHI : PRAYER_METHOD_MWL;

  // MIUI/HyperOS (Xiaomi) cihazlarda, ezan çalarken kullanıcı ses tuşuna bastığında
  // (veya sistem "arka planda çalışıyor" uyarısını kapattığında) MIUI'nin agresif pil/
  // otomatik başlatma yönetimi uygulamanın bekleyen TÜM alarm bildirimlerini (o günün
  // kalan namaz vakitlerini) sessizce iptal edebiliyor — uygulama tekrar açılana kadar
  // hiçbir bildirim gelmiyor. Bunu tamamen kod tarafından önlemek mümkün değil (Android'in
  // güvenlik modeli bu şekilde çalışıyor), bu yüzden Xiaomi cihazlarda kullanıcıyı
  // "Otomatik Başlatma" ve "Pil kısıtlaması yok" ayarlarını açmaya yönlendiriyoruz.
  const [showXiaomiHint, setShowXiaomiHint] = useState(false);

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
  const [notification, setNotification] = useState("");
  const [exactAlarmOff, setExactAlarmOff] = useState(false);

  // Panel her açıldığında kesin alarm iznini kontrol et — zaten bildirimleri açık olan
  // kullanıcılar (izni hiç ayarlamamış olanlar) uyarıyı buradan görür.
  useEffect(() => {
    exactAlarmsAllowed().then(allowed => setExactAlarmOff(!allowed));
  }, []);

  const notify = (msg: string) => { setNotification(msg); setTimeout(() => setNotification(""), 3000); };

  const handleThemeClick = (key: ThemeKey) => {
    const th = THEMES[key];
    setTheme(key);
    notify(t(`theme_${key}`, lang));
  };

  const tabs = [
    { key: "genel" as const, label: t("theme", lang) },
    { key: "konum" as const, label: t("location", lang) },
    { key: "metot" as const, label: t("methodTab", lang) },
    { key: "bildirim" as const, label: t("notificationsTab", lang) },
    { key: "dil" as const, label: t("language", lang) },
    { key: "hakkinda" as const, label: t("about", lang) },
    { key: "meccanen" as const, label: t("appsTab", lang) },
  ];
  type TabKey = "genel" | "konum" | "metot" | "bildirim" | "dil" | "hakkinda" | "meccanen";

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-4 px-3 pb-3 sm:pt-8 sm:px-4" onClick={onClose}>
        <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
        <div
          className={`relative w-full max-w-lg max-h-[92vh] overflow-hidden rounded-[28px] border shadow-2xl flex flex-col glass-strong ${th.settingsCard}`}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-3 px-6 pt-5 pb-3 shrink-0">
            <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
              <span className={`text-xl sm:text-2xl font-extrabold tracking-widest ${th.accent}`}>MECCANEN</span>
              <span className={`text-base sm:text-lg font-bold ${th.textSecondary} opacity-60`}>·</span>
              <h2 className={`text-base sm:text-lg font-bold ${th.accent}`}>{t("settings", lang)}</h2>
            </div>
            <button onClick={onClose} aria-label="Close settings" className="shrink-0 p-2.5 rounded-full hover:bg-white/10 transition-all cursor-pointer">
              <X className={`w-6 h-6 ${th.textMuted}`} />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 px-4 sm:px-6 pb-3 shrink-0">
            {tabs.map(tb => (
              <button key={tb.key} onClick={() => setTab(tb.key)}
                className={`min-w-0 break-words px-2 py-3.5 rounded-2xl text-base sm:text-lg font-extrabold transition-all duration-200 cursor-pointer text-center leading-tight border-2 ${tab === tb.key ? `${th.accent} border-current bg-white/15 shadow-md` : `border-white/10 bg-white/5 ${th.textMuted} hover:bg-white/10 hover:${th.textPrimary}`}`}>
                {tb.label}
              </button>
            ))}
          </div>

          <div className="overflow-y-auto flex-1 min-h-0 px-6 pb-6">

            {tab === "genel" && (
              <div className="space-y-4">
                <h3 className={`text-lg sm:text-xl font-extrabold tracking-wide ${th.textPrimary} flex flex-wrap items-center gap-2`}>
                  <Palette className="w-6 h-6 sm:w-7 sm:h-7" />{t("themeSelection", lang)}
                </h3>
                <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-2">
                  {(Object.entries(THEMES) as [ThemeKey, typeof THEMES[ThemeKey]][]).map(([key, cardTh]) => {
                    const isActive = theme === key;
                    return (
                      <button key={key} onClick={() => handleThemeClick(key)}
                        className={`relative flex min-w-0 items-start gap-2.5 p-3 pr-9 rounded-2xl border-2 transition-all duration-200 cursor-pointer overflow-hidden ${cardTh.bg} ${isActive ? "" : "border-transparent opacity-90 hover:opacity-100"}`}
                        style={isActive ? { borderColor: cardTh.preview[1] } : undefined}>
                        <div className="flex gap-0.5 shrink-0">
                          {cardTh.preview.map((c, i) => <div key={i} className="w-3.5 h-3.5 rounded-full ring-1 ring-black/10" style={{ backgroundColor: c }} />)}
                        </div>
                        <span className={`min-w-0 break-words text-left text-base sm:text-lg font-bold ${cardTh.textPrimary} leading-tight`}>{t(`theme_${key}`, lang)}</span>
                        {isActive && (
                          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-white rounded-full p-1 shadow">
                            <Check className="w-3 h-3 text-slate-900" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
                <button onClick={onOpenReligious}
                  className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer ${th.header}`}>
                  <Calendar className="w-6 h-6 shrink-0 text-amber-500" />
                  <div className="flex-1 min-w-0 text-left">
                    <div className={`text-base sm:text-lg font-bold ${th.textPrimary}`}>{t("relTitle", lang)}</div>
                    <div className={`text-sm ${th.textMuted}`}>{t("relPeriod", lang)} · {t("relSettingsDesc", lang)}</div>
                  </div>
                  <ChevronsDown className={`w-5 h-5 shrink-0 ${th.textMuted} -rotate-90`} />
                </button>
              </div>
            )}

            {tab === "dil" && (
              <div className="space-y-4">
                <h3 className={`text-sm font-bold tracking-wide ${th.textPrimary} flex items-center gap-1.5`}>
                  <Globe className="w-3.5 h-3.5" />{t("language", lang)}
                </h3>
                <div className="grid grid-cols-2 gap-2.5">
                  {LANGUAGE_LIST.map(l => (
                    <button key={l.code} onClick={() => setLang(l.code)}
                      className={`py-4 rounded-2xl border-2 text-lg font-bold transition-all duration-200 cursor-pointer ${lang === l.code ? `border-current bg-white/15 ${th.textPrimary} shadow-md` : `border-white/10 bg-white/5 ${th.textMuted} hover:bg-white/10`}`}>
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {tab === "konum" && (
              <LocationManager
                th={th} lang={lang}
                location={location} setLocation={setLocation}
                savedLocations={savedLocations} setSavedLocations={setSavedLocations}
                onFindLocation={onFindLocation}
                isDetectingLocation={isDetectingLocation}
                autoLocationEnabled={autoLocationEnabled}
                onToggleAutoLocation={onToggleAutoLocation}
              />
            )}

            {tab === "metot" && (
              <div className="space-y-2">
                <h3 className={`text-lg sm:text-xl font-extrabold tracking-wide ${th.textPrimary} flex items-center gap-2 mb-3`}>
                  <Sparkles className="w-6 h-6 sm:w-7 sm:h-7" />{t("prayerMethod", lang)}
                </h3>
                {PRAYER_METHODS_ORDERED.map(m => {
                  const isEffective = activeMethod === m.id && activeMethod !== prayerMethod;
                  return (
                  <button key={m.id} onClick={() => setPrayerMethod(m.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all duration-200 cursor-pointer text-left ${prayerMethod === m.id ? "border-white/30 bg-white/10" : "border-white/5 bg-white/5 hover:bg-white/10"}`}>
                    <div>
                      <div className={`text-base sm:text-lg font-extrabold ${th.textPrimary} flex items-center gap-2 flex-wrap`}>
                        {m.label[lang] || m.label.en}
                        {isEffective && (
                          <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-full border text-emerald-400 border-emerald-500/40 bg-emerald-500/10">{t("activeMethodBadge", lang)}</span>
                        )}
                        {m.id === recommendedMethodId && (
                          <span className={`text-[10px] sm:text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${th.accent}`}>{t("recommended", lang)}</span>
                        )}
                      </div>
                      <div className={`text-sm sm:text-base ${th.textMuted} mt-0.5`}>{m.description[lang] || m.description.en}</div>
                    </div>
                    {prayerMethod === m.id && <Check className={`w-4 h-4 ${th.accent} shrink-0 ml-2`} />}
                  </button>
                  );
                })}
              </div>
            )}

            {tab === "bildirim" && (
              <div className="space-y-4">
                <h3 className={`text-xl sm:text-2xl font-extrabold tracking-wide ${th.textPrimary} flex items-center gap-2`}>
                  <Bell className="w-6 h-6 sm:w-7 sm:h-7" />{t("notificationHeader", lang)}
                </h3>
                <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-200 ${notificationSettings.enabled ? "border-amber-500/30 bg-amber-500/10" : "border-white/5 bg-white/5 hover:bg-white/10"}`}>
                  <div className="flex items-center gap-3">
                    {notificationSettings.enabled ? <Bell className="w-5 h-5 text-amber-400" /> : <BellOff className={`w-5 h-5 ${th.textMuted}`} />}
                    <div>
                      <div className={`text-sm font-bold ${notificationSettings.enabled ? "text-amber-400" : th.textPrimary}`}>
                        {notificationSettings.enabled ? t("notificationsOn", lang) : t("notificationsOff", lang)}
                      </div>
                      <div className={`text-sm ${th.textMuted}`}>{t("notificationHeader", lang)}</div>
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
                        await schedulePrayerNotifications(prayerTimes, updated, "", lang, undefined, multiDayPrayerTimes, location.timezone || "Europe/Istanbul");
                        notify(t("notifyActive", lang));
                        // Pil optimizasyonu muafiyeti iste (tüm Android'lerde geçerli, sessizce
                        // no-op olur eğer zaten muaf ise veya plugin mevcut değilse).
                        await promptBatteryWhitelist();
                        // Kesin alarm iznini kontrol et: kapalıysa aşağıdaki uyarı paneli
                        // görünür ("Ayarları Aç" ile "Alarmlar ve hatırlatıcılar" sayfası açılır).
                        setExactAlarmOff(!(await exactAlarmsAllowed()));
                        // Xiaomi/MIUI cihazlarda, daha önce gösterilmediyse otomatik başlatma
                        // uyarısını göster — bildirimlerin gün boyu güvenilir gelmesi için kritik.
                        if (isLikelyXiaomi() && !localStorage.getItem("mnv_xiaomi_hint_dismissed")) {
                          setShowXiaomiHint(true);
                        }
                      } else { notify(t("notifyOff", lang)); }
                    }}
                    className={`relative w-12 h-6 rounded-full transition-all duration-300 cursor-pointer border-2 ${notificationSettings.enabled ? "bg-amber-500 border-amber-400" : "bg-slate-700 border-slate-600 hover:border-slate-500"}`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${notificationSettings.enabled ? "left-6" : "left-0.5"}`} />
                  </button>
                </div>

                {showXiaomiHint && (
                  <div className="p-4 rounded-2xl border border-sky-500/30 bg-sky-500/10 space-y-2.5">
                    <div className="text-sm sm:text-base font-bold text-sky-400">
                      {t("xiaomiHintTitle", lang)}
                    </div>
                    <p className={`text-sm ${th.textMuted} leading-relaxed`}>
                      {t("xiaomiHintDesc", lang)}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={async () => { await promptXiaomiAutostart(); }}
                        className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-sky-500/20 border border-sky-500/40 text-sky-400 hover:bg-sky-500/30 transition-all cursor-pointer">
                        {t("openSettings", lang)}
                      </button>
                      <button
                        onClick={() => { localStorage.setItem("mnv_xiaomi_hint_dismissed", "1"); setShowXiaomiHint(false); }}
                        className={`px-4 py-2.5 rounded-xl text-sm font-bold border border-white/10 bg-white/5 ${th.textMuted} hover:bg-white/10 transition-all cursor-pointer`}>
                        {t("dismiss", lang)}
                      </button>
                    </div>
                  </div>
                )}

                {exactAlarmOff && notificationSettings.enabled && (
                  <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 space-y-2.5">
                    <div className="text-sm sm:text-base font-bold text-amber-400">
                      {t("exactAlarmWarningTitle", lang)}
                    </div>
                    <p className={`text-sm ${th.textMuted} leading-relaxed`}>
                      {t("exactAlarmWarningDesc", lang)}
                    </p>
                    <button
                      onClick={async () => { await openExactAlarmSettings(); }}
                      className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-amber-500/20 border border-amber-500/40 text-amber-400 hover:bg-amber-500/30 transition-all cursor-pointer w-full">
                      {t("exactAlarmOpenSettings", lang)}
                    </button>
                  </div>
                )}

                {notificationSettings.enabled && (
                  <>
                    <div>
                      <div className={`text-lg sm:text-xl font-extrabold tracking-wide ${th.textPrimary} mb-2`}>{t("minutesBefore", lang)}</div>
                      <div className="flex gap-2 flex-wrap">
                        {[0, 5, 10, 15, 20, 30].map(min => (
                          <button key={min} onClick={async () => {
                            const updated = { ...notificationSettings, minutesBefore: min };
                            setNotificationSettings(updated);
                            saveNotificationSettings(updated);
                            await schedulePrayerNotifications(prayerTimes, updated, "", lang, undefined, multiDayPrayerTimes, location.timezone || "Europe/Istanbul");
                            notify(min === 0 ? t("minutesOff", lang) : t("notifyMinutes", lang, { min: String(min) }));
                          }}
                            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all duration-200 cursor-pointer border ${notificationSettings.minutesBefore === min ? "border-amber-500/50 bg-amber-500/20 text-amber-400" : `border-white/5 bg-white/5 ${th.textMuted} hover:bg-white/10`}`}>
                            {min === 0 ? t("minutesOff", lang) : t("minutes", lang, { min: String(min) })}
                          </button>
                        ))}
                      </div>
                      {notificationSettings.minutesBefore === 0 && !notificationSettings.notifyAtVakit && (
                        <p className="text-sm text-amber-500/80 mt-2 leading-relaxed">{t("minutesOffWarning", lang)}</p>
                      )}
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-2xl border border-white/5 bg-white/5">
                      <div className={`text-base sm:text-lg font-bold ${th.textPrimary}`}>{t("notifyAtVakitLabel", lang)}</div>
                      <button onClick={async () => {
                        const updated = { ...notificationSettings, notifyAtVakit: !notificationSettings.notifyAtVakit };
                        setNotificationSettings(updated);
                        saveNotificationSettings(updated);
                        await schedulePrayerNotifications(prayerTimes, updated, "", lang, undefined, multiDayPrayerTimes, location.timezone || "Europe/Istanbul");
                      }}
                        className={`relative w-12 h-6 rounded-full transition-all duration-300 cursor-pointer border-2 shrink-0 ${notificationSettings.notifyAtVakit ? "bg-amber-500 border-amber-400" : "bg-slate-700 border-slate-600 hover:border-slate-500"}`}>
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${notificationSettings.notifyAtVakit ? "left-6" : "left-0.5"}`} />
                      </button>
                    </div>

                    {notificationSettings.notifyAtVakit && (
                      <div>
                        <div className="flex gap-2">
                          {(["default", "ezan"] as const).map(st => (
                            <button key={st} onClick={async () => {
                              const updated = { ...notificationSettings, soundTypeAtVakit: st };
                              setNotificationSettings(updated);
                              saveNotificationSettings(updated);
                              await schedulePrayerNotifications(prayerTimes, updated, "", lang, undefined, multiDayPrayerTimes, location.timezone || "Europe/Istanbul");
                            }}
                              className={`flex-1 py-3 rounded-2xl text-base sm:text-lg font-bold transition-all duration-200 cursor-pointer border ${notificationSettings.soundTypeAtVakit === st ? "border-amber-500/50 bg-amber-500/20 text-amber-400" : `border-white/5 bg-white/5 ${th.textMuted} hover:bg-white/10`}`}>
                              {st === "ezan" ? t("soundEzan", lang) : t("soundDefault", lang)}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between p-3 rounded-2xl border border-white/5 bg-white/5">
                      <div>
                        <div className={`text-base sm:text-lg font-bold ${th.textPrimary}`}>{t("statusNotifLabel", lang)}</div>
                        <div className={`text-sm ${th.textMuted} mt-0.5`}>{t("statusNotifDesc", lang)}</div>
                      </div>
                      <button onClick={async () => {
                        const turningOn = !notificationSettings.showStatusNotification;
                        const updated = { ...notificationSettings, showStatusNotification: turningOn };
                        setNotificationSettings(updated);
                        saveNotificationSettings(updated);
                        const r = await schedulePrayerNotifications(prayerTimes, updated, "", lang, undefined, multiDayPrayerTimes, location.timezone || "Europe/Istanbul");
                        console.log("[Meccanen] Durum bildirimi planlama sonucu:", r);
                        if (!r.success) {
                          notify(t("notifyScheduleError", lang, { error: r.error || "?" }));
                        } else if (turningOn) {
                          notify(t("notifyActive", lang));
                        } else {
                          notify(t("notifyOff", lang));
                        }
                      }}
                        className={`relative w-12 h-6 rounded-full transition-all duration-300 cursor-pointer border-2 shrink-0 ${notificationSettings.showStatusNotification ? "bg-amber-500 border-amber-400" : "bg-slate-700 border-slate-600 hover:border-slate-500"}`}>
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${notificationSettings.showStatusNotification ? "left-6" : "left-0.5"}`} />
                      </button>
                    </div>

                    <div>
                      <div className={`text-lg sm:text-xl font-extrabold tracking-wide ${th.textPrimary} mb-2`}>{t("whichPrayers", lang)}</div>
                      <div className="space-y-2">
                        {(Object.entries(notificationSettings.prayers) as [keyof typeof notificationSettings.prayers, boolean][]).map(([key, isOn]) => (
                          <div key={key} className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${isOn ? "border-amber-500/20 bg-amber-500/8" : "border-white/5 bg-white/5"}`}>
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${isOn ? "bg-amber-400" : "bg-slate-600"}`} />
                              <span className={`text-sm font-bold ${isOn ? th.textPrimary : th.textMuted}`}>{t(`prayer_${key}`, lang)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {key !== "gunes" && (
                                <button onClick={() => toggleEzanPreview(key)}
                                  title={t("listenEzan", lang)}
                                  className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all cursor-pointer shrink-0 ${playingEzanPreview === key ? "border-amber-500/50 bg-amber-500/20 text-amber-400" : `border-white/10 bg-white/5 ${th.textMuted} hover:bg-white/10 hover:${th.textPrimary}`}`}>
                                  {playingEzanPreview === key ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                                </button>
                              )}
                              <button onClick={async () => {
                                const updated = { ...notificationSettings, prayers: { ...notificationSettings.prayers, [key]: !isOn } };
                                setNotificationSettings(updated);
                                saveNotificationSettings(updated);
                                await schedulePrayerNotifications(prayerTimes, updated, "", lang, undefined, multiDayPrayerTimes, location.timezone || "Europe/Istanbul");
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
                  <p className={`text-sm ${th.textMuted} mt-1`}>v{APP_VERSION}</p>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                  <p className={`text-sm ${th.textSecondary} leading-relaxed`}>
                    {t("aboutDesc1", lang)}
                  </p>
                  <p className={`text-sm ${th.textSecondary} leading-relaxed`}>
                    {t("aboutDesc2", lang)}
                  </p>
                  <p className={`text-sm ${th.textSecondary} leading-relaxed`}>
                    {t("aboutDesc3", lang)}
                  </p>
                </div>

                <p className={`text-sm ${th.textSecondary} leading-relaxed px-1`}>
                  {t("aboutDesc4", lang)}
                </p>

                <div className={`border-t ${th.header} pt-4 space-y-3`}>
                  <h3 className={`text-lg sm:text-xl font-extrabold tracking-wide ${th.textPrimary} flex items-center gap-2`}>
                    <Heart className="w-6 h-6 sm:w-7 sm:h-7 text-rose-400" />{t("supporterTitle", lang)}
                  </h3>
                  <p className={`text-sm ${th.textSecondary} leading-relaxed`}>{t("supporterDesc", lang)}</p>

                  {isSupporterUser ? (
                    <div className="flex items-center gap-2 p-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10">
                      <Star className="w-5 h-5 text-emerald-400 shrink-0" />
                      <span className="text-sm font-bold text-emerald-400">{t("supporterOwned", lang)}</span>
                    </div>
                  ) : supporterLoading ? (
                    <div className={`text-sm ${th.textMuted}`}>{t("updating", lang)}</div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {/* Şu an sadece Gümüş (1 kahve) seçeneği gösteriliyor. Altın (2 kahve)
                          seçeneği bilinçli olarak gizlendi — kod/satın alma mantığı ileride
                          tekrar kullanılmak üzere arkada duruyor, sadece SUPPORTER_PRODUCT_IDS
                          filtrelenerek UI'dan kaldırıldı. */}
                      {SUPPORTER_PRODUCT_IDS.filter((pid) => pid === "destekci_2_99").map((pid) => {
                        const isBusy = purchasingId === pid;
                        const labelKey = pid === "destekci_2_99" ? "supporterButtonSilver" : "supporterButtonGold";
                        const coffeeCount = pid === "destekci_2_99" ? 1 : 2;
                        return (
                          <button key={pid}
                            disabled={isBusy || purchasingId !== null}
                            onClick={() => onSupporterPurchase(pid)}
                            className="flex items-center gap-2.5 px-4 py-3 rounded-2xl border border-rose-500/25 bg-rose-500/10 text-rose-400 font-bold hover:bg-rose-500/20 transition-all duration-200 cursor-pointer disabled:opacity-50 text-left">
                            <span className="flex items-center gap-0.5 shrink-0">
                              {Array.from({ length: coffeeCount }).map((_, i) => <Coffee key={i} className="w-4 h-4" />)}
                            </span>
                            <span className="text-sm sm:text-base leading-tight">{isBusy ? t("updating", lang) : t(labelKey, lang)}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <button onClick={onSupporterRestore}
                    className={`text-xs ${th.textMuted} underline underline-offset-2 hover:${th.textPrimary} transition-all cursor-pointer`}>
                    {t("supporterRestore", lang)}
                  </button>
                </div>

                <p className={`text-center text-sm ${th.textMuted}`}>© 2026 Meccanen</p>
              </div>
            )}

            {tab === "meccanen" && (
              <div className="space-y-4">
                <div className={`rounded-2xl border p-4 ${th.card}`}>
                  <p className={`text-xs leading-relaxed ${th.textSecondary}`}>{t("appsIntro", lang)}</p>
                </div>

                {([
                  {
                    nameKey: "appNamazName", descKey: "appNamazDesc", img: appNamazIcon,
                    url: "https://play.google.com/store/apps/details?id=meccanen.namaz.vakti.v1",
                  },
                  {
                    nameKey: "appHabitName", descKey: "appHabitDesc", img: appHabitIcon,
                    url: "https://play.google.com/store/apps/details?id=com.meccanen.habittracker",
                  },
                  {
                    nameKey: "appWeatherName", descKey: "appWeatherDesc", img: appWeatherIcon,
                    url: "https://play.google.com/store/apps/details?id=com.specialweatherassistant.app",
                  },
                ] as const).map((app) => (
                  <div key={app.nameKey} className={`rounded-2xl border p-4 space-y-3 ${th.card}`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <img src={app.img} alt="" className="w-11 h-11 shrink-0 rounded-2xl object-cover" />
                      <div className="min-w-0">
                        <h4 className={`font-medium text-sm ${th.textPrimary}`}>{t(app.nameKey, lang)}</h4>
                        <p className={`text-xs leading-relaxed ${th.textSecondary}`}>{t(app.descKey, lang)}</p>
                      </div>
                    </div>
                    <a href={app.url} target="_blank" rel="noopener noreferrer"
                      className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold transition active:scale-[0.98] ${th.card} ${th.accent}`}>
                      <ExternalLink size={13} className="shrink-0" />
                      {t("appsOpen", lang)}
                    </a>
                  </div>
                ))}

                <p className={`text-center text-xs ${th.textMuted}`}>{t("appsFoot", lang)}</p>
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
    return "vaha";
  });
  const [lang, setLangState] = useState<LangCode>(() => {
    return (localStorage.getItem("mnv_lang") as LangCode) || detectLanguage();
  });
  const setLang = (l: LangCode) => { setLangState(l); localStorage.setItem("mnv_lang", l); };

  useEffect(() => {
    document.documentElement.lang = getLocale(lang);
    document.documentElement.dir = isRTL(lang) ? "rtl" : "ltr";
  }, [lang]);

  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!langMenuOpen) return;
    const close = (e: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) setLangMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [langMenuOpen]);

  const [locMenuOpen, setLocMenuOpen] = useState(false);
  const locMenuRef = useRef<HTMLDivElement>(null);
  const [showAddLocation, setShowAddLocation] = useState(false);
  useEffect(() => {
    if (!locMenuOpen) return;
    const close = (e: MouseEvent) => {
      if (locMenuRef.current && !locMenuRef.current.contains(e.target as Node)) setLocMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [locMenuOpen]);

  // Erişilebilirlik: yazı boyutu büyütme (yaşlı/görme zorluğu yaşayan kullanıcılar için).
  // "Aa" düğmesiyle 3 kademe arasında döngü yapılır: Normal (%100), Büyük (%115), Daha Büyük (%130).
  // Uygulanması index.css'teki --afs CSS değişkeni üzerinden global olarak yapılıyor
  // (aşağıdaki useEffect'e bakınız) — böylece Ayarlar/Hakkında dahil TÜM metinler
  // otomatik olarak kapsanıyor, tek tek her ekranı değiştirmeye gerek kalmıyor.
  const FONT_SCALE_LEVELS = [1, 1.15, 1.3];
  const [fontScale, setFontScale] = useState<number>(() => {
    const saved = parseFloat(localStorage.getItem("mnv_font_scale") || "1");
    return FONT_SCALE_LEVELS.includes(saved) ? saved : 1;
  });
  const [isFontScaleChanging, setIsFontScaleChanging] = useState(false);
  useLayoutEffect(() => {
    document.documentElement.style.setProperty("--afs", String(fontScale));
  }, [fontScale]);
  const cycleFontScale = () => {
    const idx = FONT_SCALE_LEVELS.indexOf(fontScale);
    const next = FONT_SCALE_LEVELS[(idx === -1 ? 0 : idx + 1) % FONT_SCALE_LEVELS.length];
    setFontScale(next);
    setIsFontScaleChanging(true);
    window.setTimeout(() => setIsFontScaleChanging(false), 260);
    localStorage.setItem("mnv_font_scale", String(next));
    showThemeToast(`${t("fontSizeLabel", lang)}: %${Math.round(next * 100)}`);
  };

  // 3. satır (eylem butonları) taşarsa, sondaki küçük ikonları (Dil/Tema/Ayarlar)
  // üst satıra — uygulama adının sağına — taşırız. Böylece toplam hep 3 satır kalır.
  const row3Ref = useRef<HTMLDivElement>(null);
  const [iconsInHeader, setIconsInHeader] = useState(false);
  // Dil ya da yazı boyutu değişince yeniden ölç: ikonlar sığıyorsa 3. satıra geri dönsün.
  // (Ölçüm effect'inden ÖNCE gelmeli ki sıfırlama, ölçümün kararını ezmesin.)
  useEffect(() => { setIconsInHeader(false); }, [lang, fontScale]);
  useEffect(() => {
    if (iconsInHeader) return;
    const el = row3Ref.current;
    if (!el) return;
    const kids = [...el.children] as HTMLElement[];
    if (kids.length < 6) return;
    // RTL'de ilk öğe sağda, son öğe solda olur; bu yüzden yön bağımsız
    // hesaplıyoruz (last.right - first.left RTL'de negatif çıkar).
    const rects = kids.map((k) => k.getBoundingClientRect());
    const left = Math.min(...rects.map((r) => r.left));
    const right = Math.max(...rects.map((r) => r.right));
    if (right - left > el.clientWidth + 1) setIconsInHeader(true);
  }, [iconsInHeader, lang, fontScale]);
  useEffect(() => {
    const onResize = () => setIconsInHeader(false);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const [notificationSettings, setNotificationSettingsState] = useState<NotificationSettings>(loadNotificationSettings);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<"genel"|"konum"|"metot"|"bildirim"|"dil"|"hakkinda"|"meccanen">("genel");
  const [location, setLocation] = useState<Location>(() => {
    try { const s = localStorage.getItem("mnv_location"); return s ? JSON.parse(s) : DEFAULT_LOCATION; }
    catch { return DEFAULT_LOCATION; }
  });
  const [savedLocations, setSavedLocationsState] = useState<Location[]>(() => {
    try { const s = localStorage.getItem("mnv_saved_locations"); return s ? JSON.parse(s) : [DEFAULT_LOCATION]; }
    catch { return [DEFAULT_LOCATION]; }
  });
  const [prayerMethod, setPrayerMethodState] = useState<number>(() =>
    resolveDefaultPrayerMethod(localStorage.getItem("mnv_prayer_method"))
  );
  // Fiilen kullanılan metot: kullanıcı seçimi 99 ise 99; API/önbellek verisi
  // varsa seçili metot; matematiksel fallback'e düşüldüyse 99.
  // `prayerMethod` yalnızca kullanıcı seçimini temsil eder ve fallback'te DEĞİŞMEZ.
  const [activeMethod, setActiveMethod] = useState<number>(() =>
    resolveDefaultPrayerMethod(localStorage.getItem("mnv_prayer_method"))
  );
  const [activeSource, setActiveSource] = useState<PrayerTimesSource | null>(null);
  // Matematiksel hesaba düşüldüğünde bir kez gösterilen bilgi penceresi.
  const [offlineNoticePending, setOfflineNoticePending] = useState(false);
  const offlineNoticeShownRef = useRef(false);
  const [date, setDate] = useState(new Date());
  const [prayerTimes, setPrayerTimes] = useState<PrayerTime[]>(() =>
    getPrayerTimesFallback(DEFAULT_LOCATION.latitude, DEFAULT_LOCATION.longitude, new Date(), DEFAULT_LOCATION.timezone!)
  );
  // Çok günlü bildirim planlaması için bugün + sonraki günlerin vakitleri (index 0 = BUGÜN).
  // Uygulama günlerce açılmasa da bildirim zincirinin kendi kendine işlemesini sağlar.
  const [multiDayPrayerTimes, setMultiDayPrayerTimes] = useState<PrayerTime[][]>([]);
  const [prayerLoading, setPrayerLoading] = useState(false);
  const [nextPrayerStr, setNextPrayerStr] = useState("");
  const [compassHeading, setCompassHeading] = useState<number | null>(null);
  const [qiblaDir, setQiblaDir] = useState(0);
  const [declination, setDeclination] = useState(0);
  const [deviceBeta, setDeviceBeta] = useState<number | null>(null);
  // Manyetik alan bozukken (metal/mıknatıs yakını) ölçülen yön güvenilmez:
  // oku soluklaştırıp uyarı gösteriyoruz, yanlış yönü "doğru" gibi göstermiyoruz.
  const [qiblaInterference, setQiblaInterference] = useState(false);
  // Manyetometre kalibrasyonu zayıf: pusula "8 çiz" hareketi istiyor.
  const [qiblaCalibration, setQiblaCalibration] = useState(false);

  // Kâbe'ye kalan açı (-180..180, + = sağa dön). Okla birebir aynı hesap.
  // Pusula uygulama açılır açılmaz çalıştığı için "aç/kapa" durumu yok.
  const qiblaDelta = compassHeading !== null
    ? ((((qiblaDir - declination - compassHeading + 540) % 360) + 360) % 360) - 180
    : null;
  const QIBLA_LOCK_DEG = 5;   // hedefe "vardım" sayılan açı
  const qiblaLocked = !qiblaInterference && !qiblaCalibration && qiblaDelta !== null && Math.abs(qiblaDelta) <= QIBLA_LOCK_DEG;
  // Uzakken amber, yaklaşırken lime, kilitlenince yeşil (yumuşak ton geçişi).
  const qiblaT = qiblaDelta === null ? 1 : Math.min(1, Math.max(0, (Math.abs(qiblaDelta) - QIBLA_LOCK_DEG) / 25));
  const qiblaHue = 160 - 122 * qiblaT;
  const qiblaColor = `hsl(${qiblaHue.toFixed(1)} ${(64 + 28 * qiblaT).toFixed(1)}% ${(52 - 2 * qiblaT).toFixed(1)}%)`;
  const qiblaColorDeep = `hsl(${qiblaHue.toFixed(1)} ${(64 + 28 * qiblaT).toFixed(1)}% ${(40 - 2 * qiblaT).toFixed(1)}%)`;
  // Telefon dik tutulduğunda ekranın "üstü" gökyüzünü gösterir; kıble okunun
  // ekran düzlemindeki karşılığı ~90° kayar. Kullanıcıyı düz tutuşa yönlendir.
  // Sensör hiç yoksa uyarı anlamsız olur, o yüzden yalnızca veri varken gösteriliyor.
  const qiblaHoldFlat = compassHeading !== null && deviceBeta !== null && Math.abs(deviceBeta) > 40;
  // Kilitlenmeye girerken tek atımlık nabız (sürekli animasyon yok).
  const [qiblaPulse, setQiblaPulse] = useState(0);
  useEffect(() => { if (qiblaLocked) setQiblaPulse(n => n + 1); }, [qiblaLocked]);
  // Kilitlenince kısa titreşim: ekrana bakmadan da "tamam" geri bildirimi.
  useEffect(() => {
    if (!qiblaLocked) return;
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") navigator.vibrate(60);
  }, [qiblaLocked]);
  useEffect(() => {
    const onOrientation = (e: DeviceOrientationEvent) => {
      if (typeof e.beta === "number") setDeviceBeta(e.beta);
    };
    window.addEventListener("deviceorientation", onOrientation as EventListener);
    return () => window.removeEventListener("deviceorientation", onOrientation as EventListener);
  }, []);
  const [compassUnsupported, setCompassUnsupported] = useState(false);
  // Play'den indirilen yeni sürüm hazır: "Güncelleme hazır — yeniden başlat" satırı.
  const [updateReady, setUpdateReady] = useState(false);
  // Bulunulan noktanın beklenen manyetik alan şiddeti (μT). Girişim uyarısı mutlak
  // bir μT eşiği yerine buna göre oransal hesaplanır: alan Brezilya'da ~23,
  // Almanya'da ~48 μT olabilir; tek bir sabit sayı global uygulamada yanıltıcı.
  const expectedFieldUt = useMemo(
    () => magneticFieldIntensity(location.latitude, location.longitude),
    [location.latitude, location.longitude]
  );
  // Yönü bozan asıl büyüklük alanın yatay bileşeni; girişim önce buna göre ölçülür.
  const expectedHorizontalUt = useMemo(
    () => magneticFieldHorizontal(location.latitude, location.longitude),
    [location.latitude, location.longitude]
  );
  const [showLocationPrompt, setShowLocationPrompt] = useState(
    () => !localStorage.getItem("mnv_location_prompted")
  );
  // İlk kurulumda pil optimizasyonu muafiyeti için bilgilendirme penceresi.
  const [showBatteryPrompt, setShowBatteryPrompt] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(
    () => !localStorage.getItem("mnv_onboarded_v1")
  );
  const [showTesbih, setShowTesbih] = useState(false);
  const [showReligious, setShowReligious] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  // Kullanıcı "Konumu Bul" seçtiyse bu flag localStorage'da true kalır.
  // Bu sayede: (1) uygulama her açılışında, (2) her 30 dakikada bir konum otomatik güncellenir.
  const [autoLocationEnabled, setAutoLocationEnabled] = useState<boolean>(
    () => localStorage.getItem("mnv_auto_location") === "true"
  );

  // ── Destekçi Rozeti (Google Play Billing) ── App seviyesinde, çünkü hem
  // Ayarlar panelinde hem de ana sayfanın altındaki footer'da gösteriliyor.
  const [isSupporterUser, setIsSupporterUser] = useState(false);
  const [supporterLoading, setSupporterLoading] = useState(true);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [supporterNotice, setSupporterNotice] = useState("");
  const [themeToast, setThemeToast] = useState("");
  const showThemeToast = (msg: string) => { setThemeToast(msg); setTimeout(() => setThemeToast(""), 2500); };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setSupporterLoading(true);
      // getSupporterProducts() burada fiyat göstermek için değil, Play Billing
      // bağlantısını ve native taraftaki ürün önbelleğini önceden ısıtmak için
      // çağrılıyor — purchase() anında daha hızlı açılsın diye.
      const [, ownedStatus] = await Promise.all([
        getSupporterProducts(),
        checkIsSupporter(),
      ]);
      if (!cancelled) {
        setIsSupporterUser(ownedStatus);
        setSupporterLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const notifySupporter = (msg: string) => { setSupporterNotice(msg); setTimeout(() => setSupporterNotice(""), 3000); };

  const handleSupporterPurchase = async (productId: SupporterProductId) => {
    setPurchasingId(productId);
    const result = await purchaseSupporterBadge(productId);
    setPurchasingId(null);
    if (result.success) {
      setIsSupporterUser(true);
      notifySupporter(t("supporterThankYou", lang));
    } else if (result.message) {
      notifySupporter(result.message);
    }
  };

  const handleSupporterRestore = async () => {
    const restored = await restoreSupporterPurchases();
    setIsSupporterUser(restored);
    notifySupporter(restored ? t("supporterRestoredSuccess", lang) : t("supporterRestoredNone", lang));
  };

  const moonPhase = useMemo(() => calcMoonPhase(date), [date]);
  const solarTimes = useMemo(
    () => calcSolarTimes(location.latitude, location.longitude, date, location.timezone || "Europe/Istanbul"),
    [location.latitude, location.longitude, date, location.timezone]
  );
  const tTheme = THEMES[themeKey];
  const isLight = ["seher","gul","nane","vaha","nilufer","lavanta"].includes(themeKey);

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

  // ─── Play güncellemesi (sessiz indirme) ───────────────────────────────────
  // Açılıştan 6 sn sonra sorulur: onboarding/konum/pil pencereleriyle çakışmasın.
  // Güncelleme indirilince satır çıkar, kullanıcı dokununca uygulama yeniden başlar.
  useEffect(() => {
    let stop = () => {};
    const id = setTimeout(() => { stop = watchAppUpdate(setUpdateReady); }, 6000);
    return () => { clearTimeout(id); stop(); };
  }, []);

  const lastFetchKey = useRef("");
  const wasOfflineRef = useRef(false);
  const retryOnlineRef = useRef<() => void>(() => {});
  const methodLabel = (id: number) => {
    const m = PRAYER_METHODS.find(x => x.id === id);
    return m ? (m.label[lang] || m.label.en) : "";
  };
  const loadPrayerTimes = async (loc: Location, method: number, dt: Date, force = false) => {
    const key = `${loc.latitude.toFixed(2)}_${loc.longitude.toFixed(2)}_${dt.getDate()}_${dt.getMonth()}_${dt.getFullYear()}_${method}`;
    if (!force && lastFetchKey.current === key) return;
    lastFetchKey.current = key;
    setPrayerLoading(true);
    try {
      const result = await fetchPrayerTimes(
        loc.latitude, loc.longitude, dt, loc.timezone || "Europe/Istanbul", method,
        force ? { force: true } : undefined
      );
      const { times, source } = result;
      setPrayerTimes(times);
      setActiveSource(source);
      // Etkin metot: offline matematik hesabına düşüldüyse 99; aksi halde seçili metot.
      setActiveMethod(method === 99 || source === "offline" ? 99 : method);

      if (source === "api") {
        // Yeniden bağlanınca bir sonraki çevrimdışı dönem için pencereyi sıfırla.
        offlineNoticeShownRef.current = false;
        setOfflineNoticePending(false);
        // Gerçekten çevrimdışı/önbellek durumundan API'ye dönüldüyse kısa bildirim.
        // Kullanıcının bilerek 99 seçip sonra başka metoda geçmesi "yeniden bağlandı" sayılmaz.
        if (wasOfflineRef.current && method !== 99) {
          showThemeToast(`${t("backOnlineToast", lang)} · ${methodLabel(method)}`);
        }
        wasOfflineRef.current = false;
      } else if (source === "offline" && method !== 99 && !offlineNoticeShownRef.current) {
        // Yalnızca gerçekten matematiksel hesap kullanıldığında (önbellek yok) bilgi ver.
        offlineNoticeShownRef.current = true;
        setOfflineNoticePending(true);
      }
      if (source === "cache" || (source === "offline" && method !== 99)) {
        wasOfflineRef.current = true;
      }

      // Çok günlü bildirim planlaması için bugünün + ufuktaki günlerin vakitlerini çek.
      // İlk günü yeniden çekmek yerine cache'ten (aynı key) anında gelir; ek günler tek ya
      // da birkaç ağ isteği demektir. Başarısız olursa sessizce geç — scheduler 2 güne düşer.
      try {
        const days: PrayerTime[][] = [];
        for (let i = 0; i < NOTIFICATION_HORIZON_DAYS; i++) {
          const d = new Date(dt);
          d.setDate(d.getDate() + i);
          const dayResult = await fetchPrayerTimes(
            loc.latitude, loc.longitude, d, loc.timezone || "Europe/Istanbul", method,
            source !== "api" ? { offlineOnly: true } : undefined
          );
          days.push(dayResult.times);
        }
        setMultiDayPrayerTimes(days);
      } catch { /* çok günlü veri yok — yalnızca bugün+yarın planlanır */ }
    } catch {
      setMultiDayPrayerTimes([]);
      setPrayerTimes(getPrayerTimesFallback(loc.latitude, loc.longitude, dt, loc.timezone || "Europe/Istanbul"));
      setActiveSource("offline");
      setActiveMethod(99);
    } finally { setPrayerLoading(false); }
  };

  // İnternet geri geldiğinde / uygulama öne geldiğinde: seçili metot 99 değilse ve
  // elimizdeki veri API'den gelmiyorsa (önbellek veya matematiksel) zorla yeniden çek.
  retryOnlineRef.current = () => {
    if (typeof navigator !== "undefined" && navigator.onLine === false) return;
    if (prayerMethod === 99) return;
    if (!activeSource || activeSource === "api") return;
    lastFetchKey.current = "";
    loadPrayerTimes(location, prayerMethod, date, true);
  };

  // Bildirimleri (varsa durum bildirimi dahil) yeniden planlayan ortak fonksiyon.
  // Hem prayerTimes/enabled değiştiğinde hem de uygulama ön plana her geldiğinde
  // çağrılır (aşağıya bakınız).
  const rescheduleNotifications = useRef<() => void>(() => {});
  rescheduleNotifications.current = () => {
    if (prayerTimes.length > 0 && notificationSettings.enabled) {
      schedulePrayerNotifications(prayerTimes, notificationSettings, location.name, lang, undefined, multiDayPrayerTimes, location.timezone || "Europe/Istanbul")
        .then(r => console.log("[Meccanen] Bildirim planlama sonucu:", r));
    }
  };

  useEffect(() => {
    rescheduleNotifications.current();
  }, [prayerTimes, notificationSettings.enabled]);

  // Ana ekran widget'ları (sayısal + sematik yay) için veriyi native köprüye it.
  // `date` state'i her saniye tick ettiği için depend'e ALINMAZ; gün tarihleri
  // widgetBridge konumun zaman dilimine göre kendisi hesaplar.
  useEffect(() => {
    const days = multiDayPrayerTimes.length > 0
      ? multiDayPrayerTimes
      : prayerTimes.length > 0 ? [prayerTimes] : [];
    if (days.length === 0) return;
    const payload = buildWidgetPayload(
      days,
      location.name,
      themeKey,
      lang,
      location.timezone || "Europe/Istanbul",
      location.latitude,
      location.longitude,
      prayerMethod
    );
    syncWidgets(payload);
  }, [multiDayPrayerTimes, prayerTimes, location, themeKey, lang, prayerMethod]);

  // Açılışta, tanılama döneminden kalma test bildirimlerini (7997/7998/7999)
  // cihazın bildirim ekranından temizle.
  useEffect(() => {
    cleanupTestNotifications();
  }, []);

// Kesin alarm izni: Bildirimler AÇIKKEN izin kapalıysa, kullanıcıyı sistemin
// "Alarmlar ve hatırlatıcılar" sayfasına doğrudan yönlendir (kullanıcı her seferinde
// rahatsız olmasın diye yalnızca bir kez, localStorage bayrağı ile). Bu efecto
// hem uygulama açılışında (bildirimler zaten açıksa) hem de kullanıcı bildirimleri
// daha sonra etkinleştirdiğinde çalışır.
useEffect(() => {
  if (!notificationSettings.enabled) return;
  if (localStorage.getItem("mnv_exact_alarm_prompted")) return;
  localStorage.setItem("mnv_exact_alarm_prompted", "1");
  (async () => {
    if (!(await exactAlarmsAllowed())) await openExactAlarmSettings();
  })();
}, [notificationSettings.enabled]);

  // İlk kurulumda (onboarding ve konum penceresi kapandıktan sonra) pil optimizasyonu
  // muafiyeti için nazik bir bilgilendirme penceresi göster; kullanıcı "Ayarları Aç"a
  // basınca sistem ekranı (`promptBatteryWhitelist`) açılır. Manifest'te
  // REQUEST_IGNORE_BATTERY_OPTIMIZATIONS izni olmalı (bkz. add_perms.py); aksi halde
  // sistem ekranı sessizce açılmaz.
  useEffect(() => {
    if (showOnboarding || showLocationPrompt) return;
    if (localStorage.getItem("mnv_battery_prompted")) return;
    const id = setTimeout(() => {
      localStorage.setItem("mnv_battery_prompted", "1");
      setShowBatteryPrompt(true);
    }, 700);
    return () => clearTimeout(id);
  }, [showOnboarding, showLocationPrompt]);

  // ÖNEMLİ: Yukarıdaki effect, React'in `prayerTimes`/`enabled` REFERANS değişikliğine
  // bağlı çalışır — ama uygulama arka plandan öne geldiğinde (basit resume, tam cold
  // start olmadan) bu referanslar değişmeyebilir, effect hiç tetiklenmez. Bu durumda
  // "şu an hangi vakitteyiz" bildirimi güncel kalmaz/silinip geri gelmez. Bunu kesin
  // çözmek için, tarayıcının kendi `visibilitychange` olayını dinleyip uygulama her
  // görünür hale geldiğinde AÇIKÇA yeniden planlıyoruz — native bir eklentiye ihtiyaç
  // duymadığı için ek bir çökme riski taşımıyor.
  useEffect(() => {
    const handleVisible = () => {
      if (document.visibilityState === "visible") {
        rescheduleNotifications.current();
        retryOnlineRef.current();
      }
    };
    // İnternet geri geldiğinde (cihaz çevrimdışıyken çevrimiçi olunca) seçili
    // metoda dönmek için yeniden çek.
    const handleOnline = () => retryOnlineRef.current();
    window.addEventListener("online", handleOnline);
    document.addEventListener("visibilitychange", handleVisible);
    // Bazı Capacitor/Cordova sürümleri ek olarak bu klasik olayı da yayınlar;
    // varsa yakalarız, yoksa hiçbir şey değişmez (zararsız).
    document.addEventListener("resume", handleVisible);
    return () => {
      window.removeEventListener("online", handleOnline);
      document.removeEventListener("visibilitychange", handleVisible);
      document.removeEventListener("resume", handleVisible);
    };
  }, []);

  useEffect(() => { loadPrayerTimes(location, prayerMethod, date); }, [location.latitude, location.longitude, date.getDate(), date.getMonth(), prayerMethod]);
  const handleRefresh = () => { lastFetchKey.current = ""; loadPrayerTimes(location, prayerMethod, date, true); };

  useEffect(() => {
    setQiblaDir(calcQiblaDirection(location.latitude, location.longitude));
    // Pusula manyetik kuzeyi gösterir, kıble açısı ise gerçek kuzeye göredir. Aradaki
    // sapma (Türkiye'de ~4-6.5°) düzeltilmezse ibre sistematik olarak kayar.
    setDeclination(magneticDeclination(location.latitude, location.longitude, date));
  }, [location.latitude, location.longitude, date]);

  useEffect(() => {
    // Pusula uygulama açık olduğu sürece çalışır: "göster" butonu yok.
    // Uygulama arka plana atıldığında dinleyici bırakılır (native poll 250 ms'de bir
    // manyetometre okuyor; boşuna pil harcamasın), öne gelince yeniden başlar.
    let detach: (() => void) | null = null;
    let unsupportedTimer: number | null = null;

    const start = () => {
      if (detach) return;
      setCompassUnsupported(false);
      // Her yeniden başlatmada temiz durum: dinleyici kaliteyi ~1 s içinde
      // yeniden bildirir; böylece arka plandan dönerken eski uyarı takılı kalmaz.
      setQiblaInterference(false);
      setQiblaCalibration(false);
      requestCompassPermission().then(ok => { if (!ok) setCompassUnsupported(true); });
      detach = attachCompassListener(
        (h) => setCompassHeading(h),
        (q) => {
          setQiblaInterference(q.interference);
          setQiblaCalibration(q.calibrationNeeded);
        },
        { expectedFieldUt, expectedHorizontalUt },
      );

      // Bazı cihazlarda (manyetometre çipi olmayan veya sisteme erişilemeyen eski/bütçe
      // Android telefon ve tabletler) yön sensörü hiç veri döndürmez — tarayıcı bunu
      // belirtmek için tek seferlik, tüm alanları boş bir olay gönderir ve bir daha
      // hiç tetiklenmez. Bu durumda oku sonsuza dek "bekleniyor" göstermek yerine,
      // birkaç saniye içinde gerçek veri gelmezse uyarı gösteriyoruz.
      unsupportedTimer = window.setTimeout(() => {
        setCompassHeading(prev => {
          if (prev === null) setCompassUnsupported(true);
          return prev;
        });
      }, 2500);
    };

    const stop = () => {
      if (detach) { detach(); detach = null; }
      if (unsupportedTimer !== null) { clearTimeout(unsupportedTimer); unsupportedTimer = null; }
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") start();
      else stop();
    };

    if (document.visibilityState === "visible") start();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      stop();
    };
  }, [expectedFieldUt]);

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
        // Koordinat aynı olsa bile saat dilimi eski sürümde boylamdan yanlış
        // tahmin edilmiş olabilir (ör. Türkiye → Europe/Helsinki). Cihazın gerçek
        // saat dilimiyle düzelt.
        const deviceTz = getDeviceTimezone();
        if (deviceTz && location.timezone !== deviceTz) {
          setLocationAndSave({ ...location, timezone: deviceTz });
        }
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
        // GPS ile bulunulan konumda cihazın saat dilimi doğrudur (ağ gerekmez).
        // Cihaz saati UTC/geçersizse Open-Meteo'dan çöz.
        timezone: getDeviceTimezone() || (await fetchTimezone(coords.latitude, coords.longitude)) || guessTimezone(coords.longitude),
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

  // ─── Tek seferlik saat dilimi migrasyonu ──────────────────────────────────
  // Eski sürümler GPS konumunun saat dilimini boylamdan tahmin ediyordu
  // (guessTimezone). Bu, DST uygulamayan ülkelerde (ör. Türkiye → Europe/Helsinki)
  // yaz saati bitince vakitlerde 1 saat kaymaya yol açıyordu. Kayıtlı konumları
  // gerçek IANA saat dilimiyle bir kez düzelt. Ağ yoksa bir sonraki açılışta tekrar dener.
  useEffect(() => {
    const FLAG = "mnv_tz_fix_v1";
    if (localStorage.getItem(FLAG) === "1") return;
    let cancelled = false;

    // Yalnızca boylam tahminiyle birebir eşleşen konumlar şüpheli olabilir;
    // geocoding'den gelen doğru saat dilimleri (ör. İstanbul ≠ Helsinki) atlanır.
    const isSuspicious = (loc: Location) => loc.timezone === guessTimezone(loc.longitude);

    (async () => {
      const targets: Location[] = [];
      const seen = new Set<string>();
      const addTarget = (loc: Location) => {
        const key = `${loc.latitude.toFixed(3)}_${loc.longitude.toFixed(3)}`;
        if (seen.has(key) || !isSuspicious(loc)) return;
        seen.add(key);
        targets.push(loc);
      };
      addTarget(location);
      savedLocations.forEach(addTarget);

      if (targets.length === 0) {
        localStorage.setItem(FLAG, "1");
        return;
      }

      const resolved = new Map<string, string | null>();
      for (let i = 0; i < targets.length; i += 4) {
        const chunk = targets.slice(i, i + 4);
        const tzs = await Promise.all(chunk.map(l => fetchTimezone(l.latitude, l.longitude)));
        chunk.forEach((l, j) => {
          resolved.set(`${l.latitude.toFixed(3)}_${l.longitude.toFixed(3)}`, tzs[j]);
        });
      }
      if (cancelled) return;

      // Ağ hatası olduysa hiçbir şeyi değiştirme ve bayrağı koyma → sonraki açılışta tekrar dene.
      if ([...resolved.values()].some(v => v === null)) return;

      const fix = (loc: Location): Location => {
        const tz = resolved.get(`${loc.latitude.toFixed(3)}_${loc.longitude.toFixed(3)}`);
        return tz && tz !== loc.timezone ? { ...loc, timezone: tz } : loc;
      };

      const fixedLocation = fix(location);
      if (fixedLocation !== location) setLocationAndSave(fixedLocation);

      const fixedSaved = savedLocations.map(fix);
      if (fixedSaved.some((l, i) => l !== savedLocations[i])) setSavedLocations(fixedSaved);

      localStorage.setItem(FLAG, "1");
    })();

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLocationDenied = () => {
    setShowLocationPrompt(false);
    localStorage.setItem("mnv_location_prompted", "true");
  };

  const localTime = useMemo(() => {
    const tz = location.timezone || "Europe/Istanbul";
    let hour="--", min="--", sec="--", weekday="—", gregDay="--", gregMonthYear="— —";
    let hijriDay="--", hijriMonth="—", hijriYear="----";
    try {
      const locale = getLocale(lang);
      const tp = new Intl.DateTimeFormat("en-US",{timeZone:tz,hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false}).formatToParts(date);
      hour=tp.find(p=>p.type==="hour")?.value||"--";
      min=tp.find(p=>p.type==="minute")?.value||"--";
      sec=tp.find(p=>p.type==="second")?.value||"--";
      weekday=new Intl.DateTimeFormat(locale,{timeZone:tz,weekday:"long"}).format(date);
      // Miladi tarih alanları: fa/ar gibi yerellerde varsayılan takvim
      // Hicri/Şemsi olabildiği için Gregoryen açıkça sabitlenir.
      gregDay=new Intl.DateTimeFormat(locale,{timeZone:tz,day:"numeric",calendar:"gregory"}).format(date);
      gregMonthYear=new Intl.DateTimeFormat(locale,{timeZone:tz,month:"long",year:"numeric",calendar:"gregory"}).format(date);
      const months = getHijriMonths(lang);
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


  const effectiveMethodLabel = methodLabel(activeMethod);
  // Kullanıcı 99'u kendi seçmediyse ve matematiksel hesaba düşüldüyse uyarı tonu kullan.
  const isAutoOffline = activeMethod === 99 && prayerMethod !== 99;

  // Sondaki küçük ikon butonları (Dil / Tema / Ayarlar) — normalde 3. satırda,
  // 3. satır taşarsa üst satıra (uygulama adının sağına) taşınırlar.
  const headerIcons = (
    <>
      <div ref={langMenuRef} className="relative shrink-0">
        <button onClick={() => setLangMenuOpen(o => !o)}
          title={t("language", lang)}
          aria-label={t("language", lang)}
          aria-haspopup="listbox"
          aria-expanded={langMenuOpen}
          className={`flex items-center justify-center w-9 h-9 border rounded-full transition-colors cursor-pointer shrink-0 ${langMenuOpen ? `${tTheme.accent} ${hdrBtnBg}` : `${hdrBtnBg} ${hdrBtnText}`}`}>
          <Globe className="w-5 h-5 shrink-0" />
        </button>
        {langMenuOpen && (
          <div role="listbox"
            className={`absolute right-0 top-full mt-2 z-[80] min-w-[150px] rounded-2xl border p-1.5 shadow-2xl ${tTheme.settingsCard}`}>
            {LANGUAGE_LIST.map(l => (
              <button key={l.code} role="option" aria-selected={lang === l.code}
                onClick={() => { setLang(l.code); setLangMenuOpen(false); }}
                className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-colors cursor-pointer ${lang === l.code ? `${tTheme.accent} ${tTheme.card}` : `${tTheme.textSecondary} hover:bg-white/10`}`}>
                <span className="flex items-center gap-2 min-w-0">
                  <span className="tabular-nums">{l.code.toUpperCase()}</span>
                  <span className="font-medium opacity-75 truncate">{l.label}</span>
                </span>
                {lang === l.code && <Check className="w-4 h-4 shrink-0" />}
              </button>
            ))}
          </div>
        )}
      </div>
      <button onClick={() => {
          const order = Object.keys(THEMES) as ThemeKey[];
          const next = order[(order.indexOf(themeKey) + 1) % order.length];
          setTheme(next);
          showThemeToast(t(`theme_${next}`, lang));
        }}
        aria-label={t("theme", lang)}
        className={`flex items-center justify-center w-9 h-9 border rounded-full transition-colors cursor-pointer shrink-0 ${hdrBtnBg} ${hdrBtnTextSm}`}>
        <Palette className="w-5 h-5 shrink-0" />
      </button>
      <button onClick={() => { setSettingsInitialTab("genel"); setSettingsOpen(true); }}
        aria-label={t("settings", lang)}
        className={`flex items-center justify-center w-9 h-9 border rounded-full transition-colors cursor-pointer shrink-0 ${hdrBtnBg} ${hdrBtnText}`}>
        <Settings className="w-5 h-5 shrink-0" />
      </button>
    </>
  );

  return (
    <div dir={isRTL(lang) ? "rtl" : "ltr"} className={`min-h-screen ${tTheme.bg} ${tTheme.textPrimary} flex flex-col relative overflow-hidden p-3 sm:p-6 md:p-8 transition-colors duration-700`}>
      {showLocationPrompt && (
        <LocationPermissionPrompt
          onAllow={handleLocationAllowed}
          onDeny={handleLocationDenied}
          lang={lang}
        />
      )}

      {showBatteryPrompt && (
        <BatteryOptimizationPrompt
          lang={lang}
          onOpen={async () => { setShowBatteryPrompt(false); await promptBatteryWhitelist(); }}
          onDismiss={() => setShowBatteryPrompt(false)}
        />
      )}

      {offlineNoticePending && !showOnboarding && !showLocationPrompt && !showBatteryPrompt && !settingsOpen && (
        <OfflineMethodNotice
          lang={lang}
          onOk={() => setOfflineNoticePending(false)}
          onChange={() => {
            setOfflineNoticePending(false);
            setSettingsInitialTab("metot");
            setSettingsOpen(true);
          }}
        />
      )}

      {settingsOpen && (
        <SettingsPanel
          theme={themeKey} setTheme={setTheme}
          location={location} setLocation={setLocationAndSave}
          savedLocations={savedLocations} setSavedLocations={setSavedLocations}
          prayerMethod={prayerMethod} setPrayerMethod={setPrayerMethod}
          activeMethod={activeMethod}
          notificationSettings={notificationSettings}
          setNotificationSettings={setNotificationSettings}
          prayerTimes={prayerTimes}
          multiDayPrayerTimes={multiDayPrayerTimes}
          onClose={() => setSettingsOpen(false)} t={tTheme}
          lang={lang} setLang={setLang}
          onFindLocation={handleFindLocation}
          isDetectingLocation={isDetectingLocation}
          autoLocationEnabled={autoLocationEnabled}
          onToggleAutoLocation={handleToggleAutoLocation}
          initialTab={settingsInitialTab}
          isSupporterUser={isSupporterUser}
          supporterLoading={supporterLoading}
          purchasingId={purchasingId}
          onSupporterPurchase={handleSupporterPurchase}
          onSupporterRestore={handleSupporterRestore}
          onOpenReligious={() => { setSettingsOpen(false); setShowReligious(true); }}
        />
      )}

      <div className="w-full max-w-2xl mx-auto flex flex-col gap-4 sm:gap-5 relative z-10 animate-fadeIn">

        {/* Header — 3 satırlık yapı:
            1) Marka: yalnızca MECCANEN + uygulama adı. İkisi tek satırda kalır
               (uygulama adı truncate) → asla alt satıra ya da ekran dışına taşmaz.
            2) Konum: tam genişlik buton, tıklayınca kayıtlı konumlar açılır liste.
            3) Tüm eylem butonları (tesbih, takvim, yazı boyutu, dil, tema, ayarlar). */}
        <header className="flex flex-col gap-2 pb-4">
          {/* 1. Satır — marka */}
          <div className="flex items-center gap-2 min-w-0">
            <button onClick={() => { setSettingsInitialTab("meccanen"); setSettingsOpen(true); }}
              className="cursor-pointer select-none hover:opacity-75 transition-opacity duration-200 shrink-0">
              {/* NOT: Bu başlık kasıtlı olarak text-[Npx] (sabit piksel) kullanıyor —
                  Tailwind'in text-2xl/3xl gibi rem-tabanlı sınıflarını KULLANMIYOR,
                  bu yüzden üst menüdeki "Aa" yazı boyutu büyütme sisteminden etkilenmez. */}
              <span className={`text-[26px] sm:text-[32px] font-extrabold tracking-widest ${tTheme.accent} leading-none`}>
                MECCANEN
              </span>
            </button>
            <span className={`text-sm sm:text-base font-semibold min-w-0 truncate flex-1 ${tTheme.textSecondary}`}>
              {t("appName", lang)}
            </span>
            {iconsInHeader && (
              <div className="flex items-center gap-2 shrink-0">{headerIcons}</div>
            )}
          </div>

          {/* 2. Satır — konum: tıklayınca kayıtlı konumlar aşağı açılır listede */}
          <div className="relative" ref={locMenuRef}>
            <button onClick={() => setLocMenuOpen(o => !o)}
              aria-haspopup="listbox"
              aria-expanded={locMenuOpen}
              className={`inline-flex items-center gap-2 h-12 w-full px-4 border rounded-full text-base font-bold ${tTheme.accent} ${hdrBtnBg} transition-all cursor-pointer min-w-0`}>
              <MapPin className="w-5 h-5 shrink-0" />
              <span className="truncate flex-1 text-start">{location.name}{location.country ? `, ${location.country}` : ""}</span>
              <ChevronsDown className={`w-4 h-4 shrink-0 transition-transform ${locMenuOpen ? "rotate-180" : "-rotate-90"}`} />
            </button>

            {locMenuOpen && (
              <div role="listbox" className={`absolute inset-x-0 top-full mt-2 z-[60] rounded-2xl border p-1.5 shadow-2xl ${tTheme.settingsCard}`}>
                {savedLocations.map((l, i) => {
                  const active = l.latitude.toFixed(3) === location.latitude.toFixed(3) && l.longitude.toFixed(3) === location.longitude.toFixed(3);
                  return (
                    <div key={i} className={`flex items-center rounded-xl ${active ? tTheme.card : ""}`}>
                      <button role="option" aria-selected={active}
                        onClick={() => { setLocationAndSave(l); setLocMenuOpen(false); }}
                        className={`flex items-center gap-2 flex-1 min-w-0 px-3 py-2.5 text-sm font-bold text-start transition-colors cursor-pointer ${active ? tTheme.accent : `${tTheme.textSecondary} hover:bg-white/10`}`}>
                        {active ? <Check className="w-4 h-4 shrink-0" /> : <MapPin className="w-4 h-4 shrink-0" />}
                        <span className="truncate">{l.name}{l.country ? `, ${l.country}` : ""}</span>
                      </button>
                      {savedLocations.length > 1 && (
                        <button aria-label={t("delete", lang)}
                          onClick={() => {
                            const next = savedLocations.filter((_, j) => j !== i);
                            setSavedLocations(next);
                            if (active) setLocationAndSave(next[0]);
                          }}
                          className={`shrink-0 p-2 me-1 rounded-xl transition-colors cursor-pointer ${tTheme.textMuted} hover:text-red-400`}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
                <div className={`my-1 border-t ${tTheme.header}`} />
                <button onClick={() => { setLocMenuOpen(false); setShowAddLocation(true); }}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold text-start transition-colors cursor-pointer ${tTheme.accent} hover:bg-white/10`}>
                  <Plus className="w-4 h-4 shrink-0" />
                  {t("addLocation", lang)}
                </button>
              </div>
            )}
          </div>

          {/* 3. Satır — kalan eylem butonları (taşarsa sondaki ikonlar üst satıra geçer) */}
          <div ref={row3Ref} className="flex items-center gap-1 flex-nowrap">
            <button onClick={() => setShowTesbih(true)}
              title={t("tesbih", lang)}
              aria-label={t("tesbih", lang)}
              className={`ms-auto inline-flex items-center gap-1.5 px-3 py-2 border rounded-full text-sm font-bold transition-colors cursor-pointer shrink-0 ${tTheme.accent} ${hdrBtnBg}`}>
              <CircleDot className="w-4 h-4 shrink-0" /><span className="min-w-0">{t("tesbih", lang)}</span>
            </button>
            <button onClick={() => setShowReligious(true)}
              title={t("relTitle", lang)}
              aria-label={t("relTitle", lang)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 border rounded-full text-sm font-bold transition-colors cursor-pointer shrink-0 ${tTheme.accent} ${hdrBtnBg}`}>
              <Calendar className="w-4 h-4 shrink-0" /><span className="min-w-0">{t("relTitle", lang)}</span>
            </button>
            <button onClick={cycleFontScale}
              title={t("fontSizeLabel", lang)}
              aria-label={t("fontSizeLabel", lang)}
              className={`px-3 py-1.5 text-sm sm:text-base font-bold border rounded-full transition-transform duration-300 cursor-pointer hover:scale-105 active:scale-95 shrink-0 ${isFontScaleChanging ? "scale-110 ring-2 ring-current/30" : ""} ${hdrBtnBg} ${hdrBtnText}`}>
              Aa
            </button>
            {!iconsInHeader && headerIcons}
          </div>
        </header>

        {/* Play'den yeni sürüm sessizce indirildi: tek satır, tek dokunuş.
            (Güncelleme yoksa/elle kurulmuş APK'da hiç görünmez — §16) */}
        {updateReady && (
          <div className={`flex items-center gap-3 w-full px-4 py-3 rounded-2xl border text-base sm:text-lg font-semibold ${isLight ? "bg-sky-500/10 border-sky-500/40 text-sky-800" : "bg-sky-500/10 border-sky-500/35 text-sky-200"}`}>
            <Download className="w-5 h-5 shrink-0" />
            <span className="min-w-0 flex-1 leading-snug">{t("updateReady", lang)}</span>
            <button onClick={() => { void restartForUpdate(); }}
              className={`shrink-0 px-4 py-2 rounded-xl text-base font-bold cursor-pointer transition-colors ${isLight ? "bg-sky-600 text-white hover:bg-sky-700" : "bg-sky-500 text-slate-900 hover:bg-sky-400"}`}>
              {t("updateRestart", lang)}
            </button>
          </div>
        )}

        <section className={`${tTheme.card} border rounded-3xl p-6 sm:p-7 transition-all duration-300 shadow-2xl`}>
          <div className={`flex items-center justify-center gap-1.5 mb-2 ${tTheme.accent}`}>
            <MapPin className="w-4 h-4 shrink-0" />
            <span className="text-sm sm:text-base font-bold truncate max-w-full">{location.name}{location.country ? `, ${location.country}` : ""}</span>
          </div>
          {/* Etkin hesaplama yöntemi — tıklayınca metot sekmesi açılır. */}
          <div className="flex justify-center mb-2">
            <button
              onClick={() => { setSettingsInitialTab("metot"); setSettingsOpen(true); }}
              title={t("prayerMethod", lang)}
              className={`inline-flex items-center gap-1.5 max-w-full px-3 py-1 rounded-full border text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
                isAutoOffline
                  ? "border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
                  : `${hdrBtnBg} ${hdrBtnText}`
              }`}>
              {activeMethod === 99
                ? <WifiOff className="w-3.5 h-3.5 shrink-0" />
                : <Sparkles className="w-3.5 h-3.5 shrink-0" />}
              <span className="truncate">{effectiveMethodLabel}</span>
              {activeSource === "cache" && activeMethod !== 99 && (
                <span className="shrink-0 opacity-70 font-semibold">· {t("cacheBadge", lang)}</span>
              )}
              <ChevronsDown className="w-3.5 h-3.5 shrink-0 -rotate-90 opacity-70" />
            </button>
          </div>
          {/* Saat her zaman soldan sağa okunur; RTL arayüzde saniyeler
              saatın soluna kaymasın diye kapsayıcı LTR'ye sabitlenir. */}
          <div dir="ltr" className="flex items-baseline justify-center font-mono select-none mb-1">
            <span className={`text-6xl sm:text-7xl md:text-8xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b ${tTheme.clockGrad} tracking-tight`}>
              {localTime.hour}:{localTime.min}
            </span>
            <span className={`text-[22px] sm:text-[28px] font-light ${tTheme.secColor} ml-2 animate-pulse`}>:{localTime.sec}</span>
          </div>
          <p className={`text-center text-sm sm:text-base font-medium ${tTheme.textSecondary} mb-4`}>{localTime.weekday}</p>

          {nextPrayerStr && (
            <div className={`mb-5 p-4 rounded-2xl border-2 ${tTheme.prayerActive} flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 shadow-lg`}>
              <span className="text-sm sm:text-base font-semibold uppercase tracking-wide text-center opacity-80">
                {lang === "tr"
                  ? "Sonraki Vakte Kalan Süre:"
                  // Farsça'da "in" edatı (تا) isimden ÖNCE gelir: "تا نماز بعدی".
                  : lang === "fa"
                    ? `${t("in", lang)} ${t("nextPrayer", lang)}`
                    : `${t("nextPrayer", lang)} ${t("in", lang)}`}
              </span>
              <span className="text-3xl sm:text-4xl font-mono font-extrabold">{nextPrayerStr.split(": ")[1] || nextPrayerStr}</span>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-5">
            {prayerTimes.map((item, idx) => (
              <div key={item.key}
                className={`flex flex-col items-center justify-center py-3 sm:py-4 px-0.5 sm:px-2 rounded-xl border-2 transition-all duration-200 ${activePrayerIndex === idx ? `${tTheme.prayerActive} ring-2` : "border-transparent bg-black/20"}`}>
                <div className={`text-sm sm:text-base font-bold tracking-wide truncate w-full text-center ${activePrayerIndex === idx ? "" : tTheme.textMuted}`}>{t(`prayer_${item.key}`, lang) || item.name}</div>
                <div className={`text-2xl sm:text-4xl font-mono font-extrabold mt-1 leading-none ${activePrayerIndex === idx ? "" : tTheme.textSecondary}`}>{item.time}</div>
              </div>
            ))}
          </div>

          {prayerLoading && (
            <div className={`flex items-center justify-center gap-2 -mt-3 mb-4 text-sm ${tTheme.textMuted}`}>
              <RefreshCw className="w-4 h-4 animate-spin" />{t("updating", lang)}
            </div>
          )}

          <div className={`border-t pt-5 flex items-start gap-3 ${tTheme.header}`}>
            <div className="flex-1 text-center">
              <div className={`text-sm sm:text-base font-semibold tracking-wide ${tTheme.accent2} mb-2 flex items-center justify-center gap-2`}>
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />{t("gregorian", lang)}
              </div>
              <div className={`text-4xl sm:text-5xl font-bold font-sans ${tTheme.accent2}`}>{localTime.gregDay}</div>
              <div className={`text-base sm:text-lg font-sans ${tTheme.accent2} opacity-80 mt-1`}>{localTime.gregMonthYear}</div>
            </div>
            <div className="flex-1 text-center">
              {/* Başlık yok; ay figürünün diğer sütunların gün rakamlarıyla aynı hizada
                  başlaması için etiket satırı kadar görünmez boşluk bırakılır. */}
              <div className={`text-sm sm:text-base font-semibold tracking-wide mb-2 invisible`} aria-hidden="true">&nbsp;</div>
              <div className={`text-4xl sm:text-5xl ${tTheme.textPrimary}`} title={t(moonPhase.phase, lang)}>{MOON_PHASE_ICONS[moonPhase.phase]}</div>
              <div className={`text-sm sm:text-base mt-1 ${tTheme.textSecondary}`}>{t(moonPhase.phase, lang)} · %{moonPhase.illumination}</div>
            </div>
            <div className="flex-1 text-center">
              <div className={`text-sm sm:text-base font-semibold tracking-wide ${tTheme.hijriAccent} mb-2 flex items-center justify-center gap-2`}>
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />{t("hijri", lang)}
              </div>
              <div className={`text-4xl sm:text-5xl font-bold font-sans ${tTheme.hijriAccent}`}>{localTime.hijriDay}</div>
              <div className={`text-base sm:text-lg font-sans mt-1 ${tTheme.hijriAccent} opacity-80`}>{localTime.hijriMonth} ({localTime.hijriYear} AH)</div>
            </div>
          </div>
        </section>

        <section className={`${tTheme.card} border rounded-2xl p-6 sm:p-7 transition-all duration-300 shadow-xl`}>
          <div className={`text-lg sm:text-xl font-extrabold tracking-wide ${tTheme.accent2} mb-4 flex items-center gap-2`}>
            <Sun className="w-6 h-6 sm:w-7 sm:h-7" />{t("kerahatTitle", lang)}
          </div>

          {(() => {
            const total = solarTimes.sunsetMinutes - solarTimes.sunriseMinutes;
            const parts = new Intl.DateTimeFormat("en-US", {
              timeZone: location.timezone || "Europe/Istanbul", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
            }).formatToParts(date);
            const num = (ty: string) => parseInt(parts.find(p => p.type === ty)?.value || "0");
            const nowMin = num("hour") * 60 + num("minute");
            const nowSec = num("hour") * 3600 + num("minute") * 60 + num("second");
            const isDaytime = nowMin >= solarTimes.sunriseMinutes && nowMin <= solarTimes.sunsetMinutes;
            // Saniye çözünürlüklü yumuşak ilerleme (ibre + güneş sürekli hareket eder).
            const frac = Math.min(1, Math.max(0, (nowSec / 60 - solarTimes.sunriseMinutes) / total));
            // 0 (doğuş) -> 180°(sol), 0.5 (istiva) -> 90°(tepe), 1 (batış) -> 0°(sağ)
            const angleDeg = 180 * (1 - frac);
            const cx = 175, cy = 190, r = 110, needleR = 88;
            const needleColor = isLight ? "#1e293b" : "#f8fafc";

            // Kerahat üçgen rengi temaya göre değişir (belirleyici renk).
            const kerahatHex = KERAHAT_COLORS[themeKey] || "#ef4444";
            const hexToRgba = (hex: string, alpha: number) => {
              const n = parseInt(hex.slice(1), 16);
              return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
            };

            // Kerahat (namazın mekruh olduğu) bantları — yaygın kabul gören yaklaşık süreler:
            // güneş doğuşundan ~45 dk sonrasına kadar, istivanın birkaç dk öncesi/sonrası,
            // ve batıştan ~45 dk öncesinden batışa kadar.
            const minToAngle = (m: number) =>
              180 * (1 - Math.min(1, Math.max(0, (m - solarTimes.sunriseMinutes) / total)));
            const bands = [
              { start: solarTimes.sunriseMinutes, end: solarTimes.sunriseMinutes + 45 },
              { start: solarTimes.solarNoonMinutes - 5, end: solarTimes.solarNoonMinutes + 5 },
              { start: solarTimes.sunsetMinutes - 45, end: solarTimes.sunsetMinutes },
            ];
            const activeBand = isDaytime && bands.find(b => nowSec >= b.start * 60 && nowSec <= b.end * 60);
            const upcomingBand = !activeBand && bands.find(b => b.start * 60 > nowSec && b.start * 60 - nowSec <= 30 * 60);

            const fmtDur = (sec: number) => {
              const t = Math.max(0, Math.round(sec));
              const hh = Math.floor(t / 3600), mm = Math.floor((t % 3600) / 60), ss = t % 60;
              const mmss = `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
              return hh > 0 ? `${hh}:${mmss}` : mmss;
            };

            const outerR = r + 7;
            const pt = (rr: number, a: number) => {
              const rad = (a * Math.PI) / 180;
              return [cx + rr * Math.cos(rad), cy - rr * Math.sin(rad)];
            };
            // Her kerahat vaktini merkezden dış yaya uzanan taralı "üçgen" dilim olarak çizer —
            // ibre bu dilimlerin içine girdiğinde kerahat vaktinde olduğu görülsün.
            const wedgePath = (startMin: number, endMin: number) => {
              const a1 = minToAngle(startMin), a2 = minToAngle(endMin);
              const [ox1, oy1] = pt(outerR, a1), [ox2, oy2] = pt(outerR, a2);
              return `M ${cx},${cy} L ${ox1},${oy1} A ${outerR},${outerR} 0 0 1 ${ox2},${oy2} Z`;
            };

            return (
              <>
                <svg viewBox="0 0 350 235" className="w-full h-auto">
                  <path d={`M ${cx - r},${cy} A ${r},${r} 0 0 1 ${cx + r},${cy}`}
                    fill="none" stroke="currentColor" className={tTheme.textMuted} strokeOpacity={0.15} strokeWidth={14} strokeLinecap="round" />
                  <path d={`M ${cx - r},${cy} A ${r},${r} 0 0 1 ${cx + r},${cy}`}
                    fill="none" stroke="url(#kerahatArcGrad)" strokeWidth={14} strokeLinecap="round" opacity={0.9} />
                  <defs>
                    <linearGradient id="kerahatArcGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#fbbf24" />
                      <stop offset="50%" stopColor="#ef4444" />
                      <stop offset="100%" stopColor="#f97316" />
                    </linearGradient>
                    <radialGradient id="sunGlowRad" cx="0.5" cy="0.5" r="0.5">
                      <stop offset="0%" stopColor="rgba(245,158,11,0.65)" />
                      <stop offset="100%" stopColor="rgba(245,158,11,0)" />
                    </radialGradient>
                    <pattern id="kerahatHatch" patternUnits="userSpaceOnUse" width="7" height="7" patternTransform="rotate(45)">
                      <rect width="7" height="7" fill={hexToRgba(kerahatHex, 0.32)} />
                      <line x1="0" y1="0" x2="0" y2="7" stroke={hexToRgba(kerahatHex, 0.85)} strokeWidth="3" />
                    </pattern>
                  </defs>

                  {bands.map((b, i) => (
                    <path key={i} d={wedgePath(b.start, b.end)}
                      fill={activeBand === b ? "rgba(239,68,68,0.45)" : "url(#kerahatHatch)"}
                      stroke={activeBand === b ? "rgba(239,68,68,0.7)" : hexToRgba(kerahatHex, 0.55)}
                      strokeWidth={1.5}
                      className={activeBand === b ? "kerahat-active-glow" : ""} />
                  ))}

                  {isDaytime && (
                    <g style={{
                        transformBox: "view-box",
                        transformOrigin: `${cx}px ${cy}px`,
                        transform: `rotate(${90 - angleDeg}deg)`,
                        transition: "transform 1s linear",
                        willChange: "transform",
                      }}>
                      <line x1={cx} y1={cy} x2={cx} y2={cy - needleR}
                        stroke={activeBand ? "#ef4444" : needleColor}
                        strokeWidth={3} strokeLinecap="round"
                        style={{ filter: activeBand ? "drop-shadow(0 0 7px rgba(239,68,68,0.9))" : isLight ? "drop-shadow(0 0 5px rgba(30,41,59,0.5))" : "drop-shadow(0 0 5px rgba(248,250,252,0.55))" }} />
                      <circle cx={cx} cy={cy - needleR} r={16} fill="url(#sunGlowRad)" className="kerahat-sun-glow" />
                      <Sun x={cx - 13} y={cy - needleR - 13} width={26} height={26}
                        className={activeBand ? (isLight ? "text-red-600" : "text-red-400") : (isLight ? "text-amber-600" : "text-amber-400")}
                        style={{ filter: activeBand ? "drop-shadow(0 0 6px rgba(239,68,68,0.9))" : "drop-shadow(0 0 6px rgba(245,158,11,0.9))" }} />
                    </g>
                  )}
                  <circle cx={cx} cy={cy} r={6} fill={activeBand ? "#ef4444" : needleColor} />

                  <Sunrise className={tTheme.textMuted} x={cx - r - 45} y={cy - 60} width={36} height={36} />
                  <Sun className={isLight ? "text-red-600" : "text-red-400"} x={cx - 20} y={2} width={40} height={40} />
                  <Sunset className={tTheme.textMuted} x={cx + r + 9} y={cy - 60} width={36} height={36} />

                  <text x={cx - r} y={cy + 26} textAnchor="middle" fill="currentColor" className={`font-mono font-extrabold ${tTheme.textPrimary}`} fontSize={20}>{solarTimes.sunrise}</text>
                  <text x={cx} y={68} textAnchor="middle" className="font-mono font-extrabold" fill="#ef4444" fontSize={22}>{solarTimes.solarNoon}</text>
                  <text x={cx + r} y={cy + 26} textAnchor="middle" fill="currentColor" className={`font-mono font-extrabold ${tTheme.textPrimary}`} fontSize={20}>{solarTimes.sunset}</text>
                </svg>

                {(activeBand || upcomingBand) && (
                  <div className="flex justify-center -mt-1 mb-1">
                    {activeBand ? (
                      <span className={`inline-flex items-center gap-2 px-5 py-2 rounded-full bg-red-500/20 border-2 border-red-500/50 ${isLight ? "text-red-700" : "text-red-400"} font-extrabold text-base sm:text-lg animate-pulse`}>
                        <Ban className="w-5 h-5" />{t("kerahatActive", lang)} · {t("kerahatEndsIn", lang, { time: fmtDur(activeBand.end * 60 - nowSec) })}
                      </span>
                    ) : (
                      <span className={`inline-flex items-center gap-2 px-5 py-2 rounded-full bg-amber-500/15 border ${isLight ? "border-amber-500/60 text-amber-800" : "border-amber-500/40 text-amber-300"} font-bold text-sm sm:text-base`}>
                        <Clock className="w-4 h-4" />{t("kerahatStartsIn", lang, { time: fmtDur(upcomingBand.start * 60 - nowSec) })}
                      </span>
                    )}
                  </div>
                )}
              </>
            );
          })()}

          <p className={`text-base sm:text-lg ${tTheme.textMuted} mt-2 leading-snug text-center`}>{t("kerahatDesc", lang)}</p>
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
            </div>
          </section>
        )}

        <section className={`${tTheme.card} border rounded-xl p-6 sm:p-7 transition-all duration-300 shadow-md`}>
          {/* Başlık şeridi (20 Kasım 2026): "Kıble" tek başına belirsizdi ve 16–18 px
              gri kalıyordu. Artık temanın kendi vurgu renginde bir şerit içinde büyük
              başlık + altyazı; yaşlı kullanıcı ilk bakışta ne olduğunu anlar. Şerit
              `currentColor` ile boyanır, böylece 16 temanın hepsinde uyumlu kalır.
              Pusula ve ok aynen kalır. */}
          <div className={`flex flex-wrap items-center gap-x-2.5 gap-y-1 px-3.5 py-2.5 rounded-xl border mb-4 bg-current/10 border-current/25 ${tTheme.accent}`}>
            <Compass className="w-5 h-5 shrink-0" />
            <div className={`text-xl sm:text-2xl font-extrabold tracking-tight ${tTheme.textPrimary}`}>{t("qiblaTitle", lang)}</div>
            <div className="ml-auto text-[11px] sm:text-xs font-semibold opacity-70">{t("qiblaSubtitle", lang)}</div>
          </div>
          <div className="flex flex-col items-center gap-3">
            {/* Pusula her zaman açık: ok kıbleye döner, üstü gösterdiğinde yön doğrudur.
                Buton, "pusula açık" etiketi ve derece metni yok — tek bakışta okunur. */}
            <div className="relative w-48 h-48 sm:w-60 sm:h-60">
              <svg viewBox="0 0 200 200" className="w-full h-full">
                <defs>
                  <radialGradient id="compassBg" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.07)" />
                    <stop offset="75%" stopColor="rgba(255,255,255,0.02)" />
                    <stop offset="100%" stopColor="rgba(255,255,255,0.00)" />
                  </radialGradient>
                  <linearGradient id="needleTip" x1="0" y1="1" x2="0" y2="0">
                    <stop offset="0%" stopColor={qiblaColorDeep} />
                    <stop offset="100%" stopColor={qiblaColor} />
                  </linearGradient>
                </defs>

                {/* Zemin + dış halka: kilitlenince kalınlaşıp yeşile döner.
                    Manyetik girişimde tüm gösterge soluklaşır: bu yön doğru değil. */}
                <circle cx="100" cy="100" r="92" fill="url(#compassBg)" stroke={isLight ? "rgba(15,23,42,0.10)" : "rgba(255,255,255,0.10)"} strokeWidth="1" />
                <g style={{ opacity: qiblaInterference ? 0.28 : qiblaCalibration ? 0.5 : 1, transition: "opacity 0.35s ease" }}>
                <circle cx="100" cy="100" r="86" fill="none"
                  stroke={qiblaLocked ? qiblaColor : (isLight ? "rgba(15,23,42,0.16)" : "rgba(255,255,255,0.14)")}
                  strokeOpacity={qiblaLocked ? 0.95 : 1}
                  strokeWidth={qiblaLocked ? 5 : 1.5} />

                {/* Kilitlenince tek atımlık nabız */}
                {qiblaPulse > 0 && (
                  <circle key={qiblaPulse} cx="100" cy="100" r="92" fill="none"
                    stroke="#34d399" strokeWidth="3" className="qibla-lock-pulse" />
                )}

                {/* TEK BÜYÜK OK — ucu halkanın içine kadar uzanır, kıbleye döner. */}
                <g style={{
                  transform: `rotate(${compassHeading !== null ? qiblaDir - declination - compassHeading : qiblaDir}deg)`,
                  transformOrigin: "100px 100px",
                  transition: "transform 0.18s ease-out",
                }}>
                  {/* Ok başı + gövde: tek parça, ucu halkaya dayanır */}
                  <polygon points="100,10 119,58 100,48 81,58"
                    fill="url(#needleTip)"
                    stroke={qiblaLocked ? qiblaColor : "rgba(0,0,0,0.10)"}
                    strokeWidth="1" strokeLinejoin="round" />
                  <rect x="94" y="50" width="12" height="44" rx="4"
                    fill="url(#needleTip)"
                    stroke={qiblaLocked ? qiblaColor : "rgba(0,0,0,0.10)"}
                    strokeWidth="1" />
                </g>

                {/* Merkez göbeği */}
                <circle cx="100" cy="100" r="9" fill="rgba(15,23,42,0.9)" stroke={qiblaColor} strokeWidth="1.5" />
                <circle cx="100" cy="100" r="3" fill={qiblaColor} />
                </g>
              </svg>
            </div>

            {/* Girişim uyarısı önce gelir: alan bozuksa "düz tut" demenin anlamı yok. */}
            {qiblaInterference && (
              <div className={`flex items-center gap-3 w-full px-4 py-3.5 rounded-xl border text-base sm:text-lg font-semibold leading-snug text-left ${isLight ? "bg-amber-500/10 border-amber-500/40 text-amber-800" : "bg-amber-500/10 border-amber-500/35 text-amber-300"}`}>
                <Magnet className="w-5 h-5 shrink-0" />
                {t("qiblaMagnetic", lang)}
              </div>
            )}

            {/* Kalibrasyon notu: YALNIZCA sensör kalibrasyon istediğinde çıkar
                (accuracy <= 1). Kalibrasyon tek seferlik bir iş; not hep durunca
                kullanıcı "her açılışta yapmam gerek" sanıyordu. Göründüğünde de
                yaşlı kullanıcı okuyabilsin diye büyük tutuluyor. */}
            {!qiblaInterference && qiblaCalibration && (
              <div className={`flex items-center gap-4 w-full px-4 py-4 rounded-xl border text-left ${isLight ? "bg-sky-500/10 border-sky-500/45 text-sky-800" : "bg-sky-500/10 border-sky-500/40 text-sky-200"}`}>
                {/* 8 çizme hareketi: nokta lemniskat üzerinde tur atıyor */}
                <svg viewBox="0 0 120 64" className="w-28 h-16 sm:w-32 sm:h-20 shrink-0" aria-hidden="true">
                  <path id="qiblaCalEight"
                    d="M24 32 C24 10 53 10 60 32 C67 54 96 54 96 32 C96 10 67 10 60 32 C53 54 24 54 24 32 Z"
                    fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" opacity="0.6" />
                  <circle r="5" fill="currentColor">
                    <animateMotion dur="2.8s" repeatCount="indefinite" rotate="auto">
                      <mpath href="#qiblaCalEight" />
                    </animateMotion>
                  </circle>
                </svg>
                <div className="leading-snug">
                  <div className="text-lg sm:text-xl font-bold">{t("qiblaCalibrate", lang)}</div>
                  <div className="text-base sm:text-lg opacity-90 mt-1">{t("qiblaCalibrateHow", lang)}</div>
                </div>
              </div>
            )}

            {!qiblaInterference && !qiblaCalibration && qiblaHoldFlat && (
              <div className={`flex items-center gap-2.5 text-base sm:text-lg font-semibold text-center leading-snug px-3.5 py-2.5 rounded-xl border ${isLight ? "bg-amber-500/10 border-amber-500/40 text-amber-800" : "bg-amber-500/10 border-amber-500/30 text-amber-300"}`}>
                <Smartphone className="w-5 h-5 shrink-0" />
                {t("qiblaHoldFlat", lang)}
              </div>
            )}

            {compassHeading !== null && qiblaLocked && (
              <div className="text-lg sm:text-xl font-extrabold tracking-tight" style={{ color: qiblaColor }}>
                {t("qiblaAhead", lang)}
              </div>
            )}

            {compassHeading === null && compassUnsupported && !qiblaInterference && (
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
            <div className="flex items-center gap-2 flex-wrap justify-center">
              {isSupporterUser ? (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 text-emerald-400 text-xs font-semibold">
                  <Star className="w-3.5 h-3.5" />{t("supporterOwned", lang)}
                </span>
              ) : !supporterLoading && (
                /* Şu an sadece Gümüş (1 kahve) seçeneği gösteriliyor. Altın (2 kahve)
                   seçeneği bilinçli olarak gizlendi — kod/satın alma mantığı ileride
                   tekrar kullanılmak üzere arkada duruyor. */
                SUPPORTER_PRODUCT_IDS.filter((pid) => pid === "destekci_2_99").map((pid) => {
                  const isBusy = purchasingId === pid;
                  const labelKey = pid === "destekci_2_99" ? "supporterButtonSilver" : "supporterButtonGold";
                  const coffeeCount = pid === "destekci_2_99" ? 1 : 2;
                  return (
                    <button key={pid}
                      disabled={isBusy || purchasingId !== null}
                      onClick={() => handleSupporterPurchase(pid)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-rose-500/20 bg-rose-500/10 text-rose-400 text-xs font-semibold hover:bg-rose-500/20 transition-all cursor-pointer disabled:opacity-50">
                      <span className="flex items-center gap-0.5 shrink-0">
                        {Array.from({ length: coffeeCount }).map((_, i) => <Coffee key={i} className="w-3.5 h-3.5" />)}
                      </span>
                      {isBusy ? t("updating", lang) : t(labelKey, lang)}
                    </button>
                  );
                })
              )}
            </div>
            {supporterNotice && (
              <div className="text-[11px] text-emerald-400 font-semibold">{supporterNotice}</div>
            )}
          </div>
        </footer>

      </div>

      {themeToast && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-[60] px-4 py-2 rounded-full border text-sm font-bold bg-black/80 text-white border-white/20 shadow-xl animate-fadeIn">
          {themeToast}
        </div>
      )}

      {showTesbih && (
        <TesbihModal theme={tTheme} isLight={isLight} lang={lang} onClose={() => setShowTesbih(false)} />
      )}

      {showAddLocation && (
        <AddLocationModal
          th={tTheme} lang={lang}
          location={location} setLocation={setLocationAndSave}
          savedLocations={savedLocations} setSavedLocations={setSavedLocations}
          onFindLocation={handleFindLocation}
          isDetectingLocation={isDetectingLocation}
          autoLocationEnabled={autoLocationEnabled}
          onToggleAutoLocation={handleToggleAutoLocation}
          onClose={() => setShowAddLocation(false)}
        />
      )}

      {showReligious && (
        <ReligiousCalendarModal
          theme={tTheme}
          isLight={isLight}
          lang={lang}
          tz={location.timezone || "Europe/Istanbul"}
          onClose={() => setShowReligious(false)}
        />
      )}

      {showOnboarding && (
        <Onboarding
          theme={tTheme}
          isLight={isLight}
          lang={lang}
          onDone={() => { localStorage.setItem("mnv_onboarded_v1", "1"); setShowOnboarding(false); }}
        />
      )}
    </div>
  );
}
