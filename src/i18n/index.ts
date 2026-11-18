/**
 * i18n çekirdeği — tek kaynak.
 *
 * Tüm dil verisi `src/i18n/locales/*.ts` dosyalarındadır. Bu dosya yalnızca
 * kayıt defterini okur, tip türetir ve erişim yardımcılarını sunar.
 * Uygulama kodu `src/utils/i18n.ts` üzerinden buraya erişir.
 */
import { LOCALES, type LangCode } from "./locales/index.ts";
import type { LocaleMeta, LocaleModule, PrayerMethodText } from "./types.ts";

export { LOCALES };
export type { LangCode, LocaleMeta, LocaleModule, PrayerMethodText };
export type LanguageMeta = LocaleMeta;

/** Dil menüsündeki sıra (locales/index.ts'teki kayıt sırası). */
export const LANGUAGE_ORDER = Object.keys(LOCALES) as LangCode[];

export const LANGUAGES = Object.fromEntries(
  LANGUAGE_ORDER.map((code) => [code, LOCALES[code].meta]),
) as Record<LangCode, LocaleMeta>;

export const LANGUAGE_LIST: (LocaleMeta & { code: LangCode })[] =
  LANGUAGE_ORDER.map((code) => ({ ...LOCALES[code].meta, code }));

export const getLangMeta = (lang: LangCode): LocaleMeta => LOCALES[lang]?.meta ?? LOCALES.en.meta;
export const isRTL = (lang: LangCode): boolean => getLangMeta(lang).dir === "rtl";
export const getLocale = (lang: LangCode): string => getLangMeta(lang).locale;

/** Bir dilin mesaj sözlüğü (eksik anahtarlar için `t()` kullanın). */
export const getMessages = (lang: LangCode): Record<string, string> =>
  LOCALES[lang]?.messages ?? LOCALES.en.messages;

/**
 * Arayüz metni. Sıra: dil -> İngilizce -> Türkçe -> anahtar.
 * `{ad}` yer tutucuları `vars` ile doldurulur.
 */
export function t(key: string, lang: LangCode, vars?: Record<string, string>): string {
  let val = LOCALES[lang]?.messages[key]
    ?? LOCALES.en.messages[key]
    ?? LOCALES.tr.messages[key]
    ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) val = val.replace(`{${k}}`, v);
  }
  return val;
}

/** 12 hicri ay adı. Tüm dillerde tanımlıdır; yine de İngilizceye düşer. */
export function getHijriMonths(lang: LangCode): string[] {
  return LOCALES[lang]?.hijriMonths ?? LOCALES.en.hijriMonths ?? [];
}

/** Bildirim metni. Dil -> İngilizce -> Türkçe -> `fallback`/anahtar. */
export function getNotificationText(
  key: string,
  lang: LangCode,
  fallback?: string,
): string {
  const loc = LOCALES[lang];
  // Namaz adları (`prayer_*`) arayüz mesajlarında da tutulur; bildirim bölümünde
  // ayrıca yazılmasa bile aynı dilden okunur (tek kaynak).
  const own = loc?.notifications?.[key]
    ?? (key.startsWith("prayer_") ? loc?.messages?.[key] : undefined);
  if (own !== undefined) return own;
  return LOCALES.en.notifications?.[key]
    ?? (key.startsWith("prayer_") ? LOCALES.en.messages?.[key] : undefined)
    ?? LOCALES.tr.notifications?.[key]
    ?? LOCALES.tr.messages?.[key]
    ?? fallback
    ?? key;
}

/** Hesaplama yöntemi etiketi/açıklaması. Dil -> İngilizce -> Türkçe. */
export function getPrayerMethodText(
  id: number | string,
  lang: LangCode,
): PrayerMethodText {
  const key = String(id);
  return LOCALES[lang]?.prayerMethods?.[key]
    ?? LOCALES.en.prayerMethods?.[key]
    ?? LOCALES.tr.prayerMethods?.[key]
    ?? { label: key, description: "" };
}

/** Esmâ anlamı. Dil -> İngilizce -> Türkçe -> boş. */
export function getEsmaMeaning(key: string, lang: LangCode): string {
  return LOCALES[lang]?.esma?.[key]
    ?? LOCALES.en.esma?.[key]
    ?? LOCALES.tr.esma?.[key]
    ?? "";
}

/** Esmâ gezegen/gün bölümü etiketi. Dil -> İngilizce -> Türkçe -> anahtar. */
export function getEsmaLabel(
  kind: "planets" | "segments",
  key: string,
  lang: LangCode,
): string {
  return LOCALES[lang]?.esmaLabels?.[kind]?.[key]
    ?? LOCALES.en.esmaLabels?.[kind]?.[key]
    ?? LOCALES.tr.esmaLabels?.[kind]?.[key]
    ?? key;
}

// ── Cihaz dili algılama ─────────────────────────────────────────────────────
// Harita tamamen locale dosyalarından türetilir; yeni dilde ek kod gerekmez.
const LANG_MAP: Record<string, LangCode> = {};
for (const code of LANGUAGE_ORDER) {
  LANG_MAP[code] = code;
  const locale = LOCALES[code].meta.locale.toLowerCase();
  LANG_MAP[locale] = code;
  LANG_MAP[locale.split("-")[0]] = code;
}

export function detectLanguage(): LangCode {
  const raw = (navigator.language || "en").toLowerCase();
  return LANG_MAP[raw] || LANG_MAP[raw.split("-")[0]] || "en";
}
