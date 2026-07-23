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
  label: Record<string, string>;
  description: Record<string, string>;
}

export const PRAYER_METHODS: PrayerMethod[] = [
  {
    id: 13,
    label:       { tr: "Diyanet İşleri",        en: "Diyanet (Turkey)",       de: "Diyanet (Türkei)",         ar: "ديانت (تركيا)",             ur: "دیانت (ترکیہ)"          },
    description: { tr: "Türkiye resmi takvimi", en: "Official Turkey calendar",de: "Offizieller Türkei-Kalender",ar: "التقويم الرسمي لتركيا",    ur: "ترکیہ کا سرکاری کیلنڈر"  },
  },
  {
    id: 3,
    label:       { tr: "Muslim World League",   en: "Muslim World League",     de: "Muslim World League",      ar: "رابطة العالم الإسلامي",    ur: "مسلم ورلڈ لیگ"          },
    description: { tr: "Avrupa ve dünya geneli",en: "Europe and worldwide",    de: "Europa und weltweit",      ar: "أوروبا وعالمياً",           ur: "یورپ اور عالمی سطح"     },
  },
  {
    id: 2,
    label:       { tr: "ISNA",                  en: "ISNA",                    de: "ISNA",                     ar: "ISNA",                      ur: "ISNA"                    },
    description: { tr: "Kuzey Amerika",         en: "North America",           de: "Nordamerika",              ar: "أمريكا الشمالية",           ur: "شمالی امریکہ"           },
  },
  {
    id: 4,
    label:       { tr: "Ümmü'l-Kurâ",          en: "Umm al-Qura",             de: "Umm al-Qura",              ar: "أم القرى",                  ur: "ام القری"               },
    description: { tr: "Suudi Arabistan / Hicaz",en:"Saudi Arabia / Hijaz",   de: "Saudi-Arabien / Hedschas", ar: "المملكة العربية السعودية",   ur: "سعودی عرب / حجاز"      },
  },
  {
    id: 5,
    label:       { tr: "Mısır (EGAS)",          en: "Egypt (EGAS)",            de: "Ägypten (EGAS)",           ar: "مصر (هيئة المساحة)",        ur: "مصر (EGAS)"             },
    description: { tr: "Mısır ve Kuzey Afrika", en: "Egypt and North Africa",  de: "Ägypten und Nordafrika",   ar: "مصر وشمال أفريقيا",         ur: "مصر اور شمالی افریقہ"  },
  },
  {
    id: 1,
    label:       { tr: "Karachi (HEC)",         en: "Karachi (HEC)",           de: "Karachi (HEC)",            ar: "كراتشي (HEC)",              ur: "کراچی (HEC)"            },
    description: { tr: "Pakistan ve Güney Asya",en: "Pakistan and South Asia", de: "Pakistan und Südasien",    ar: "باكستان وجنوب آسيا",        ur: "پاکستان اور جنوبی ایشیا"},
  },
  {
    id: 99,
    label:       { tr: "Matematiksel (Offline)",en: "Mathematical (Offline)",  de: "Mathematisch (Offline)",   ar: "حسابي (بدون إنترنت)",       ur: "ریاضی (آف لائن)"        },
    description: { tr: "İnternet gerektirmez",  en: "No internet required",    de: "Kein Internet erforderlich",ar: "لا يحتاج إنترنت",           ur: "انٹرنیٹ کی ضرورت نہیں" },
  },
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
