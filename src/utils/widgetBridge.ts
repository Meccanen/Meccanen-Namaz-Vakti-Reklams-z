import { Capacitor } from "@capacitor/core";
import { registerPlugin } from "@capacitor/core";
import { calcSolarTimes, calcMoonPhase } from "./astronomyHelper";
import { t, getHijriMonths, getLocale, type LangCode } from "./i18n";

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
  /** Native worker'ın AlAdhan/native hesabı için konum ve metot (opsiyonel). */
  lat?: number;
  lng?: number;
  method?: number;
}

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
  lng?: number,
  method?: number
): WidgetPayload {
  const safeTz = tz || "Europe/Istanbul";
  const lc = lang as LangCode;
  const locale = getLocale(lc);
  // 7 gün: native worker günde bir tazelese de kullanıcı uygulamayı bir hafta
  // açmasa bile widget'ın elinde ileri tarihli veri kalsın.
  const rows = days.slice(0, 7).map((day, i) => {
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
      gd = new Intl.DateTimeFormat(locale, { timeZone: safeTz, day: "numeric", calendar: "gregory" }).format(dayDate);
      gm = new Intl.DateTimeFormat(locale, { timeZone: safeTz, month: "long", year: "numeric", calendar: "gregory" }).format(dayDate);
      const hp = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", {
        timeZone: safeTz, day: "numeric", month: "numeric", year: "numeric",
      }).formatToParts(dayDate);
      const hv = (ty: string) => hp.find(p => p.type === ty)?.value || "1";
      hd = hv("day");
      hm = getHijriMonths(lc)[parseInt(hv("month"), 10) - 1] || "—";
      hy = hv("year");
      const moon = calcMoonPhase(dayDate);
      mp = t(moon.phase, lc);
      mi = moon.illumination;
    } catch {
      // alanlar "–" olarak kalır; widget zarif şekilde boş alan gösterir
    }
    return {
      date: dateInTz(safeTz, i),
      noon,
      wd, gd, gm, hd, hm, hy, mp, mi,
      times: day.map((p) => {
        const key = `prayer_${p.key}`;
        const localized = t(key, lc);
        return { n: localized === key ? p.name : localized, t: p.time };
      }),
    };
  });
  return { days: rows, city, theme, lang, tz: safeTz, lat, lng, method };
}

export async function syncWidgets(payload: WidgetPayload): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await WidgetBridge.update({ payload: JSON.stringify(payload) });
  } catch {
    // native widget yoksa sessizce geç
  }
}