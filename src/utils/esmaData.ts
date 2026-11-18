/**
 * Esmâ-i Hüsnâ — isimlerin Arapça yazılışı ve okunuşu.
 *
 * ANLAMLAR ARTIK DİL MODÜLLERİNDEDİR:
 *   src/i18n/locales/<kod>.ts -> esma: { anahtar: "anlam" }
 * Yeni bir dilin Esmâ anlamlarını eklemek için ilgili locale dosyasına
 * `esma` bölümünü eklemek yeterlidir. Eksikse İngilizceye düşer.
 */

import { LANGUAGE_ORDER, LOCALES } from "../i18n/index.ts";

export interface EsmaMeaning {
  arabic: string;
  transliteration: string;
  /** Dil kodu -> anlam (tr, en, ar, de, ur, fa ...). */
  [lang: string]: string;
}

/** Arapça yazılış + okunuş (dilden bağımsız). */
const BASE: Record<string, { arabic: string; transliteration: string }> = {
  "allah": {
    "arabic": "الله",
    "transliteration": "Allâh"
  },
  "rahman": {
    "arabic": "الرحمن",
    "transliteration": "er-Rahmân"
  },
  "rahim": {
    "arabic": "الرحيم",
    "transliteration": "er-Rahîm"
  },
  "melik": {
    "arabic": "الملك",
    "transliteration": "el-Melik"
  },
  "kuddus": {
    "arabic": "القدوس",
    "transliteration": "el-Kuddûs"
  },
  "selam": {
    "arabic": "السلام",
    "transliteration": "es-Selâm"
  },
  "mumin": {
    "arabic": "المؤمن",
    "transliteration": "el-Mü'min"
  },
  "muheymin": {
    "arabic": "المهيمن",
    "transliteration": "el-Müheymin"
  },
  "aziz": {
    "arabic": "العزيز",
    "transliteration": "el-Azîz"
  },
  "cebbar": {
    "arabic": "الجبار",
    "transliteration": "el-Cebbâr"
  },
  "mutekebbir": {
    "arabic": "المتكبر",
    "transliteration": "el-Mütekebbir"
  },
  "halik": {
    "arabic": "الخالق",
    "transliteration": "el-Hâlık"
  },
  "bari": {
    "arabic": "البارئ",
    "transliteration": "el-Bâri'"
  },
  "musavvir": {
    "arabic": "المصور",
    "transliteration": "el-Musavvir"
  },
  "gaffar": {
    "arabic": "الغفار",
    "transliteration": "el-Gaffâr"
  },
  "kahhar": {
    "arabic": "القهار",
    "transliteration": "el-Kahhâr"
  },
  "vehhab": {
    "arabic": "الوهاب",
    "transliteration": "el-Vehhâb"
  },
  "rezzak": {
    "arabic": "الرزاق",
    "transliteration": "er-Rezzâk"
  },
  "fettah": {
    "arabic": "الفتاح",
    "transliteration": "el-Fettâh"
  },
  "alim": {
    "arabic": "العليم",
    "transliteration": "el-Alîm"
  },
  "kabiz": {
    "arabic": "القابض",
    "transliteration": "el-Kâbız"
  },
  "basit": {
    "arabic": "الباسط",
    "transliteration": "el-Bâsıt"
  },
  "hafid": {
    "arabic": "الخافض",
    "transliteration": "el-Hâfıd"
  },
  "rafi": {
    "arabic": "الرافع",
    "transliteration": "er-Râfi'"
  },
  "muizz": {
    "arabic": "المعز",
    "transliteration": "el-Muizz"
  },
  "muzill": {
    "arabic": "المذل",
    "transliteration": "el-Müzill"
  },
  "semi": {
    "arabic": "السميع",
    "transliteration": "es-Semî'"
  },
  "basir": {
    "arabic": "البصير",
    "transliteration": "el-Basîr"
  },
  "hakem": {
    "arabic": "الحكم",
    "transliteration": "el-Hakem"
  },
  "adl": {
    "arabic": "العدل",
    "transliteration": "el-Adl"
  },
  "latif": {
    "arabic": "اللطيف",
    "transliteration": "el-Latîf"
  },
  "habir": {
    "arabic": "الخبير",
    "transliteration": "el-Habîr"
  },
  "halim": {
    "arabic": "الحليم",
    "transliteration": "el-Halîm"
  },
  "azim": {
    "arabic": "العظيم",
    "transliteration": "el-Azîm"
  },
  "gafur": {
    "arabic": "الغفور",
    "transliteration": "el-Gafûr"
  },
  "sekur": {
    "arabic": "الشكور",
    "transliteration": "eş-Şekûr"
  },
  "aliyy": {
    "arabic": "العلي",
    "transliteration": "el-Aliyy"
  },
  "kebir": {
    "arabic": "الكبير",
    "transliteration": "el-Kebîr"
  },
  "hafiz": {
    "arabic": "الحفيظ",
    "transliteration": "el-Hafîz"
  },
  "mukit": {
    "arabic": "المقيت",
    "transliteration": "el-Mukît"
  },
  "hasib": {
    "arabic": "الحسيب",
    "transliteration": "el-Hasîb"
  },
  "celil": {
    "arabic": "الجليل",
    "transliteration": "el-Celîl"
  },
  "kerim": {
    "arabic": "الكريم",
    "transliteration": "el-Kerîm"
  },
  "rakib": {
    "arabic": "الرقيب",
    "transliteration": "er-Rakîb"
  },
  "mucib": {
    "arabic": "المجيب",
    "transliteration": "el-Mücîb"
  },
  "vasi": {
    "arabic": "الواسع",
    "transliteration": "el-Vâsi'"
  },
  "hakim": {
    "arabic": "الحكيم",
    "transliteration": "el-Hakîm"
  },
  "vedud": {
    "arabic": "الودود",
    "transliteration": "el-Vedûd"
  },
  "mecid": {
    "arabic": "المجيد",
    "transliteration": "el-Mecîd"
  },
  "bais": {
    "arabic": "الباعث",
    "transliteration": "el-Bâis"
  },
  "sehid": {
    "arabic": "الشهيد",
    "transliteration": "eş-Şehîd"
  },
  "hak": {
    "arabic": "الحق",
    "transliteration": "el-Hak"
  },
  "vekil": {
    "arabic": "الوكيل",
    "transliteration": "el-Vekîl"
  },
  "kavi": {
    "arabic": "القوي",
    "transliteration": "el-Kavî"
  },
  "metin": {
    "arabic": "المتين",
    "transliteration": "el-Metîn"
  },
  "veli": {
    "arabic": "الولي",
    "transliteration": "el-Velî"
  },
  "hamid": {
    "arabic": "الحميد",
    "transliteration": "el-Hamîd"
  },
  "muhsi": {
    "arabic": "المحصي",
    "transliteration": "el-Muhsî"
  },
  "mubdi": {
    "arabic": "المبدئ",
    "transliteration": "el-Mübdi'"
  },
  "muid": {
    "arabic": "المعيد",
    "transliteration": "el-Muîd"
  },
  "muhyi": {
    "arabic": "المحيي",
    "transliteration": "el-Muhyî"
  },
  "mumit": {
    "arabic": "المميت",
    "transliteration": "el-Mümît"
  },
  "hayy": {
    "arabic": "الحي",
    "transliteration": "el-Hayy"
  },
  "kayyum": {
    "arabic": "القيوم",
    "transliteration": "el-Kayyûm"
  },
  "vacid": {
    "arabic": "الواجد",
    "transliteration": "el-Vâcid"
  },
  "macid": {
    "arabic": "الماجد",
    "transliteration": "el-Mâcid"
  },
  "vahid": {
    "arabic": "الواحد",
    "transliteration": "el-Vâhid"
  },
  "ehad": {
    "arabic": "الأحد",
    "transliteration": "el-Ehad"
  },
  "samed": {
    "arabic": "الصمد",
    "transliteration": "es-Samed"
  },
  "kadir": {
    "arabic": "القادر",
    "transliteration": "el-Kâdir"
  },
  "muktedir": {
    "arabic": "المقتدر",
    "transliteration": "el-Muktedir"
  },
  "mukaddim": {
    "arabic": "المقدم",
    "transliteration": "el-Mukaddim"
  },
  "muahhir": {
    "arabic": "المؤخر",
    "transliteration": "el-Muahhir"
  },
  "evvel": {
    "arabic": "الأول",
    "transliteration": "el-Evvel"
  },
  "ahir": {
    "arabic": "الآخر",
    "transliteration": "el-Âhir"
  },
  "zahir": {
    "arabic": "الظاهر",
    "transliteration": "ez-Zâhir"
  },
  "batin": {
    "arabic": "الباطن",
    "transliteration": "el-Bâtın"
  },
  "vali": {
    "arabic": "الوالي",
    "transliteration": "el-Vâlî"
  },
  "muteal": {
    "arabic": "المتعالي",
    "transliteration": "el-Müteâl"
  },
  "birr": {
    "arabic": "البر",
    "transliteration": "el-Birr"
  },
  "tevvab": {
    "arabic": "التواب",
    "transliteration": "et-Tevvâb"
  },
  "muntakim": {
    "arabic": "المنتقم",
    "transliteration": "el-Müntakim"
  },
  "afuvv": {
    "arabic": "العفو",
    "transliteration": "el-Afüvv"
  },
  "rauf": {
    "arabic": "الرؤوف",
    "transliteration": "er-Raûf"
  },
  "malikulmulk": {
    "arabic": "مالك الملك",
    "transliteration": "Mâlikü'l-Mülk"
  },
  "zulcelal": {
    "arabic": "ذو الجلال والإكرام",
    "transliteration": "Zü'l-Celâli ve'l-İkrâm"
  },
  "muksit": {
    "arabic": "المقسط",
    "transliteration": "el-Muksıt"
  },
  "cami": {
    "arabic": "الجامع",
    "transliteration": "el-Câmi'"
  },
  "gani": {
    "arabic": "الغني",
    "transliteration": "el-Ganî"
  },
  "mugni": {
    "arabic": "المغني",
    "transliteration": "el-Mugnî"
  },
  "mani": {
    "arabic": "المانع",
    "transliteration": "el-Mâni'"
  },
  "darr": {
    "arabic": "الضار",
    "transliteration": "ed-Dârr"
  },
  "nafi": {
    "arabic": "النافع",
    "transliteration": "en-Nâfi'"
  },
  "nur": {
    "arabic": "النور",
    "transliteration": "en-Nûr"
  },
  "hadi": {
    "arabic": "الهادي",
    "transliteration": "el-Hâdî"
  },
  "bedi": {
    "arabic": "البديع",
    "transliteration": "el-Bedî'"
  },
  "baki": {
    "arabic": "الباقي",
    "transliteration": "el-Bâkî"
  },
  "varis": {
    "arabic": "الوارث",
    "transliteration": "el-Vâris"
  },
  "resid": {
    "arabic": "الرشيد",
    "transliteration": "er-Reşîd"
  },
  "sabur": {
    "arabic": "الصبور",
    "transliteration": "es-Sabûr"
  },
  "musteri_suspicious": {
    "arabic": "المشتري",
    "transliteration": "el-Müşterî (?)"
  }
};

export const ESMA_MEANINGS: Record<string, EsmaMeaning> = Object.fromEntries(
  Object.entries(BASE).map(([key, base]) => {
    const out: Record<string, string> = { ...base };
    for (const code of LANGUAGE_ORDER) {
      const meaning = LOCALES[code].esma?.[key];
      if (meaning) out[code] = meaning;
    }
    return [key, out as EsmaMeaning];
  }),
);
