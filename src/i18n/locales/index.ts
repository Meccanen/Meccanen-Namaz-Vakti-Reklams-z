/**
 * Dil kayıt defteri.
 *
 * YENİ DİL EKLEMEK İÇİN:
 *  1. `src/i18n/locales/<kod>.ts` dosyasını oluştur (bkz. `fa.ts` örneği).
 *  2. Bu dosyaya iki satır ekle: import + LOCALES içinde kısa kayıt.
 *
 * Sıra, dil menüsündeki sıradır. `LangCode` tipi bu nesneden türetilir;
 * başka hiçbir yerde dil listesi tutulmaz.
 */
import type { LocaleModule } from "../types.ts";

import tr from "./tr.ts";
import en from "./en.ts";
import de from "./de.ts";
import es from "./es.ts";
import fr from "./fr.ts";
import pt from "./pt.ts";
import ru from "./ru.ts";
import ar from "./ar.ts";
import ur from "./ur.ts";
import ja from "./ja.ts";
import fa from "./fa.ts";

const registry = {
  tr,
  en,
  de,
  es,
  fr,
  pt,
  ru,
  ar,
  ur,
  ja,
  fa,
} as const satisfies Record<string, LocaleModule>;

export type LangCode = keyof typeof registry;

/** Tüm diller tek tip `LocaleModule` olarak görünür (opsiyonel bölümler dahil). */
export const LOCALES: Record<LangCode, LocaleModule> = registry;
