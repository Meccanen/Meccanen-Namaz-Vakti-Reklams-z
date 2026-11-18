# Meccanen Namaz Vakti — Çalışma Özeti

> Bu dosya, çalışmanın bir sonraki konuşma penceresinde kaldığı yerden devam edebilmesi
> için hazırlanmıştır. Son güncelleme: 12 Kasım 2026.

**Son durum (12 Kasım 2026):** Kıble pusulası yeniden yazıldı (native manyetometre köprüsü +
görsel yenileme) ve durum bildirimi metin hatası giderildi. **Play AAB hazır:**
`dist/meccanen-release-v2.3.2026111200.aab` (versionCode `2026111200` — Play'deki `2026111100`'den
+100, upload anahtarıyla imzalı). Önceki sürüm: `2.3.2026111100` (11 dil, Farsça dahil). Sıradaki
iş: AAB'yi Play Console'a yüklemek (manuel). Ayrıntılar için **bölüm 5A**.

---

## 1. Proje Kimliği

| | |
|---|---|
| **Uygulama** | Meccanen Namaz Vakti (Meccanen Prayer Times) |
| **appId** | `meccanen.namaz.vakti.v1` |
| **Play listing** | https://play.google.com/store/apps/details?id=meccanen.namaz.vakti.v1 |
| **Proje yolu** | `/home/Knight/Desktop/Play/Namazvakti` |
| **Sürüm** | versionName `2.3.<versionCode>`; versionCode **10 hane** = `YYYYMMDDCC` (ör. `2026110306`) |
| **Stack** | React 19 + Vite 6 + TypeScript 5.8 + Tailwind CSS v4 + Capacitor 6 (Android) |
| **Paket adı (npm)** | `meccanen-namaz-vakti` |

Kardeş uygulamalar (kendi Play listelerine sahip, "Meccanen" sekmesinde tanıtılır):
- Habit Tracker — `com.meccanen.habittracker`
- Hava Durumu — `com.specialweatherassistant.app` (masaüstü referans: `/home/Knight/Desktop/Hava`)

---

## 2. Dizin Yapısı

```
Namazvakti/
├── App.tsx ruhu: src/App.tsx        # ~2034 satır, tek büyük bileşen (ana uygulama)
├── src/
│   ├── App.tsx                      # Ana uygulama + SettingsPanel + Onboarding tetikleyicileri
│   ├── main.tsx                     # React kök
│   ├── index.css                    # Tailwind v4 + tema token'ları + Aa yazı boyutu (--afs) sistemi
│   ├── types.ts                     # Location vb. tipler
│   ├── vite-env.d.ts                # /// <reference types="vite/client" />  (png import tipleri)
│   ├── assets/                      # app-namaz.png, app-habit.png, app-weather.png (kart ikonları)
│   ├── components/
│   │   ├── Onboarding.tsx
│   │   ├── TesbihModal.tsx
│   │   ├── ReligiousCalendarModal.tsx
│   │   └── AddLocationModal.tsx     (+ LocationManager export)
│   ├── services/
│   │   └── billingService.ts        # capacitor-play-billing sarmalayıcı
│   ├── i18n/                        # ★ modüler dil sistemi (bkz. Bölüm 4)
│   │   ├── index.ts                 # t(), isRTL(), getLocale(), getHijriMonths() ...
│   │   ├── types.ts                 # LocaleModule sözleşmesi
│   │   ├── native.json              # Android uygulama/widget adları (build-time tek kaynak)
│   │   ├── README.md                # "2 dakikada yeni dil" kılavuzu
│   │   └── locales/                 # tr en de es fr pt ru ar ur ja fa + index.ts (kayıt defteri)
│   └── utils/
│       ├── i18n.ts                  # ince köprü → ../i18n/index.ts (geriye dönük uyum)
│       ├── prayerHelper.ts          # Ezan vakti hesabı + yöntemler (Diyanet/Karachi/MWL)
│       ├── notificationHelper.ts    # Bildirim planlama/iptal
│       ├── locationHelper.ts        # Konum izni/pozisyon/timezone
│       ├── qiblaHelper.ts           # Kıble yönü + pusula
│       ├── astronomyHelper.ts       # Ay fazı, güneş saatleri
│       ├── esmaHelper.ts            # Esma saati, gezegen/segment etiketleri
│       ├── religiousHelper.ts       # Dini Günler 2026-2027 (Hicri, umalqura)
│       ├── spaceHelper.ts, weatherHelper.ts, widgetBridge.ts, batteryHelper.ts
│       └── compass.png
├── native/
│   └── widget/                      # 4 Android widget'ı (kaynak, build'de android/ içine kopyalanır)
│       ├── java/meccanen/namaz/vakti/v1/widgets/
│       │   ├── WidgetCore.java, WidgetPalettes.java, PrayerMath.java
│       │   ├── WidgetPayloadBuilder.java        # AlAdhan aylık payload (30 gün)
│       │   ├── WidgetSyncWorker.java            # günlük WorkManager işi
│       │   ├── WidgetRefreshReceiver.java       # boot/tarih/saat/dilim tazeleme
│       │   ├── PrayerAnalogWidgetProvider.java  # Analog Saat (yeni)
│       │   ├── PrayerArcWidgetProvider.java     # Vakit Halkası
│       │   ├── PrayerClockWidgetProvider.java   # Saat & Takvim
│       │   └── PrayerGridWidgetProvider.java    # Vakit Kartları (6 kart ızgara)
│       ├── res/layout/widget_{arc,clock,analog,grid}_{layout,preview}.xml
│       ├── res/xml/widget_{arc,clock,analog,grid}_info.xml
│       ├── res/values*/preview_strings.xml      # seçici metinleri (6 dil: en,tr,de,ar,ur,fa)
│       ├── res/drawable-nodpi, drawable-tr-nodpi # seçici PNG'leri (Pillow)
│       └── res/drawable/widget_bg_*.xml         # 15 tema arka planı + grid_card
├── scripts/
│   ├── i18n-check.mjs               # dil denetimi (npm run i18n:check / :strict)
│   ├── i18n-export.mjs              # çeviri kontrol listesi (npm run i18n:export)
│   └── local-build/                 # build-local.sh'in çağırdığı Python yamaları
│       ├── patch_notif.py               # Local Notifications yamaları (cancelPreviousId + timeoutAfter)
│       ├── add_battery_plugin.py        # MIUI bildirim fix plugin'i
│       ├── add_widgets.py               # Widget native kaynak + manifest + WidgetBridge
│       ├── add_perms.py                 # İzinler
│       └── make_icons.py                # Uygulama ikonları (Pillow)
├── local-plugins/capacitor-play-billing/   # Yerel Capacitor eklentisi (destekçi rozeti IAP)
├── assets/                          # meccanen-logo*.png, notification_icon/, sounds/*.mp3 (ezan)
├── docs/                            # growth-roadmap.md, notification-system-findings.md,
│                                    # privacy-policy*.html, fa-ceviri-kontrol.txt (400 satır TSV)
├── apk/                             # kalıcı APK/AAB yedeği (dist/ her build'de silinir)
├── public/ , dist/                  # dist = Vite webDir (build çıktısı + APK/AAB buraya kopyalanır)
├── build-local.sh                   # Yerel Android build aracı (GitHub Actions kotası olmadan)
├── capacitor.config.json            # appId, webDir=dist, androidScheme=https, allowMixedContent
├── server.ts, variables.gradle, tsconfig.json, vite.config.ts, metadata.json
```

---

## 3. Build Sistemi — `build-local.sh`

GitHub Actions kotasına gerek olmadan **yerel** Android build.

```bash
# Debug APK (test, imza gerekmez)
VERSION_CODE=2026093231 VERSION_NAME=2.3.2026093231 ./build-local.sh debug

# İmzalı AAB (Play Store) — ZORUNLU env değişkenleri:
KEYSTORE_PATH=/home/Knight/Desktop/Play/keys/meccanen-namaz-upload.keystore \
KEYSTORE_PASSWORD=<parola> KEY_ALIAS=meccanen-namaz-upload KEY_PASSWORD=<parola> \
VERSION_CODE=2026093230 VERSION_NAME=2.3.2026093230 ./build-local.sh release

# İkisi birden
./build-local.sh all
```

### Önemli notlar
- ⚠️ **versionCode 10 haneli olmalı: `YYYYMMDDCC`.** Şema `2026` + `11` (ay) + `03` (gün) + `06`
  (gün içi sayaç) → `2026110306`. Kısa yazmak (örn. `20261111`) sayısal olarak **daha küçük** olur
  (`20.261.111 < 2.026.110.306`) ve Play şu hatayı verir:
  *"You can't roll out this release because it doesn't allow any existing users to upgrade to the
  newly added app bundles."* 11 Kasım 2026'da bu hata yaşandı; doğrusu `2026111100`
  (2.026.111.100 > 2.026.110.306). Yeni sürümde **her zaman önce Play'deki en yüksek versionCode'u
  oku**, sonra tarih+sayaç ver.
- **JAVA_HOME / ANDROID_HOME:** Script varsayılanı `/tmp/opencode/jdk17` ve `/tmp/opencode/sdk`
  (oturum sıfırlanınca silinir). **Kasım 2026'da otomatik algılama eklendi:** varsayılan yol
  geçersizse sırayla `~/.local/opt/jdk-17`, `~/.local/jdk17`, `~/.jdks/*` (JDK) ve
  `~/Android/Sdk`, `/usr/lib/android-sdk`, `~/Library/Android/sdk` (SDK) denenir.
  Bu makinede çalışan yollar:
  - `JAVA_HOME=/home/Knight/.local/opt/jdk-17` (Temurin 17.0.20.1, **jlink dahil**)
  - `ANDROID_HOME=/home/Knight/Android/Sdk` (platform 36, build-tools 36.0.0)
  - `ANDROID_HOME=/home/Knight/.local/android-sdk` de geçerli (aynı platform/build-tools).
  - ⚠️ `/usr/lib/jvm/java-17-openjdk-amd64` **kullanılamaz**: yalnız JRE kurulu, `jlink` yok →
    `JdkImageTransform ... jlink executable does not exist` hatası. `-x "$JAVA_HOME/bin/jlink"`
    kontrolü bu yüzden var.
  Artık env değişkeni vermeden `./build-local.sh debug` çalışır.
- **Mod davranışı (git'teki orijinal):**
  - `debug` → `assembleDebug` → `dist/meccanen-debug-v<VERSION_NAME>.apk`
  - `release` → `assembleRelease + bundleRelease` (imzalı) →
    `dist/meccanen-release-v<VERSION_NAME>.apk` **ve** `.aab`
  - `all` → ikisi
- **`dist/` aynı zamanda Vite `webDir`'idir.** Her build başında `npm run build` (vite) `dist/`'i
  temizler. Bu yüzden **release'ten sonra debug build çalıştırırsan AAB/APK silinir.**
  Çözüm: release'i en son çalıştır, ya da üretilen AAB/APK'yı `dist/` dışına kopyala
  (yedek: `/tmp/opencode/keep/`).
- **Uzun build'ler 120 sn'de kesildiği için** arka planda çalıştır ve log'u poll et:
  ```bash
  setsid bash -c 'env JAVA_HOME=... ANDROID_HOME=... PATH=... VERSION_CODE=... \
    KEYSTORE_PATH=... ... ./build-local.sh release > /tmp/opencode/rel.log 2>&1' \
    </dev/null >/dev/null 2>&1 & disown
  sleep 100; tail -8 /tmp/opencode/rel.log
  ```
- **Release'te D8/R8 OOM tuzağı:** Capacitor şablonu `org.gradle.jvmargs=-Xmx1536m` ile gelir; bu
  makinede release dex birleştirmede `OutOfMemoryError: Java heap space` verip build'i kilitler
  (log'da görünmez çünkü Gradle daemon çöker, istemci yanıt bekler). Script artık `cap add` sonrası
  `android/gradle.properties` içindeki değeri `-Xmx2560m -XX:MaxMetaspaceSize=512m` yapar.
  Ayrıntılı neden için: `~/.gradle/daemon/8.2.1/daemon-*.out.log`.
- Build sonunda `android/` üretim artığı otomatik silinir (temizlik adımı).

### Release imzalama
- Keystore: `/home/Knight/Desktop/Play/keys/meccanen-namaz-upload.keystore` (PKCS12)
- Alias: `meccanen-namaz-upload`
- Sertifika SHA-256: `A9:6E:58:9B:89:0E:80:55:C9:6B:CA:56:B6:7E:25:2E:CD:88:0C:26:AE:60:44:2A:EB:4D:DA:E6:73:28:13:F4`
- Sertifika sahibi: `CN=Meccanen Namaz, OU=Mobile, O=Meccanen, L=Leipzig, ST=Sachsen, C=DE`
- **Keystore parolası bu dosyaya GÜVENLİK nedeniyle YAZILMADI.** Build komutunda env olarak verilir
  (kullanıcıda mevcut; önceki oturumlarda `yqSQywJWQIlYA9N0_40693e` kullanıldı — doğrulayın).
- **KÖK NEDEN — imzasız AAB:** `./gradlew bundleRelease`'i **doğrudan** çalıştırmak
  (`-Pandroid.injected.signing.*` parametreleri olmadan) **imzasız** AAB üretir; Play
  "All uploaded bundles must be signed." hatası verir. Doğru yol: `build-local.sh release`.
- Doğrulama:
  - AAB: kök `META-INF/MANIFEST.MF`, `MECCANEN.SF`, `MECCANEN.RSA` var mı +
    `/home/Knight/.local/opt/jdk-17/bin/jarsigner -verify <aab>` → "jar verified"
  - APK: `/home/Knight/Android/Sdk/build-tools/36.0.0/apksigner verify -v <apk>` → v2 true
- Araç yolları (sistemde yok, JDK/SDK içinde): `jarsigner`, `keytool` →
  `/home/Knight/.local/opt/jdk-17/bin/`; `apksigner` → `/home/Knight/Android/Sdk/build-tools/36.0.0/`.

---

## 4. i18n Sistemi — `src/i18n/` (modüler, 11 dil)

> **Kasım 2026'da yeniden yazıldı.** Eski `src/utils/i18n.ts` (2418 satır, tüm diller içinde)
> kaldırıldı; her dil kendi dosyasında. `src/utils/i18n.ts` artık yalnızca `../i18n/index.ts`
> dosyasını yeniden dışa aktaran ince bir köprü (mevcut import'lar bozulmasın diye).

**Diller (11):** `tr, en, de, es, fr, pt (pt-BR), ru, ar (RTL), ur (RTL), ja, fa (RTL)`

### Dosya yapısı
```
src/i18n/
  index.ts            # kayıt defteri okuma + t(), isRTL(), getLocale(), getHijriMonths() ...
  types.ts            # LocaleModule sözleşmesi (meta+messages zorunlu, diğerleri opsiyonel)
  native.json         # Android uygulama + 4 widget adı, dil başına (build-time tek kaynak)
  README.md           # "2 dakikada yeni dil" kılavuzu
  locales/
    index.ts          # KAYIT DEFTERİ: import + registry; dil menüsü sırası burada
    tr.ts en.ts de.ts es.ts fr.ts pt.ts ru.ts ar.ts ur.ts ja.ts fa.ts
```

### Sözleşme (`types.ts` → `LocaleModule`)
| Alan | Zorunlu | Yoksa |
|---|---|---|
| `meta` (`code`, `label`, `dir`, `locale`) | ✅ | — |
| `messages` (arayüz anahtarları) | ✅ | — |
| `hijriMonths` (12 ay) | — | İngilizce 12 ay |
| `prayerMethods` (`id → {label, description}`) | — | İngilizce |
| `notifications` (`prayer_*` + `beforeTitle` …) | — | İngilizce |
| `esma` (101 Esmâ anlamı) | — | İngilizce |
| `esmaLabels` (`planets`, `segments`) | — | İngilizce |
| `native.json` kaydı | — | İngilizce Android adı |

### API (tek kaynak)
- `LANGUAGE_ORDER`, `LANGUAGES`, `LANGUAGE_LIST` — kayıt defterinden türetilir
- `t(key, lang, vars?)` — sıra: **dil → en → tr → anahtar**; `vars` ile `{ad}` ikamesi
- `getNotificationText(key, lang, fallback?)` — `prayer_*` anahtarı bildirim bölümünde yoksa
  **aynı dilin `messages` bölümüne** düşer (namaz adları tek kaynak)
- `getPrayerMethodText(id, lang)`, `getEsmaMeaning(key, lang)`,
  `getEsmaLabel("planets"|"segments", key, lang)`
- `getHijriMonths(lang)`, `getLocale(lang)`, `isRTL(lang)`, `detectLanguage()`
- `LangCode = keyof typeof registry` — **başka hiçbir yerde dil listesi tutulmaz**

### Yeni dil ekleme (≈2 dk)
1. `src/i18n/locales/<kod>.ts` oluştur (en küçük geçerli örnek `README.md`'de).
2. `src/i18n/locales/index.ts`'e **2 satır**: `import xx from "./xx.ts";` + registry'ye `xx,`.
3. (Opsiyonel) `src/i18n/native.json`'a uygulama/widget adları.
4. `npm run i18n:check` + `npm run i18n:export xx`.

`LangCode`, dil menüsü, cihaz dili algılama (`LANG_MAP`, `meta.locale`'den türetilir), RTL yönü
ve `Intl` locale'i otomatik gelir.

### Doğrulama araçları (`package.json`)
| Komut | İş |
|---|---|
| `npm run i18n:check` | eksik/fazla anahtar, yer tutucu, hijri/esma kontrolü (uyarı modu) |
| `npm run i18n:check:strict` | eksik anahtarlar da hata sayılır |
| `npm run i18n:export <kod>` | `docs/<kod>-ceviri-kontrol.txt` üretir (TSV: sıra / anahtar / tr / en / hedef) |

### Tarih/saat yerelleştirme tuzağı
`fa-IR` gibi bazı yerellerde `Intl.DateTimeFormat` varsayılan takvimi Gregoryen **değildir**
(fa-IR → persian/Şemsî). Miladi tarih gösteren her yerde `calendar: "gregory"` açıkça verilir
(`App.tsx` saat kartı, `widgetBridge.ts`, `ReligiousCalendarModal.tsx`; dini gün listesinde
ayrıca `timeZone: "UTC"`). Hicri alanlar zaten sabit `en-u-ca-islamic-umalqura` biçimlendiricisi
+ `getHijriMonths()` ile üretilir.

### Kullanım (App.tsx)
```ts
import { t, detectLanguage, LangCode, LANGUAGE_LIST, isRTL, getLocale, getHijriMonths } from "./utils/i18n";
```
- Dil kalıcılığı: `localStorage["mnv_lang"]` (`detectLanguage()` varsayılan)
- `document.documentElement.lang = getLocale(lang)`, `dir = isRTL(lang) ? "rtl" : "ltr"`

### Not
- `src/vite-env.d.ts` → `/// <reference types="vite/client" />` (PNG import tipleri için; yoksa tsc
  "Cannot find module '*.png'" der).

---

## 5. Tamamlanan İşler (bu dönem)

1. **i18n registry migrasyonu** — `i18n.ts` yeniden yazıldı; 5 yeni dil eklendi (es, fr, pt-BR, ru, ja)
   → toplam 10 dil. `App.tsx` iki eski dil listesi (`LANGUAGES`, `LANG_OPTIONS`) ve `LOCALE_MAP`
   kaldırıldı; `LANGUAGE_LIST` / `getLocale` / `isRTL` kullanımına geçildi. MIUI uyarı metinleri
   i18n'e taşındı (`xiaomiHintTitle`, `xiaomiHintDesc`, `openSettings`, `dismiss`).
2. **`onboardingTimesDesc`** tüm 10 dilde "10" (vakit sayısı) olarak güncellendi.
3. **`html lang/dir` senkron fix** — CSS `text-transform: uppercase` Türkçe kurallarla
   "in"→"İN", "Próxima"→"PRÓXİMA" yapıyordu. `document.documentElement.lang/dir` runtime'da
   `getLocale`/`isRTL` ile ayarlanarak düzeltildi.
4. **10 dil cihazda doğrulandı** (CDP) — menüde görünüyor, seçimde `lang/dir/mnv_lang` doğru,
   UI çevriliyor, ar/ur RTL, JS hatası yok.
5. **"Meccanen" sekmesi görselleri (Hava yapısına uyarlandı)** — emoji rozetleri (🕌/✅/🌤)
   kaldırıldı; gerçek PNG ikonlar kullanıldı:
   - `src/assets/app-{namaz,habit,weather}.png` (Hava'dan kopyalandı)
   - `src/App.tsx` ~877-905: `apps` dizisi (`nameKey/descKey/img/url`) → `<img className="w-11 h-11
     shrink-0 rounded-2xl object-cover">`, `h4 font-medium text-sm`, `p text-xs`,
     `ExternalLink size={13}`, foot `text-xs`.
6. **Uygulama adları 10 dilde yerelleştirildi** (`appNamazName`/`appHabitName`/`appWeatherName`):
   - tr: Namaz Vakti / Alışkanlık Takipçisi / Hava Durumu
   - en: Prayer Times / Habit Tracker / Weather
   - de: Gebetszeiten / Gewohnheiten-Tracker / Wetter
   - ar: أوقات الصلاة / متتبع العادات / الطقس
   - ur: نماز کے اوقات / عادات ٹریکر / موسم
   - es: Horarios de Oración / Rastreador de Hábitos / El Tiempo
   - fr: Heures de prière / Suivi d'habitudes / Météo
   - ja: 礼拝時間 / 習慣トラッカー / 天気予報
   - pt: Horários de Oração / Rastreador de Hábitos / Previsão do Tempo
   - ru: Время намаза / Трекер привычек / Погода
   (Açıklamalar zaten 10 dilde çevriliydi.) CDP ile 10 dil doğrulandı.
7. **Release akışı düzeltildi** — imzasız AAB kök nedeni bulundu; `build-local.sh release` ile
   injected signing kullanıldı. VERSION_CODE **2026093230** üretildi ve doğrulandı
   (AAB `jar verified` + sertifika SHA-256 eşleşti).

---

### Widget'lar — `2.3.2026110303` (Kasım 2026)

**Güncelleme zinciri (uygulama açılmadan):** `WidgetSyncWorker` günde bir kez WorkManager ile
çalışır; `WidgetPayloadBuilder` AlAdhan'dan 30 günlük vakitleri çeker, `WidgetCore` veriyi
birleştirir/seçer ve 30 güne kadar önbellekler (ağ yoksa `PrayerMath` ile çevrimdışı hesap).
`WidgetRefreshReceiver` boot / tarih değişimi / saat dilimi / `MY_PACKAGE_REPLACED` olaylarında
tazeler; `WidgetCore` ayrıca dakikalık exact alarm kurar (canlı saat ve sıradaki vakit).
Analog widget da aynı `refreshAll` / `buildFor` / `hasClockOrArc` zincirine dahildir; güncelleme
doğruluğu diğer canlı saatli widget'larla birebir aynıdır.

**Widget listesi (4):**

- **Vakit Halkası (3×3)** — Halkada dilim sınırlarında tam saat etiketleri vardır (sıradaki vakit
  vurgulu); merkezde sıradaki vakit adı + saati; iç kenarda kısa "şimdi" işareti; kerahat
  aralıkları kırmızı bant. Halkanın altında **6 sütun × 2 satır** (üstte vakit adı 11sp, altta
  saat 12sp; sıradaki vaktin saati vurgulu).
- **Saat & Takvim (4×4)** — Canlı saat 46sp; saatin altında yalnızca hafta günü. Şehir satırı
  Vakit Halkası'ndaki gibi tam ortada, kalın ve vurgu renginde. Miladi ve Hicri sütunları artık
  **birebir aynı font/ stil** (etiket + gün + ay/yıl; ay/yıl kalın, `sans-serif`, vurgu rengi).
  Altta 6 sütun × 2 satır vakit (ad 12sp, saat 13sp). Kök `match_parent` + dikey ortalama.
- **Analog Saat (4×4)** — Temalı Canvas analog kadran (dış çember, 60 çentik, 12/3/6/9,
  akrep + yelkovan) bitmap olarak çizilir; kadranın üzerinde **hareketli saniye ibresi** vardır.
  Saniye ibresi, aynı kırmızı ibre görselinin 6°'lik adımlarla döndürülmüş **60 karelik
  `ViewFlipper`**'ı ile `autoStart=true` / `flipInterval=1000` sayesinde launcher içinde akar;
  uygulama her saniye uyanmaz (pil dostu). Her build'de `setDisplayedChild(cal.get(SECOND))` ile
  doğru konuma hizalanır. En altta 6 sütun × 2 satır vakit satırı. (Önceki sürümdeki `Chronometer`
  dijital saat ve ay evresi/moon satırı **kaldırıldı**.)
- **Vakit Kartları (4×2)** — Sol-üst konum, 6 başlık kartı ve her kartın altında ortalanmış saat.

**Kaldırılan:** "Vakitler" sayısal widget'ı (`PrayerTimesWidgetProvider`, `widget_pt_*`,
`widget_times` etiketi) tamamen kaldırıldı — Java, layout/xml/önizleme/PNG, manifest receiver,
`add_widgets.py`, `build-local.sh` ve `preview_strings.xml` (5 dil) referansları temizlendi.

**Seçici önizlemeleri:** 4 `*_info.xml` içinde `previewLayout` (Android 12+), `previewImage`
(eski sürümler) ve 5 dilde `description`. PNG'ler `scripts/local-build/make_widget_previews.py`
(Pillow) ile üretilir → `res/drawable-nodpi/` (en) ve `res/drawable-tr-nodpi/` (tr). Analog için
kadran (`widget_analog_face.png`) ve saniye ibresi (`widget_analog_second_hand.png`) da bu betikle
üretilir; eski ay simgesi (`widget_analog_moon.png`) ve `widget_preview_moon*` metinleri kaldırıldı.

**Uzun ad kısaltmaları:** 6 sütuna sığmayan adlar `PrayerArcWidgetProvider.widgetName()` ile
kısaltılır: de `Sonnenaufgang → Aufgang`, ur `طلوع آفتاب → طلوع`.

### Hero Kartı Tarih Bölümü — `2.3.2026110305`

Ana ekran (hero) kartındaki tarih bölümü **üç eşit sütuna** bölündü:
**Miladi / Ayın Fazı / Hicri**. Miladi ve Hicri sütunları Saat & Takvim widget'ındaki gibi
kendi alanlarında ortalanır (`flex-1 text-center`; etiket satırları `justify-center`). Ay
figürü (`MOON_PHASE_ICONS`) ve altındaki açıklama (`{phase} · %{illumination}`) ortadaki
sütuna taşındı. Orta sütunda **başlık yok**; yalnızca görünmez bir etiket satırı (`invisible`)
ile ay figürünün diğer sütunların gün rakamlarıyla aynı hizada başlaması sağlanır. Dar
ekranlarda uzun tarih/ay adları alt satıra inebilir (kabul edildi). `src/App.tsx` ~1797 civarı.
Kullanılmayan `Moon` ikonu importtan kaldırıldı.

### Hero Tarih Sütunları + Analog Saat — `2.3.2026110306`

- **Hero kartı (Miladi/Hicri font eşitleme):** İki tarih sütununun fontu zaten aynıydı
  (`Plus Jakarta Sans`); gerçek fark **stil**ti. Miladi gün/ay artık Hicri ile birebir aynı
  görünümde: gün `text-4xl sm:text-5xl font-bold font-sans ${accent2}`, ay/yıl
  `text-base sm:text-lg font-sans ${accent2} opacity-80 mt-1`; Hicri tarafına da açık `font-sans`
  eklendi. Böylece iki sütun simetrik. Ay figürü ve metni **korundu** (kullanıcı beğendi).
- **Saat & Takvim widget'ı:** Tutarlılık için `HDAY` rengi `pal.text` → `pal.accent` yapıldı;
  Miladi ve Hicri gün/ay artık aynı vurgu renginde.
- **Analog widget:** Dijital `Chronometer` saat ve ay evresi (moon) satırı **kaldırıldı**;
  yerine kadran üzerinde **hareketli saniye ibresi** geldi (60 kareli `ViewFlipper`, yukarıda
  ayrıntılı). İlgili `SECS`/`MOON`/`PHASE` id'leri, `buildMoon()`, `Path`/`RectF`/`SystemClock`
  importları ve `widget_analog_moon.png` + `widget_preview_moon*` metinleri temizlendi.

### Farsça (fa) + i18n Modüler Refactor — `2.3.20261111`

**Kaynak:** `/home/Knight/Desktop/Play/ceviri_fa_duzeltilmis.json` — 246 anahtar, kullanıcı onaylı
düzeltilmiş Farsça (önceki taslağa göre 17 düzeltme; dosyadaki değerler **birebir** kullanıldı).

- **Mimari:** 10 mevcut dil `src/i18n/locales/*.ts`'e taşındı; eski gömülü haritalar silindi:
  `prayerHelper` (`PRAYER_METHODS`), `notificationHelper` (`PRAYER_NAMES`/`TEXTS`/`STATUS_TEXTS`),
  `widgetBridge` (`PRAYER_NAMES`/`HIJRI_MONTHS`/`MOON_PHASES`/`LOCALE_MAP`),
  `religiousHelper` (`HIJRI_MONTHS`), `esmaData` (5 dilde 101 anlam), `esmaHelper`
  (`PLANET_LABELS`/`SEGMENT_LABELS`), `App.tsx` + 4 bileşen (`lang === "ar" || "ur"` ve locale zincirleri).
  Artık `prayerHelper` id listesini, `esmaData` yalnız Arapça yazılış/okunuşu tutar; metinler locale'den gelir.
- **Farsça içerik:** 246 arayüz anahtarı + 12 hicri ay + 7 hesaplama yöntemi + bildirim metinleri +
  101 Esmâ anlamı + gezegen/gün bölümü etiketleri. `dir: rtl`, `locale: fa-IR`.
- **Bildirim düzeltmesi:** `getNotificationText`, `prayer_*` anahtarı bildirim bölümünde yoksa
  aynı dilin `messages` bölümüne düşer. Böylece fa bildirimleri "Fajr" değil "فجر" der; aynı
  düzeltme es/fr/pt/ru/ja bildirimlerini de İngilizceden kurtardı.
- **Android/native:** `src/i18n/native.json` tek kaynak (uygulama + 4 widget adı; `build-local.sh`
  oradan okur, `values-<dil>/strings.xml` üretir). `native/widget/res/values-fa/preview_strings.xml`
  eklendi; `add_widgets.py` kopyalama listesine `values-fa`.
- **Kontrol listesi:** `docs/fa-ceviri-kontrol.txt` — 400 satır TSV
  (ARAYÜZ 246, HİCRİ AYLAR 12, YÖNTEM 14, BİLDİRİM 13, ESMA 101, ETİKET 14). Hedef sütununda boş yok.
- **RTL hataları (cihazda bulundu ve düzeltildi):**
  1. **Saat:** RTL'de saniye saatin soluna kayıyordu (`19: 04:03`) → saat kapsayıcısına `dir="ltr"`.
  2. **Üst menü taşması:** `contentSpan = last.right - first.left` RTL'de negatif çıktığı için
     ikonlar üst satıra hiç taşınmıyor, dişli ekran kenarından kırpılıyordu → yön bağımsız
     `Math.max(right) - Math.min(left)` ölçümü (ar/ur'u da etkileyen yeni header kodunda hata).
  3. **"Next prayer in" etiketi:** fa'da `نماز بعدی تا` çıkıyordu → `تا نماز بعدی`
     (`lang === "fa"` için tr'deki gibi tek satır özel durum; ileride `nextPrayerIn` anahtarına taşınabilir).
- **Küçük normalizasyonlar:** es/fr/pt/ru/ja'daki İngilizce `hijriMonths` kopyaları kaldırıldı
  (İngilizceye düşer); widget ay-fazı metinleri artık uygulama ekranıyla aynı kaynaktan
  (tr/ar/ur'da ufak ifade birleşmesi); `onboardingTimesDesc` 10 → **11 dil** (tüm dillerde);
  widget Almanca gün doğumu "Sonnenaufgang" → "Aufgang" (UI metni).
- **Doğrulama:** `npm run i18n:check` → 11 dil, hata yok (yalnız beklenen `de` 28 / `ur` 29 eksik
  anahtar + `ja.in` boş uyarısı); `npx tsc --noEmit` → yalnız **7 önceden var olan hata**
  (server.ts express/genai/dotenv, `LocalNotificationsPlugin.pending`, 3× `webkitCompassHeading`);
  `npm run build` → 1723 modül, başarılı.
- **APK:** `apk/meccanen-debug-v2.3.20261111.apk` (27 MB) — Samsung A52'ye `adb install -r` ile
  kuruldu, uygulamada FA فارسی seçilip cihazda doğrulandı (RTL, vakitler, yöntemler, ayarlar).
- **Play AAB (11 Kasım 2026):** `apk/meccanen-release-v2.3.2026111100.aab` — imzalı ve doğrulandı.
  İlk denemede versionCode `20261111` (8 hane) Play'de reddedildi → `2026111100` ile yeniden derlendi.
  İlk deneme 30 dk sonra timeout oldu; kök neden Gradle daemon'ın `-Xmx1536m` ile D8 dex
  birleştirmede OOM olmasıydı. `build-local.sh` artık heap'i 2560 MB yapıyor; ikinci build
  **3m 14s** sürdü. Ayrıntı/doğrulama: Bölüm 8.

---

## 5A. Kıble Pusulası Yenilemesi + Bildirim Düzeltmesi — `2.3.2026111200` (12 Kasım 2026)

### 5A.1 Kök neden: OS füzyonu yaw'ı kaydırıyor

Cihaz: **Samsung A015 (Galaxy A01), Android 16 / API 36**, manyetometre `qmc6308`.
Telefon düz yatarken (acc → z/|a| = 1.000) aynı anda okunan değerler:

| Kaynak | Değer |
|---|---|
| OS `rotation-vector` füzyonu (uygulamanın gördüğü) | **290.5°** |
| Ham mag + acc (durumsuz hesap) | **107.4°** |
| Göreli (jiro) akışın net dönüşü | ~0° (telefon eski yerinde) |

Aradaki fark **183°**. Yani kıble formülü hiç bozuk değildi; uygulama bozuk sensörü doğru
gösteriyordu. Ekranı kapatıp açmak füzyonu yeniden başlattığı için geçici olarak düzeliyordu.

### 5A.2 Çözümün katmanları

**a) Native `QiblaSensor` plugin (ham manyetometre köprüsü)**

WebView manyetometreye erişemediği için Java tarafında yazıldı; `build-local.sh` içindeki
`scripts/local-build/add_qibla_plugin.py` dosyayı üretip `MainActivity`'ye kaydediyor
(battery plugin'iyle aynı kalıp).

| Dosya | İş |
|---|---|
| `scripts/local-build/add_qibla_plugin.py` | `QiblaSensorPlugin.java` üretimi + MainActivity kaydı |
| `src/utils/nativeCompass.ts` | `nativeCompassHeading()` / `stopNativeCompass()` köprüsü |
| `src/utils/qiblaHelper.ts` | `pollNative()` — 250 ms'de bir okur, referansı onarır |

Plugin `getHeading()` → `{ ok, heading, total }` döner. `total` (µT) kalite kapısıdır:
**30–62 µT** dışındaki örnek referans olarak kullanılmaz (yerkürenin alanı ~45–50 µT; elde
tutarken 46 → 82 µT ölçüldü).

**b) Referans sıçraması reddi (JS)**

Fiziksel bir dönüş, mutlak ve göreli yönü **aynı** miktarda değiştirir; yani `(mutlak − göreli)`
farkı sabittir. Bu fark aniden büyük ölçüde değişirse telefon dönmemiş, referans zıplamıştır →
örnek yok sayılır.

**c) Manyetik sapma — `src/utils/geomag.ts`**

WMM-2025 resmi katsayıları gömülü, çevrimdışı. `magneticDeclination(lat, lng, alt, tarih)`.
pygeomag 1.1.0 ile 2520 noktalı ızgarada: **maks 0.047°**, ortalama **0.0006°**.
İbre hesabı: `needle = qiblaDir − declination − compassHeading`.

**d) Kıble geometrisi**

`calcQiblaDirection()` büyük daire formülü; 11 test noktasında bağımsız kerteriz referansına
karşı **0.000000°** fark. `getCompassHeading()` hibrit eksen kullanır: düz tutuşta üst kenar
(+y), dik tutuşta arka yüz (−z); seçim `|cosβ|` ile z-ekseni yatay izdüşümü karşılaştırılarak
yapılır (45° eğimde geçiş). `screen.orientation.angle` ayrıca eklenir.
216 tutuş kombinasyonunda bağımsız rotasyon matrisine karşı **0.0000°** hata.

### 5A.3 Sabitler (qiblaHelper.ts)

| Sabit | Değer | Ne yapıyor |
|---|---|---|
| `MAX_REF_JUMP` | 12° | mutlak referans sıçraması reddi |
| mutlak düzeltme kazancı | 0.1 | yavaş sürüklenme düzeltmesi |
| `NATIVE_FLIP` | 100° | yalnızca gerçek füzyon kayması (~180°) referansı sıfırlar |
| `NATIVE_STABLE` | 12° | son 4 örneğin medyanı etrafındaki saçılma sınırı (≥3 örnek şart) |
| `NATIVE_DRIFT_GAIN` | 0.05 | 8° üzeri farkı sıçratmadan benimser |
| alan kalitesi | 30–62 µT | manyetik girişim kapısı |
| EMA | 0.18 s | dairesel alçak geçiren filtre |
| `QIBLA_LOCK_DEG` | 3° | "hedefe vardım" eşiği |
| renk rampası | 3° → 28° | amber → lime → yeşil |

> **Neden 45° değil 100°:** eşik 45° iken telefonu elde tutmak manyetik alanı bozuyor ve ham
> referans 30–40° kayıyordu; uygulama bunu "gerçek kayma" sanıp ibreyi iki yönde birden
> oynatıyordu. Artık 30–40°'lik girişim kayması sıçratmıyor, yavaşça benimseniyor.

### 5A.4 Görsel dil (App.tsx · Kıble kartı)

- **Hedef dilimi (±10°)**: halkanın üzerinde kalın yay; kilitlenince parlaklaşır.
- **Kalan açı dilimi**: 0° ile ibre arasındaki halka dilimi + kesikli kılavuz çizgi.
- **Akan kesikli dönüş okları**: gereken tarafta (3 ve 9 hizası, r=74) `stroke-dashoffset`
  animasyonuyla **hedefe doğru** akar; 3° altında kaybolur.
- **Kilit**: halka 5 px + `hsl` tonu tam yeşil, ibre/Kâbe ikonu yeşil, tek atımlık nabız
  (`@keyframes qiblaLockPulse`, `transform-box: fill-box`).
- **Kâbe ikonu**: siyah küp gövde + altın kuşak (hizam) + altın kapı + çatı çizgisi, koyu
  "badge" zeminiyle halkadan ayrışır.
- **Metin**: "Kâbe tam önünde ✓" / "X° sağa dön" / "X° sola dön" / "Kâbe arkanda — 180° dön"
  (tr/en/de; diğer diller İngilizceye düşer).
- **Halka teması**: açık temada `rgba(15,23,42,0.16)`, koyu temada `rgba(255,255,255,0.14)`.

### 5A.5 Bildirim düzeltmesi — "title" hatası

`notificationHelper.ts`, i18n sözlüğünde **olmayan** anahtarları çağırıyordu; `getNotificationText`
bulamayınca anahtarın kendisini döndürdüğü için ekranda "title" yazıyordu.

| Çağrılan (hatalı) | Doğrusu |
|---|---|
| `title` | `statusTitle` ("Şu An {name} Vakti") |
| `bodyPrayer` | `statusBodyPrayer` ("{next} Namazı Saat {time}") |
| `bodySunrise` | `statusBodySunrise` ("Güneşin Doğuşu Saat {time}") |

Cihazda doğrulama (`adb shell dumpsys notification --noredact`):
`android.title = "Şu An Yatsı Vakti"`, `android.text = "İmsak Vakti Saat 05:28"`.
Almanca sözlükte bu anahtarlar zaten vardı.

### 5A.6 Doğrulama özeti

| Test | Sonuç |
|---|---|
| Kıble formülü (11 nokta) | 0.000000° |
| Hibrit eksen (216 tutuş) | 0.0000° |
| WMM-2025 (2520 nokta) | maks 0.047° / ort. 0.0006° |
| Anchor senaryoları (6 test) | 6/6 (bozuk mutlak 180° çevir–dön sonrası ibre sabit) |
| Native plugin (cihaz, 10 örnek) | 323.9° — bağımsız hesap 323.9° |
| Enjeksiyon testi (180° kayma) | ibre −181.6 → −20.2 → −181.5 (kendini toparladı) |
| Kararlılık (42 s, alan 48.6–50.4 µT) | ibre 5.1° ± 0.1; uygulama 124.3° vs ham 126° |
| Görsel durumlar (sağ/sol/kilit) | yay yönü, ok başı, kalın halka, akan ok kaybolması ✓ |
| Bildirim | "Şu An Yatsı Vakti" / "İmsak Vakti Saat 05:28" |

### 5A.7 Cihazda tekrar test reçetesi

```bash
# WebView devtools köprüsü
SOCK=$(adb shell cat /proc/net/unix | grep -oE 'webview_devtools_remote_[0-9]+' | head -1 | tr -d '\r')
adb forward tcp:9222 localabstract:$SOCK

# ibre açısı (DOM)
# document.querySelector('polygon[fill*="needleTip"]').parentElement.style  → rotate(...)

# ham sensör doğrusu
adb shell dumpsys sensorservice

# durum bildirimi metni
adb shell dumpsys notification --noredact | grep -E "android\.(title|text)"
```

Sentetik yön enjeksiyonu (referansı sıfırlamak için dinleyiciyi kapat-aç, sonra **offset
kurulmadan** enjekte et):

```js
btn.click(); await sleep(200); btn.click(); await sleep(120);
for (let i = 0; i < 12; i++) {
  dispatchEvent(new DeviceOrientationEvent('deviceorientationabsolute',
    { alpha, beta: 0, gamma: 0, absolute: true }));
  await sleep(40);
}
```
> Dinleyici yeniden kurulduktan sonra `offset` dolarsa 12° sıçrama koruması enjeksiyonu reddeder —
> bu **doğru** davranıştır, test için yukarıdaki sıralama gerekir.

### 5A.8 Bilinen sınırlar

- **Düz yatıkken 180° çevirme sensörle ayırt edilemez** (ivmeölçer yaw görmez); arayüz dönmez.
  İbre dünyaya sabit olduğu için doğru kalır, metin okumayı netleştirir. Dik tutuşta referans
  arka yüze (−z) geçer.
- Oklar/renk geçişi **sentetik yönle** doğrulandı; fiziksel çevirmeyle tekrar bakılmalı.
- `prefers-reduced-motion` desteği yok (nabız + akan oklar her zaman animasyonlu).
- Kıble metinleri tr/en/de; kalan diller İngilizceye düşer.
- Elde tutarken alan >62 µT ise ham referans kullanılmaz; bu sırada jıro akışı devam eder
  (yavaş kayma olabilir, sıçrama olmaz).

### 5A.9 Değişen / eklenen dosyalar

| Dosya | Durum |
|---|---|
| `src/utils/qiblaHelper.ts` | yeniden yazıldı (hibrit eksen, EMA, anchor, native poll) |
| `src/utils/geomag.ts` | **yeni** — WMM-2025 |
| `src/utils/nativeCompass.ts` | **yeni** — plugin köprüsü |
| `scripts/local-build/add_qibla_plugin.py` | **yeni** — Java plugin üretimi |
| `build-local.sh` | plugin adımı eklendi |
| `src/App.tsx` | ibre transformu, sapma, hedef dilimi, akan oklar, kilit, Kâbe ikonu, ipucu metni |
| `src/index.css` | `qiblaLockPulse`, `qiblaTurnFlow` animasyonları |
| `src/i18n/locales/{tr,en,de}.ts` | kıble ipucu metinleri |
| `src/utils/notificationHelper.ts` | `statusTitle` / `statusBodyPrayer` / `statusBodySunrise` |

### 5A.10 Sonraki adımlar (kıble)

- Kilitlenince kısa titreşim (Vibration API) — ekrana bakmadan geri bildirim.
- `prefers-reduced-motion` desteği (nabız + akan oklar statik gösterim).
- Çentikleri 12'ye indirip 4 ana yönü (K/D/G/B) harflerle göstermek.
- Kıble ipucu metinlerini kalan dillere çevirmek.

### 5A.11 Güvenlik notu (12 Kasım oturumu)

Anahtar klasörü listelenirken maskeleme hatası nedeniyle `meccanen_namaz_release_secrets.txt`
(upload keystore parolası) ve `havadurumu_release_secrets.txt` içeriği konuşmaya yansıdı.
Öneri: havadurumu upload anahtarını rotate et, bu konuşmayı paylaşma. Namaz uygulamasının
Play App Signing imza anahtarı etkilenmez; gerekirse Play Console'dan upload key sıfırlanabilir.

---

## 6. Cihaz & CDP Test Yöntemi

- **Bağlı cihazlar (değişkenlik gösterir):** en son `A52EEA0000048908`; öncesinde `d9edf6220000`,
  çok öncesinde Nothing A015 `00100348D000503`.
- **Release build'de WebView debugging KAPALIDIR** → devtools soketi açılmaz. Cihazda görsel/işlevsel
  doğrulama yapmak için **debug build** gerekir.
- CDP adımları:
  ```bash
  adb shell monkey -p meccanen.namaz.vakti.v1 -c android.intent.category.LAUNCHER 1
  PID=$(adb shell pidof meccanen.namaz.vakti.v1 | tr -d '\r')
  adb forward --remove-all
  adb forward tcp:9222 localabstract:webview_devtools_remote_$PID
  curl -s http://localhost:9222/json      # webSocketDebuggerUrl al
  ```
- Yardımcı script: `/tmp/opencode/cdp.py` (python websocket-client; `Runtime.evaluate`,
  `awaitPromise/returnByValue`, `suppress_origin=True`). **Oturum sıfırlanınca silinir → yeniden oluştur.**
  İçeriği:
  ```python
  import sys, json, websocket
  ws_url = sys.argv[1]; expr = sys.argv[2]
  timeout = float(sys.argv[3]) if len(sys.argv) > 3 else 10.0
  ws = websocket.create_connection(ws_url, timeout=timeout, suppress_origin=True)
  ws.send(json.dumps({"id":1,"method":"Runtime.evaluate",
    "params":{"expression":expr,"awaitPromise":True,"returnByValue":True}}))
  while True:
      res = json.loads(ws.recv())
      if res.get("id")==1: print(json.dumps(res, ensure_ascii=False, indent=2)); break
  ws.close()
  ```
- **Meccanen sekmesine gitmek:** ana ekrandaki **"MECCANEN"** başlık butonuna tıkla
  (`App.tsx` 1547: `setSettingsInitialTab("meccanen"); setSettingsOpen(true)`), sonra `h4` metinlerini oku.
- Onboarding overlay'ini atlamak için localStorage:
  ```js
  localStorage.setItem("mnv_onboarded_v1","1");
  localStorage.setItem("mnv_location_prompted","true");
  localStorage.setItem("mnv_xiaomi_hint_dismissed","1");
  localStorage.setItem("mnv_exact_alarm_prompted","1");
  localStorage.setItem("mnv_lang","tr"); location.reload();
  ```
- Debug ↔ release imza uyuşmazlığında `adb uninstall meccanen.namaz.vakti.v1` gerekir.
  Ara sıra `INSTALL_FAILED_USER_RESTRICTED` (telefonda onay diyaloğu) çıkar.
- **APK'yı cihaza kurma (CDP'siz, en hızlı görsel doğrulama):**
  ```bash
  adb install -r apk/meccanen-debug-v<VERSION>.apk
  adb shell am force-stop meccanen.namaz.vakti.v1
  adb shell am start -n meccanen.namaz.vakti.v1/.MainActivity
  adb exec-out screencap -p > /tmp/opencode/ss.png   # ekran görüntüsü
  adb shell input tap X Y                            # dokunma (fiziksel piksel)
  ```
  - A52 ekranı: **720×1600, density 320** (screenshot ile aynı koordinatlar).
  - İlk açılışta sırayla: onboarding (X ile kapat) → konum izni (uygulama + Android diyaloğu)
    → pil optimizasyonu (Dismiss) → ana ekran. Dil menüsü: **globe ikonu**.
  - Dil seçimi `localStorage["mnv_lang"]`'e yazılır; yeniden kurulumda (`-r`) korunur.
  - WebView açılışta ~5 sn boş kalabilir; screencap'i 5-6 sn sonra al.
- JS hatalarını gör: `adb logcat -d -s Capacitor/Console`

---

## 7. localStorage Anahtarları (App.tsx)

| Anahtar | İşlev |
|---|---|
| `mnv_lang` | Seçili dil |
| `mnv_theme` | Tema |
| `mnv_font_scale` | Yazı boyutu (Aa sistemi, `--afs` CSS değişkeni) |
| `mnv_location` / `mnv_saved_locations` | Konum(lar) |
| `mnv_prayer_method` | Hesap yöntemi |
| `mnv_onboarded_v1` | Onboarding tamamlandı |
| `mnv_location_prompted` | Konum izni soruldu |
| `mnv_auto_location` | Otomatik konum açık |
| `mnv_xiaomi_hint_dismissed` | MIUI uyarısı kapatıldı |
| `mnv_exact_alarm_prompted` | Kesin alarm izni soruldu |
| `meccanen_is_supporter` | Destekçi rozeti |

---

## 8. Mevcut Durum (son)

> ⚠️ Bu bölüm **11 Kasım 2026** itibarıyladır. 12 Kasım güncellemesi (kıble pusulası + bildirim düzeltmesi + `2.3.2026111200` AAB) için **bölüm 5A**'ya bak; güncel özet başlıktadır.

- **Sürüm (Play, yüklenmeye hazır):** `2.3.2026111100` / versionCode `2026111100`
  (= 2.026.111.100 > canlı `2026110306` = 2.026.110.306). minSdk 24, compile/target 36.
  İlk denemede `20261111` (8 hane) kullanıldı ve Play "existing users cannot upgrade" hatası
  verdi — bkz. Bölüm 3 ve 9'daki versionCode kuralı. Bu dosyalar `apk/`'dan silindi.
- **Debug APK:** `apk/meccanen-debug-v2.3.20261111.apk` (27 MB) — **güncel**, Farsça dahil.
  Samsung A52'ye USB ile kuruldu, cihazda FA فارسی seçilip doğrulandı. İçerik:
  - 11 dil (`src/i18n/locales/fa.ts`), fa RTL + `fa-IR`.
  - Cihazda düzeltilmiş 3 RTL hatası (saat yönü, header taşma ölçümü, fa etiket sırası).
  - Widget `values-fa` kaynakları APK'da mevcut (`aapt dump --values resources` ile doğrulandı).
- **İmzalı AAB (Play'e yüklenecek):** `apk/meccanen-release-v2.3.2026111100.aab` (25 MB, 11 Kasım 2026)
  - `jarsigner -verify` → **"jar verified."** (exit 0); sertifika SHA-256 yukarıdakiyle **birebir aynı**.
  - `versionCode 2026111100`, `versionName 2.3.2026111100`; önceki yayın `2026110306`'dan **büyük**
    (2.026.111.100 > 2.026.110.306).
  - `base/resources.pb` içinde Farsça metinler var (`strings -e S | grep اوقات` → 11 eşleşme).
  - SHA-256: `06edd7a662b58c3effa5938e5688d08f13a928ef37dc0a317c65ef5a1d1b0a5e`
- **İmzalı release APK (aynı build):** `apk/meccanen-release-v2.3.2026111100.apk` (26 MB) —
  `apksigner verify` → v2 imzası geçerli; `aapt dump badging` → versionCode 2026111100;
  `values-fa` widget metinleri APK içinde doğrulandı.
- **Keystore:** `/home/Knight/Desktop/Play/keys/meccanen-namaz-upload.keystore`, alias
  `meccanen-namaz-upload`; parola `/home/Knight/Desktop/Play/keys/meccanen_namaz_release_secrets.txt`
  içindeki `PAROLA:` satırından okunuyor (dosyaya yazılmadı).
- **Çıktılar:** `apk/` kalıcı yedek; `dist/` Vite tarafından her build'de silinir
  (build sonrası APK'yı `apk/`'ya kopyala).
- **Git (commit edilmedi):** yeni `src/i18n/` (index/types/native.json/README + 11 locale dosyası),
  `scripts/i18n-check.mjs`, `scripts/i18n-export.mjs`, `docs/fa-ceviri-kontrol.txt`,
  `native/widget/res/values-fa/`, `apk/meccanen-debug-v2.3.20261111.apk`;
  değişik `src/utils/i18n.ts`, `prayerHelper.ts`, `notificationHelper.ts`, `widgetBridge.ts`,
  `religiousHelper.ts`, `esmaData.ts`, `esmaHelper.ts`, `src/App.tsx`, `build-local.sh`,
  `package.json`, `scripts/local-build/add_widgets.py`; ayrıca önceki dönemin widget dosyaları.
  Silinen: `PrayerTimesWidgetProvider.java` + `widget_pt_*`.

---

## 9. Notlar / Tuzaklar

- **React 19 + Vite + Tailwind v4.** Tema token'ları `index.css`'te (`card`, `settingsCard`,
  `accent`, `textPrimary/Secondary/Muted` vb.). Yazı boyutu `--afs` CSS değişkeniyle ölçeklenir;
  `text-*` sınıfları `!important` ile override edilmiştir.
- PNG importları için `src/vite-env.d.ts` şart.
- `dist/`'in Vite webDir olması en sık karışıklık nedeni (Bölüm 3).
- İmzalı AAB için asla doğrudan `gradlew bundleRelease` kullanma (Bölüm 3).
- `/tmp/opencode/*` (cdp.py, jdk17/sdk symlink'leri, keep/) oturum sıfırlanınca kaybolur.
- **i18n:** Yeni metin eklerken **sadece** `src/i18n/locales/*.ts` dosyalarını düzenle; başka bir
  dosyaya dil haritası **ekleme** (`prayerHelper`/`notificationHelper`/`widgetBridge`/`esmaData`
  artık metin tutmaz). Yeni anahtar → önce `en.ts`, sonra diğerleri; `npm run i18n:check`.
- **i18n:** `hijriMonths`/`prayerMethods`/`notifications`/`esma`/`esmaLabels` opsiyoneldir;
  eksikse İngilizceye düşer. "Eksik" sanıp kopyalamak gereksiz (es/fr/pt/ru/ja'da hijri dizileri
  bu yüzden kaldırıldı).
- **RTL:** Sayısal saat/geri sayım gibi LTR okunması gereken bloklara `dir="ltr"` ver.
  Genişlik/taşma ölçümlerinde `first.left`/`last.right` varsayımı RTL'de ters çalışır;
  `min(left)` / `max(right)` kullan.
- **Tarih:** `fa-IR` (ve bazı ar yerelleri) varsayılan takvimi Gregoryen değildir; Miladi tarih
  gösteren her `Intl`/`toLocaleDateString` çağrısına `calendar: "gregory"` ekle (Bölüm 4).

---

## 10. Olası Sonraki Adımlar

- **Farsça'yı yayınla:** AAB hazır → `apk/meccanen-release-v2.3.2026111100.aab`. Play Console'da
  "Production → Create new release" ile yükle; sürüm notları için Bölüm 11'deki taslağı kullan.
  (Play Developer API kimliği bu makinede yok; yükleme manuel.)
- **Yeni dil (öneri):** Endonezce (`id`) — en büyük Müslüman nüfus, LTR/Latin, ~1 saatlik iş;
  sonra Bengalce (`bn`). Akış: `ceviri_<kod>.json` → `locales/<kod>.ts` → registry'ye 2 satır →
  `native.json` → `npm run i18n:check` + `i18n:export <kod>` → cihazda dene.
- **Bilinen eksikler:** `de` 28, `ur` 29 arayüz anahtarı eksik (refactor öncesinden);
  `ja.in` bilinçli boş; `AddLocationModal`'da hazır İran şehri yok (fa'da arama Latin harfleriyle).
- **fa etiket sırası:** `App.tsx` içinde `lang === "fa"` özel durumu var; istenirse
  `nextPrayerIn` gibi tek bir anahtara taşınıp dilden bağımsız hale getirilebilir.
- Yeni sürüm çıkarırken: içerik değişikliği + `VERSION_CODE` artır, `build-local.sh release`,
  imza doğrula, AAB'yi `dist` dışına yedekle, AAB'yi en son üret (debug sonrası çalıştırma).
- Widget'lar (`native/widget`) ile ilgili değişikliklerde `scripts/local-build/add_widgets.py`
  güncelliğini kontrol et.

---

## 11. Sürüm Notları Taslağı — `2.3.2026111100` (Play Console)

Play, her dil için 500 karaktere kadar sürüm notu kabul eder. Türkçe ve İngilizce zorunlu değil ama
önerilir; Farsça için de eklenebilir.

**Türkçe (tr-TR):**
```
Yeni dil: Farsça (فارسی)! 🎉
• Uygulama artık 11 dilde
• Farsça için tam sağdan sola (RTL) arayüz
• Saat yönü ve üst menü taşma düzeltmeleri (Arapça ve Urduca dahil)
• Farsça widget adları ve bildirim metinleri
```

**English (en-US):**
```
New language: Persian (فارسی)! 🎉
• The app now supports 11 languages
• Full right-to-left (RTL) layout for Persian
• Fixed clock direction and header overflow (also affects Arabic and Urdu)
• Persian widget labels and notification texts
```

**فارسی (fa-IR):**
```
زبان جدید: فارسی! 🎉
• برنامه اکنون از ۱۱ زبان پشتیبانی می‌کند
• رابط کاربری کامل راست‌به‌چپ برای فارسی
• اصلاح جهت ساعت و سرریز منوی بالا (شامل عربی و اردو)
• نام ویجت‌ها و متن اعلان‌ها به فارسی
```
