import { useState, useEffect } from "react";
import { X, Search, Navigation, MapPin, Trash2, Plus, Star, ChevronsDown } from "lucide-react";
import { t, LangCode, isRTL, getLocale } from "../utils/i18n";
import { TURKEY_PROVINCES, PAKISTAN_CITIES } from "../utils/weatherHelper";
import { getDeviceTimezone, resolveTimezone, DEFAULT_LOCATION } from "../utils/locationHelper";
import type { Location } from "../types";

const MAX_LOCATIONS = 33;

interface ThemeTokens {
  card: string;
  settingsCard: string;
  header: string;
  accent: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
}

interface GeocodingResult {
  name: string;
  country?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
  admin1?: string;
}

export interface LocationManagerProps {
  th: ThemeTokens;
  lang: LangCode;
  location: Location;
  setLocation: (l: Location) => void;
  savedLocations: Location[];
  setSavedLocations: (locs: Location[]) => void;
  onFindLocation: () => void;
  isDetectingLocation: boolean;
  autoLocationEnabled: boolean;
  onToggleAutoLocation: (val: boolean) => void;
}

/**
 * Konum yönetimi gövdesi — hem Ayarlar > Konum sekmesinde hem de üst menüdeki
 * "Konum ekle" modalında AYNI bileşen kullanılır: konumumu bul, otomatik konum
 * anahtarı, şehir arama, ülke ön ayarları ve kayıtlı konumlar.
 */
export function LocationManager({
  th, lang, location, setLocation, savedLocations, setSavedLocations,
  onFindLocation, isDetectingLocation, autoLocationEnabled, onToggleAutoLocation,
}: LocationManagerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Location[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [notification, setNotification] = useState("");

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
        // Open-Meteo normalde doğru IANA saat dilimini döndürür. Vermezse (GMT/UTC),
        // boylamdan tahmin yerine koordinatın gerçek saat dilimini çöz.
        const results: Location[] = await Promise.all(data.results.map(async (r: GeocodingResult) => {
          let tz = r.timezone;
          if (!tz || tz === "GMT" || tz === "UTC") {
            tz = await resolveTimezone(r.latitude, r.longitude, getDeviceTimezone());
          }
          return {
            name: r.name, country: r.country || t("unknown", lang),
            latitude: r.latitude, longitude: r.longitude,
            timezone: tz,
            admin1: r.admin1 || "",
          };
        }));
        setSearchResults(results);
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
    onToggleAutoLocation(false);
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

  return (
    <div className="space-y-4">
      {notification && (
        <div className="bg-slate-900 border border-slate-700 px-4 py-2 rounded-full text-xs font-semibold text-slate-100 shadow-xl text-center animate-fadeIn">
          {notification}
        </div>
      )}

      {/* Otomatik konum toggle — her zaman görünür, tıklanınca açılır/kapanır */}
      <div className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${autoLocationEnabled ? "bg-sky-500/10 border-sky-500/20" : "bg-white/5 border-white/5"}`}>
        <div className="flex items-center gap-2">
          <Navigation className={`w-4 h-4 shrink-0 ${autoLocationEnabled ? "text-sky-400" : th.textMuted}`} />
          <div>
            <div className={`text-base sm:text-lg font-extrabold ${autoLocationEnabled ? "text-sky-400" : th.textPrimary}`}>
              {t("autoLocationToggleLabel", lang)}
            </div>
            <div className={`text-sm ${th.textMuted}`}>
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
          <h3 className={`text-sm font-bold tracking-wide ${th.textPrimary} flex items-center gap-1.5 mb-2`}>
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
                      <span className={`text-sm font-bold ${isActive ? th.accent : th.textPrimary}`}>{loc.name}</span>
                      <span className={`text-sm ${th.textMuted}`}>{loc.country}</span>
                    </div>
                    <div className={`text-sm ${th.textMuted} font-mono mt-0.5`}>{loc.latitude.toFixed(2)}°N {loc.longitude.toFixed(2)}°E</div>
                  </button>
                  <button onClick={() => deleteSaved(idx)} aria-label={t("delete", lang)} className={`p-1.5 ${th.textMuted} hover:text-red-400 transition-all cursor-pointer shrink-0`}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <h3 className={`text-lg sm:text-xl font-extrabold tracking-wide ${th.textPrimary} flex items-center gap-2 mb-2`}>
          <Search className="w-5 h-5 sm:w-6 sm:h-6" />{t("searchCity", lang)}
        </h3>
        <div className="relative mb-2">
          <input type="text" value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && performSearch()}
            placeholder={t("searchCity", lang)}
            className={`w-full bg-black/30 border border-white/10 focus:border-white/30 focus:ring-1 focus:ring-white/20 rounded-2xl pl-10 pr-20 py-2.5 text-sm ${th.textPrimary} placeholder:${th.textMuted} focus:outline-none transition-all duration-200`} />
          <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${th.textMuted}`} />
          <button onClick={performSearch} disabled={isSearching}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 rounded-xl text-xs font-extrabold uppercase cursor-pointer disabled:opacity-50 text-slate-900 bg-white/80">
            {isSearching ? t("updating", lang) : t("search", lang)}
          </button>
        </div>
        {searchResults.length > 0 && (
          <div className="bg-black/40 border border-white/10 rounded-2xl p-2 max-h-44 overflow-y-auto space-y-1 mb-2">
            {searchResults.map((r, i) => (
              <button key={i} onClick={() => addAndSelectCity(r)}
                className={`w-full hover:bg-white/10 rounded-xl p-2.5 text-left text-sm ${th.textPrimary} flex justify-between items-center transition-all cursor-pointer`}>
                <div>
                  <span className={`font-bold ${th.textPrimary}`}>{r.name}</span>
                  {r.admin1 && <span className={`${th.textMuted} ml-1.5 text-sm`}>({r.admin1})</span>}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${th.accent} bg-white/5 border border-white/10`}>{r.country}</span>
                  <Plus className={`w-3.5 h-3.5 ${th.textMuted}`} />
                </div>
              </button>
            ))}
          </div>
        )}
        {searchError && <p className="text-sm text-amber-500 mb-2">{searchError}</p>}
        {lang === "tr" && (
          <div>
            <label className={`text-sm ${th.textMuted} font-bold uppercase tracking-wide flex items-center gap-1 mb-1.5`}>
              <MapPin className="w-3 h-3" />{t("turkeyProvinces", lang)}
            </label>
            <div className="relative">
              <select value="" onChange={e => { if (e.target.value) selectProvince(e.target.value); }}
                className={`w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm ${th.textPrimary} focus:outline-none cursor-pointer appearance-none`}>
                <option value="">{t("select", lang)}</option>
                {TURKEY_PROVINCES.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
              </select>
              <ChevronsDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${th.textMuted} pointer-events-none`} />
            </div>
          </div>
        )}
        {lang === "ur" && (
          <div dir="rtl">
            <label className={`text-sm ${th.textMuted} font-bold uppercase tracking-wide flex items-center gap-1 mb-1.5`}>
              <MapPin className="w-3 h-3" />{t("pakistanCities", lang)}
            </label>
            <div className="relative">
              <select value="" onChange={e => { if (e.target.value) selectPakistanCity(Number(e.target.value)); }}
                className={`w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm ${th.textPrimary} focus:outline-none cursor-pointer appearance-none`}
                dir="rtl">
                <option value="">{t("select", lang)}</option>
                {PAKISTAN_CITIES.map(p => <option key={p.id} value={p.id}>{p.urdu}</option>)}
              </select>
              <ChevronsDown className={`absolute left-3 right-auto top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${th.textMuted} pointer-events-none`} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * "Konum ekle" penceresi — arka plan bulanıklaştırılmış bağımsız modal.
 * İçerik, Ayarlar > Konum sekmesiyle AYNI LocationManager bileşenidir.
 */
export default function AddLocationModal({
  th, lang, onClose, ...manager
}: LocationManagerProps & { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md animate-fadeIn" onClick={onClose}>
      <div className={`relative w-full max-w-lg rounded-[28px] border shadow-2xl flex flex-col max-h-[92vh] glass-strong ${th.settingsCard}`} onClick={e => e.stopPropagation()}>
        <div className={`flex items-center justify-between gap-3 px-5 sm:px-6 py-4 border-b shrink-0 ${th.header}`}>
          <h2 className={`text-lg font-extrabold tracking-wide flex items-center gap-2 ${th.textPrimary}`}>
            <MapPin className={`w-5 h-5 ${th.accent}`} />
            {t("addLocation", lang)}
          </h2>
          <button onClick={onClose} aria-label={t("close", lang)} className={`shrink-0 p-2.5 rounded-full hover:bg-white/10 transition-all cursor-pointer`}>
            <X className={`w-5 h-5 ${th.textMuted}`} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 min-h-0 p-5 sm:p-6">
          <LocationManager th={th} lang={lang} {...manager} />
        </div>
      </div>
    </div>
  );
}
