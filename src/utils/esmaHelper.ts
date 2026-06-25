/**
 * Esmâ Saatleri — İbn-i Îsâ-yı Saruhânî'nin Şerh-i Esmâ-i Hüsnâ'sına (1541) dayanan
 * klasik 7 gezegen / 7 gün-bölümü sistemi.
 *
 * KAYNAK: Prof. Dr. Ali Yılmaz, "Türk Edebiyatında Esmâ-i Hüsnâ Şerhleri ve İbn-i Îsâ-yı
 * Saruhânî'nin Şerh-i Esmâ-i Hüsnâ'sı" (DergiPark, makale no. 222048).
 *
 * SİSTEM NASIL ÇALIŞIR:
 * İbn-i Îsâ, 99 ismi yedi gezegene (Güneş, Müşterî/Jüpiter, Zühre/Venüs, Mirrîh/Merih,
 * Kamer/Ay, Utârid/Merkür, Zuhal/Satürn) dağıtmış, her gezegenin kendine ait bir isim
 * listesi ve her ismin kaç defa zikredileceği (genellikle ismin ebced değeri) belirtilmiştir.
 * Her gezegen de, haftanın yedi gününde günün yedi farklı bölümüne (Sabah, Kuşluk, Zevâl,
 * Öğle, Mâ-beyn, İkindi, Akşam) denk gelir — bu yüzden AYNI gün-bölümü, haftanın farklı
 * günlerinde farklı bir gezegenin (ve dolayısıyla farklı bir isim listesinin) yönetimine
 * girer. Bu da doğal olarak GÜNDEN GÜNE DEĞİŞEN bir isim döngüsü oluşturur.
 *
 * ÖNEMLİ: Bu döngü artık namaz vakitlerinden tamamen BAĞIMSIZDIR — kendi 7 gün-bölümü
 * vardır (namaz vakitlerinin 6 vaktiyle birebir örtüşmez).
 *
 * VERİ KALİTESİ NOTU: Kaynak metin OCR/PDF çıkarımından geldiği için bazı girdiler
 * şüpheli veya eksiktir (örn. Mirrîh listesinde tekrarlanan "9." numarası, "ed-Dârr"ın
 * sayısının "Ğ" olarak basılı olması, "el-Müşterî" gibi 99 isim listesinde karşılığı
 * olmayan bir girdi). Bu girdiler DÜZELTİLMEDEN, kaynakta nasılsa öyle bırakılmıştır.
 */

import { ESMA_MEANINGS, EsmaMeaning } from "./esmaData";

export type PlanetKey = "gunes" | "musteri" | "zuhre" | "mirrih" | "kamer" | "utarid" | "zuhal";
export type SegmentKey = "sabah" | "kusluk" | "zeval" | "ogle" | "mabeyn" | "ikindi" | "aksam";

export interface PlanetItem {
  key: string;       // ESMA_MEANINGS anahtarı
  count: number | null; // kaynaktaki zikir sayısı (ebced değeri); null = kaynakta belirsiz/okunamıyor
}

export const PLANET_LABELS: Record<PlanetKey, { tr: string; en: string; ar: string }> = {
  gunes: { tr: "Güneş", en: "The Sun", ar: "الشمس" },
  musteri: { tr: "Müşterî (Jüpiter)", en: "Jupiter", ar: "المشتري" },
  zuhre: { tr: "Zühre (Venüs)", en: "Venus", ar: "الزهرة" },
  mirrih: { tr: "Mirrîh (Merih)", en: "Mars", ar: "المريخ" },
  kamer: { tr: "Kamer (Ay)", en: "The Moon", ar: "القمر" },
  utarid: { tr: "Utârid (Merkür)", en: "Mercury", ar: "عطارد" },
  zuhal: { tr: "Zuhal (Satürn)", en: "Saturn", ar: "زحل" },
};

export const SEGMENT_LABELS: Record<SegmentKey, { tr: string; en: string; ar: string }> = {
  sabah: { tr: "Sabah", en: "Morning (Sabah)", ar: "الصباح" },
  kusluk: { tr: "Kuşluk", en: "Forenoon (Kuşluk)", ar: "الضحى" },
  zeval: { tr: "Zevâl", en: "Solar Noon (Zevâl)", ar: "الزوال" },
  ogle: { tr: "Öğle", en: "Midday (Öğle)", ar: "الظهر" },
  mabeyn: { tr: "Mâ-beyn", en: "Mid-Afternoon (Mâ-beyn)", ar: "ما بين الظهر والعصر" },
  ikindi: { tr: "İkindi", en: "Afternoon (İkindi)", ar: "العصر" },
  aksam: { tr: "Akşam", en: "Evening & Night (Akşam)", ar: "المساء والليل" },
};

const SEGMENT_ORDER: SegmentKey[] = ["sabah", "kusluk", "zeval", "ogle", "mabeyn", "ikindi", "aksam"];

// Kaynaktaki "her gezegenin haftanın hangi gününde günün hangi bölümüne isabet ettiği" tablosu.
// 0=Pazar, 1=Pazartesi, ... 6=Cumartesi (JS Date.getDay() ile aynı sıralama)
const WEEKDAY_KEYS = ["pazar", "pazartesi", "sali", "carsamba", "persembe", "cuma", "cumartesi"] as const;

// planet -> { gün: bölüm }
const PLANET_DAY_SEGMENT: Record<PlanetKey, Record<typeof WEEKDAY_KEYS[number], SegmentKey>> = {
  gunes:   { pazartesi: "mabeyn", sali: "kusluk", carsamba: "ikindi", persembe: "zeval", cuma: "aksam", cumartesi: "ogle", pazar: "sabah" },
  musteri: { pazartesi: "zeval", sali: "aksam", carsamba: "ogle", persembe: "sabah", cuma: "mabeyn", cumartesi: "kusluk", pazar: "ikindi" },
  zuhre:   { pazartesi: "ikindi", sali: "zeval", carsamba: "aksam", persembe: "ogle", cuma: "sabah", cumartesi: "mabeyn", pazar: "kusluk" },
  mirrih:  { pazartesi: "ogle", sali: "sabah", carsamba: "mabeyn", persembe: "kusluk", cuma: "ikindi", cumartesi: "zeval", pazar: "aksam" },
  kamer:   { pazartesi: "sabah", sali: "mabeyn", carsamba: "kusluk", persembe: "ikindi", cuma: "zeval", cumartesi: "aksam", pazar: "ogle" },
  utarid:  { pazartesi: "aksam", sali: "ogle", carsamba: "sabah", persembe: "mabeyn", cuma: "kusluk", cumartesi: "ikindi", pazar: "zeval" },
  zuhal:   { pazartesi: "kusluk", sali: "ikindi", carsamba: "zeval", persembe: "aksam", cuma: "ogle", cumartesi: "sabah", pazar: "mabeyn" },
};

// (gün, bölüm) -> gezegen tablosunu PLANET_DAY_SEGMENT'ten ters çevirerek otomatik kuruyoruz.
function buildSegmentPlanetTable(): Record<typeof WEEKDAY_KEYS[number], Record<SegmentKey, PlanetKey>> {
  const table: any = {};
  for (const day of WEEKDAY_KEYS) table[day] = {};
  (Object.keys(PLANET_DAY_SEGMENT) as PlanetKey[]).forEach((planet) => {
    WEEKDAY_KEYS.forEach((day) => {
      const seg = PLANET_DAY_SEGMENT[planet][day];
      table[day][seg] = planet;
    });
  });
  return table;
}
const SEGMENT_PLANET_TABLE = buildSegmentPlanetTable();

// Kaynaktaki 7 gezegen listesi (isim + ebced/zikir sayısı). Sıra ve sayılar kaynakla aynıdır;
// şüpheli/eksik veriler (null) düzeltilmeden bırakılmıştır.
export const PLANETS: Record<PlanetKey, PlanetItem[]> = {
  gunes: [
    { key: "allah", count: 66 }, { key: "rahman", count: 298 }, { key: "rahim", count: 386 },
    { key: "melik", count: 90 }, { key: "selam", count: 131 }, { key: "halik", count: 731 },
    { key: "bari", count: 204 }, { key: "basit", count: 72 }, { key: "rafi", count: 351 },
    { key: "muizz", count: 117 }, { key: "basir", count: 300 }, { key: "hakem", count: 68 },
    { key: "adl", count: 104 }, { key: "gafur", count: 1286 }, { key: "aliyy", count: 110 },
    { key: "hafiz", count: 998 }, { key: "mukit", count: 550 }, { key: "celil", count: 73 },
    { key: "bais", count: 573 }, { key: "muhsi", count: 148 }, { key: "hayy", count: 18 },
    { key: "kadir", count: 305 }, { key: "muktedir", count: 744 }, { key: "evvel", count: 37 },
    { key: "vali", count: 47 }, { key: "afuvv", count: 156 }, { key: "zulcelal", count: 1100 },
    { key: "gani", count: 1060 }, { key: "mani", count: 161 }, { key: "nur", count: 256 },
    { key: "hadi", count: 20 }, { key: "baki", count: 113 }, { key: "resid", count: 514 },
    { key: "sabur", count: 298 },
  ],
  musteri: [
    { key: "kuddus", count: 170 }, { key: "muheymin", count: 145 }, { key: "mutekebbir", count: 662 },
    { key: "kahhar", count: 306 }, { key: "alim", count: 150 }, { key: "kabiz", count: 903 },
    { key: "semi", count: 180 }, { key: "kebir", count: 231 }, { key: "musteri_suspicious", count: 55 },
    { key: "sehid", count: 319 }, { key: "hamid", count: 62 }, { key: "mubdi", count: 56 },
    { key: "kayyum", count: 156 }, { key: "samed", count: 134 }, { key: "tevvab", count: 409 },
    { key: "muksit", count: 219 }, { key: "cami", count: 114 }, { key: "bedi", count: 86 },
  ],
  zuhre: [
    { key: "mumin", count: 136 }, { key: "gaffar", count: 1281 }, { key: "vehhab", count: 14 },
    { key: "rezzak", count: 308 }, { key: "latif", count: 129 }, { key: "sekur", count: 526 },
    { key: "hasib", count: 80 }, { key: "kerim", count: 270 }, { key: "rakib", count: 312 },
    { key: "mecid", count: 57 }, { key: "vekil", count: 66 }, { key: "metin", count: 500 },
    { key: "muhyi", count: 68 }, { key: "macid", count: 48 }, { key: "birr", count: 202 },
    { key: "mugni", count: 1100 }, { key: "varis", count: 707 },
  ],
  mirrih: [
    { key: "aziz", count: 94 }, { key: "cebbar", count: 206 }, { key: "muzill", count: 770 },
    { key: "kavi", count: 110 }, { key: "veli", count: 46 }, { key: "mumit", count: 490 },
    { key: "vahid", count: 19 }, { key: "ehad", count: 13 }, { key: "ahir", count: 801 },
    { key: "muntakim", count: 630 }, { key: "darr", count: null },
  ],
  kamer: [
    { key: "musavvir", count: 336 }, { key: "habir", count: 812 }, { key: "vasi", count: 137 },
    { key: "hakim", count: 78 }, { key: "vedud", count: 20 }, { key: "batin", count: 62 },
  ],
  utarid: [
    { key: "fettah", count: 489 }, { key: "azim", count: 1020 }, { key: "muid", count: 124 },
    { key: "rauf", count: 286 }, { key: "malikulmulk", count: 212 },
  ],
  zuhal: [
    { key: "hafiz", count: 1481 }, { key: "halim", count: 88 }, { key: "vacid", count: 14 },
    { key: "mukaddim", count: 184 }, { key: "muahhir", count: 184 }, { key: "zahir", count: 1106 },
    { key: "muteal", count: 551 }, { key: "nafi", count: 201 },
  ],
};

export interface EsmaSaatiResult {
  segment: SegmentKey;
  planet: PlanetKey;
  weekday: string;
  item: PlanetItem;
  meaning: EsmaMeaning;
  segmentStart: Date;
  segmentEnd: Date;
}

// Bugünün (Date) hangi gün-bölümüne (segment) denk geldiğini, mevcut namaz vakitlerinden
// türetilen sınırlarla hesaplar. Namaz vakti hesaplamasından bağımsız bir döngü olduğu için
// sadece sınır belirlemek amacıyla bu vakitlerden faydalanılır.
export function getSegmentBoundaries(
  prayerTimes: { key: string; time: string }[],
  baseDate: Date,
  nextDayImsak: string | null,
): Record<SegmentKey, { start: Date; end: Date }> | null {
  const findTime = (key: string) => prayerTimes.find(p => p.key === key)?.time;
  const imsak = findTime("imsak");
  const gunes = findTime("gunes");
  const ogle = findTime("ogle");
  const ikindi = findTime("ikindi");
  const aksam = findTime("aksam");
  if (!imsak || !gunes || !ogle || !ikindi || !aksam) return null;

  const toDate = (hhmm: string, dayOffset = 0): Date => {
    const [h, m] = hhmm.split(":").map(Number);
    const d = new Date(baseDate);
    d.setDate(d.getDate() + dayOffset);
    d.setHours(h, m, 0, 0);
    return d;
  };
  const mid = (a: Date, b: Date) => new Date((a.getTime() + b.getTime()) / 2);

  const tImsak = toDate(imsak);
  const tGunes = toDate(gunes);
  const tOgle = toDate(ogle);
  const tIkindi = toDate(ikindi);
  const tAksam = toDate(aksam);
  const tNextImsak = toDate(nextDayImsak || imsak, 1);

  const kusluk_zeval_mid = mid(tGunes, tOgle);
  const ogle_mabeyn_mid = mid(tOgle, tIkindi);

  return {
    sabah:  { start: tImsak, end: tGunes },
    kusluk: { start: tGunes, end: kusluk_zeval_mid },
    zeval:  { start: kusluk_zeval_mid, end: tOgle },
    ogle:   { start: tOgle, end: ogle_mabeyn_mid },
    mabeyn: { start: ogle_mabeyn_mid, end: tIkindi },
    ikindi: { start: tIkindi, end: tAksam },
    aksam:  { start: tAksam, end: tNextImsak },
  };
}

function getWeekdayKey(date: Date): typeof WEEKDAY_KEYS[number] {
  return WEEKDAY_KEYS[date.getDay()];
}

// Bir gezegenin listesinden, GÜNE göre değişen ama gün içinde sabit kalan bir isim seçer
// (gün-yılın kaçıncı günü olduğuna göre indekslenir — basit, deterministik bir döngü).
function pickDeterministic<T>(list: T[], date: Date): T {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / 86400000);
  return list[dayOfYear % list.length];
}

export function getCurrentEsmaSaati(
  now: Date,
  prayerTimes: { key: string; time: string }[],
  nextDayImsak: string | null,
): EsmaSaatiResult | null {
  const boundaries = getSegmentBoundaries(prayerTimes, now, nextDayImsak);
  if (!boundaries) return null;

  let currentSegment: SegmentKey | null = null;
  for (const seg of SEGMENT_ORDER) {
    const { start, end } = boundaries[seg];
    if (now >= start && now < end) { currentSegment = seg; break; }
  }
  // Gece yarısını geçip "aksam" bitmeden önceki bir an için (örn. 00:30) yukarıdaki döngü
  // bulamayabilir çünkü "aksam" aralığı dünkü akşam vaktinden bugünkü imsak'a kadar sürer.
  // Bu durumda "aksam" segmentini fallback olarak kullan.
  if (!currentSegment) currentSegment = "aksam";

  const weekday = getWeekdayKey(now);
  const planet = SEGMENT_PLANET_TABLE[weekday][currentSegment];
  const list = PLANETS[planet];
  const item = pickDeterministic(list, now);
  const meaning = ESMA_MEANINGS[item.key];

  return {
    segment: currentSegment,
    planet,
    weekday,
    item,
    meaning,
    segmentStart: boundaries[currentSegment].start,
    segmentEnd: boundaries[currentSegment].end,
  };
}
