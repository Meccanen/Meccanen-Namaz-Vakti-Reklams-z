path = "android/app/src/main/AndroidManifest.xml"
content = open(path).read()
if "ACCESS_COARSE_LOCATION" not in content:
    new_perms = ('    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />\n    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />\n')
    marker = '<uses-permission android:name="android.permission.INTERNET" />'
    if marker in content:
        content = content.replace(marker, marker + "\n" + new_perms.rstrip())
    else:
        content = content.replace("</manifest>", new_perms + "</manifest>")
    open(path, "w").write(content)
feature_overrides = ('    <uses-feature android:name="android.hardware.location.gps" android:required="false" />\n    <uses-feature android:name="android.hardware.location.network" android:required="false" />\n    <uses-feature android:name="android.hardware.location" android:required="false" />\n')
if 'android.hardware.location.gps" android:required="false"' not in content:
    content = content.replace("</manifest>", feature_overrides + "</manifest>")
    open(path, "w").write(content)
if "SCHEDULE_EXACT_ALARM" not in content:
    alarm_perms = '    <uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />\n    <uses-permission android:name="android.permission.USE_EXACT_ALARM" />\n'
    content = content.replace("</manifest>", alarm_perms + "</manifest>")
    open(path, "w").write(content)
if "REQUEST_IGNORE_BATTERY_OPTIMIZATIONS" not in content:
    content = content.replace("</manifest>", '    <uses-permission android:name="android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS" />\n</manifest>')
with open(path, "w") as f:
    f.write(content)
print("perms ok")
