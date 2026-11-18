// Dini Günler 2026-2027
// Tarihler Hicri kurallara göre umalqura takviminden hesaplanır.
// Not: Hilal gözlemine bağlı günler ±1 gün kayabilir (Diyanet/yerel ilan).

import { getHijriMonths, type LangCode } from "./i18n";

export interface ReligiousEvent {
  date: string;      // "YYYY-MM-DD" (Miladi)
  hijriDay: number;  // Hicri gün
  hijriMonth: number;// Hicri ay (1-12)
  hijriYear: number; // Hicri yıl
  hijriLabel?: string;// okunabilir etiket, ör. "27 Recep 1448" (getReligiousEvents çıktısında dolu)
  nameKey: string;   // i18n anahtarı
}


// Her dini günün Hicri (gun, ay) kuralı. Bayram/arife günleri özel işlenir.
// key sırayı korumak için kullanılır (1 = veri+kandil sırasına göre).
function hijriParts(date: Date, tz: string): { y: number; m: number; d: number } {
  const hp = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", {
    timeZone: tz, day: "numeric", month: "numeric", year: "numeric",
  }).formatToParts(date);
  const num = (t: string) => parseInt(hp.find((p) => p.type === t)?.value || "0", 10);
  return { y: num("year"), m: num("month"), d: num("day") };
}

function addDays(iso: string, delta: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + delta));
  return dt.toISOString().slice(0, 10);
}

const HIJRI_DAY_KEYS: Record<string, { m: number; d: number; key: string }[]> = {
  // (Hicri ay, Hicri gün) → ad anahtarı
  "*": [
    { m: 1, d: 1, key: "relYilbasi" },
    { m: 1, d: 10, key: "relAsure" },
    { m: 3, d: 12, key: "relMevlit" },
    { m: 7, d: 1, key: "relUcAylar" },
    { m: 7, d: 27, key: "relMirac" },
    { m: 8, d: 15, key: "relBerat" },
    { m: 9, d: 1, key: "relRamazan" },
    { m: 9, d: 27, key: "relKadir" },
    { m: 10, d: 1, key: "relBayram1" },
    { m: 10, d: 2, key: "relBayram2" },
    { m: 10, d: 3, key: "relBayram3" },
    { m: 12, d: 9, key: "relArifeKurban" },
    { m: 12, d: 10, key: "relKurban1" },
    { m: 12, d: 11, key: "relKurban2" },
    { m: 12, d: 12, key: "relKurban3" },
    { m: 12, d: 13, key: "relKurban4" },
  ],
};

export function getReligiousEvents(tz: string, lang: LangCode = "tr"): ReligiousEvent[] {
  const out: ReligiousEvent[] = [];
  const months = getHijriMonths(lang);
  const rules = HIJRI_DAY_KEYS["*"];

  for (let yy = 2026; yy <= 2027; yy++) {
    for (let mm = 1; mm <= 12; mm++) {
      const daysInMonth = new Date(Date.UTC(yy, mm, 0)).getUTCDate();
      for (let dd = 1; dd <= daysInMonth; dd++) {
        const date = new Date(Date.UTC(yy, mm - 1, dd, 12));
        const h = hijriParts(date, tz);
        const rule = rules.find((r) => r.m === h.m && r.d === h.d);
        if (!rule) continue;
        const iso = `${yy}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
        out.push({
          date: iso,
          hijriDay: h.d,
          hijriMonth: h.m,
          hijriYear: h.y,
          nameKey: rule.key,
        });
        // Ramazan Bayramı Arifesi: bayram 1. gününden bir önceki Miladi gün
        if (rule.key === "relBayram1") {
          const prev = addDays(iso, -1);
          const ph = hijriParts(new Date(prev + "T12:00:00"), tz);
          out.push({
            date: prev,
            hijriDay: ph.d,
            hijriMonth: ph.m,
            hijriYear: ph.y,
            nameKey: "relArifeRamazan",
          });
        }
      }
    }
  }

  // Regaib: Recep ayının ilk Cuma gecesi → bir önceki gün listeye eklenir.
  const recepOnes = out.filter((e) => e.nameKey === "relUcAylar");
  for (const r of recepOnes) {
    const [y, m, d] = r.date.split("-").map(Number);
    let cur = new Date(Date.UTC(y, m - 1, d, 12));
    for (let i = 0; i < 7; i++) {
      if (cur.getUTCDay() === 5) {
        out.push({
          date: cur.toISOString().slice(0, 10),
          hijriDay: 1 + i,
          hijriMonth: 7,
          hijriYear: r.hijriYear,
          nameKey: "relRegaib",
        });
        break;
      }
      cur = new Date(Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth(), cur.getUTCDate() + 1, 12));
    }
  }

  // Sırala + ay/dil etiketi ekle (dil bağımlı alan çıktıya dahil edilir)
  const sorted = [...out].sort((a, b) => a.date.localeCompare(b.date));
  const seen = new Set<string>();
  const unique = sorted.filter((e) => {
    const k = `${e.date}|${e.nameKey}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  return unique.map((e) => {
    const monthName = months[e.hijriMonth - 1] || "";
    return {
      ...e,
      hijriLabel: `${e.hijriDay} ${monthName} ${e.hijriYear}`,
    };
  }).sort((a, b) => a.date.localeCompare(b.date));
}