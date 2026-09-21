import { Capacitor } from "@capacitor/core";
import { registerPlugin } from "@capacitor/core";
import { calcSolarTimes, calcMoonPhase } from "./astronomyHelper";

/**
 * Yerel ana ekran widget'larına vakit/tema/şehir verisini ileten kapı.
 * Native taraf: WidgetBridgePlugin (build sırasında android projesine eklenir).
 */
interface WidgetBridgePlugin {
  update(opts: { payload: string }): Promise<void>;
}
const WidgetBridge = registerPlugin<WidgetBridgePlugin>("WidgetBridge");

export type PrayerRow = { key: string; name: string; time: string };
export type WidgetDayPayload = {
  date: string;
  noon: string;
  wd: string;   // haftanın günü (yerelleştirilmiş, uzun)
  gd: string;   // miladi gün sayısı
  gm: string;   // miladi ay + yıl ("September 2026")
  hd: string;   // hicri gün sayısı
  hm: string;   // hicri ay adı (yerelleştirilmiş)
  hy: string;   // hicri yıl
  mp: string;   // ay fazı (yerelleştirilmiş)
  mi: number;   // aydınlanma yüzdesi
  times: { n: string; t: string }[];
};

export interface WidgetPayload {
  days: WidgetDayPayload[];
  city: string;
  theme: string;
  lang: string;
  tz: string;
}

// i18n ile birebir aynı adlar — widget dili Ruby değil Capacitor, bu yüzden
// tarayıcı tarafı vakit adlarını yerelleştirip native'ye hazır etiket verir.
const PRAYER_NAMES: Record<string, Record<string, string>> = {
  tr: { imsak: "İmsak",   gunes: "Güneş", ogle: "Öğle",   ikindi: "İkindi", aksam: "Akşam", yatsi: "Yatsı" },
  en: { imsak: "Fajr",    gunes: "Sunrise", ogle: "Dhuhr",   ikindi: "Asr",     aksam: "Maghrib", yatsi: "Isha" },
  ar: { imsak: "الفجر",   gunes: "الشروق", ogle: "الظهر",   ikindi: "العصر",    aksam: "المغرب",  yatsi: "العشاء" },
  de: { imsak: "Fadschr", gunes: "Sonnenaufgang", ogle: "Dhuhr", ikindi: "Asr", aksam: "Maghrib", yatsi: "Isha" },
  ur: { imsak: "فجر",     gunes: "طلوع آفتاب", ogle: "ظہر",  ikindi: "عصر",     aksam: "مغرب",    yatsi: "عشاء" },
};

// Ana uygulamadaki (App.tsx) HIJRI_MONTHS + ay fazı çevirileriyle birebir aynı.
const HIJRI_MONTHS: Record<string, string[]> = {
  tr: ["Muharrem","Safer","Rebiülevvel","Rebiülahir","Cemaziyelevvel","Cemaziyelahir","Recep","Şaban","Ramazan","Şevval","Zilkade","Zilhicce"],
  en: ["Muharram","Safar","Rabi al-Awwal","Rabi al-Thani","Jumada al-Ula","Jumada al-Thania","Rajab","Sha'ban","Ramadan","Shawwal","Dhu al-Qi'dah","Dhu al-Hijjah"],
  ar: ["محرم","صفر","ربيع الأول","ربيع الثاني","جمادى الأولى","جمادى الآخرة","رجب","شعبان","رمضان","شوال","ذو القعدة","ذو الحجة"],
  de: ["Muharram","Safar","Rabi al-Awwal","Rabi ath-Thani","Dschumada l-ula","Dschumada th-thaniya","Radschab","Scha'ban","Ramadan","Schawwal","Dhu l-Qa'da","Dhu l-Hijja"],
  ur: ["محرم","صفر","ربیع الاول","ربیع الثانی","جمادی الاول","جمادی الثانی","رجب","شعبان","رمضان","شوال","ذوالقعدہ","ذوالحجہ"],
};

const MOON_PHASES: Record<string, Record<string, string>> = {
  tr: { newMoon: "Yeni Ay", waxingCrescent: "Hilal", firstQuarter: "İlk Dördün", waxingGibbous: "Şişkin Ay", fullMoon: "Dolunay", waningGibbous: "Azalan Şişkin Ay", thirdQuarter: "Son Dördün", waningCrescent: "Eski Hilal" },
  en: { newMoon: "New Moon", waxingCrescent: "Waxing Crescent", firstQuarter: "First Quarter", waxingGibbous: "Waxing Gibbous", fullMoon: "Full Moon", waningGibbous: "Waning Gibbous", thirdQuarter: "Third Quarter", waningCrescent: "Waning Crescent" },
  ar: { newMoon: "محاق", waxingCrescent: "هلال متزايد", firstQuarter: "تربيع أول", waxingGibbous: "أحدب متزايد", fullMoon: "بدر", waningGibbous: "أحدب متناقص", thirdQuarter: "تربيع ثاني", waningCrescent: "هلال متناقص" },
  de: { newMoon: "Neumond", waxingCrescent: "Zunehmende Sichel", firstQuarter: "Erstes Viertel", waxingGibbous: "Zunehmender Mond", fullMoon: "Vollmond", waningGibbous: "Abnehmender Mond", thirdQuarter: "Letztes Viertel", waningCrescent: "Abnehmende Sichel" },
  ur: { newMoon: "نیا چاند", waxingCrescent: "بڑھتا ہلال", firstQuarter: "پہلی چوتھائی", waxingGibbous: "بڑھتا بھرا چاند", fullMoon: "پورا چاند", waningGibbous: "گھٹتا بھرا چاند", thirdQuarter: "آخری چوتھائی", waningCrescent: "گھٹتا ہلال" },
};

function dateInTz(tz: string, offsetDays: number): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(Date.now() + offsetDays * 86400000));
  return `${parts.find(p => p.type === "year")!.value}-${parts.find(p => p.type === "month")!.value}-${parts.find(p => p.type === "day")!.value}`;
}

function fmtHM(minutes: number): string {
  const m = Math.max(0, Math.round(minutes));
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

export function buildWidgetPayload(
  days: PrayerRow[][],
  city: string,
  theme: string,
  lang: string,
  tz: string,
  lat?: number,
  lng?: number
): WidgetPayload {
  const safeTz = tz || "Europe/Istanbul";
  const LOCALE_MAP: Record<string, string> = { tr: "tr-TR", en: "en-US", ar: "ar-SA", de: "de-DE", ur: "ur-PK" };
  const locale = LOCALE_MAP[lang] || "en-US";
  const rows = days.slice(0, 3).map((day, i) => {
    let noon = "";
    const dayDate = new Date(Date.now() + i * 86400000);
    if (typeof lat === "number" && typeof lng === "number") {
      try {
        noon = fmtHM(calcSolarTimes(lat, lng, dayDate, safeTz).solarNoonMinutes);
      } catch {
        noon = "";
      }
    }
    let wd = "--", gd = "--", gm = "--", hd = "--", hm = "--", hy = "----", mp = "--", mi = 0;
    try {
      wd = new Intl.DateTimeFormat(locale, { timeZone: safeTz, weekday: "long" }).format(dayDate);
      gd = new Intl.DateTimeFormat(locale, { timeZone: safeTz, day: "numeric" }).format(dayDate);
      gm = new Intl.DateTimeFormat(locale, { timeZone: safeTz, month: "long", year: "numeric" }).format(dayDate);
      const hp = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", {
        timeZone: safeTz, day: "numeric", month: "numeric", year: "numeric",
      }).formatToParts(dayDate);
      const hv = (ty: string) => hp.find(p => p.type === ty)?.value || "1";
      hd = hv("day");
      hm = (HIJRI_MONTHS[lang] || HIJRI_MONTHS.en)[parseInt(hv("month"), 10) - 1] || "—";
      hy = hv("year");
      const moon = calcMoonPhase(dayDate);
      mp = (MOON_PHASES[lang] || MOON_PHASES.en)[moon.phase] || moon.phase;
      mi = moon.illumination;
    } catch {
      // alanlar "–" olarak kalır; widget zarif şekilde boş alan gösterir
    }
    return {
      date: dateInTz(safeTz, i),
      noon,
      wd, gd, gm, hd, hm, hy, mp, mi,
      times: day.map(p => ({
        n: PRAYER_NAMES[lang]?.[p.key] ?? p.name,
        t: p.time,
      })),
    };
  });
  return { days: rows, city, theme, lang, tz: safeTz };
}

export async function syncWidgets(payload: WidgetPayload): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await WidgetBridge.update({ payload: JSON.stringify(payload) });
  } catch {
    // native widget yoksa sessizce geç
  }
}