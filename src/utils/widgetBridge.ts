import { Capacitor } from "@capacitor/core";
import { registerPlugin } from "@capacitor/core";

/**
 * Yerel ana ekran widget'larına vakit/tema/şehir verisini ileten kapı.
 * Native taraf: WidgetBridgePlugin (build sırasında android projesine eklenir).
 */
interface WidgetBridgePlugin {
  update(opts: { payload: string }): Promise<void>;
}
const WidgetBridge = registerPlugin<WidgetBridgePlugin>("WidgetBridge");

export type PrayerRow = { key: string; name: string; time: string };
export type WidgetDayPayload = { date: string; times: { n: string; t: string }[] };

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

function dateInTz(tz: string, offsetDays: number): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(Date.now() + offsetDays * 86400000));
  return `${parts.find(p => p.type === "year")!.value}-${parts.find(p => p.type === "month")!.value}-${parts.find(p => p.type === "day")!.value}`;
}

export function buildWidgetPayload(
  days: PrayerRow[][],
  city: string,
  theme: string,
  lang: string,
  tz: string
): WidgetPayload {
  const rows = days.slice(0, 3).map((day, i) => ({
    date: dateInTz(tz || "Europe/Istanbul", i),
    times: day.map(p => ({
      n: PRAYER_NAMES[lang]?.[p.key] ?? p.name,
      t: p.time,
    })),
  }));
  return { days: rows, city, theme, lang, tz: tz || "Europe/Istanbul" };
}

export async function syncWidgets(payload: WidgetPayload): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await WidgetBridge.update({ payload: JSON.stringify(payload) });
  } catch {
    // native widget yoksa sessizce geç
  }
}