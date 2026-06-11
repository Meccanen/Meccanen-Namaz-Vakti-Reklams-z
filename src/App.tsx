import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  MapPin, Calendar, Clock, Compass, Sparkles, Search,
  RefreshCw, ChevronsDown, Globe, Map,
  X, Settings, Palette, Check, Plus, Trash2, Star, Lock, Coffee
} from "lucide-react";
import { fetchPrayerTimes, getPrayerTimesFallback, PrayerTime, PRAYER_METHODS } from "./utils/prayerHelper";
import { Location } from "./types";
import { TURKEY_PROVINCES } from "./utils/weatherHelper";

// ─── THEMES ───────────────────────────────────────────────────────────────────
export const THEMES = {
  gece: {
    label: "Gece Mavisi", preview: ["#020617","#0ea5e9","#818cf8"], free: true,
    bg: "bg-[#020617]", card: "bg-slate-900/40 border-slate-800/80",
    cardHover: "hover:border-slate-700/60", header: "border-slate-800/80",
    accent: "text-sky-400", accent2: "text-indigo-400", accent3: "text-amber-300",
    prayerActive: "bg-gradient-to-b from-amber-500/10 to-amber-500/25 border-amber-500/30 text-amber-300 ring-amber-500/20",
    clockGrad: "from-white to-slate-200", secColor: "text-sky-400",
    blob1: "bg-indigo-500/5", blob2: "bg-sky-500/5",
    hijriAccent: "text-amber-400", settingsCard: "bg-slate-900/95 border-slate-700",
  },
  alacakaranlik: {
    label: "Alacakaranlık", preview: ["#1a0a2e","#e879f9","#f59e0b"], free: false,
    bg: "bg-[#1a0a2e]", card: "bg-purple-950/30 border-purple-900/30",
    cardHover: "hover:border-purple-700/40", header: "border-purple-900/40",
    accent: "text-fuchsia-400", accent2: "text-purple-400", accent3: "text-amber-300",
    prayerActive: "bg-gradient-to-b from-fuchsia-500/10 to-fuchsia-500/25 border-fuchsia-500/30 text-fuchsia-300 ring-fuchsia-500/20",
    clockGrad: "from-fuchsia-100 to-purple-200", secColor: "text-fuchsia-400",
    blob1: "bg-fuchsia-500/5", blob2: "bg-purple-500/5",
    hijriAccent: "text-fuchsia-400", settingsCard: "bg-purple-950/95 border-purple-700",
  },
  orman: {
    label: "Orman Yeşili", preview: ["#051a0f","#34d399","#a3e635"], free: false,
    bg: "bg-[#051a0f]", card: "bg-emerald-950/30 border-emerald-900/30",
    cardHover: "hover:border-emerald-700/40", header: "border-emerald-900/40",
    accent: "text-emerald-400", accent2: "text-lime-400", accent3: "text-amber-300",
    prayerActive: "bg-gradient-to-b from-emerald-500/10 to-emerald-500/25 border-emerald-500/30 text-emerald-300 ring-emerald-500/20",
    clockGrad: "from-emerald-100 to-lime-200", secColor: "text-emerald-400",
    blob1: "bg-emerald-500/5", blob2: "bg-lime-500/5",
    hijriAccent: "text-lime-400", settingsCard: "bg-emerald-950/95 border-emerald-700",
  },
  altin: {
    label: "Altın Çöl", preview: ["#160d00","#f59e0b","#fb923c"], free: false,
    bg: "bg-[#160d00]", card: "bg-amber-950/30 border-amber-900/30",
    cardHover: "hover:border-amber-700/40", header: "border-amber-900/40",
    accent: "text-amber-400", accent2: "text-orange-400", accent3: "text-yellow-300",
    prayerActive: "bg-gradient-to-b from-amber-500/10 to-amber-500/25 border-amber-500/30 text-amber-300 ring-amber-500/20",
    clockGrad: "from-amber-100 to-orange-200", secColor: "text-amber-400",
    blob1: "bg-amber-500/5", blob2: "bg-orange-500/5",
    hijriAccent: "text-orange-400", settingsCard: "bg-amber-950/95 border-amber-700",
  },
  ramazan: {
    label: "Ramazan", preview: ["#0d0a1a","#c084fc","#fde68a"], free: false,
    bg: "bg-[#0d0a1a]", card: "bg-violet-950/30 border-violet-900/30",
    cardHover: "hover:border-violet-700/40", header: "border-violet-900/40",
    accent: "text-violet-300", accent2: "text-yellow-300", accent3: "text-rose-300",
    prayerActive: "bg-gradient-to-b from-violet-500/10 to-violet-500/25 border-violet-500/30 text-violet-200 ring-violet-500/20",
    clockGrad: "from-violet-100 to-yellow-200", secColor: "text-violet-300",
    blob1: "bg-violet-500/5", blob2: "bg-yellow-500/5",
    hijriAccent: "text-yellow-300", settingsCard: "bg-violet-950/95 border-violet-800",
  },
  kabe: {
    label: "Kâbe", preview: ["#0a0a0a","#d4af37","#ffffff"], free: false,
    bg: "bg-[#0a0a0a]", card: "bg-neutral-900/60 border-neutral-800/60",
    cardHover: "hover:border-neutral-700/50", header: "border-neutral-800/60",
    accent: "text-yellow-500", accent2: "text-yellow-300", accent3: "text-white",
    prayerActive: "bg-gradient-to-b from-yellow-500/10 to-yellow-500/20 border-yellow-500/30 text-yellow-300 ring-yellow-500/20",
    clockGrad: "from-yellow-200 to-white", secColor: "text-yellow-500",
    blob1: "bg-yellow-500/3", blob2: "bg-white/3",
    hijriAccent: "text-yellow-400", settingsCard: "bg-neutral-900/95 border-neutral-700",
  },
  turkuaz: {
    label: "Turkuaz Deniz", preview: ["#010f14","#06b6d4","#67e8f9"], free: false,
    bg: "bg-[#010f14]", card: "bg-cyan-950/30 border-cyan-900/30",
    cardHover: "hover:border-cyan-700/40", header: "border-cyan-900/40",
    accent: "text-cyan-400", accent2: "text-teal-400", accent3: "text-sky-200",
    prayerActive: "bg-gradient-to-b from-cyan-500/10 to-cyan-500/25 border-cyan-500/30 text-cyan-300 ring-cyan-500/20",
    clockGrad: "from-cyan-100 to-teal-200", secColor: "text-cyan-400",
    blob1: "bg-cyan-500/5", blob2: "bg-teal-500/5",
    hijriAccent: "text-teal-400", settingsCard: "bg-cyan-950/95 border-cyan-800",
  },
  bordo: {
    label: "Bordo Kadife", preview: ["#1a0008","#f43f5e","#fda4af"], free: false,
    bg: "bg-[#1a0008]", card: "bg-rose-950/30 border-rose-900/30",
    cardHover: "hover:border-rose-700/40", header: "border-rose-900/40",
    accent: "text-rose-400", accent2: "text-pink-400", accent3: "text-orange-300",
    prayerActive: "bg-gradient-to-b from-rose-500/10 to-rose-500/25 border-rose-500/30 text-rose-300 ring-rose-500/20",
    clockGrad: "from-rose-100 to-pink-200", secColor: "text-rose-400",
    blob1: "bg-rose-500/5", blob2: "bg-pink-500/5",
    hijriAccent: "text-pink-400", settingsCard: "bg-rose-950/95 border-rose-800",
  },
  gunes: {
    label: "Gün Batımı", preview: ["#1a0d00","#f97316","#fbbf24"], free: false,
    bg: "bg-[#1a0d00]", card: "bg-orange-950/30 border-orange-900/30",
    cardHover: "hover:border-orange-700/40", header: "border-orange-900/40",
    accent: "text-orange-400", accent2: "text-amber-300", accent3: "text-yellow-200",
    prayerActive: "bg-gradient-to-b from-orange-500/10 to-orange-500/25 border-orange-500/30 text-orange-300 ring-orange-500/20",
    clockGrad: "from-orange-100 to-amber-200", secColor: "text-orange-400",
    blob1: "bg-orange-500/5", blob2: "bg-amber-500/5",
    hijriAccent: "text-amber-300", settingsCard: "bg-orange-950/95 border-orange-800",
  },
  safir: {
    label: "Safir Gece", preview: ["#00051a","#3b82f6","#a5b4fc"], free: false,
    bg: "bg-[#00051a]", card: "bg-blue-950/30 border-blue-900/30",
    cardHover: "hover:border-blue-700/40", header: "border-blue-900/40",
    accent: "text-blue-400", accent2: "text-indigo-300", accent3: "text-sky-200",
    prayerActive: "bg-gradient-to-b from-blue-500/10 to-blue-500/25 border-blue-500/30 text-blue-300 ring-blue-500/20",
    clockGrad: "from-blue-100 to-indigo-200", secColor: "text-blue-400",
    blob1: "bg-blue-500/5", blob2: "bg-indigo-500/5",
    hijriAccent: "text-indigo-300", settingsCard: "bg-blue-950/95 border-blue-800",
  },
  // ── AÇIK TEMALAR ──
  seher: {
    label: "Beyaz Seher", preview: ["#fefce8","#d97706","#92400e"], free: false,
    bg: "bg-[#fefce8]", card: "bg-white/70 border-amber-200/80",
    cardHover: "hover:border-amber-300/60", header: "border-amber-200/60",
    accent: "text-amber-700", accent2: "text-orange-600", accent3: "text-amber-900",
    prayerActive: "bg-gradient-to-b from-amber-400/20 to-amber-400/35 border-amber-500/40 text-amber-800 ring-amber-400/30",
    clockGrad: "from-amber-900 to-orange-800", secColor: "text-amber-600",
    blob1: "bg-amber-300/20", blob2: "bg-orange-200/20",
    hijriAccent: "text-orange-700", settingsCard: "bg-white/98 border-amber-200",
  },
  gul: {
    label: "Gül Bahçesi", preview: ["#fff1f2","#e11d48","#9f1239"], free: false,
    bg: "bg-[#fff1f2]", card: "bg-white/70 border-rose-200/80",
    cardHover: "hover:border-rose-300/60", header: "border-rose-200/60",
    accent: "text-rose-600", accent2: "text-pink-600", accent3: "text-rose-800",
    prayerActive: "bg-gradient-to-b from-rose-400/20 to-rose-400/35 border-rose-500/40 text-rose-700 ring-rose-400/30",
    clockGrad: "from-rose-900 to-pink-800", secColor: "text-rose-500",
    blob1: "bg-rose-300/20", blob2: "bg-pink-200/20",
    hijriAccent: "text-rose-700", settingsCard: "bg-white/98 border-rose-200",
  },
  nane: {
    label: "Nane Yeşili", preview: ["#f0fdf4","#16a34a","#14532d"], free: false,
    bg: "bg-[#f0fdf4]", card: "bg-white/70 border-green-200/80",
    cardHover: "hover:border-green-300/60", header: "border-green-200/60",
    accent: "text-green-700", accent2: "text-emerald-600", accent3: "text-green-900",
    prayerActive: "bg-gradient-to-b from-green-400/20 to-green-400/35 border-green-500/40 text-green-800 ring-green-400/30",
    clockGrad: "from-green-900 to-emerald-800", secColor: "text-green-600",
    blob1: "bg-green-300/20", blob2: "bg-emerald-200/20",
    hijriAccent: "text-emerald-700", settingsCard: "bg-white/98 border-green-200",
  },
};
export type ThemeKey = keyof typeof THEMES;

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function getIsPremium(): boolean { return localStorage.getItem("mnv_premium") === "true"; }

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

const DEFAULT_LOCATION: Location = {
  name: "İstanbul", country: "Türkiye",
  latitude: 41.0082, longitude: 28.9784,
  timezone: "Europe/Istanbul", admin1: "Marmara"
};

// ─── TEMA ÖNİZLEME KARTI ─────────────────────────────────────────────────────
function ThemePreviewCard({ themeKey }: { themeKey: ThemeKey }) {
  const th = THEMES[themeKey];
  const isLight = ["seher","gul","nane"].includes(themeKey);
  const textMain = isLight ? th.preview[2] : "rgba(255,255,255,0.9)";
  const textSub  = isLight ? th.preview[1] + "cc" : "rgba(255,255,255,0.45)";
  const cardBg   = isLight ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.04)";
  const cardBorder = isLight ? `${th.preview[1]}33` : "rgba(255,255,255,0.07)";
  const activeBg   = th.preview[1] + "44";
  const activeBorder = th.preview[1] + "88";

  const prayers = [
    { n:"İmsak", t:"04:32" }, { n:"Güneş", t:"06:10" }, { n:"Öğle", t:"13:15" },
    { n:"İkindi", t:"17:02" }, { n:"Akşam", t:"20:18" }, { n:"Yatsı", t:"22:01" },
  ];
  const activeIdx = 4; // Akşam vakti aktif

  return (
    <div className="rounded-2xl overflow-hidden shadow-xl border"
      style={{ background: th.preview[0], borderColor: isLight ? th.preview[1]+"33" : "rgba(255,255,255,0.08)" }}>

      {/* ── Header ── */}
      <div className="flex justify-between items-center px-4 pt-3 pb-2"
        style={{ borderBottom: `1px solid ${isLight ? th.preview[1]+"22" : "rgba(255,255,255,0.06)"}` }}>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-lg flex items-center justify-center"
            style={{ background: th.preview[1]+"22", border: `1px solid ${th.preview[1]}44` }}>
            <div className="w-2 h-2 rounded-full" style={{ background: th.preview[1] }} />
          </div>
          <div>
            <div className="text-[9px] font-black" style={{ color: textMain }}>Meccanen Namaz Vakti</div>
            <div className="text-[7px] font-medium" style={{ color: textSub }}>Reklamsız</div>
          </div>
        </div>
        <div className="px-2 py-0.5 rounded-full text-[7px] font-bold"
          style={{ background: th.preview[1]+"22", color: th.preview[1] }}>İstanbul</div>
      </div>

      {/* ── Saat + Takvim ── */}
      <div className="px-4 py-3" style={{ borderBottom: `1px solid ${isLight ? th.preview[1]+"22" : "rgba(255,255,255,0.06)"}` }}>
        <div className="flex items-baseline gap-1 mb-1">
          <span className="text-2xl font-extrabold font-mono" style={{ color: textMain }}>20:18</span>
          <span className="text-sm font-light" style={{ color: th.preview[1] }}>:45</span>
        </div>
        <div className="text-[8px] font-semibold mb-2" style={{ color: textSub }}>Cuma</div>
        <div className="flex justify-between">
          <div>
            <div className="text-[7px] font-black uppercase mb-0.5" style={{ color: th.preview[1] }}>Miladi</div>
            <div className="text-sm font-black" style={{ color: textMain }}>11</div>
            <div className="text-[7px]" style={{ color: textSub }}>Haziran 2026</div>
          </div>
          <div className="text-right">
            <div className="text-[7px] font-black uppercase mb-0.5" style={{ color: th.preview[2] }}>Hicri</div>
            <div className="text-sm font-black" style={{ color: th.preview[2] }}>14</div>
            <div className="text-[7px]" style={{ color: textSub }}>Zilhicce (1447 AH)</div>
          </div>
        </div>
      </div>

      {/* ── Namaz Vakitleri ── */}
      <div className="px-3 py-3">
        <div className="text-[7px] font-black uppercase tracking-widest mb-2" style={{ color: th.preview[1] }}>
          ✦ Diyanet Vakitleri
        </div>
        <div className="grid grid-cols-6 gap-1">
          {prayers.map(({ n, t: time }, i) => (
            <div key={n} className="flex flex-col items-center p-1.5 rounded-xl transition-all"
              style={{
                background: i === activeIdx ? activeBg : cardBg,
                border: `1px solid ${i === activeIdx ? activeBorder : cardBorder}`,
              }}>
              <span className="text-[6.5px] font-bold mb-0.5"
                style={{ color: i === activeIdx ? th.preview[1] : textSub }}>{n}</span>
              <span className="text-[8px] font-mono font-black"
                style={{ color: i === activeIdx ? th.preview[1] : textMain }}>{time}</span>
            </div>
          ))}
        </div>
        {/* Gradient bar */}
        <div className="h-0.5 rounded-full mt-3"
          style={{ background: `linear-gradient(90deg, ${th.preview[1]}, ${th.preview[2]})` }} />
      </div>
    </div>
  );
}

// ─── PREMIUM MODAL ────────────────────────────────────────────────────────────
function PremiumModal({ onClose, t, previewTheme }: {
  onClose: () => void;
  t: typeof THEMES[ThemeKey];
  previewTheme?: ThemeKey;
}) {
  const [activePreview, setActivePreview] = useState<ThemeKey>(previewTheme || "alacakaranlik");
  const premiumThemes = (Object.entries(THEMES) as [ThemeKey, typeof THEMES[ThemeKey]][]).filter(([, th]) => !th.free);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />
      <div
        className={`relative w-full max-w-sm rounded-[28px] border shadow-2xl flex flex-col max-h-[88vh] overflow-hidden ${t.settingsCard}`}
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-white/10 transition-all cursor-pointer z-10">
          <X className="w-4 h-4 text-slate-400" />
        </button>

        <div className="p-6 pb-4 shrink-0">
          <div className="text-center mb-4">
            <div className="text-3xl mb-2">✨</div>
            <h2 className={`text-lg font-black ${t.accent} mb-0.5`}>Premium Temalar</h2>
            <p className="text-[11px] text-slate-400">9 özel tema · Tek seferlik satın alma</p>
          </div>

          {/* Canlı Önizleme */}
          <div className="mb-3">
            <div className="text-[9px] text-slate-500 uppercase tracking-widest font-black mb-2 text-center">
              Önizleme: {THEMES[activePreview].label}
            </div>
            <ThemePreviewCard themeKey={activePreview} />
          </div>
        </div>

        {/* Tema seçici scroll */}
        <div className="overflow-y-auto flex-1 px-6 pb-4">
          <div className="grid grid-cols-3 gap-2 mb-4">
            {premiumThemes.map(([key, th]) => (
              <button key={key}
                onClick={() => setActivePreview(key)}
                className={`flex flex-col items-center gap-1.5 p-2 rounded-2xl border-2 transition-all cursor-pointer
                  ${activePreview === key ? "border-white/30 bg-white/10" : "border-white/5 bg-white/5 hover:bg-white/10"}`}>
                <div className="flex gap-0.5">
                  {th.preview.map((c, i) => <div key={i} className="w-3 h-3 rounded-full" style={{ backgroundColor: c }} />)}
                </div>
                <span className="text-[9px] text-slate-300 font-bold text-center leading-tight">{th.label}</span>
                {activePreview === key && <Check className="w-3 h-3 text-white" />}
              </button>
            ))}
          </div>

          <button
            className="w-full py-3 rounded-2xl font-black text-sm bg-gradient-to-r from-amber-500 to-orange-500 text-black hover:opacity-90 transition-all cursor-pointer mb-2"
            onClick={() => {
              // TODO: Google Play Billing entegrasyonu
              alert("Google Play Billing yakında eklenecek!");
            }}
          >
            ₺79 · Tek Seferlik Satın Al
          </button>
          <p className="text-center text-[10px] text-slate-600">Reklam yok · Abonelik yok · Tek ödeme</p>
        </div>
      </div>
    </div>
  );
}

// ─── SETTINGS PANEL ───────────────────────────────────────────────────────────
function SettingsPanel({
  theme, setTheme, location, setLocation,
  savedLocations, setSavedLocations,
  prayerMethod, setPrayerMethod,
  isPremium, setIsPremium,
  onClose, t,
  logoTapCount, setLogoTapCount,
}: {
  theme: ThemeKey; setTheme: (k: ThemeKey) => void;
  location: Location; setLocation: (l: Location) => void;
  savedLocations: Location[]; setSavedLocations: (locs: Location[]) => void;
  prayerMethod: number; setPrayerMethod: (m: number) => void;
  isPremium: boolean; setIsPremium: (v: boolean) => void;
  onClose: () => void; t: typeof THEMES[ThemeKey];
  logoTapCount: number; setLogoTapCount: (n: number) => void;
}) {
  const [tab, setTab] = useState<"genel"|"konum"|"metod">("genel");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Location[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [notification, setNotification] = useState("");
  const [premiumModalOpen, setPremiumModalOpen] = useState(false);
  const [premiumPreviewTheme, setPremiumPreviewTheme] = useState<ThemeKey | undefined>();

  const notify = (msg: string) => { setNotification(msg); setTimeout(() => setNotification(""), 3000); };

  // 5x logo tıklama — gizli premium toggle
  const handleLogoTap = () => {
    const next = logoTapCount + 1;
    setLogoTapCount(next);
    if (next >= 5) {
      setLogoTapCount(0);
      const newVal = !isPremium;
      setIsPremium(newVal);
      localStorage.setItem("mnv_premium", String(newVal));
      notify(newVal ? "✨ Premium aktif (test modu)" : "🔒 Premium devre dışı (test modu)");
    }
  };

  const performSearch = async () => {
    const q = searchQuery.trim();
    if (!q) return;
    setIsSearching(true); setSearchError(""); setSearchResults([]);
    try {
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=6&language=tr`);
      const data = await res.json();
      if (data.results?.length) {
        setSearchResults(data.results.map((r: any) => ({
          name: r.name, country: r.country || "Bilinmiyor",
          latitude: r.latitude, longitude: r.longitude,
          timezone: r.timezone && r.timezone !== "GMT" && r.timezone !== "UTC"
            ? r.timezone : guessTimezone(r.longitude),
          admin1: r.admin1 || ""
        })));
      } else setSearchError("Şehir bulunamadı.");
    } catch { setSearchError("Arama yapılamadı."); }
    finally { setIsSearching(false); }
  };

  const addAndSelectCity = (loc: Location) => {
    // Ücretsiz kullanıcı: max 1 konum
    if (!isPremium && savedLocations.length >= 1) {
      const exists = savedLocations.some(l =>
        l.latitude.toFixed(2) === loc.latitude.toFixed(2) &&
        l.longitude.toFixed(2) === loc.longitude.toFixed(2)
      );
      if (!exists) {
        setPremiumPreviewTheme(undefined);
        setPremiumModalOpen(true);
        return;
      }
    }
    const exists = savedLocations.some(l =>
      l.latitude.toFixed(2) === loc.latitude.toFixed(2) &&
      l.longitude.toFixed(2) === loc.longitude.toFixed(2)
    );
    const newList = exists ? savedLocations : [...savedLocations, loc];
    setSavedLocations(newList);
    setLocation(loc);
    setSearchResults([]); setSearchQuery("");
    notify(`📍 ${loc.name}, ${loc.country} seçildi`);
  };

  const selectSaved = (loc: Location) => { setLocation(loc); notify(`📍 ${loc.name}, ${loc.country} seçildi`); };

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

  const handleThemeClick = (key: ThemeKey) => {
    const th = THEMES[key];
    if (!th.free && !isPremium) {
      setPremiumPreviewTheme(key);
      setPremiumModalOpen(true);
      return;
    }
    setTheme(key);
    notify(`🎨 ${th.label} teması seçildi`);
  };

  const tabs = [
    { key: "genel" as const, label: "Genel" },
    { key: "konum" as const, label: "Konum" },
    { key: "metod" as const, label: "Metod" },
  ];

  return (
    <>
      {premiumModalOpen && (
        <PremiumModal
          onClose={() => { setPremiumModalOpen(false); setPremiumPreviewTheme(undefined); }}
          t={t} previewTheme={premiumPreviewTheme}
        />
      )}

      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <div
          className={`relative w-full max-w-lg max-h-[88vh] overflow-hidden rounded-[28px] border shadow-2xl flex flex-col ${t.settingsCard}`}
          onClick={e => e.stopPropagation()}
        >
          {/* Panel header — logo 5x tıklama */}
          <div className="flex justify-between items-center px-6 pt-5 pb-3 shrink-0">
            <div className="flex items-center gap-2">
              {/* GİZLİ TOGGLE: Logo'ya 5x tıklama ⚠️ PROD'A ÇIKARKEN KALDIR */}
              <button onClick={handleLogoTap} className="p-1 rounded-lg cursor-pointer select-none">
                <Settings className={`w-5 h-5 ${t.accent}`} />
              </button>
              <h2 className={`text-lg font-black ${t.accent}`}>Ayarlar</h2>
              {logoTapCount > 0 && logoTapCount < 5 && (
                <span className="text-[9px] text-slate-600">{5 - logoTapCount} kez daha</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isPremium ? (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-[10px] font-black text-amber-400">
                  ✨ Premium
                </span>
              ) : (
                <button
                  onClick={() => { setPremiumPreviewTheme(undefined); setPremiumModalOpen(true); }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-[10px] font-black text-amber-400 hover:opacity-80 transition-all cursor-pointer"
                >
                  ✨ Premium Al
                </button>
              )}
              <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-all cursor-pointer">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 px-6 pb-3 shrink-0">
            {tabs.map(tb => (
              <button key={tb.key} onClick={() => setTab(tb.key)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${tab === tb.key ? `bg-white/15 ${t.accent}` : "text-slate-500 hover:bg-white/5"}`}>
                {tb.label}
              </button>
            ))}
          </div>

          <div className="overflow-y-auto flex-1 px-6 pb-6 space-y-5">

            {/* ── GENEL: Tema ── */}
            {tab === "genel" && (
              <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5" />Tema Seçimi
                </h3>

                {/* Ücretsiz tema */}
                <div>
                  <div className="text-[9px] text-slate-500 uppercase tracking-widest font-black mb-2">Ücretsiz</div>
                  {(Object.entries(THEMES) as [ThemeKey, typeof THEMES[ThemeKey]][])
                    .filter(([, th]) => th.free)
                    .map(([key, th]) => (
                      <button key={key} onClick={() => handleThemeClick(key)}
                        className={`relative w-full flex items-center gap-3 p-3 rounded-2xl border-2 transition-all cursor-pointer ${theme === key ? "border-white/30 bg-white/10" : "border-white/5 bg-white/5 hover:bg-white/10"}`}>
                        <div className="flex gap-1 shrink-0">
                          {th.preview.map((c, i) => <div key={i} className="w-4 h-4 rounded-full" style={{ backgroundColor: c }} />)}
                        </div>
                        <span className="text-xs font-bold text-slate-200">{th.label}</span>
                        {theme === key && <Check className="w-4 h-4 text-white absolute right-3 top-1/2 -translate-y-1/2" />}
                      </button>
                    ))}
                </div>

                {/* Premium temalar */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[9px] text-amber-500/80 uppercase tracking-widest font-black flex items-center gap-1">
                      <Lock className="w-3 h-3" />Premium (12 Tema)
                    </div>
                    {!isPremium && (
                      <button onClick={() => { setPremiumPreviewTheme(undefined); setPremiumModalOpen(true); }}
                        className="text-[9px] text-amber-400 font-bold hover:opacity-70 transition-all cursor-pointer">
                        ₺79 →
                      </button>
                    )}
                  </div>
                  {/* Koyu temalar */}
                  <div className="text-[8px] text-slate-600 uppercase tracking-widest font-black mb-1.5">🌙 Koyu</div>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {(Object.entries(THEMES) as [ThemeKey, typeof THEMES[ThemeKey]][])
                      .filter(([k, th]) => !th.free && !["seher","gul","nane"].includes(k))
                      .map(([key, th]) => {
                        const locked = !isPremium;
                        const isActive = theme === key;
                        return (
                          <button key={key} onClick={() => handleThemeClick(key)}
                            className={`relative flex items-center gap-2.5 p-3 rounded-2xl border-2 transition-all cursor-pointer overflow-hidden
                              ${isActive ? "border-white/30 bg-white/10" : "border-white/5 bg-white/5 hover:bg-white/10"}
                              ${locked ? "opacity-70" : ""}`}>
                            <div className="flex gap-0.5 shrink-0">
                              {th.preview.map((c, i) => <div key={i} className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: c }} />)}
                            </div>
                            <span className="text-[11px] font-bold text-slate-200 leading-tight">{th.label}</span>
                            {locked
                              ? <Lock className="w-3 h-3 text-amber-500/70 absolute right-2.5 top-1/2 -translate-y-1/2 shrink-0" />
                              : isActive && <Check className="w-3.5 h-3.5 text-white absolute right-2.5 top-1/2 -translate-y-1/2" />
                            }
                          </button>
                        );
                      })}
                  </div>
                  {/* Açık temalar */}
                  <div className="text-[8px] text-slate-600 uppercase tracking-widest font-black mb-1.5">☀️ Açık</div>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.entries(THEMES) as [ThemeKey, typeof THEMES[ThemeKey]][])
                      .filter(([k, th]) => !th.free && ["seher","gul","nane"].includes(k))
                      .map(([key, th]) => {
                        const locked = !isPremium;
                        const isActive = theme === key;
                        return (
                          <button key={key} onClick={() => handleThemeClick(key)}
                            className={`relative flex items-center gap-2.5 p-3 rounded-2xl border-2 transition-all cursor-pointer overflow-hidden
                              ${isActive ? "border-amber-400/40 bg-amber-50/20" : "border-slate-300/20 bg-white/5 hover:bg-white/10"}
                              ${locked ? "opacity-70" : ""}`}>
                            <div className="flex gap-0.5 shrink-0">
                              {th.preview.map((c, i) => <div key={i} className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ backgroundColor: c }} />)}
                            </div>
                            <span className="text-[11px] font-bold text-slate-200 leading-tight">{th.label}</span>
                            {locked
                              ? <Lock className="w-3 h-3 text-amber-500/70 absolute right-2.5 top-1/2 -translate-y-1/2 shrink-0" />
                              : isActive && <Check className="w-3.5 h-3.5 text-white absolute right-2.5 top-1/2 -translate-y-1/2" />
                            }
                          </button>
                        );
                      })}
                  </div>
                </div>

                {/* Ko-fi bağış */}
                <div className={`border-t ${t.header} pt-4`}>
                  <a
                    href="https://ko-fi.com/meccanen"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 text-amber-400 font-bold text-sm hover:bg-amber-500/20 transition-all cursor-pointer"
                  >
                    <Coffee className="w-4 h-4" />
                    Bana bir kahve ısmarla ☕
                  </a>
                  <p className="text-center text-[10px] text-slate-600 mt-1.5">Ko-fi üzerinden destek olabilirsin</p>
                </div>
              </div>
            )}

            {/* ── KONUM ── */}
            {tab === "konum" && (
              <div className="space-y-4">
                {/* Konum limiti uyarısı */}
                {!isPremium && (
                  <div className="flex items-center gap-2 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                    <Lock className="w-4 h-4 text-amber-500 shrink-0" />
                    <div className="flex-1">
                      <div className="text-xs font-bold text-amber-400">Ücretsiz: 1 konum</div>
                      <div className="text-[10px] text-slate-500">Sınırsız konum için Premium Al</div>
                    </div>
                    <button onClick={() => { setPremiumPreviewTheme(undefined); setPremiumModalOpen(true); }}
                      className="text-[10px] text-amber-400 font-black hover:opacity-70 cursor-pointer">
                      ₺79 →
                    </button>
                  </div>
                )}

                {savedLocations.length > 0 && (
                  <div>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 mb-2">
                      <Star className="w-3.5 h-3.5" />Kayıtlı Konumlar ({savedLocations.length}{!isPremium ? "/1" : ""})
                    </h3>
                    <div className="space-y-1.5">
                      {savedLocations.map((loc, idx) => {
                        const isActive = location.latitude.toFixed(3) === loc.latitude.toFixed(3);
                        return (
                          <div key={idx} className={`flex items-center gap-2 p-3 rounded-2xl border transition-all ${isActive ? "bg-white/10 border-white/20" : "bg-black/20 border-white/5"}`}>
                            <button onClick={() => selectSaved(loc)} className="flex-1 text-left cursor-pointer">
                              <div className="flex items-center gap-2">
                                {isActive && <div className={`w-2 h-2 rounded-full ${t.accent.replace("text-","bg-")} shrink-0`} />}
                                <span className={`text-sm font-bold ${isActive ? t.accent : "text-slate-200"}`}>{loc.name}</span>
                                <span className="text-xs text-slate-500">{loc.country}</span>
                              </div>
                              <div className="text-[10px] text-slate-600 font-mono mt-0.5">{loc.latitude.toFixed(2)}°N {loc.longitude.toFixed(2)}°E</div>
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
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 mb-2">
                    <Search className="w-3.5 h-3.5" />
                    {!isPremium && savedLocations.length >= 1 ? (
                      <span className="flex items-center gap-1">Yeni Konum <Lock className="w-3 h-3 text-amber-500" /></span>
                    ) : "Yeni Konum Ekle"}
                  </h3>
                  <div className="relative mb-2">
                    <input type="text" value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && performSearch()}
                      placeholder="Şehir arayın (Paris, Mekke, Konya…)"
                      className="w-full bg-black/30 border border-white/10 focus:border-white/30 rounded-2xl pl-10 pr-20 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none" />
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <button onClick={performSearch} disabled={isSearching}
                      className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 rounded-xl text-[10px] font-extrabold uppercase cursor-pointer disabled:opacity-50 text-slate-900 bg-white/80">
                      {isSearching ? "…" : "ARA"}
                    </button>
                  </div>
                  {searchResults.length > 0 && (
                    <div className="bg-black/40 border border-white/10 rounded-2xl p-2 max-h-44 overflow-y-auto space-y-1 mb-2">
                      {searchResults.map((r, i) => (
                        <button key={i} onClick={() => addAndSelectCity(r)}
                          className="w-full hover:bg-white/10 rounded-xl p-2.5 text-left text-xs text-slate-300 flex justify-between items-center transition-all cursor-pointer">
                          <div>
                            <span className="font-bold text-slate-100">{r.name}</span>
                            {r.admin1 && <span className="text-slate-500 ml-1.5 text-[10px]">({r.admin1})</span>}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${t.accent} bg-white/5 border border-white/10`}>{r.country}</span>
                            {!isPremium && savedLocations.length >= 1
                              ? <Lock className="w-3.5 h-3.5 text-amber-500" />
                              : <Plus className="w-3.5 h-3.5 text-slate-500" />
                            }
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {searchError && <p className="text-xs text-amber-500 mb-2">{searchError}</p>}

                  <div>
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1 mb-1.5">
                      <Map className="w-3 h-3" />Türkiye 81 İl
                    </label>
                    <div className="relative">
                      <select onChange={e => { if (e.target.value) { selectProvince(e.target.value); e.target.value = ""; } }}
                        className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none cursor-pointer appearance-none">
                        <option value="">— Seçiniz —</option>
                        {TURKEY_PROVINCES.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                      </select>
                      <ChevronsDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── METOD ── */}
            {tab === "metod" && (
              <div className="space-y-2">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 mb-3">
                  <Sparkles className="w-3.5 h-3.5" />Hesaplama Metodu
                </h3>
                {PRAYER_METHODS.map(m => (
                  <button key={m.id} onClick={() => setPrayerMethod(m.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl border-2 transition-all cursor-pointer text-left ${prayerMethod === m.id ? "border-white/30 bg-white/10" : "border-white/5 bg-white/5 hover:bg-white/10"}`}>
                    <div>
                      <div className="text-xs font-bold text-slate-100">{m.label}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{m.description}</div>
                    </div>
                    {prayerMethod === m.id && <Check className="w-4 h-4 text-white shrink-0 ml-2" />}
                  </button>
                ))}
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

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [themeKey, setThemeKey] = useState<ThemeKey>(() => {
    const saved = localStorage.getItem("mnv_theme") as ThemeKey;
    if (saved && THEMES[saved]) {
      if (!THEMES[saved].free && !getIsPremium()) return "gece";
      return saved;
    }
    return "gece";
  });
  const [isPremium, setIsPremium] = useState<boolean>(getIsPremium);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [logoTapCount, setLogoTapCount] = useState(0);
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

  const t = THEMES[themeKey];

  const setTheme = (key: ThemeKey) => { setThemeKey(key); localStorage.setItem("mnv_theme", key); };
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

  useEffect(() => { loadPrayerTimes(location, prayerMethod, date); }, [location.latitude, location.longitude, date.getDate(), date.getMonth(), prayerMethod]);
  const handleRefresh = () => { lastFetchKey.current = ""; loadPrayerTimes(location, prayerMethod, date, true); };

  const localTime = useMemo(() => {
    const tz = location.timezone || "Europe/Istanbul";
    let hour="--", min="--", sec="--", weekday="—", gregDay="--", gregMonthYear="— —";
    let hijriDay="--", hijriMonth="—", hijriYear="----";
    try {
      const tp = new Intl.DateTimeFormat("en-US",{timeZone:tz,hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false}).formatToParts(date);
      hour=tp.find(p=>p.type==="hour")?.value||"--";
      min=tp.find(p=>p.type==="minute")?.value||"--";
      sec=tp.find(p=>p.type==="second")?.value||"--";
      weekday=new Intl.DateTimeFormat("tr-TR",{timeZone:tz,weekday:"long"}).format(date);
      gregDay=new Intl.DateTimeFormat("tr-TR",{timeZone:tz,day:"numeric"}).format(date);
      gregMonthYear=new Intl.DateTimeFormat("tr-TR",{timeZone:tz,month:"long",year:"numeric"}).format(date);
      const HIJRI_MONTHS=["Muharrem","Safer","Rebiülevvel","Rebiülahir","Cemaziyelevvel","Cemaziyelahir","Recep","Şaban","Ramazan","Şevval","Zilkade","Zilhicce"];
      const hp=new Intl.DateTimeFormat("en-u-ca-islamic-umalqura",{timeZone:tz,day:"numeric",month:"numeric",year:"numeric"}).formatToParts(date);
      hijriDay=hp.find(p=>p.type==="day")?.value||"--";
      hijriMonth=HIJRI_MONTHS[parseInt(hp.find(p=>p.type==="month")?.value||"1")-1]||"—";
      hijriYear=hp.find(p=>p.type==="year")?.value||"----";
    } catch {}
    return {hour,min,sec,weekday,gregDay,gregMonthYear,hijriDay,hijriMonth,hijriYear};
  }, [date, location.timezone]);

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

  const currentMethod = PRAYER_METHODS.find(m => m.id === prayerMethod) || PRAYER_METHODS[0];

  return (
    <div className={`min-h-screen ${t.bg} text-slate-100 flex flex-col relative overflow-hidden p-4 md:p-8 transition-colors duration-500`}>
      <div className={`absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[35rem] h-[35rem] ${t.blob1} rounded-full blur-[100px] pointer-events-none`} />
      <div className={`absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[40rem] h-[40rem] ${t.blob2} rounded-full blur-[120px] pointer-events-none`} />

      {settingsOpen && (
        <SettingsPanel
          theme={themeKey} setTheme={setTheme}
          location={location} setLocation={setLocationAndSave}
          savedLocations={savedLocations} setSavedLocations={setSavedLocations}
          prayerMethod={prayerMethod} setPrayerMethod={setPrayerMethod}
          isPremium={isPremium} setIsPremium={setIsPremium}
          logoTapCount={logoTapCount} setLogoTapCount={setLogoTapCount}
          onClose={() => setSettingsOpen(false)} t={t}
        />
      )}

      <div className="w-full max-w-2xl mx-auto flex flex-col gap-5 relative z-10">

        {/* HEADER */}
        <header className={`flex justify-between items-center border-b ${t.header} pb-4`}>
          <div className="flex items-center gap-3">
            <button onClick={() => setSettingsOpen(true)}
              className="p-2 bg-white/5 border border-white/10 rounded-xl hover:border-white/25 hover:scale-105 transition-all cursor-pointer">
              <Compass className={`w-7 h-7 ${t.accent}`} />
            </button>
            <div>
              <h1 className="text-lg font-black tracking-tight text-slate-100">Meccanen Namaz Vakti</h1>
              <p className="text-[10px] text-slate-500 font-medium">
                Reklamsız {isPremium && <span className="text-amber-500 ml-1">· ✨ Premium</span>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 bg-black/30 border ${t.header} rounded-full text-xs font-semibold ${t.accent}`}>
              <MapPin className="w-3.5 h-3.5" />{location.name}
            </span>
            <button onClick={handleRefresh}
              className={`p-1.5 text-slate-400 hover:text-white bg-black/30 border ${t.header} rounded-full hover:bg-white/10 transition-all cursor-pointer`}>
              <RefreshCw className={`w-4 h-4 ${prayerLoading ? `animate-spin ${t.accent}` : ""}`} />
            </button>
          </div>
        </header>

        {/* SAAT + TAKVİM */}
        <section className={`${t.card} ${t.cardHover} backdrop-blur-lg border rounded-[28px] p-6 transition-all`}>
          <div className="flex items-baseline justify-center font-mono select-none mb-1">
            <span className={`text-6xl sm:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b ${t.clockGrad}`}>
              {localTime.hour}:{localTime.min}
            </span>
            <span className={`text-3xl font-light ${t.secColor} ml-2 animate-pulse`}>:{localTime.sec}</span>
          </div>
          <p className="text-center text-sm font-semibold text-slate-400 mb-4">{localTime.weekday}</p>
          <div className={`border-t ${t.header} pt-4 flex justify-between items-start gap-4`}>
            <div>
              <div className={`text-[9px] font-black uppercase tracking-widest ${t.accent2} mb-1 flex items-center gap-1`}>
                <Calendar className="w-3 h-3" />Miladi
              </div>
              <div className="text-2xl font-black text-slate-100">{localTime.gregDay}</div>
              <div className="text-xs text-slate-400 font-semibold mt-0.5">{localTime.gregMonthYear}</div>
            </div>
            <div className="text-right">
              <div className={`text-[9px] font-black uppercase tracking-widest ${t.hijriAccent} mb-1 flex items-center justify-end gap-1`}>
                <Sparkles className="w-3 h-3" />Hicri
              </div>
              <div className={`text-2xl font-black ${t.hijriAccent}`}>{localTime.hijriDay}</div>
              <div className={`text-xs font-semibold mt-0.5 ${t.hijriAccent} opacity-80`}>{localTime.hijriMonth} ({localTime.hijriYear} AH)</div>
            </div>
          </div>
        </section>

        {/* NAMAZ VAKİTLERİ */}
        <section className={`${t.card} ${t.cardHover} backdrop-blur-lg border rounded-[28px] p-6 transition-all`}>
          <div className="flex justify-between items-center mb-4">
            <div className={`text-[10px] font-black uppercase tracking-widest ${t.accent} flex items-center gap-1.5`}>
              <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              {currentMethod.label} Vakitleri
            </div>
            <span className="text-[9px] text-slate-600 font-mono">{location.name}, {location.country}</span>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {prayerTimes.map((item, idx) => (
              <div key={item.key}
                className={`flex flex-col items-center py-3 px-2 rounded-2xl border-2 transition-all ${activePrayerIndex === idx ? `${t.prayerActive} ring-2` : "border-transparent bg-black/20"}`}>
                <div className={`text-[9px] font-black uppercase tracking-wider mb-2 ${activePrayerIndex === idx ? "" : "text-slate-500"}`}>{item.name}</div>
                <div className={`text-sm font-mono font-bold ${activePrayerIndex === idx ? "" : "text-slate-300"}`}>{item.time}</div>
              </div>
            ))}
          </div>
          {prayerLoading && (
            <div className="flex items-center justify-center gap-2 mt-3 text-xs text-slate-500">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />Güncelleniyor…
            </div>
          )}
        </section>

        {/* KONUM */}
        <section className={`${t.card} ${t.cardHover} backdrop-blur-lg border rounded-[28px] p-5 transition-all`}>
          <div className="flex justify-between items-center">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
              <Globe className={`w-3.5 h-3.5 ${t.accent}`} />Konum
            </div>
            <button onClick={() => setSettingsOpen(true)}
              className={`text-[10px] font-bold ${t.accent} cursor-pointer hover:opacity-70 transition-all`}>
              Değiştir →
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-3">
            <div>
              <div className="text-[9px] text-slate-600 uppercase tracking-wider font-bold">Şehir</div>
              <div className={`text-base font-black ${t.accent}`}>{location.name}, {location.country}</div>
            </div>
            <div className="ml-auto text-right">
              <div className="text-[9px] text-slate-600 uppercase tracking-wider font-bold">Koordinat</div>
              <div className="text-xs font-mono text-slate-400">{location.latitude.toFixed(4)}°N {location.longitude.toFixed(4)}°E</div>
              <div className="text-[10px] text-slate-600">{location.timezone}</div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className={`text-center pt-4 pb-2 text-[10px] text-slate-600 border-t ${t.header}`}>
          © {date.getFullYear()} Meccanen Namaz Vakti · AlAdhan API · Reklamsız
        </footer>

      </div>
    </div>
  );
}
