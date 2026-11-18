/**
 * Prayer Times via AlAdhan API
 * https://aladhan.com/prayer-times-api
 */

import { detectLanguage, getPrayerMethodText, LANGUAGE_ORDER } from "./i18n";

export interface PrayerTime {
  name: string;
  time: string;
  key: string;
}

export interface PrayerMethod {
  id: number;
  label: Record<string, string>;
  description: Record<string, string>;
}

export const PRAYER_METHOD_DIYANET = 13;
export const PRAYER_METHOD_MWL = 3;
export const PRAYER_METHOD_KARACHI = 1;

// Varsayılan metot — uygulamanın temel dilini İngilizceye sabitleme mantığıyla aynı:
//  - Cihaz dili Türkçe ise → Diyanet (13)
//  - Cihaz dili Urduca ise → Karachi (1)
//  - Diğer tüm diller      → Muslim World League (3) [temel varsayılan]
// Kullanıcı açıkça bir metot SEÇMEDİYSE (mnv_prayer_method kayıtlı değilse) her açılışta
// cihaz dilini izler; açıkça seçtiyse kayıtlı değer her zaman korunur.
export function resolveDefaultPrayerMethod(saved: string | null): number {
  if (saved !== null) {
    const n = parseInt(saved, 10);
    if (!Number.isNaN(n) && PRAYER_METHODS.some(m => m.id === n)) return n;
  }
  const deviceLang = detectLanguage();
  if (deviceLang === "tr") return PRAYER_METHOD_DIYANET;
  if (deviceLang === "ur") return PRAYER_METHOD_KARACHI;
  return PRAYER_METHOD_MWL;
}

// Yöntem metinleri dil modüllerinden (src/i18n/locales/*.ts -> prayerMethods) gelir.
// Burada yalnızca id listesi ve sırası tutulur; çeviri kopyası yoktur.
const METHOD_IDS = [13, 3, 2, 4, 5, 1, 99] as const;

export const PRAYER_METHODS: PrayerMethod[] = METHOD_IDS.map((id) => {
  const label: Record<string, string> = {};
  const description: Record<string, string> = {};
  for (const code of LANGUAGE_ORDER) {
    const text = getPrayerMethodText(id, code);
    label[code] = text.label;
    description[code] = text.description;
  }
  return { id, label, description };
});

// Ayarlar ekranındaki sıralama: Matematiksel (Offline) en üstte, diğerleri
// mevcut sırayla. Menüde ilk seçenek olması, internet olmadan da çalışan
// yöntemin görünür olmasını sağlar.
export const PRAYER_METHODS_ORDERED: PrayerMethod[] = [
  ...PRAYER_METHODS.filter(m => m.id === 99),
  ...PRAYER_METHODS.filter(m => m.id !== 99),
];

// ── Kalıcı önbellek ─────────────────────────────────────────────────────────
// API'den gelen vakitler localStorage'da 30+ gün saklanır. Böylece internet
// yokken (veya uygulama soğuk açıldığında) matematiksel hesaba düşmeden önce
// gerçek API verisi kullanılır. Matematiksel fallback ASLA buraya yazılmaz.
export type PrayerTimesSource = "api" | "cache" | "offline";
export interface PrayerTimesResult {
  times: PrayerTime[];
  source: PrayerTimesSource;
}

const CACHE_KEY = "mnv_prayer_cache_v1";
const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // aylık veri 12 saatte bir tazelenir
const CACHE_KEEP_PAST_DAYS = 1;
const CACHE_KEEP_FUTURE_DAYS = 35;
const CACHE_MAX_COMBOS = 12;
const FETCH_TIMEOUT_MS = 8000;

type CacheMonth = { days: Record<string, PrayerTime[]>; fetchedAt: number };
type CacheCombo = { months: Record<string, CacheMonth>; lastUsed: number };
type CacheStore = Record<string, CacheCombo>;

let store: CacheStore | null = null;

function comboKey(lat: number, lng: number, methodId: number): string {
  return `${lat.toFixed(3)}_${lng.toFixed(3)}_${methodId}`;
}

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function loadStore(): CacheStore {
  if (store) return store;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    store = parsed && typeof parsed === "object" ? (parsed as CacheStore) : {};
  } catch {
    store = {};
  }
  return store;
}

function saveStore() {
  if (!store) return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(store));
  } catch {
    // kota dolu / private mode — önbellek olmadan devam et
  }
}

function pruneStore() {
  const s = loadStore();
  const today = new Date();
  const min = new Date(today); min.setDate(min.getDate() - CACHE_KEEP_PAST_DAYS);
  const max = new Date(today); max.setDate(max.getDate() + CACHE_KEEP_FUTURE_DAYS);
  const minKey = dateKey(min), maxKey = dateKey(max);

  for (const ck of Object.keys(s)) {
    const combo = s[ck];
    if (!combo?.months) { delete s[ck]; continue; }
    for (const mk of Object.keys(combo.months)) {
      const m = combo.months[mk];
      if (!m?.days) { delete combo.months[mk]; continue; }
      for (const dk of Object.keys(m.days)) {
        if (dk < minKey || dk > maxKey) delete m.days[dk];
      }
      if (Object.keys(m.days).length === 0) delete combo.months[mk];
    }
    if (Object.keys(combo.months).length === 0) delete s[ck];
  }

  const keys = Object.keys(s);
  if (keys.length > CACHE_MAX_COMBOS) {
    keys.sort((a, b) => (s[a].lastUsed || 0) - (s[b].lastUsed || 0));
    for (const k of keys.slice(0, keys.length - CACHE_MAX_COMBOS)) delete s[k];
  }
  saveStore();
}

function readCachedDay(ck: string, dk: string): PrayerTime[] | null {
  const combo = loadStore()[ck];
  const month = combo?.months[dk.slice(0, 7)];
  const times = month?.days?.[dk];
  if (!times) return null;
  combo.lastUsed = Date.now();
  return times;
}

function isMonthFresh(ck: string, monthKey: string): boolean {
  const m = loadStore()[ck]?.months?.[monthKey];
  return !!m && Date.now() - (m.fetchedAt || 0) < CACHE_TTL_MS;
}

function writeMonth(ck: string, monthKey: string, days: Record<string, PrayerTime[]>) {
  const s = loadStore();
  if (!s[ck]) s[ck] = { months: {}, lastUsed: Date.now() };
  s[ck].months[monthKey] = { days, fetchedAt: Date.now() };
  s[ck].lastUsed = Date.now();
  pruneStore();
}

function cleanApiTime(v: unknown): string {
  // Aylık endpoint "06:02 (+03)" döndürür; günlük endpoint "06:02".
  return String(v ?? "").trim().split(/\s+/)[0];
}

function toPrayerTimes(t: Record<string, unknown>): PrayerTime[] {
  return [
    { name: "İmsak",  time: cleanApiTime(t.Fajr),    key: "imsak"  },
    { name: "Güneş",  time: cleanApiTime(t.Sunrise), key: "gunes"  },
    { name: "Öğle",   time: cleanApiTime(t.Dhuhr),   key: "ogle"   },
    { name: "İkindi", time: cleanApiTime(t.Asr),     key: "ikindi" },
    { name: "Akşam",  time: cleanApiTime(t.Maghrib), key: "aksam"  },
    { name: "Yatsı",  time: cleanApiTime(t.Isha),    key: "yatsi"  },
  ];
}

async function fetchWithTimeout(url: string): Promise<Response> {
  if (typeof AbortController === "undefined") return fetch(url);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

/** AlAdhan aylık takvim: tek istekte ~30 gün. */
async function fetchMonthFromApi(
  lat: number, lng: number, year: number, month: number, methodId: number
): Promise<Record<string, PrayerTime[]>> {
  const url = `https://api.aladhan.com/v1/calendar/${year}/${month}?latitude=${lat}&longitude=${lng}&method=${methodId}`;
  const res = await fetchWithTimeout(url);
  if (!res.ok) throw new Error(`AlAdhan API hatası: ${res.status}`);
  const data = await res.json();
  if (data?.code !== 200 || !Array.isArray(data.data)) throw new Error("AlAdhan API geçersiz yanıt");

  const out: Record<string, PrayerTime[]> = {};
  for (const item of data.data) {
    const g = item?.date?.gregorian?.date; // "DD-MM-YYYY"
    if (typeof g !== "string") continue;
    const [dd, mm, yyyy] = g.split("-");
    if (!dd || !mm || !yyyy) continue;
    out[`${yyyy}-${mm}-${dd}`] = toPrayerTimes(item.timings || {});
  }
  return out;
}

export async function fetchPrayerTimes(
  lat: number,
  lng: number,
  date: Date,
  timezone: string,
  methodId: number = 13,
  opts?: { force?: boolean; offlineOnly?: boolean }
): Promise<PrayerTimesResult> {
  // Kullanıcı bilerek offline metodu seçtiyse doğrudan matematiksel hesap.
  if (methodId === 99) {
    return { times: getPrayerTimesFallback(lat, lng, date, timezone), source: "offline" };
  }

  const dk = dateKey(date);
  const mk = dk.slice(0, 7);
  const ck = comboKey(lat, lng, methodId);
  const cached = readCachedDay(ck, dk);
  const online = typeof navigator === "undefined" || navigator.onLine !== false;

  // Çevrimdışıysak veya ağ denemesi zaten başarısız olduysa ağı hiç yormadan
  // önbelleği kullan. `offlineOnly`, çok günlü döngüde her gün için 8 sn'lik
  // zaman aşımını tekrar tekrar yaşamamak için kullanılır.
  if (!online || opts?.offlineOnly) {
    return cached
      ? { times: cached, source: "cache" }
      : { times: getPrayerTimesFallback(lat, lng, date, timezone), source: "offline" };
  }

  // Online + taze önbellek: gereksiz istek atmadan API verisini kullan.
  if (!opts?.force && cached && isMonthFresh(ck, mk)) {
    return { times: cached, source: "api" };
  }

  try {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const days = await fetchMonthFromApi(lat, lng, year, month, methodId);
    writeMonth(ck, mk, days);

    // 30 günlük ufuk ay sınırını aşıyorsa sonraki ayı da önbelleğe al.
    // Böylece ay ortasında bile ~30 günlük gerçek API verisi hazır olur.
    const horizon = new Date(date);
    horizon.setDate(horizon.getDate() + 30);
    const horizonMk = dateKey(horizon).slice(0, 7);
    if (horizonMk !== mk && !isMonthFresh(ck, horizonMk)) {
      try {
        const nextDays = await fetchMonthFromApi(
          lat, lng, horizon.getFullYear(), horizon.getMonth() + 1, methodId
        );
        writeMonth(ck, horizonMk, nextDays);
      } catch {
        // Sonraki ay önbelleği best-effort; ana sonucu etkilemez.
      }
    }

    const t = days[dk];
    if (!t) throw new Error("AlAdhan yanıtında istenen gün yok");
    return { times: t, source: "api" };
  } catch {
    if (cached) return { times: cached, source: "cache" };
    return { times: getPrayerTimesFallback(lat, lng, date, timezone), source: "offline" };
  }
}

// Fallback: internet yoksa matematiksel hesap
export function getPrayerTimesFallback(
  lat: number,
  lng: number,
  date: Date,
  timezone: string
): PrayerTime[] {
  const rad = (d: number) => (d * Math.PI) / 180;
  const deg = (r: number) => (r * 180) / Math.PI;

  function getTimezoneOffset(tz: string, d: Date): number {
    try {
      const fmt = (z: string) => new Intl.DateTimeFormat("en-US", {
        timeZone: z, year:"numeric", month:"2-digit", day:"2-digit",
        hour:"2-digit", minute:"2-digit", second:"2-digit", hour12:false,
      }).format(d);
      const pw = (s: string) => {
        const [dp, tp] = s.split(", ");
        const [mo, dy, yr] = dp.split("/").map(Number);
        const [hh, mm, ss] = tp.split(":").map(Number);
        return Date.UTC(yr, mo-1, dy, hh, mm, ss);
      };
      return (pw(fmt(tz)) - pw(fmt("UTC"))) / 3_600_000;
    } catch { return 3; }
  }

  function calcHA(angle: number, lt: number, decl: number): number | null {
    const cosH = (Math.sin(rad(angle)) - Math.sin(rad(lt)) * Math.sin(rad(decl))) /
                 (Math.cos(rad(lt)) * Math.cos(rad(decl)));
    if (cosH > 1 || cosH < -1) return null;
    return deg(Math.acos(cosH)) / 15;
  }

  const year = date.getFullYear();
  const doy  = Math.floor((date.getTime() - new Date(year,0,1).getTime()) / 86_400_000) + 1;
  const g = 357.5291 + 0.98560028 * doy;
  const q = 280.459  + 0.98564736 * doy;
  const l = q + 1.915 * Math.sin(rad(g)) + 0.02 * Math.sin(rad(2*g));
  const e = 23.439 - 0.00000036 * doy;
  const decl = deg(Math.asin(Math.sin(rad(e)) * Math.sin(rad(l))));
  const ra   = deg(Math.atan2(Math.cos(rad(e)) * Math.sin(rad(l)), Math.cos(rad(l)))) / 15;
  const transit = (doy * 0.98564736 + 280.459) / 15;
  let eot = (transit - ra) * 60;
  while (eot < -20) eot += 1440;
  while (eot >  20) eot -= 1440;

  const tzO     = getTimezoneOffset(timezone, date);
  const noon    = 12 + tzO - lng/15 - eot/60;
  const sunHA   = calcHA(-0.833, lat, decl) ?? 6.0;
  const sunrise = noon - sunHA;
  const sunset  = noon + sunHA;
  const asrAlt  = deg(Math.atan(1 / (1 + Math.tan(rad(Math.abs(lat - decl))))));
  const asrHA   = calcHA(asrAlt, lat, decl) ?? 3.0;
  const fajrHA  = calcHA(-18.0, lat, decl);
  const ishaHA  = calcHA(-17.0, lat, decl);

  // Yüksek enlem düzeltmesi (Kuzey Avrupa, Kanada gibi bölgeler için):
  // 1) fajrHA/ishaHA hesaplanamıyorsa (güneş -18°'nin altına inmez) → 1/7 kuralı
  // 2) Hesaplansa bile gün uzunluğuna göre makul sınır kontrolü yapılır:
  //    Fajr, güneş doğuşundan en fazla (gün uzunluğu/7) önce olabilir.
  //    Bu, 45°N üzerinde yaz aylarında gerçekçi olmayan saatleri önler.
  const dayLength = 2 * sunHA; // saat cinsinden
  const correction = dayLength / 7; // 1/7 kuralı

  let fajrT: number, ishaT: number;
  if (fajrHA !== null && ishaHA !== null) {
    const rawFajr = noon - fajrHA;
    const rawIsha = noon + ishaHA;
    // Hesaplanan değer mantık sınırını aşıyorsa düzeltilmiş değeri kullan
    const minFajr = sunrise - correction;
    const maxIsha = sunset  + correction;
    fajrT = rawFajr < minFajr ? minFajr : rawFajr;
    ishaT = rawIsha > maxIsha ? maxIsha : rawIsha;
  } else {
    // NULL → 1/7 kuralı doğrudan uygula
    fajrT = sunrise - correction;
    ishaT = sunset  + correction;
  }

  const fmt = (h: number) => {
    let hh = Math.floor(h), mm = Math.round((h-hh)*60);
    if (mm >= 60) { hh++; mm -= 60; }
    hh = ((hh % 24) + 24) % 24;
    return `${String(hh).padStart(2,"0")}:${String(mm).padStart(2,"0")}`;
  };

  return [
    { name:"İmsak",  time:fmt(fajrT),       key:"imsak"  },
    { name:"Güneş",  time:fmt(sunrise),      key:"gunes"  },
    { name:"Öğle",   time:fmt(noon),         key:"ogle"   },
    { name:"İkindi", time:fmt(noon+asrHA),   key:"ikindi" },
    { name:"Akşam",  time:fmt(sunset),       key:"aksam"  },
    { name:"Yatsı",  time:fmt(ishaT),        key:"yatsi"  },
  ];
}
