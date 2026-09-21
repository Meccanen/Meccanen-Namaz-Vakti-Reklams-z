import json, os, glob

with open("capacitor.config.json") as f:
    cfg = json.load(f)
app_id = cfg["appId"]
pkg_path = app_id.replace(".", "/")
java_dir = f"android/app/src/main/java/{pkg_path}"
if not os.path.isdir(java_dir):
    raise SystemExit(f">>> HATA: {java_dir} bulunamadı, appId ({app_id}) dogru mu kontrol et.")

plugin_path = f"{java_dir}/BatteryHelperPlugin.java"
plugin_code = f'''package {app_id};

import android.app.AlarmManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.PowerManager;
import android.provider.Settings;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "BatteryHelper")
public class BatteryHelperPlugin extends Plugin {{

    @PluginMethod
    public void requestIgnoreBatteryOptimizations(PluginCall call) {{
        try {{
            PowerManager pm = (PowerManager) getContext().getSystemService(Context.POWER_SERVICE);
            String pkg = getContext().getPackageName();
            if (pm != null && !pm.isIgnoringBatteryOptimizations(pkg)) {{
                Intent intent = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
                intent.setData(Uri.parse("package:" + pkg));
                intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(intent);
            }}
        }} catch (Exception e) {{
            // sessizce gec
        }}
        call.resolve();
    }}

    @PluginMethod
    public void openXiaomiAutostartSettings(PluginCall call) {{
        JSObject result = new JSObject();
        try {{
            Intent intent = new Intent();
            intent.setComponent(new ComponentName(
                "com.miui.securitycenter",
                "com.miui.permcenter.autostart.AutoStartManagementActivity"
            ));
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            result.put("opened", true);
        }} catch (Exception e) {{
            try {{
                Intent fallback = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                fallback.setData(Uri.parse("package:" + getContext().getPackageName()));
                fallback.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(fallback);
                result.put("opened", false);
            }} catch (Exception e2) {{
                result.put("opened", false);
            }}
        }}
        call.resolve(result);
    }}

    @PluginMethod
    public void canScheduleExactAlarms(PluginCall call) {{
        JSObject result = new JSObject();
        boolean allowed = true;
        try {{
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.S) {{
                AlarmManager am = (AlarmManager) getContext().getSystemService(Context.ALARM_SERVICE);
                allowed = am != null && am.canScheduleExactAlarms();
            }}
        }} catch (Exception e) {{
            allowed = true;
        }}
        result.put("allowed", allowed);
        call.resolve(result);
    }}

    @PluginMethod
    public void openExactAlarmSettings(PluginCall call) {{
        boolean opened = false;
        try {{
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.S) {{
                AlarmManager am = (AlarmManager) getContext().getSystemService(Context.ALARM_SERVICE);
                if (am == null || !am.canScheduleExactAlarms()) {{
                    Intent intent = new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM);
                    intent.setData(Uri.parse("package:" + getContext().getPackageName()));
                    intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    getContext().startActivity(intent);
                    opened = true;
                }}
            }}
        }} catch (Exception e) {{
            opened = false;
        }}
        JSObject result = new JSObject();
        result.put("opened", opened);
        call.resolve(result);
    }}
}}
'''
with open(plugin_path, "w") as f:
    f.write(plugin_code)
print(f">>> {plugin_path} olusturuldu.")

main_matches = glob.glob("android/app/src/main/java/**/MainActivity.java", recursive=True)
if not main_matches:
    raise SystemExit(">>> HATA: MainActivity.java bulunamadi.")
main_path = main_matches[0]
with open(main_path) as f:
    content = f.read()

minimal = "public class MainActivity extends BridgeActivity {}"
if "registerPlugin(BatteryHelperPlugin.class)" in content:
    print(">>> BatteryHelperPlugin zaten kayitli, dokunulmadi.")
elif minimal in content:
    patched = (
        "public class MainActivity extends BridgeActivity {\n"
        "    @Override\n"
        "    public void onCreate(android.os.Bundle savedInstanceState) {\n"
        "        registerPlugin(BatteryHelperPlugin.class);\n"
        "        super.onCreate(savedInstanceState);\n"
        "    }\n"
        "}"
    )
    content = content.replace(minimal, patched)
    with open(main_path, "w") as f:
        f.write(content)
    print(">>> BatteryHelperPlugin MainActivity'ye kaydedildi.")
else:
    raise SystemExit(">>> HATA: MainActivity.java beklenen minimal formatta degil:\n" + content)
