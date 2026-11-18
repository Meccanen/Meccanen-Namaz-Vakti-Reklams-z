# Meccanen Namaz Vakti — Ajan Notları (AGENTS.md)

> **Bu dosya kısa giriş noktasıdır.** Tam bağlam, doğrulanmış durum ve tüm tuzaklar için
> **`ajan.md`** okunur (554 satır, 18 Kasım 2026). Çelişki olursa `ajan.md` + kod esastır.

## Proje

- Capacitor 6 + React 19 + Vite 6 + TS 5.8 + Tailwind v4 Android uygulaması.
- appId / Play: `meccanen.namaz.vakti.v1` · branch `main`
- Remote: `github.com/Meccanen/Meccanen-Namaz-Vakti-Reklams-z`
- 11 dil (tr, en, de, es, fr, pt, ru, ar, ur, ja, fa), ar/ur/fa RTL.
- Son sürüm: `2.3.2026111800` (versionCode `2026111800`), imzalı APK+AAB `apk/` ve `dist/` içinde.
- Son commit: `448a745` (docs) / `0cff035` (kıble çalışması).

## Değişmez kurallar

1. `versionCode` **10 hane** `YYYYMMDDCC` ve Play'deki en yüksekten büyük olmalı.
2. `dist/` hem Vite `webDir`'i hem build çıktı kopyasıdır; her `npm run build` **siler**.
   Release çıktısını hemen `apk/`'ya kopyala (`apk/` ve `dist/` gitignore'da, commit edilmez).
3. Release yalnızca `./build-local.sh release` ile; debug APK'nın imzası farklı, üzerine kurulamaz.
4. Keystore `Play/keys/meccanen-namaz-upload.keystore`, alias `meccanen-namaz-upload`.
   Parola `Play/keys/meccanen_namaz_release_secrets.txt` içinde (`PAROLA: ...`) — **yazdırma**.
5. `npx tsc --noEmit` 4 bilinen hata verir (server.ts ×3, notificationHelper `pending`) — yeni hata ekleme.
6. `npm run i18n:check` hata vermemeli; eksik çeviri uyarı modunda kalır.

## Kıble pusulası — 18 Kasım 2026'da yapılan değişiklikler (detay: `ajan.md` §8)

- **Kart sadeleşti:** "Göster" butonu, "pusula açık" etiketi, derece metni ve Kâbe ikonu kaldırıldı.
  Pusula açılışta çalışır; arka plana atılınca dinleyiciler bırakılır, öne gelince yeniden bağlanır.
- **Tek büyük ok** + halka; kilit 5° (`QIBLA_LOCK_DEG`), kilitte halka yeşil + 60 ms titreşim.
- **Manyetik girişim artık mutlak μT eşiği değil, konuma göre oransal:**
  - Beklenen alan WMM-2025'ten: `magneticFieldHorizontal()` (öncelikli) ve `magneticFieldIntensity()`.
  - Ölçüt önce alanın **yatay** bileşeni (yönü bozan büyüklük), yoksa toplam şiddet.
  - Giriş %40 (yatay) / %38 (toplam), çıkış %28 / %25 — histerezisli; ~1,2 s medyan (5 örnek).
  - Sebep: alan enleme göre 23–67 μT arasında değişiyor; tek sabit eşik global uygulamada yanlış.
  - Girişimde ok %28 opaklığa iner, amber "Manyetik girişim — telefonu metalden uzaklaştır" çıkar,
    kilit devre dışı, ham referans beslenmez.
- **Kalibrasyon ("8 çiz") notu yalnızca gerektiğinde:** `SensorEvent.accuracy ≤ 1` 5 kötü örnek
  (~1,25 s) boyunca sürerse kutu çıkar; 3 iyi örnek (~0,75 s) kapatır. Ok %50 opaklık.
  Not **sürekli gösterilmez** — kalibrasyon tek seferlik bir iştir, sürekli göstermek
  "her açılışta yapmam gerek" yanılgısı yaratıyordu.
- **Not yaşlı kullanıcı için büyük:** ∞ çizimi 112–128 px, başlık 18–20 px, metin 16–18 px,
  nokta `animateMotion` + `mpath` ile 8'in üzerinde döner. Metinler `qiblaCalibrate` /
  `qiblaCalibrateHow` (11 dilde).
- **Görünürlük önceliği:** girişim uyarısı > "yere paralel tut" > kalibrasyon notu. Üst üste binmez.
- **Dosyalar:** `src/utils/qiblaHelper.ts` (kalite mantığı + sabitler), `src/utils/nativeCompass.ts`
  (`nativeCompassSample()` → `{heading, total, horizontal, accuracy}`), `src/utils/geomag.ts`,
  `scripts/local-build/add_qibla_plugin.py` (`QiblaSensorPlugin.java` üreteci), `src/App.tsx` kıble kartı.
- **Bilinen sınır:** `accuracy` birçok cihazda hep 3 raporlanır; o cihazlarda not hiç görünmez
  (bu telefonda ölçülen: hep 3). Düz yatıkken 180° dönüş ivmeölçerle ayırt edilemez.

## Doğrulama (kısa)

```bash
npx tsc --noEmit && npm run i18n:check
VERSION_CODE=2026111800 VERSION_NAME=2.3.2026111800 ./build-local.sh debug
```

Cihazda (Nothing A015, `00100348D000503`): `adb install -r dist/meccanen-debug-*.apk`.
CDP ile ham sensör okuma (yalnız debug):

```bash
adb forward tcp:9222 localabstract:webview_devtools_remote_$(adb shell pidof meccanen.namaz.vakti.v1 | tr -d '\r')
# /tmp/opencode/cdp.py + eval10.js → {acc,total,horiz,h}
```

Leipzig referansı: yatay 19,3 μT / toplam 49,8 μT beklenir; temiz alanda 18,9 / 47,5 ölçüldü,
laptop yanında 31,7 / 64,5 (uyarı doğru tetiklenir).

## Sık kullanılan dosyalar

| Konu | Dosya |
|---|---|
| Kıble kartı, kalite state'leri | `src/App.tsx` |
| Pusula kalite mantığı, eşikler | `src/utils/qiblaHelper.ts` |
| Ham sensör köprüsü | `src/utils/nativeCompass.ts` |
| WMM-2025 sapma + alan şiddeti | `src/utils/geomag.ts` |
| Native plugin üreteci | `scripts/local-build/add_qibla_plugin.py` |
| Çeviriler (11 dil) | `src/i18n/locales/*.ts` |
| Tam bağlam / tuzaklar | `ajan.md` |