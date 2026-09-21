#!/usr/bin/env bash
# Meccanen — yerel Android build aracı (GitHub Actions kotasına gerek kalmadan)
#
# Kullanım:
#   ./build-local.sh debug       # debug APK (test için, imza gerekmez)
#   ./build-local.sh release     # imzalı AAB (Play Store kapalı test / sürüm)
#   ./build-local.sh all         # ikisi birden
#
# Release için ZORUNLU ortam değişkenleri:
#   KEYSTORE_PATH       keystore dosya yolu
#   KEYSTORE_PASSWORD   store parolası
#   KEY_ALIAS           anahtar adı
#   KEY_PASSWORD        key parolası
#
# İsteğe bağlı değişkenler (varsayılanlar parantez içinde):
#   ANDROID_HOME        (/tmp/opencode/sdk)
#   JAVA_HOME           (/tmp/opencode/jdk17)
#   VERSION_CODE        (bugünün tarihi: YYYYMMDD)
#   VERSION_NAME        (2.3.$VERSION_CODE)
#
# Örnek:
#   KEYSTORE_PATH=/home/Knight/Desktop/meccanen-release.keystore \
#   KEYSTORE_PASSWORD=... KEY_ALIAS=... KEY_PASSWORD=... \
#   ./build-local.sh release
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPT_DIR="$ROOT/scripts/local-build"
cd "$ROOT"

MODE="${1:-debug}"
case "$MODE" in
  debug|release|all) ;;
  *) echo "HATA: bilinmeyen mod '$MODE' (debug|release|all)" >&2; exit 1 ;;
esac

JAVA_HOME="${JAVA_HOME:-/tmp/opencode/jdk17}"
ANDROID_HOME="${ANDROID_HOME:-/tmp/opencode/sdk}"
export JAVA_HOME ANDROID_HOME ANDROID_SDK_ROOT="$ANDROID_HOME"
export PATH="$JAVA_HOME/bin:$PATH"

VERSION_CODE="${VERSION_CODE:-$(date +%Y%m%d)}"
VERSION_NAME="${VERSION_NAME:-2.3.$VERSION_CODE}"
mkdir -p dist

echo ">>> Mod: $MODE | versionCode: $VERSION_CODE | versionName: $VERSION_NAME"

if [[ "$MODE" == "release" || "$MODE" == "all" ]]; then
  : "${KEYSTORE_PATH:?Release icin KEYSTORE_PATH ortam degiskeni gerekli}"
  : "${KEYSTORE_PASSWORD:?Release icin KEYSTORE_PASSWORD gerekli}"
  : "${KEY_ALIAS:?Release icin KEY_ALIAS gerekli}"
  : "${KEY_PASSWORD:?Release icin KEY_PASSWORD gerekli}"
  [[ -f "$KEYSTORE_PATH" ]] || { echo "HATA: keystore bulunamadi: $KEYSTORE_PATH" >&2; exit 1; }
fi

echo ">>> Web build (vite)"
npm run build

echo ">>> Capacitor Android projesi olusturuluyor"
rm -rf android
npx cap add android >/dev/null
npx cap sync android >/dev/null

echo ">>> Local Notifications yamalari (cancelPreviousId + timeoutAfter)"
python3 "$SCRIPT_DIR/patch_notif.py"

echo ">>> Yerlestirilmis uygulama adi (5 dil) + widget isimleri + manifest label"
python3 - << 'PY'
import os, re, xml.etree.ElementTree as ET
base = os.path.join(os.getcwd(), "android", "app", "src", "main", "res")
names = {"tr": "Meccanen Namaz Vakti", "en": "Meccanen Prayer Times", "de": "Meccanen Gebetszeiten", "ar": "Meccanen مواقيت الصلاة", "ur": "Meccanen اوقات نماز"}
# Widget isimleri — launcher ekleme ekraninda widget'lar ayristirilsin diye.
WIDGET_T = {"tr": "Vakitler", "en": "Prayer Times", "de": "Gebetszeiten", "ar": "مواقيت الصلاة", "ur": "اوقات نماز"}
WIDGET_A = {"tr": "Vakit Halkası", "en": "Prayer Circle", "de": "Gebetskreis", "ar": "دائرة الأوقات", "ur": "اوقات کا دائرہ"}
WIDGET_C = {"tr": "Saat & Takvim", "en": "Clock & Calendar", "de": "Uhr & Kalender", "ar": "الساعة والتقويم", "ur": "گھڑی اور کیلنڈر"}
ET.register_namespace("", "http://schemas.android.com/apk/res/android")
def write_values(loc, entries):
    d = os.path.join(base, f"values-{loc}" if loc else "values"); os.makedirs(d, exist_ok=True)
    p = os.path.join(d, "strings.xml"); root = None
    if os.path.exists(p):
        try: root = ET.parse(p).getroot()
        except Exception: root = None
    if root is None: root = ET.Element("resources", {"xmlns:android": "http://schemas.android.com/apk/res/android"})
    for k, v in entries.items():
        node = None
        for s in root.findall("string"):
            if s.get("name") == k: node = s; break
        if node is None: node = ET.SubElement(root, "string", {"name": k})
        node.text = v
    ET.ElementTree(root).write(p, encoding="utf-8", xml_declaration=True)
for loc in ("", "tr", "en", "de", "ar", "ur"):
    l = loc or "en"
    entries = {"app_name": names[l], "widget_times": WIDGET_T[l], "widget_arc": WIDGET_A[l], "widget_clock": WIDGET_C[l]}
    write_values(loc, entries)
mp = os.path.normpath(os.path.join(base, "..", "AndroidManifest.xml"))
xml_ = open(mp).read()
def set_label(tag):
    if 'android:label=' in tag: return re.sub(r'android:label="[^"]*"', 'android:label="@string/app_name"', tag)
    return tag.replace('>', ' android:label="@string/app_name">', 1)
xml_ = re.subn(r'<application\b[^>]*>', lambda m: set_label(m.group(0)), xml_, count=1)[0]
xml_ = re.subn(r'<activity\b[^>]*android:name="\.MainActivity"[^>]*>', lambda m: set_label(m.group(0)), xml_, count=1)[0]
open(mp, "w").write(xml_)
PY

echo ">>> BatteryHelper plugin (MIUI bildirim fix'i)"
python3 "$SCRIPT_DIR/add_battery_plugin.py"

echo ">>> Widget'lar (native kaynaklar + manifest + WidgetBridge)"
python3 "$SCRIPT_DIR/add_widgets.py"

echo ">>> variables.gradle (min 24 / compile-target 36)"
cat > android/variables.gradle << 'GRADLEEOF'
ext {
    minSdkVersion = 24
    compileSdkVersion = 36
    targetSdkVersion = 36
    androidxActivityVersion = '1.8.0'
    androidxAppCompatVersion = '1.6.1'
    androidxCoordinatorLayoutVersion = '1.2.0'
    androidxCoreVersion = '1.12.0'
    androidxFragmentVersion = '1.6.2'
    coreSplashScreenVersion = '1.0.1'
    androidxWebkitVersion = '1.9.0'
    junitVersion = '4.13.2'
    androidxJunitVersion = '1.1.5'
    androidxEspressoCoreVersion = '3.5.1'
    cordovaAndroidVersion = '10.1.1'
}
GRADLEEOF

echo ">>> Ezan sesleri + bildirim ikonlari + izinler"
mkdir -p android/app/src/main/res/raw
cp assets/sounds/ezan_imsak.mp3 assets/sounds/ezan_ogle.mp3 assets/sounds/ezan_ikindi.mp3 assets/sounds/ezan_aksam.mp3 assets/sounds/ezan_yatsi.mp3 android/app/src/main/res/raw/
for d in mdpi hdpi xhdpi xxhdpi xxxhdpi; do mkdir -p "android/app/src/main/res/drawable-$d"; done
cp assets/notification_icon/ic_stat_notify_mdpi.png android/app/src/main/res/drawable-mdpi/ic_stat_notify.png
cp assets/notification_icon/ic_stat_notify_hdpi.png android/app/src/main/res/drawable-hdpi/ic_stat_notify.png
cp assets/notification_icon/ic_stat_notify_xhdpi.png android/app/src/main/res/drawable-xhdpi/ic_stat_notify.png
cp assets/notification_icon/ic_stat_notify_xxhdpi.png android/app/src/main/res/drawable-xxhdpi/ic_stat_notify.png
cp assets/notification_icon/ic_stat_notify_xxxhdpi.png android/app/src/main/res/drawable-xxxhdpi/ic_stat_notify.png
python3 "$SCRIPT_DIR/add_perms.py"

echo ">>> Version kod"
sed -i "s/versionCode .*/versionCode $VERSION_CODE/" android/app/build.gradle
sed -i "s/versionName .*/versionName \"$VERSION_NAME\"/" android/app/build.gradle

echo ">>> Uygulama ikonlari (Pillow)"
python3 "$SCRIPT_DIR/make_icons.py"

echo "sdk.dir=$ANDROID_HOME" > android/local.properties
chmod +x android/gradlew

if [[ "$MODE" == "debug" || "$MODE" == "all" ]]; then
  echo ">>> assembleDebug"
  (cd android && ./gradlew assembleDebug)
  cp android/app/build/outputs/apk/debug/app-debug.apk "dist/meccanen-debug-v$VERSION_NAME.apk"
  echo ">>> DEBUG APK: dist/meccanen-debug-v$VERSION_NAME.apk"
fi

if [[ "$MODE" == "release" || "$MODE" == "all" ]]; then
  echo ">>> bundleRelease (imzali)"
  (cd android && ./gradlew bundleRelease \
    -Pandroid.injected.signing.store.file="$KEYSTORE_PATH" \
    -Pandroid.injected.signing.store.password="$KEYSTORE_PASSWORD" \
    -Pandroid.injected.signing.key.alias="$KEY_ALIAS" \
    -Pandroid.injected.signing.key.password="$KEY_PASSWORD")
  cp android/app/build/outputs/bundle/release/app-release.aab "dist/meccanen-release-v$VERSION_NAME.aab"
  echo ">>> RELEASE AAB: dist/meccanen-release-v$VERSION_NAME.aab"
fi

echo ">>> Temizlik (android/ üretim artigi)"
rm -rf android local-plugins/capacitor-play-billing/android/build
echo ">>> Tamamlandi."