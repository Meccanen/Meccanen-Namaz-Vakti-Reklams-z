/**
 * Tek bir dil modülünün sözleşmesi.
 *
 * Yeni dil eklemek için `src/i18n/locales/<kod>.ts` dosyasını oluşturup
 * `src/i18n/locales/index.ts` içine iki satır eklemek yeterlidir.
 * Zorunlu tek alan `messages`; diğer bölümler yoksa İngilizceye düşer.
 */

export type TextDirection = "ltr" | "rtl";

export interface LocaleMeta {
  /** ISO 639-1 kodu (dosya adıyla aynı). */
  code: string;
  /** Kendi dilindeki adı (dil menüsünde gösterilir). */
  label: string;
  /** Metin yönü. */
  dir: TextDirection;
  /** Intl.DateTimeFormat / toLocaleString için BCP-47 kodu. */
  locale: string;
}

export interface PrayerMethodText {
  label: string;
  description: string;
}

export interface EsmaLabelSet {
  planets?: Record<string, string>;
  segments?: Record<string, string>;
}

export interface LocaleModule {
  meta: LocaleMeta;
  /** Uygulama arayüzü anahtarları. Eksik anahtar İngilizceye düşer. */
  messages: Record<string, string>;
  /** 12 hicri ay adı. Yoksa İngilizce kullanılır. */
  hijriMonths?: string[];
  /** Hesaplama yöntemi metinleri: yöntem id'si -> etiket/açıklama. */
  prayerMethods?: Record<string, PrayerMethodText>;
  /** Bildirim metinleri. `prayer_*` anahtarları namaz adlarını taşır. */
  notifications?: Record<string, string>;
  /** Esmâ-i Hüsnâ anlamları: esmaData anahtarı -> anlam. */
  esma?: Record<string, string>;
  /** Esmâ gezegen/gün bölümü etiketleri. */
  esmaLabels?: EsmaLabelSet;
}
