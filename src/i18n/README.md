# i18n — Dil Modülü

Bu klasör, uygulamanın **tek çeviri kaynağıdır**. Bir dilin bütün metinleri
kendi dosyasında durur; başka hiçbir dosyada dil bazlı metin haritası yoktur.

## Yapı

```
src/i18n/
  index.ts              # kayıt defteri okuma + t(), isRTL(), getLocale() ...
  types.ts              # LocaleModule sözleşmesi
  native.json           # Android uygulama/widget adları (build-time)
  locales/
    tr.ts  en.ts  de.ts  es.ts  fr.ts  pt.ts  ru.ts  ar.ts  ur.ts  ja.ts  fa.ts
    index.ts            # dil kayıt defteri (sıra buradadır)
```

Uygulama kodu `src/utils/i18n.ts` üzerinden erişir; bu dosya sadece
`src/i18n/index.ts` dosyasını yeniden dışa aktarır.

## Yeni dil eklemek (≈2 dakika)

1. `src/i18n/locales/<kod>.ts` dosyasını oluştur. En küçük geçerli örnek:

   ```ts
   import type { LocaleModule } from "../types.ts";

   const locale: LocaleModule = {
     meta: { code: "id", label: "Bahasa Indonesia", dir: "ltr", locale: "id-ID" },
     messages: {
       appName: "Waktu Sholat",
       // ... diğer anahtarlar
     },
     // opsiyonel bölümler:
     hijriMonths: ["Muharram", "Safar", /* 12 adet */],
     prayerMethods: { "13": { label: "...", description: "..." } },
     notifications: { beforeTitle: "...", /* ... */ },
     esma: { allah: "...", /* ... */ },
     esmaLabels: { planets: { gunes: "..." }, segments: { sabah: "..." } },
   };

   export default locale;
   ```

2. `src/i18n/locales/index.ts` dosyasına **iki satır** ekle:

   ```ts
   import id from "./id.ts";
   // ...
   const registry = { /* ... */, id } as const satisfies Record<string, LocaleModule>;
   ```

3. `src/i18n/native.json` dosyasına uygulama/widget adlarını ekle (Android
   launcher etiketi için; istemezsen atlayabilirsin, İngilizceye düşer).

4. Doğrula:

   ```bash
   npm run i18n:check          # eksik/fazla anahtar, yer tutucu kontrolü
   npm run i18n:export id      # docs/id-ceviri-kontrol.txt üretir
   ```

Hepsi bu. `LangCode` tipi, dil menüsü, cihaz dili algılama, RTL yönü ve
`Intl` locale'i kayıt defterinden otomatik türetilir.

## Zorunlu / opsiyonel alanlar

| Alan | Zorunlu | Yoksa |
|---|---|---|
| `meta` | ✅ | — |
| `messages` | ✅ | — |
| `hijriMonths` | — | İngilizce 12 ay |
| `prayerMethods` | — | İngilizce etiketler |
| `notifications` | — | İngilizce bildirim metinleri |
| `esma` | — | İngilizce Esmâ anlamları |
| `esmaLabels` | — | İngilizce gezegen/gün bölümü etiketleri |
| `native.json` kaydı | — | İngilizce Android adı |

Eksik `messages` anahtarları da `t()` içinde önce İngilizceye, sonra
Türkçeye düşer.

## Doğrulama akışı (çevirmen için)

```bash
npm run i18n:export fa
```

komutu `docs/fa-ceviri-kontrol.txt` üretir. Dosya sekmeyle ayrılmıştır:

```
sıra | anahtar | Türkçe | İngilizce | hedef dil
```

Excel / LibreOffice / Google Sheets ile açıp hedef dil sütununu düzeltebilir,
ardından düzeltilmiş JSON'u `src/i18n/locales/fa.ts` içindeki ilgili bölüme
aktarabilirsiniz. `{ad}` gibi yer tutucular korunmalıdır; `npm run i18n:check`
bunu denetler.

## Notlar

- `messages` dışındaki bölümler de aynı dosyada olduğu için bir dilin tüm
  çevirisi tek dosyada incelenebilir.
- Yeni dil eklerken `LANGUAGE_ORDER`, `LANG_MAP`, `STORE`, `FALLBACK` gibi
  ikinci bir liste **yoktur**; hepsi kayıt defterinden türetilir.
- RTL dilleri için `meta.dir: "rtl"` yeterlidir; bileşenler `isRTL(lang)`
  kullanır.
