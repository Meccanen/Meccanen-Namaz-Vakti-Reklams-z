/**
 * Prayer Times via AlAdhan API
 * https://aladhan.com/prayer-times-api
 */

export interface PrayerTime {
  name: string;
  time: string;
  key: string;
}

export interface PrayerMethod {
  id: number;
  label: string;
  description: string;
}

export const PRAYER_METHODS: PrayerMethod[] = [
  { id: 13, label: "Diyanet İşleri",        description: "Türkiye resmi takvimi" },
  { id: 3,  label: "Muslim World League",    description: "Avrupa ve dünya geneli" },
  { id: 2,  label: "ISNA",                   description: "Kuzey Amerika" },
  { id: 4,  label: "Ümmü'l-Kurâ",           description: "Suudi Arabistan / Hicaz" },
  { id: 5,  label: "Mısır (EGAS)",           description: "Mısır ve Kuzey Afrika" },
  { id: 1,  label: "Karachi (HEC)",          description: "Pakistan ve Güney Asya" },
  { id: 99, label: "Matematiksel (Offline)", description: "İnternet gerektirmez" },
];

// Cache: aynı gün + konum + metod için tekrar istek atma
const cache = new Map<string, PrayerTime[]>();

export async function fetchPrayerTimes(
  lat: number,
  lng: number,
  date: Date,
  timezone: string,
  methodId: number = 13
): Promise<PrayerTime[]> {
  // Offline metod seçildiyse direkt fallback'e git
  if (methodId === 99) {
    return getPrayerTimesFallback(lat, lng, date, timezone);
  }

  const dateStr = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  const cacheKey = `${lat.toFixed(3)}_${lng.toFixed(3)}_${dateStr}_${methodId}`;

  if (cache.has(cacheKey)) return cache.get(cacheKey)!;

  const method = methodId;
  const day    = String(date.getDate()).padStart(2, '0');
  const month  = String(date.getMonth() + 1).padStart(2, '0');
  const year   = date.getFullYear();

  const url = `https://api.aladhan.com/v1/timings/${day}-${month}-${year}?latitude=${lat}&longitude=${lng}&method=${method}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`AlAdhan API hatası: ${res.status}`);
  const data = await res.json();

  if (data.code !== 200) throw new Error('AlAdhan API geçersiz yanıt');

  const t = data.data.timings;

  const result: PrayerTime[] = [
    { name: 'İmsak',  time: t.Fajr,    key: 'imsak'  },
    { name: 'Güneş',  time: t.Sunrise, key: 'gunes'  },
    { name: 'Öğle',   time: t.Dhuhr,   key: 'ogle'   },
    { name: 'İkindi', time: t.Asr,     key: 'ikindi' },
    { name: 'Akşam',  time: t.Maghrib, key: 'aksam'  },
    { name: 'Yatsı',  time: t.Isha,    key: 'yatsi'  },
  ];

  cache.set(cacheKey, result);
  return result;
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

  let fajrT: number, ishaT: number;
  if (fajrHA !== null && ishaHA !== null) {
    fajrT = noon - fajrHA;
    ishaT = noon + ishaHA;
  } else {
    const p = (24 - 2*sunHA) / 7;
    fajrT = sunrise - p;
    ishaT = sunset  + p;
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
