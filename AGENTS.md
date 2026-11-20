# AGENTS.md — Meccanen Namaz Vakti · Ajan Bağlam Dosyası

> **Bu projede tek kaynak bu dosyadır** (`ajan.md` kaldırıldı, kopya tutulmuyor).
> Yapay zekâ ajanı veya yeni geliştirici için tam bağlam: proje durumu, kıble mimarisi,
> build/release akışı, bildirim tuzakları, i18n, güvenlik ve bilinen hatalar.
> `Ozet.md` yalnızca tarihsel kayıttır; çelişki olursa **bu dosya + kod** esastır.
>
> **Son doğrulama:** 18 Kasım 2026 — kod, build çıktıları, `git status`, imza, `i18n:check` ve
> `tsc --noEmit` yeniden çalıştırılarak kontrol edildi.
>
> **Kaynaklar:** `Ozet.md` (tarihsel), `docs/notification-system-findings.md`,
> `docs/growth-roadmap.md`, `src/i18n/README.md`, `README.md`, kod ve build çıktıları.
> Çelişki olursa **bu dosya + kod** esastır; `Ozet.md` tarihsel kayıttır.

---

## 1. TL;DR

- **Ne:** Reklamsız, gizlilik odaklı, çok dilli namaz vakitleri Android uygulaması.
- **Stack:** React 19 + Vite 6 + TypeScript 5.8 + Tailwind CSS v4 + Capacitor 6.
- **appId:** `meccanen.namaz.vakti.v1` · **Play:** `meccanen.namaz.vakti.v1`
- **Diller:** 11 (tr, en, de, es, fr, pt, ru, ar, ur, ja, fa) — ar/ur/fa RTL.
- **Son build:** `2.3.2026112000` (20 Kasım 2026) — imzası doğrulandı (`jarsigner` 0, `apksigner` v2 true), Play'e yüklenmedi.
- **Build:** Yerel `./build-local.sh` (GitHub Actions kotası nedeniyle tercih edilir).
- **Güncelleme:** Play In-App Updates, sessiz indirme + "Yeniden başlat" satırı — §16.
- **Kritik kural:** `versionCode` **10 haneli** `YYYYMMDDCC` olmalı ve Play'deki en yüksekten büyük olmalı.
- **Kritik kural:** `dist/` hem Vite `webDir`'idir hem build çıktılarının kopyalandığı yerdir; her `npm run build` onu **siler**.
- **Durum:** Çalışma ağacı temiz; son commit 20 Kasım 2026 (`558635e`). TypeScript'te 4 bilinen hata var (aşağıda).

---

## 2. Güncel Durum (20 Kasım 2026 — doğrulanmış)

### 2.1 Sürüm ve çıktılar

| Öğe | Değer | Doğrulama |
|---|---|---|
| Son üretilen sürüm | `2.3.2026112000` / versionCode `2026112000` | `aapt2 dump badging` |
| AAB | `dist/meccanen-release-v2.3.2026112000.aab` (~25,8 MB) | `jarsigner -verify` → exit 0 |
| APK | `dist/meccanen-release-v2.3.2026112000.apk` (~26,7 MB) | `apksigner verify -v` → v2 true |
| AAB sertifikası | SHA-256 `A9:6E:58:...:13:F4`, geçerlilik 2054 | `keytool -printcert -jarfile` |
| minSdk / target | 24 / 36 (compile 36) | `aapt2 dump badging` |
| Önceki yayınlanan | `2.3.2026111200` | `Ozet.md` |
| `apk/` kalıcı yedek | `2026111100`, `2026111200`, `2026111800`, `2026112000` (AAB+APK) | `ls apk/` |

> Keystore: `Play/keys/meccanen-namaz-upload.keystore`, alias `meccanen-namaz-upload`.
> Parola `Play/keys/meccanen_namaz_release_secrets.txt` içinde (`PAROLA: ...`); yazdırma.

### 2.2 Kaynak kod durumu

| Kontrol | Sonuç |
|---|---|
| `git branch` | `main`, remote `github.com/Meccanen/Meccanen-Namaz-Vakti-Reklams-z` |
| Son commit | `558635e` · 20 Kasım 2026 · "feat(update): Play In-App Updates ile sessiz güncelleme" |
| Commit edilmemiş | **yok** (bu docs commit'i hariç) |
| `npm run i18n:check` | 11 dil, **hata yok**; uyarılar aşağıda |
| `npx tsc --noEmit` | **4 hata** (hepsi bilinen/zararsız, aşağıda) |
| `src/App.tsx` | **2440 satır** |
| Tema sayısı | **16** (`THEMES`, App.tsx) |
| Widget sayısı | **4** (Arc, Clock, Analog, Grid) |

### 2.3 Bilinen hatalar / uyarılar (gerçek)

**TypeScript (4):**
1. `server.ts(1)` — `express` yok (AI Studio şablonu; üretimde kullanılmıyor).
2. `server.ts(5)` — `@google/genai` yok.
3. `server.ts(6)` — `dotenv` yok.
4. `src/utils/notificationHelper.ts(711)` — `LocalNotificationsPlugin.pending` tipi yok
   (plugin sürümüyle ilgili; çalışma zamanında `pending()` zaten güvenilmez, bkz. §7).

**i18n uyarıları (`i18n:check`):**
- `de`: 28 eksik mesaj anahtarı + 5 fazla anahtar (`country`, `timezone`, `searching`, `adFreeTag`, `months`).
- `ur`: 29 eksik mesaj anahtarı + 4 fazla anahtar (`country`, `timezone`, `searching`, `months`).
- Kıble anahtarları **11 dilde tam** (18 Kasım 2026'da eski `qiblaTurn*`/`qiblaBehind` kaldırıldı,
  yerine `qiblaHoldFlat`, `qiblaAhead`, `qiblaMagnetic`, `qiblaCalibrate`, `qiblaCalibrateHow` geldi;
  20 Kasım 2026'da kart başlığı için `qiblaTitle` + `qiblaSubtitle` eklendi).
- `ja.in`: boş metin (bilinçli olabilir).
- `strict` modda bunlar hata sayılır: `npm run i18n:check:strict`.

**Diğer:**
- `native.json` yalnızca **6 dil** içerir (tr, en, de, ar, ur, fa). `es, fr, pt, ru, ja` Android
  uygulama/widget etiketlerinde İngilizceye düşer.
- `README.md` hâlâ AI Studio şablonu; proje README'si değil.
- `package.json` sürümü `1.0.2`; Android `versionName` ile ilişkisi yok (kafa karıştırabilir).
- Play Console'a `2026111200` yüklenip yüklenmediği bu makineden doğrulanamıyor (API kimliği yok).

---

## 3. Komutlar

```bash
# Web geliştirme
npm run dev              # Vite dev sunucusu
npm run build            # Üretim web build'i → dist/ (dist'i SİLER)
npm run preview          # Üretim build'ini önizle

# Kalite
npx tsc --noEmit         # 4 bilinen hata dışında temiz olmalı
npm run i18n:check       # Uyarı modu (hata yok)
npm run i18n:check:strict# Eksik anahtarlar da hata
npm run i18n:export <kod># docs/<kod>-ceviri-kontrol.txt (TSV) üretir

# Android (yerel, önerilen)
./build-local.sh debug   # İmzasız debug APK
./build-local.sh release # İmzalı APK + AAB
./build-local.sh all     # İkisi (release'i en son çalıştır!)

# Capacitor (manuel, gerekirse)
npx cap add android
npx cap sync android
npx cap open android
```

### Release build için zorunlu ortam değişkenleri

```bash
KEYSTORE_PATH=/home/Knight/Desktop/Play/keys/meccanen-namaz-upload.keystore \
KEYSTORE_PASSWORD=<parola> \
KEY_ALIAS=meccanen-namaz-upload \
KEY_PASSWORD=<parola> \
VERSION_CODE=2026111800 \
VERSION_NAME=2.3.2026111800 \
./build-local.sh release
```

- **Parola kaynağı:** `/home/Knight/Desktop/Play/keys/meccanen_namaz_release_secrets.txt`
  (`PAROLA:` satırı). **İçeriğini konuşmaya/komuta yazdırmayın.**
- **JDK:** `/home/Knight/.local/opt/jdk-17` (jlink şart; salt JRE çalışmaz).
- **SDK:** `/home/Knight/Android/Sdk` (platform 36, build-tools 36.0.0).
- Script bu yolları otomatik algılar; env vermeden `./build-local.sh debug` çalışır.

---

## 4. Mimari ve Dosya Haritası

```
Namazvakti/
├── src/
│   ├── App.tsx                  # ~2415 satır; ana ekran + SettingsPanel + modallerin tetikleyicileri
│   ├── main.tsx                 # React kök
│   ├── index.css                # Tailwind v4 + tema token'ları + --afs yazı boyutu + animasyonlar
│   ├── types.ts                 # Location vb.
│   ├── components/
│   │   ├── Onboarding.tsx
│   │   ├── TesbihModal.tsx
│   │   ├── ReligiousCalendarModal.tsx
│   │   └── AddLocationModal.tsx # + LocationManager
│   ├── services/
│   │   └── billingService.ts    # Play Billing sarmalayıcı (destekçi IAP)
│   ├── i18n/                    # ★ TEK çeviri kaynağı
│   │   ├── index.ts             # t(), isRTL(), getLocale(), getHijriMonths()...
│   │   ├── types.ts             # LocaleModule sözleşmesi
│   │   ├── native.json          # Android app/widget adları (6 dil)
│   │   ├── README.md            # "2 dakikada yeni dil"
│   │   └── locales/             # tr en de es fr pt ru ar ur ja fa + index.ts (registry)
│   └── utils/
│       ├── i18n.ts              # ince köprü → ../i18n/index.ts
│       ├── prayerHelper.ts      # Vakit hesabı + yöntemler (Diyanet/Karachi/MWL...)
│       ├── notificationHelper.ts# Bildirim planlama/iptal
│       ├── locationHelper.ts    # Konum izni/pozisyon/timezone
│       ├── qiblaHelper.ts       # Kıble yönü + pusula + native poll
│       ├── geomag.ts            # WMM-2025 manyetik sapma (çevrimdışı)
│       ├── nativeCompass.ts     # Native QiblaSensor köprüsü
│       ├── astronomyHelper.ts   # Ay fazı, güneş saatleri
│       ├── esmaHelper.ts        # Esma saati, gezegen/segment etiketleri
│       ├── esmaData.ts          # 101 Esmâ (yalnız Arapça yazılış/okunuş)
│       ├── religiousHelper.ts   # Dini Günler 2026-2027 (Hicri, umalqura)
│       ├── spaceHelper.ts, weatherHelper.ts, widgetBridge.ts, batteryHelper.ts
│       └── compass.png
├── native/widget/               # 4 Android widget kaynağı (build'de android/ içine kopyalanır)
│   ├── java/meccanen/namaz/vakti/v1/widgets/
│   │   ├── WidgetCore.java, WidgetPalettes.java, PrayerMath.java
│   │   ├── WidgetPayloadBuilder.java   # AlAdhan aylık payload (30 gün)
│   │   ├── WidgetSyncWorker.java       # günlük WorkManager işi
│   │   ├── WidgetRefreshReceiver.java  # boot/tarih/saat/dilim tazeleme
│   │   ├── PrayerArcWidgetProvider.java     # Vakit Halkası
│   │   ├── PrayerClockWidgetProvider.java   # Saat & Takvim
│   │   ├── PrayerAnalogWidgetProvider.java  # Analog Saat
│   │   └── PrayerGridWidgetProvider.java    # Vakit Kartları
│   └── res/layout|xml|values{,-tr,-de,-ar,-ur,-fa}|drawable*
├── scripts/
│   ├── i18n-check.mjs, i18n-export.mjs
│   └── local-build/
│       ├── patch_notif.py          # Local Notifications yamaları
│       ├── add_battery_plugin.py   # MIUI batarya/bildirim plugin'i
│       ├── add_qibla_plugin.py     # QiblaSensor (ham manyetometre) plugin'i
│       ├── add_widgets.py          # Widget native kaynak + manifest + WidgetBridge
│       ├── add_perms.py            # İzinler
│       ├── make_icons.py           # Uygulama ikonları (Pillow)
│       └── make_widget_previews.py # Widget önizleme PNG'leri (Pillow)
├── local-plugins/capacitor-play-billing/  # Yerel IAP eklentisi
├── assets/                      # meccanen-logo*.png, notification_icon/, sounds/*.mp3
├── docs/                        # growth-roadmap, notification-findings, privacy, fa kontrol listesi
├── apk/                         # KALICI APK/AAB yedeği
├── dist/                        # Vite webDir + build çıktısı (GEÇİCİ)
├── build-local.sh               # Yerel Android build
├── capacitor.config.json        # appId, webDir=dist, androidScheme=https
└── server.ts                    # AI Studio şablonu (kullanılmıyor)
```

### Uygulama özellikleri (kodda mevcut)

- Ana ekran: canlı saat, sıradaki vakit + geri sayım, günün 6 vakti, kerahat aralıkları.
- Miladi / Hicri / ay fazı üç sütunlu hero kartı.
- Kıble pusulası (native manyetometre + WMM-2025 sapma + kilit animasyonu).
- Esma saati bölümü (101 Esmâ).
- Tesbih sayacı (`TesbihModal`).
- Dini günler takvimi 2026-2027 (`ReligiousCalendarModal`).
- Bildirimler: vakit öncesi hatırlatıcı, vakit girişi, "şu an X vakti" durum bildirimi.
- 4 Android widget + widget senkronu (`widgetBridge.ts`).
- Konum yönetimi: otomatik konum + kayıtlı konumlar.
- 16 tema, Aa yazı boyutu sistemi (`--afs`).
- Destekçi IAP: `destekci_2_99`, `destekci_4_99` (`billingService.ts`).
- "Meccanen" sekmesi: kardeş uygulamalar (Habit Tracker, Hava Durumu) tanıtımı.
- 11 dil, RTL desteği, cihaz dili algılama.

---

## 5. Değişmez Kurallar (ihlal = sessiz/geç fark edilen hata)

1. **`versionCode` 10 hane:** `YYYYMMDDCC` (CC = gün içi sayaç). Kısa yazım (8 hane) sayısal
   olarak daha küçüktür ve Play "existing users cannot upgrade" hatası verir.
   Her sürümde önce **Play'deki en yüksek versionCode'u oku**, sonra tarih+sayaç ver.
2. **`dist/` = Vite webDir.** Her `npm run build` `dist/`'i temizler. Release çıktısını hemen
   `apk/`'ya kopyala; release build'ini en son çalıştır.
3. **AAB imzası:** Asla doğrudan `./gradlew bundleRelease` çalıştırma (imzasız AAB üretir).
   Her zaman `./build-local.sh release` kullan (injected signing).
4. **i18n tek kaynak:** Metinler yalnızca `src/i18n/locales/*.ts` içinde. Başka dosyaya dil
   haritası ekleme. Yeni anahtar önce `en.ts`, sonra diğerleri; `npm run i18n:check`.
5. **RTL:** Sayısal saat/geri sayım bloklarına `dir="ltr"`. Genişlik ölçümlerinde
   `first.left`/`last.right` varsayımı RTL'de ters çalışır; `min(left)`/`max(right)` kullan.
6. **Tarih:** `fa-IR` gibi yerellerde varsayılan takvim Gregoryen değildir. Miladi tarih gösteren
   her `Intl`/`toLocaleDateString` çağrısına `calendar: "gregory"` ekle. Hicri alanlar zaten
   `en-u-ca-islamic-umalqura` + `getHijriMonths()` ile üretilir.
7. **Bildirim ID'leri:** Tüm sistemde benzersiz olmalı. Aynı ID'ye ikinci alarm ilkini **sessizce
   iptal eder**. ID aralıklarını tek kaynakta tut ve yorumla (bkz. §7).
8. **Büyük bildirim batch'i:** 70+ bildirimi tek `schedule()` ile gönderme; 5'erlik parçala +
   8 sn timeout. Bazı cihazlarda sessizce kaybolur.
9. **Kesin alarm izni:** Android 13+ varsayılan kapalıdır. Kullanıcıyı bildirimleri açtığı anda
   `openExactAlarmSettings()` ile yönlendir; gece bildirimleri aksi halde Doze'da gecikir.
10. **Java/plugin üretimi:** `android/` geçicidir; build sonunda silinir. Native değişiklikleri
    `native/widget/` ve `scripts/local-build/*.py` üzerinden yap; `android/` içinde bırakma.
11. **Keystore parolası** dosyaya/dosyaya yazılmaz; build'de env olarak verilir. Secrets
    dosyasının içeriğini konuşmaya yazdırma.
12. **`/tmp/opencode/*`** oturum sıfırlanınca silinir (cdp.py, JDK/SDK symlink'leri, keep/).
    Kalıcı olması gerekenleri proje içine koy.

---

## 6. Build & Release Akışı

### 6.1 Yerel build (`build-local.sh`)

Sırasıyla yapar:
1. `npm run build` (Vite → `dist/`)
2. `android/` oluşturur: `rm -rf android && npx cap add android && npx cap sync android`
3. `patch_notif.py` — Local Notifications `cancelPreviousId` + `timeoutAfter` yamaları
4. `src/i18n/native.json` → `values-*/strings.xml` (app + 4 widget adı) + manifest label
5. `add_battery_plugin.py` — MIUI bildirim fix plugin'i
6. `add_qibla_plugin.py` — `QiblaSensorPlugin.java` + MainActivity kaydı
7. `add_widgets.py` — widget Java/res/manifest + `WidgetBridgePlugin`
8. Gradle heap: `-Xmx2560m -XX:MaxMetaspaceSize=512m` (D8/R8 OOM önlemi)
9. `variables.gradle`: minSdk 24, compile/target 36
10. Ezan sesleri + bildirim ikonları + izinler
11. versionCode/versionName → `android/app/build.gradle`
12. Uygulama ikonları (`make_icons.py`)
13. `assembleDebug` ve/veya `assembleRelease + bundleRelease` (imzalı)
14. Çıktıları `dist/`'e kopyalar; `android/`'i siler

### 6.2 Uzun build kuralı

Komut 120 sn'de kesilebilir. Arka planda çalıştır ve log'u poll et:

```bash
setsid bash -c 'env JAVA_HOME=/home/Knight/.local/opt/jdk-17 \
  ANDROID_HOME=/home/Knight/Android/Sdk \
  VERSION_CODE=2026111800 VERSION_NAME=2.3.2026111800 \
  KEYSTORE_PATH=... KEYSTORE_PASSWORD=... KEY_ALIAS=... KEY_PASSWORD=... \
  ./build-local.sh release > /tmp/opencode/rel.log 2>&1' \
  </dev/null >/dev/null 2>&1 & disown
sleep 100; tail -8 /tmp/opencode/rel.log
```

### 6.3 Release doğrulama (atlanmaz)

```bash
# AAB imzası
/home/Knight/.local/opt/jdk-17/bin/jarsigner -verify \
  dist/meccanen-release-v<VER>.aab          # → exit 0

# Sertifika
/home/Knight/.local/opt/jdk-17/bin/keytool -printcert -jarfile \
  dist/meccanen-release-v<VER>.aab          # SHA-256 A9:6E:58:...

# APK imzası + sürüm
/home/Knight/Android/Sdk/build-tools/36.0.0/apksigner verify -v \
  dist/meccanen-release-v<VER>.apk          # v2 true
/home/Knight/Android/Sdk/build-tools/36.0.0/aapt2 dump badging \
  dist/meccanen-release-v<VER>.apk | head -3

# Kalıcı yedek
cp dist/meccanen-release-v<VER>.{aab,apk} apk/
```

### 6.4 Release sırası

1. Play'deki en yüksek versionCode'u kontrol et.
2. İçerik değişikliğini yap + `npx tsc --noEmit` + `npm run i18n:check`.
3. `VERSION_CODE`/`VERSION_NAME` ver → `./build-local.sh release`.
4. İmzayı doğrula (§6.3).
5. AAB/APK'yı `apk/`'ya kopyala.
6. Play Console'a **manuel** yükle (bu makinede Play Developer API kimliği yok).

---

## 7. Bildirim Sistemi — Doğrulanmış Tuzaklar

Kaynak: `docs/notification-system-findings.md` (Eylül 2026, cihazda doğrulanmış).

- **Aynı ID = sessiz iptal.** Anlık "şu an" bildirimi ile vakit geçiş zinciri aynı ID'yi
  kullanırsa plugin öncekini iptal eder, hata dönmez. Anlık bildirim için ayrı taban kullan
  (`IMMEDIATE_ID_BASE`, ör. 8300; hatırlatıcılar ≤6012, geçişler ≥9000).
- **Zamanlamasız push çalışmıyor.** `at: new Date(Date.now() + 2000)` + `allowWhileIdle: true`
  kullan. Anlık bildirimi **ilk ve tek çağrıda** planla; büyük listede `at` geçmişe düşerse
  plugin sessizce atar.
- **Dev batch (70+) başarısız olabilir.** 5'erlik parçala, her parçaya 8 sn `Promise.race`
  timeout koy, hataları izole et.
- **`pending()` güvenilmez.** SharedPreferences defterinden okur, AlarmManager'den değil.
  "pending=0" alarm yok demek değildir. Gerçek kanıt: test bildiriminin gelmesi.
- **Kesin alarm izni** Android 13+ kapalıdır. `canScheduleExactAlarms()` /
  `openExactAlarmSettings()` (API 31+). Bildirimler etkinleştirildiği **anda** sor.
- **`allowWhileIdle: true`** her planlama türünde kullanılır.
- Kanal adı verilmezse Android kanala son bildirim başlığına benzer ad verir; `channelName`
  açıkça ver.
- Teşhis yaklaşımı: uygulama içi "Test bildirimi gönder" + "Son planlama" satırı; console.log'a
  güvenme (WebView'da kullanıcı göremez).

---

## 8. Kıble Pusulası — Mimari ve Sınırlar

- **Sorun:** OS `rotation-vector` füzyonu bu cihazda (MTK + QMC6308) yaw'ı ~183° kaydırıyordu;
  formül değil sensör bozuktu.
- **Kart tasarımı (18 Kasım 2026):** tek bakışta okunur — başlık + halka + tek büyük ok.
  "Göster" butonu, "pusula açık" etiketi, derece metni ve Kâbe ikonu **yok**; pusula uygulama
  açılır açılmaz çalışır. Uygulama arka plana atılınca dinleyiciler bırakılır (native poll
  250 ms), öne gelince yeniden bağlanır (`visibilitychange`).
- **Başlık şeridi (20 Kasım 2026):** eski başlık tek kelime "Kıble" ve 16–18 px gri olduğu için
  belirsiz kalıyordu. Yerine temanın vurgu renginde yuvarlak köşeli bir şerit geldi. Renk
  `currentColor` ile boyanır (`bg-current/10 border-current/25` + `tTheme.accent`) → 16 temanın
  hepsinde uyumlu; şerit yalnızca vurgu, başlık `tTheme.textPrimary`. İçerik: pusula ikonu +
  `qiblaTitle` (büyük, `text-xl sm:text-2xl` extrabold) + sağda `qiblaSubtitle` altyazısı.
  İki anahtar da 11 dilde; uzun dillerde (de: "Gebetsrichtung") `flex-wrap` ile alt satıra kayar.
  Pusula, ok ve kalite mantığı **değişmedi**.
- **Ok:** göbekten çıkan gövde + ok başı (`rect x=94 y=50 w=12 h=44 rx=4`,
  `polygon 100,10 119,58 100,48 81,58`). `needle = qiblaDir − declination − compassHeading`.
- **Kilit:** `QIBLA_LOCK_DEG = 5°`; halka kalınlaşıp yeşile döner, `navigator.vibrate(60)`,
  "Kâbe tam önünde ✓" yalnızca kilitliyken.
- **Katmanlar:** native `QiblaSensor` (ham mag + acc; `getHeading()` →
  `{ ok, heading, total, horizontal, accuracy }`) → referans sıçraması reddi (mutlak − göreli
  farkı) → WMM-2025 sapma (`geomag.ts`) → hibrit eksen (düz tutuşta +y, dik tutuşta −z).
- **Kalite sinyalleri** (`attachCompassListener(cb, onQuality, { expectedFieldUt, expectedHorizontalUt })`):
  1. **Manyetik girişim** — beklenen alan konuma göre `magneticFieldHorizontal()` /
     `magneticFieldIntensity()` ile hesaplanır (mutlak μT eşiği global uygulamada yanlış:
     Brezilya'da 23 μT, Almanya'da 50 μT normal). Ölçüt önce **yatay** bileşen (yönü bozan
     büyüklük), yoksa toplam. Giriş %40 (yatay) / %38 (toplam), çıkış %28 / %25 — histerezisli;
     ~1,2 s medyan (5 örnek). Ok %28 opaklığa iner, amber "Manyetik girişim" satırı çıkar,
     kilit devre dışı. Leipzig'de beklenen: 19,3 μT yatay / 49,8 μT toplam; temiz alanda ölçülen
     18,9 / 47,5; laptop yanında ölçülen 31,7 / 64,5 (uyarı doğru tetiklenir).
  2. **Kalibrasyon** — `SensorEvent.accuracy ≤ 1` (güvenilmez/düşük); 5 kötü örnek (~1,25 s)
     uyarıyı açar, 3 iyi örnek (~0,75 s) kapatır. Ok %50 opaklık, "8 çiz" notu vurgulanır.
- **"8 çiz" notu** — **yalnızca sensör kalibrasyon istediğinde** (`accuracy ≤ 1`) görünür;
  kalibrasyon tek seferlik bir iş olduğu için sürekli göstermek kullanıcıyı "her açılışta
  yapmam gerek" diye yanıltıyordu (18 Kasım 2026 kararı). Göründüğünde yaşlı kullanıcı için
  büyük: ∞ çizimi 112–128 px, başlık 18–20 px, metin 16–18 px. Nokta `animateMotion` +
  `mpath` ile 8'in üzerinde döner. Girişim uyarısı varken not gizlenir (önce metal uzaklaşmalı).
  Metinler: `qiblaCalibrate` / `qiblaCalibrateHow` (11 dilde).
- **Sabitler (`qiblaHelper.ts`):** `MAX_REF_JUMP=12°`, `NATIVE_FLIP=100°`, `NATIVE_STABLE=12°`,
  `NATIVE_DRIFT_GAIN=0.05`, EMA 0,18 s, `HORIZ_TOLERANCE=0.40` / `HORIZ_RELEASE=0.28`,
  `FIELD_TOLERANCE=0.38` / `FIELD_RELEASE=0.25`, yedek mutlak aralık 30–62 μT.
- **Bilinen sınırlar:**
  - Düz yatıkken 180° çevirme sensörle ayırt edilemez (ivmeölçer yaw görmez).
  - Girişimde ham referans beslenmez; jiro akışı devam eder (yavaş kayma) — ok bu yüzden soluk.
  - `accuracy` birçok cihazda hep 3 (yüksek) raporlanır; o cihazlarda not hiç görünmez.
    Sensör gerçeğe aykırı raporluyorsa kullanıcıya ulaşmanın yolu yok (kabul edilen sınır;
    istenirse ileride "Kıble" başlığına dokununca notu açan sessiz bir yol eklenebilir).
  - `prefers-reduced-motion` desteği yok (kilit nabzı + 8 çizimi her zaman animasyonlu).
  - Eşikler Leipzig'de ölçülen değerlerle kalibre edildi; farklı enlemlerde saha testi gerekir.

---

## 9. Widget Sistemi

- **4 widget:** Vakit Halkası (3×3), Saat & Takvim (4×4), Analog Saat (4×4), Vakit Kartları (4×2).
- **Veri zinciri:** JS `widgetBridge.ts` → SharedPreferences → `WidgetCore`; `WidgetSyncWorker`
  günde bir AlAdhan'dan 30 günlük payload çeker (`WidgetPayloadBuilder`); ağ yoksa `PrayerMath`
  ile çevrimdışı hesap. `WidgetRefreshReceiver` boot/tarih/saat dilimi/`MY_PACKAGE_REPLACED`'te tazeler.
- **Canlı saat:** `WidgetCore` dakikalık exact alarm kurar. Analog widget'ta saniye ibresi 60 kareli
  `ViewFlipper` (`autoStart`, `flipInterval=1000`) ile akar; uygulama her saniye uyanmaz.
- **Kaynak:** `native/widget/` — build'de `add_widgets.py` ile `android/` içine kopyalanır.
- **Önizleme PNG'leri:** `scripts/local-build/make_widget_previews.py` (Pillow) →
  `res/drawable-nodpi/` (en) ve `res/drawable-tr-nodpi/` (tr).
- **Diller:** widget `values` yalnız 6 dilde (en, tr, de, ar, ur, fa); diğerleri İngilizceye düşer.
- **Uzun ad kısaltmaları:** `PrayerArcWidgetProvider.widgetName()` (de `Sonnenaufgang → Aufgang`,
  ur `طلوع آفتاب → طلوع`).

> Widget değişikliğinde `scripts/local-build/add_widgets.py` kopyalama listesini ve manifest
> receiver kayıtlarını güncellediğinden emin ol; `android/` içinde değişiklik yapma.

---

## 10. i18n Sistemi

- **Kayıt defteri:** `src/i18n/locales/index.ts` — sıra dil menüsüdür; `LangCode` buradan türetilir.
  Başka yerde dil listesi tutulmaz.
- **API:** `t(key, lang, vars?)`, `isRTL`, `getLocale`, `getNotificationText`,
  `getPrayerMethodText`, `getEsmaMeaning`, `getEsmaLabel`, `getHijriMonths`, `detectLanguage`.
  Fallback: **dil → en → tr → anahtar**.
- **Bildirim metinleri:** `prayer_*` anahtarı `notifications` bölümünde yoksa aynı dilin
  `messages` bölümüne düşer (namaz adları tek kaynak).
- **Opsiyonel bölümler:** `hijriMonths`, `prayerMethods`, `notifications`, `esma`, `esmaLabels`.
  Eksikse İngilizceye düşer; "eksik" sanıp kopyalamak gereksiz.
- **Yeni dil (≈2 dk):**
  1. `src/i18n/locales/<kod>.ts` oluştur.
  2. `locales/index.ts`'e import + registry satırı.
  3. (Ops.) `src/i18n/native.json`'a app/widget adları.
  4. `npm run i18n:check` + `npm run i18n:export <kod>`.
- **Yeni metin:** önce `en.ts`, sonra diğer diller. Yer tutucular (`{ad}`) korunmalı.
- **Kalıcılık:** `localStorage["mnv_lang"]`; `document.documentElement.lang/dir` runtime'da güncellenir.

---

## 11. Test ve Doğrulama

### 11.1 Web

```bash
npm run dev
npx tsc --noEmit
npm run i18n:check
```

### 11.2 Android cihaz (adb)

```bash
adb install -r apk/meccanen-debug-v<VER>.apk
adb shell am force-stop meccanen.namaz.vakti.v1
adb shell am start -n meccanen.namaz.vakti.v1/.MainActivity
adb exec-out screencap -p > /tmp/opencode/ss.png
adb shell input tap X Y
adb logcat -d -s Capacitor/Console
```

### 11.3 CDP (yalnız debug build)

> **Release build'de WebView debugging KAPALIDIR.** Görsel/işlevsel doğrulama için debug build gerekir.

```bash
adb shell monkey -p meccanen.namaz.vakti.v1 -c android.intent.category.LAUNCHER 1
PID=$(adb shell pidof meccanen.namaz.vakti.v1 | tr -d '\r')
adb forward --remove-all
adb forward tcp:9222 localabstract:webview_devtools_remote_$PID
curl -s http://localhost:9222/json    # webSocketDebuggerUrl
```

- Yardımcı script `/tmp/opencode/cdp.py` oturum sıfırlanınca silinir; `Ozet.md` §6'da içeriği var.
- Onboarding'i atlamak için:
  ```js
  localStorage.setItem("mnv_onboarded_v1","1");
  localStorage.setItem("mnv_location_prompted","true");
  localStorage.setItem("mnv_xiaomi_hint_dismissed","1");
  localStorage.setItem("mnv_exact_alarm_prompted","1");
  localStorage.setItem("mnv_lang","tr"); location.reload();
  ```
- "Meccanen" sekmesi: ana ekrandaki **MECCANEN** başlık butonu →
  `setSettingsInitialTab("meccanen"); setSettingsOpen(true)`.

### 11.4 localStorage anahtarları (kodda doğrulanmış)

| Anahtar | İşlev |
|---|---|
| `mnv_lang` | Seçili dil |
| `mnv_theme` | Tema |
| `mnv_font_scale` | Yazı boyutu (`--afs`) |
| `mnv_location` / `mnv_saved_locations` | Konum(lar) |
| `mnv_prayer_method` | Hesap yöntemi |
| `mnv_onboarded_v1` | Onboarding tamamlandı |
| `mnv_location_prompted` | Konum izni soruldu |
| `mnv_auto_location` | Otomatik konum |
| `mnv_xiaomi_hint_dismissed` | MIUI uyarısı kapatıldı |
| `mnv_exact_alarm_prompted` | Kesin alarm izni soruldu |
| `mnv_battery_prompted` | Pil optimizasyonu istemi gösterildi |
| `meccanen_is_supporter` | Destekçi durumu önbelleği (`billingService.ts`) |

---

## 12. Görev → Dokunulacak Dosya

| Yapmak istediğin | Dosya(lar) |
|---|---|
| Ana ekran / kart düzeni | `src/App.tsx` |
| Tema / renk | `src/App.tsx` (`THEMES`, `KERAHAT_COLORS`), `src/index.css` |
| Yeni metin / çeviri | `src/i18n/locales/*.ts`, gerekirse `src/i18n/native.json` |
| Vakit hesabı / yöntem | `src/utils/prayerHelper.ts` |
| Bildirim | `src/utils/notificationHelper.ts`, `scripts/local-build/patch_notif.py` |
| Kıble | `src/utils/qiblaHelper.ts`, `geomag.ts`, `nativeCompass.ts`, `scripts/local-build/add_qibla_plugin.py`, App.tsx kıble kartı |
| Widget | `native/widget/**`, `src/utils/widgetBridge.ts`, `scripts/local-build/add_widgets.py` |
| Konum | `src/utils/locationHelper.ts`, `src/components/AddLocationModal.tsx` |
| Dini günler | `src/utils/religiousHelper.ts`, `src/components/ReligiousCalendarModal.tsx` |
| Tesbih | `src/components/TesbihModal.tsx` |
| Destekçi IAP | `src/services/billingService.ts`, `local-plugins/capacitor-play-billing/` |
| Build / imza | `build-local.sh`, `scripts/local-build/*` |
| Growth / ASO / Ramazan | `docs/growth-roadmap.md` |

---

## 13. Teknik Borç / Yapılacaklar (öncelik sırası)

1. **`2026112000`'ü Play Console'a yükle** — AAB `apk/meccanen-release-v2.3.2026112000.aab`
   (imza doğrulandı, versionCode `2026112000`). Play'deki en yüksekten büyük olduğundan emin ol;
   daha yüksek bir sürüm yayınlandıysa yeni versionCode ile yeniden derle.
2. **Uygulama içi güncellemeyi gerçek cihazda doğrula** — internal testing track'e yükle, Play'den
   kur, güncelleme akışını gör (§16). Yerel APK ile test edilemez.
3. **Cihaz testi bekleyen kıble değişiklikleri** — 20 Kasım'da telefonda test edilemedi
   (cihaz bağlı değildi): girişim uyarısı (yatay eşik) ve kalibrasyon notu görünürlüğü.
4. **i18n eksiklerini kapat:** `de` 28, `ur` 29 eksik anahtar; fazla anahtarları temizle.
5. **`native.json`'a es/fr/pt/ru/ja ekle** (Android etiketleri İngilizce kalmasın).
6. **`server.ts` temizliği** — kullanılmıyorsa sil veya `express`/`@google/genai`/`dotenv`
   bağımlılıklarını ekle; TS hatalarını sıfırla.
7. **`notificationHelper.ts` `pending` tip hatası** — plugin tip tanımı veya `as any` ile düzelt.
8. **README'yi güncelle** — AI Studio şablonu yerine gerçek proje README'si.
9. **`Ozet.md` §8'i güncelle** — 11 Kasım'da kalmış; güncel özet başlıkta ve §5A'da.
10. **Kıble:** `prefers-reduced-motion`, kilit titreşimi, kalan dillere çeviri.
11. **Ramazan 1448 hazırlığı** — Ocak 2027 başında başlamalı (imsakiye, sahur/iftar bildirimi,
    fitre, tema). Bkz. `docs/growth-roadmap.md`.

---

## 14. Güvenlik

- **Keystore:** `/home/Knight/Desktop/Play/keys/meccanen-namaz-upload.keystore` (PKCS12),
  alias `meccanen-namaz-upload`.
- **Parola:** `/home/Knight/Desktop/Play/keys/meccanen_namaz_release_secrets.txt` içindeki
  `PAROLA:` satırı. Dosyaya/AGENTS.md'ye yazma; komuta echo etme; konuşmaya yansıtma.
- **12 Kasım 2026 olayı:** Anahtar klasörü listelenirken maskeleme hatası nedeniyle
  `meccanen_namaz_release_secrets.txt` ve `havadurumu_release_secrets.txt` içeriği konuşmaya
  yansıdı. Öneri: Hava Durumu upload anahtarını rotate et; bu konuşmayı paylaşma. Namaz
  uygulamasının Play App Signing anahtarı etkilenmez.
- **Play App Signing** kullanılıyor; upload key gerekirse Play Console'dan sıfırlanabilir.
- `.gitignore` yalnızca `node_modules/` ve `dist/` içerir; `apk/` ve `dist/` dikkat.

---

## 15. Hızlı Kontrol Listesi (her oturum başı)

```text
[ ] git status — commit edilmemiş değişiklik var mı?
[ ] En son build hangi sürüm? dist/ ve apk/ tutarlı mı?
[ ] Play'deki en yüksek versionCode nedir? (yeni sürüm için)
[ ] npx tsc --noEmit — 4 bilinen hata dışında yeni hata var mı?
[ ] npm run i18n:check — yeni eksik/fazla anahtar var mı?
[ ] Değişiklik native/widget veya scripts/local-build'e mi ait? android/ içinde bırakma.
[ ] Release çıktısını apk/ klasörüne kopyaladın mı?
[ ] Uygulama içi güncelleme değiştiyse: plugin major'ı Capacitor sürümüyle uyumlu mu? (§16)
```

---

## 16. Uygulama İçi Güncelleme (Play In-App Updates)

- **Amaç:** Yeni sürüm Play'de yayınlandığında kullanıcıyı uygulamadan çıkmadan, sessizce
  güncellemek; yaşlı kullanıcıyı dürtmeden.
- **Paket:** `@capawesome/capacitor-app-update@^6.1.0` — Capacitor **6** ile uyumlu olan sürüm.
  Capacitor yükseltilmeden plugin 7/8'e **çıkılmaz** (peer dep `@capacitor/core >= 7/8`).
  Play Core bağımlılığı (`com.google.android.play:app-update:2.1.0`) plugin modülünden gelir;
  `build-local.sh` yeniden ürettiği için ayrıca `android/` yaması **gerekmez**.
- **Akış** (`src/utils/appUpdate.ts` → `watchAppUpdate()`):
  1. Açılıştan **6 sn sonra** `getAppUpdateInfo()` (onboarding/konum/pil pencereleriyle çakışmasın).
  2. `installStatus === DOWNLOADED` ise (önceki oturumda inmiş) doğrudan satır gösterilir.
  3. `updateAvailability === UPDATE_AVAILABLE` **ve** `flexibleUpdateAllowed` **ve**
     `clientVersionStalenessDays >= 3` ise `startFlexibleUpdate()` çağrılır.
     Play kendi onay penceresini gösterir (Play Core kuralı: indirme onayı kullanıcıdan alınır).
  4. İndirme arka planda sürer; `onFlexibleUpdateStateChange` → `DOWNLOADED` olunca
     arayüzde tek satır: `updateReady` + düğme `updateRestart` → `restartForUpdate()`
     (`completeFlexibleUpdate()` uygulamayı yeni sürümle başlatır).
- **3 gün kuralı (`STALE_DAYS = 3`):** taze yayında kullanıcıyı dürtmemek için bilinçli.
  Kritik sürüm gerekiyorsa Play Console'da *in-app update priority* ile ayrıca ele alınır
  (şu an yalnızca flexible akış kodlu; `performImmediateUpdate()` **kullanılmıyor**).
- **Arayüz:** Header'ın hemen altında, `max-w-2xl` kapsayıcı içinde; `updateReady` false ise
  hiçbir şey çizilmez (sade kart kuralı korunur). Yer: `src/App.tsx` (`updateReady` state +
  `Download` ikonu).
- **Bilinen sınırlar:**
  - Yalnızca **Play'den kurulan** uygulamada çalışır; elle kurulan APK'da/web'de `try/catch`
    ile sessizce devre dışı kalır (test bu yüzden yerel APK ile yapılamaz).
  - Play'de daha yüksek `versionCode` yayınlanmış olması gerekir; kademeli yayında görünmesi
    saatler sürebilir. Test: Play **internal testing** track + Play'den kurulum.
  - `clientVersionStalenessDays` ilk gün 0 olduğu için taze yayında akış hemen tetiklenmez.
  - Play zaten varsayılan olarak otomatik günceller; bu akış otomatik güncellemeyi kapatmış
    veya güncellemesi bekleyen kullanıcılar içindir.

---

*Bu dosya tek bağlam kaynağıdır: `AGENTS.md`. Yeni bir bilgi eklerken başka bir ajan dosyası
açmayın, buraya ekleyin (ajanlar `AGENTS.md` adını otomatik okur).*
