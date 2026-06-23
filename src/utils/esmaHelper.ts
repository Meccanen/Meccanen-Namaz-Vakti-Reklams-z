/**
 * Esmaül Hüsna — Vakit Eşleştirmesi
 *
 * NOT: Bu eşleştirme, her namaz vaktine sabit bir Esma atayan klasik bir hadis/fıkıh
 * hükmüne dayanmaz — halk arasında yaygın olan bir zikir/tefekkür geleneğidir.
 * Vaktin ruhuna (sabahın açılışı, öğlenin diriliği, akşamın bağışlanma dileği vb.)
 * uygun bir isim seçilmiştir. Zikir sayısı olarak, namaz sonrası tesbihatta da
 * kullanılan standart 33 sayısı tercih edilmiştir.
 */

export interface EsmaEntry {
  arabic: string;          // Arapça yazımı
  transliteration: string; // Okunuşu (TR)
  name: { tr: string; en: string; ar: string };
  meaning: { tr: string; en: string; ar: string };
  zikirCount: number;
  purpose: { tr: string; en: string; ar: string };
}

export const PRAYER_ESMA: Record<string, EsmaEntry> = {
  imsak: {
    arabic: "الفتّاح",
    transliteration: "Ya Fettâh",
    name: { tr: "El-Fettâh", en: "Al-Fattah", ar: "الفتّاح" },
    meaning: {
      tr: "Her türlü zorluğu açan, hayır kapılarını kolaylaştıran",
      en: "The Opener, the One who eases every difficulty and opens the doors of good",
      ar: "الذي يفتح أبواب الخير ويسهّل كل عسير",
    },
    zikirCount: 33,
    purpose: {
      tr: "Sabah vaktinde, günün hayırla açılması, rızkın ve işlerin kolaylaşması niyetiyle okunur.",
      en: "Recited at dawn with the intention that the day opens with goodness and one's provision and affairs are eased.",
      ar: "يُقرأ عند الفجر بنية أن يُفتح اليوم بالخير وتُسهَّل الأرزاق والأمور.",
    },
  },
  gunes: {
    arabic: "النور",
    transliteration: "Ya Nûr",
    name: { tr: "En-Nûr", en: "An-Nur", ar: "النور" },
    meaning: {
      tr: "Nur, her şeyi aydınlatan",
      en: "The Light, the One who illuminates all things",
      ar: "الذي ينير كل شيء",
    },
    zikirCount: 33,
    purpose: {
      tr: "Güneşin doğuşuyla, kalbin ve aklın aydınlanması, doğru yolun bulunması niyetiyle okunur.",
      en: "Recited at sunrise for the heart and mind to be illuminated and guided to the right path.",
      ar: "يُقرأ عند الشروق لاستنارة القلب والعقل والهداية إلى الطريق الصحيح.",
    },
  },
  ogle: {
    arabic: "الحيّ",
    transliteration: "Ya Hayy",
    name: { tr: "El-Hayy", en: "Al-Hayy", ar: "الحيّ" },
    meaning: {
      tr: "Ezelî ve ebedî diri, hayat veren",
      en: "The Ever-Living, the source of all life",
      ar: "الحي الذي لا يموت، مصدر كل حياة",
    },
    zikirCount: 33,
    purpose: {
      tr: "Günün en yoğun saatlerinde dirilik, sağlık ve güç dileğiyle okunur.",
      en: "Recited at midday for vitality, health and strength during the busiest hours of the day.",
      ar: "يُقرأ في وسط النهار طلبًا للحيوية والصحة والقوة في أشغل ساعات اليوم.",
    },
  },
  ikindi: {
    arabic: "الودود",
    transliteration: "Ya Vedûd",
    name: { tr: "El-Vedûd", en: "Al-Wadud", ar: "الودود" },
    meaning: {
      tr: "Çok seven ve çok sevilen",
      en: "The Most Loving and the Most Beloved",
      ar: "الكثير المحبة والمحبوبية",
    },
    zikirCount: 33,
    purpose: {
      tr: "Günün yorgunluğunun bastığı ikindi vaktinde, kalplere sevgi, şefkat ve huzur dileğiyle okunur.",
      en: "Recited in the afternoon, as fatigue sets in, for love, compassion and peace to settle in the heart.",
      ar: "يُقرأ في العصر، حين يبدأ التعب، طلبًا للمحبة والرحمة والسكينة في القلب.",
    },
  },
  aksam: {
    arabic: "الغفّار",
    transliteration: "Ya Gaffâr",
    name: { tr: "El-Gaffâr", en: "Al-Ghaffar", ar: "الغفّار" },
    meaning: {
      tr: "Günahları tekrar tekrar bağışlayan",
      en: "The Ever-Forgiving, who forgives sins again and again",
      ar: "الذي يغفر الذنوب مرارًا وتكرارًا",
    },
    zikirCount: 33,
    purpose: {
      tr: "Günün kapanışında, geçmiş günahlardan tevbe ve bağışlanma dileğiyle okunur.",
      en: "Recited as the day closes, seeking repentance and forgiveness for past sins.",
      ar: "يُقرأ عند ختام اليوم طلبًا للتوبة والمغفرة عن الذنوب الماضية.",
    },
  },
  yatsi: {
    arabic: "الحفيظ",
    transliteration: "Ya Hafîz",
    name: { tr: "El-Hafîz", en: "Al-Hafiz", ar: "الحفيظ" },
    meaning: {
      tr: "Koruyan, gözeten",
      en: "The Protector, the Preserver",
      ar: "الحافظ الذي يحمي ويرعى",
    },
    zikirCount: 33,
    purpose: {
      tr: "Gecenin başında, uyku esnasında ve her türlü kötülükten korunma dileğiyle okunur.",
      en: "Recited at the start of night, seeking protection during sleep and from all harm.",
      ar: "يُقرأ في بداية الليل طلبًا للحماية أثناء النوم ومن كل شر.",
    },
  },
};

export function getEsmaForPrayerKey(key: string): EsmaEntry | null {
  return PRAYER_ESMA[key] || null;
}
