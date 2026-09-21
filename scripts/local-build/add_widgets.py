import json, os, shutil, glob
with open("capacitor.config.json") as f:
    cfg = json.load(f)
app_id = cfg["appId"]
pkg_path = app_id.replace(".", "/")
java_dir = f"android/app/src/main/java/{pkg_path}"
print(f">>> appId={app_id}, hedef={java_dir}")
if not os.path.isdir("native/widget/java"):
    raise SystemExit(">>> HATA: native/widget/java bulunamadı.")
for root, dirs, files in os.walk("native/widget/java"):
    for fn in files:
        if not fn.endswith(".java"):
            continue
        rel = os.path.relpath(os.path.join(root, fn), "native/widget/java")
        dest = os.path.join("android/app/src/main/java/", rel)
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        shutil.copy2(os.path.join(root, fn), dest)
        print(f">>> kopyalandı: {dest}")
for sub in ("layout", "xml", "drawable"):
    src = os.path.join("native/widget/res", sub)
    dest = os.path.join("android/app/src/main/res", sub)
    if not os.path.isdir(src):
        continue
    os.makedirs(dest, exist_ok=True)
    for fn in os.listdir(src):
        shutil.copy2(os.path.join(src, fn), os.path.join(dest, fn))
        print(f">>> res/{sub}: {fn}")
mp = "android/app/src/main/AndroidManifest.xml"
xml = open(mp).read()
if "RECEIVE_BOOT_COMPLETED" not in xml:
    xml = xml.replace("</manifest>", '    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />\n</manifest>')
    print(">>> RECEIVE_BOOT_COMPLETED izni eklendi.")
if "widgets.PrayerTimesWidgetProvider" not in xml:
    receivers = f'''
<receiver
                android:name="{app_id}.widgets.PrayerTimesWidgetProvider"
                android:exported="false"
                android:label="@string/widget_times">
                <intent-filter>
                    <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />
                </intent-filter>
                <meta-data android:name="android.appwidget.provider" android:resource="@xml/widget_pt_info" />
            </receiver>
            <receiver
                android:name="{app_id}.widgets.PrayerArcWidgetProvider"
                android:exported="false"
                android:label="@string/widget_arc">
                <intent-filter>
                    <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />
                </intent-filter>
                <meta-data android:name="android.appwidget.provider" android:resource="@xml/widget_arc_info" />
            </receiver>
    <receiver
        android:name="{app_id}.widgets.WidgetRefreshReceiver"
        android:exported="false">
        <intent-filter>
            <action android:name="{app_id}.widgets.REFRESH" />
        </intent-filter>
        <intent-filter>
            <action android:name="android.intent.action.BOOT_COMPLETED" />
            <action android:name="android.intent.action.DATE_CHANGED" />
            <action android:name="android.intent.action.TIME_SET" />
            <action android:name="android.intent.action.TIMEZONE_CHANGED" />
        </intent-filter>
    </receiver>'''
    xml = xml.replace("</application>", receivers + "\n    </application>")
    open(mp, "w").write(xml)
    print(">>> Widget receiver'ları manifest'e eklendi.")
else:
    print(">>> Widget receiver'ları zaten mevcut, dokunulmadı.")

if "widgets.PrayerClockWidgetProvider" in xml:
    print(">>> Saat widget receiver'i zaten mevcut, dokunulmadi.")
else:
    clock_rx = f'''
        <receiver
            android:name="{app_id}.widgets.PrayerClockWidgetProvider"
            android:exported="false"
            android:label="@string/widget_clock">
            <intent-filter>
                <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />
            </intent-filter>
            <meta-data android:name="android.appwidget.provider" android:resource="@xml/widget_clock_info" />
        </receiver>'''
    xml = xml.replace("</application>", clock_rx + "\n    </application>")
    open(mp, "w").write(xml)
    print(">>> Saat widget receiver'i manifest'e eklendi.")

main_matches = glob.glob("android/app/src/main/java/**/MainActivity.java", recursive=True)
main_path = main_matches[0]
content = open(main_path).read()
if "registerPlugin(WidgetBridgePlugin.class)" in content:
    print(">>> WidgetBridgePlugin zaten kayıtlı, dokunulmadı.")
else:
    minimal = "public class MainActivity extends BridgeActivity {}"
    if minimal in content:
        content = content.replace(minimal,
            "public class MainActivity extends BridgeActivity {\n"
            "    @Override\n"
            "    public void onCreate(android.os.Bundle savedInstanceState) {\n"
            "        registerPlugin(WidgetBridgePlugin.class);\n"
            "        super.onCreate(savedInstanceState);\n"
            "    }\n"
            "}")
    elif "super.onCreate(savedInstanceState);" in content:
        content = content.replace("super.onCreate(savedInstanceState);",
            "        registerPlugin(WidgetBridgePlugin.class);\n        super.onCreate(savedInstanceState);")
    else:
        raise SystemExit(">>> HATA: MainActivity.java beklenen formatta değil:\n" + content)
    open(main_path, "w").write(content)
print(">>> Widget adımı tamamlandı.")
