/**
 * Esmaül Hüsna — Vakit Eşleştirmesi (v2 — akademik kaynağa dayalı)
 *
 * KAYNAK: Prof. Dr. Ali Yılmaz, "Türk Edebiyatında Esmâ-i Hüsnâ Şerhleri ve
 * İbn-i Îsâ-yı Saruhânî'nin Şerh-i Esmâ-i Hüsnâ'sı" (DergiPark). Bu makale,
 * Osmanlı dönemi "havâss" (esmanın özel faydaları) geleneğini ve özellikle
 * İbn-i Îsâ-yı Saruhânî'nin 948/1541'de tamamladığı manzum Şerh-i Esmâ-i
 * Hüsnâ'sını ile Seyyid Süleymân el-Hüseynî'nin Kenzü'l-Havâss adlı eserini
 * konu alır.
 *
 * ÖNEMLİ NOTLAR:
 * 1) Bu klasik gelenekte isimler GÜNÜN VAKİTLERİYLE değil, belirli
 *    İHTİYAÇLARLA (rızık, koruma, aile huzuru, sağlık vb.) eşleştirilir.
 *    Vakitlere dağıtım bizim tercihimizdir; sadece "El-Kerîm" ismi
 *    kaynakta açıkça SABAH namazından sonra okunması tavsiye edildiği için
 *    İmsak vaktiyle birebir örtüşmektedir, diğerleri tematik uyuma göre
 *    seçilmiştir.
 * 2) Zikir sayıları, mevcut olduğunda, KAYNAKTA GEÇEN GERÇEK SAYILARDIR
 *    (genellikle ismin ebced/sayısal değerine dayanır, bu yüzden 33/99 gibi
 *    yuvarlak sayılar değildir). Kaynakta sayı belirtilmeyen isimler için
 *    standart tesbih sayısı olan 33 kullanılmış ve bu açıkça belirtilmiştir.
 * 3) Kaynakta bazı isimler (örn. El-Müntakım) için başkasına zarar/intikam
 *    amaçlı kullanımlar da anlatılır; bunlar bilerek DIŞARIDA TUTULMUŞTUR.
 *    Yalnızca kişinin kendisini koruması amaçlı, zarar vermeyen kullanımlar
 *    aktarılmıştır.
 * 4) Bu bir fıkıh hükmü değil, halk arasında yaygın olan tarihî bir
 *    zikir/tefekkür geleneğidir (havâss). Kaynakta da bu şekilde tanıtılır.
 */

export interface EsmaEntry {
  arabic: string;
  transliteration: string;
  name: { tr: string; en: string; ar: string };
  meaning: { tr: string; en: string; ar: string };
  zikirCount: number;
  countIsDocumented: boolean; // true: kaynakta geçen gerçek sayı, false: varsayılan 33
  purpose: { tr: string; en: string; ar: string };
}

export const PRAYER_ESMA: Record<string, EsmaEntry> = {
  imsak: {
    arabic: "الكريم",
    transliteration: "Ya Kerîm",
    name: { tr: "El-Kerîm", en: "Al-Karim", ar: "الكريم" },
    meaning: { tr: "Çok cömert, ikram eden", en: "The Most Generous, the Bestower", ar: "الكريم الكثير العطاء" },
    zikirCount: 48,
    countIsDocumented: true,
    purpose: {
      tr: "Osmanlı dönemi havâss kaynaklarında (Kenzü'l-Havâss), her gün sabah namazından sonra 48 defa \"Yâ Kerîm\" okumaya devam edenin rızkının kolaylaşıp bollaşacağı, sıkıntıdan kurtulacağı anlatılır.",
      en: "Ottoman-era havass sources (Kenzü'l-Havâss) describe that one who recites \"Ya Karim\" 48 times every day after the dawn prayer will find their provision eased and increased, and relief from hardship.",
      ar: "تصف مصادر الخواص العثمانية (كنز الخواص) أن من يقرأ \"يا كريم\" 48 مرة كل صباح بعد صلاة الفجر يجد رزقه ميسَّرًا ويزداد، ويتخلص من الضيق.",
    },
  },
  gunes: {
    arabic: "الوهاب",
    transliteration: "Ya Vehhâb",
    name: { tr: "El-Vehhâb", en: "Al-Wahhab", ar: "الوهاب" },
    meaning: { tr: "Karşılıksız bağışta bulunan", en: "The Bestower of Gifts", ar: "الذي يهب بلا حساب" },
    zikirCount: 33,
    countIsDocumented: false,
    purpose: {
      tr: "Aynı gelenekte bu ismin zikrine devam edenin malının ve itibarının artacağı, uğursuzluğun gideceği belirtilir. Kaynakta kesin bir sayı verilmediği için burada standart 33 kullanılmıştır.",
      en: "The same tradition states that one who persists in reciting this name will see their wealth and reputation grow, and misfortune lifted. As the source gives no fixed count, the standard 33 is used here.",
      ar: "تذكر نفس التقاليد أن من يستمر في ذكر هذا الاسم تزداد ثروته وسمعته ويرتفع عنه سوء الحظ. لم يحدد المصدر عددًا ثابتًا، فاستُخدم هنا العدد المعتاد 33.",
    },
  },
  ogle: {
    arabic: "السلام",
    transliteration: "Ya Selâm",
    name: { tr: "Es-Selâm", en: "As-Salam", ar: "السلام" },
    meaning: { tr: "Her türlü eksiklikten salim, esenlik veren", en: "The Source of Peace and Safety", ar: "السالم من كل عيب، مصدر السلامة" },
    zikirCount: 33,
    countIsDocumented: false,
    purpose: {
      tr: "Kenzü'l-Havâss'ta bu ismi zikredenin afetlerden, kazalardan, yangından, su taşkınlarından, deniz fırtınalarından ve yırtıcı hayvanlardan korunacağı anlatılır — günün en hareketli, dışarıda geçirilen vakti olan öğleye uygun bir koruma temasıdır. Kaynakta kesin sayı verilmediği için standart 33 kullanılmıştır.",
      en: "Kenzü'l-Havâss describes that one who recites this name is protected from disasters, accidents, fire, floods, sea storms, and wild animals — a fitting theme of protection for midday, the busiest and most outward-facing hour. As no fixed count is given, the standard 33 is used.",
      ar: "يصف كنز الخواص أن من يذكر هذا الاسم يُحمى من الكوارث والحوادث والحرائق والفيضانات وعواصف البحر والحيوانات المفترسة — وهو موضوع حماية مناسب لوقت الظهر الأكثر نشاطًا. لم يحدد عدد ثابت، فاستُخدم 33.",
    },
  },
  ikindi: {
    arabic: "المقتدر",
    transliteration: "Ya Muktedir",
    name: { tr: "El-Muktedir", en: "Al-Muqtadir", ar: "المقتدر" },
    meaning: { tr: "Her şeye gücü yeten, kudret sahibi", en: "The All-Powerful, the One with Full Capability", ar: "القادر على كل شيء" },
    zikirCount: 744,
    countIsDocumented: true,
    purpose: {
      tr: "İbn-i Îsâ-yı Saruhânî'nin menâkıbnâmesinde anlatılan bir kıssada, eşler arasındaki geçimsizliği gidermek için günde 744 defa \"Yâ Muktedir\" okunması tavsiye edilir; günler geçtikçe ailenin huzura kavuştuğu nakledilir.",
      en: "A story recorded in İbn-i Îsâ-yı Saruhânî's biography recommends reciting \"Ya Muqtadir\" 744 times a day to resolve discord between spouses; over time the household is said to find peace.",
      ar: "تُذكر قصة في مناقب ابن عيسى الساروخاني توصي بقراءة \"يا مقتدر\" 744 مرة يوميًا لحل الخلاف بين الزوجين؛ ويُروى أن البيت يجد السكينة مع مرور الأيام.",
    },
  },
  aksam: {
    arabic: "الحليم والشكور",
    transliteration: "Ya Halîm, Ya Şekûr",
    name: { tr: "El-Halîm ve eş-Şekûr", en: "Al-Halim & Ash-Shakur", ar: "الحليم والشكور" },
    meaning: { tr: "Yumuşak davranan, sabırlı / Az amele çok mükâfat veren, şükrü kabul eden", en: "The Gentle, the Forbearing / The Most Appreciative, Acceptor of Gratitude", ar: "الحليم الصبور / الشكور الذي يقبل الشكر" },
    zikirCount: 614,
    countIsDocumented: true,
    purpose: {
      tr: "Aynı kıssada, eşler arasındaki geçimsizliği gidermek için günde 614 defa \"Yâ Halîm Yâ Şekûr\" okunması tavsiye edilir; günün kapanışında, evdeki huzur ve sabır niyetiyle okunabilir.",
      en: "In the same story, reciting \"Ya Halim Ya Shakur\" 614 times a day is recommended to ease discord between spouses; fitting at day's end, with an intention of household peace and patience.",
      ar: "في نفس القصة، يُنصح بقراءة \"يا حليم يا شكور\" 614 مرة يوميًا لتخفيف الخلاف بين الزوجين؛ مناسب في ختام اليوم بنية السكينة والصبر في البيت.",
    },
  },
  yatsi: {
    arabic: "المنتقم",
    transliteration: "Ya Müntakım",
    name: { tr: "El-Müntakım", en: "Al-Muntaqim", ar: "المنتقم" },
    meaning: { tr: "Haksızlık edenlerin hakkını adaletle alan", en: "The Avenger of Wrongdoing (with Justice)", ar: "الذي يأخذ حق المظلوم بالعدل" },
    zikirCount: 602,
    countIsDocumented: true,
    purpose: {
      tr: "Kenzü'l-Havâss'ta, bu ismi günde 602 defa zikretmeye devam edenin başkalarının zulmünden ve kötülüğünden korunacağı anlatılır. (Kaynakta bu ismin başkasına zarar verme amaçlı kullanımları da geçer; burada yalnızca kişinin kendini koruması amaçlı kısım aktarılmıştır.) Gece, her türlü kötülükten korunma niyetiyle okunabilir.",
      en: "Kenzü'l-Havâss states that one who recites this name 602 times a day is protected from others' oppression and harm. (The source also records uses of this name intended to harm others; only the self-protective use is conveyed here.) Fitting at night, with the intention of protection from all harm.",
      ar: "يذكر كنز الخواص أن من يداوم على ذكر هذا الاسم 602 مرة يوميًا يُحمى من ظلم الآخرين وشرهم. (يذكر المصدر أيضًا استخدامات لهذا الاسم بقصد الإضرار بالآخرين؛ لم يُذكر هنا إلا الاستخدام الوقائي للنفس.) مناسب في الليل بنية الحماية من كل شر.",
    },
  },
};

export function getEsmaForPrayerKey(key: string): EsmaEntry | null {
  return PRAYER_ESMA[key] || null;
}
