import os

base = "node_modules/@capacitor/local-notifications/android/src/main/java/com/capacitorjs/plugins/localnotifications/"

path = base + "TimedNotificationPublisher.java"
if not os.path.exists(path):
    raise SystemExit(f">>> HATA: {path} bulunamadı")

with open(path) as f:
    content = f.read()

marker = "        notificationManager.notify(id, notification);"
if marker not in content:
    raise SystemExit(">>> HATA: Beklenen native kod satırı bulunamadı, eklenti sürümü değişmiş olabilir.")

old_patch_start = "        try {\n            Logger.debug(Logger.tags(\"LN\"), \"cancelPreviousId DEBUG:"
old_patch_start_v1 = "        try {\n            org.json.JSONObject extra = notificationJson.optJSONObject(\"extra\");"
for old_start in (old_patch_start, old_patch_start_v1):
    if old_start in content:
        start_idx = content.index(old_start)
        end_idx = content.index(marker, start_idx)
        content = content[:start_idx] + content[end_idx:]
        print(">>> Önceki yama sürümü tespit edildi ve kaldırıldı, yerine güncel sürüm konulacak.")
        break

patch = (
    "        try {\n"
    "            Logger.debug(Logger.tags(\"LN\"), \"cancelPreviousId DEBUG: id=\" + id\n"
    "                + \" notificationJson=\" + (notificationJson == null ? \"NULL\" : notificationJson.toString()));\n"
    "            org.json.JSONObject extra = notificationJson.optJSONObject(\"extra\");\n"
    "            Logger.debug(Logger.tags(\"LN\"), \"cancelPreviousId DEBUG: extra=\" + (extra == null ? \"NULL\" : extra.toString()));\n"
    "            if (extra != null && extra.has(\"cancelPreviousId\")) {\n"
    "                int prevId = extra.getInt(\"cancelPreviousId\");\n"
    "                notificationManager.cancel(prevId);\n"
    "                Logger.debug(Logger.tags(\"LN\"), \"cancelPreviousId DEBUG: cancel(\" + prevId + \") CAGRILDI\");\n"
    "            } else {\n"
    "                Logger.debug(Logger.tags(\"LN\"), \"cancelPreviousId DEBUG: cancelPreviousId anahtari YOK veya extra NULL, cancel CAGRILMADI\");\n"
    "            }\n"
    "        } catch (Exception e) {\n"
    "            Logger.error(Logger.tags(\"LN\"), \"cancelPreviousId patch failed\", e);\n"
    "        }\n"
    + marker
)
content = content.replace(marker, patch)
with open(path, "w") as f:
    f.write(content)
print(">>> Durum bildirimi zinciri yaması (cancelPreviousId) uygulandı.")

path2 = base + "LocalNotificationManager.java"
if not os.path.exists(path2):
    raise SystemExit(f">>> HATA: {path2} bulunamadı")

with open(path2) as f:
    content2 = f.read()

marker2 = (
    "        mBuilder.setSmallIcon(localNotification.getSmallIcon(context, getDefaultSmallIcon(context)));\n"
    "        mBuilder.setLargeIcon(localNotification.getLargeIcon(context));"
)
if marker2 not in content2:
    raise SystemExit(">>> HATA: LocalNotificationManager.java beklenen satırlar bulunamadı, eklenti sürümü değişmiş olabilir.")

timeout_patch = (
    "        mBuilder.setSmallIcon(localNotification.getSmallIcon(context, getDefaultSmallIcon(context)));\n"
    "        mBuilder.setLargeIcon(localNotification.getLargeIcon(context));\n"
    "        try {\n"
    "            org.json.JSONObject timeoutExtra = localNotification.getExtra();\n"
    "            if (timeoutExtra != null && timeoutExtra.has(\"timeoutMs\")) {\n"
    "                long timeoutMs = timeoutExtra.getLong(\"timeoutMs\");\n"
    "                if (timeoutMs > 0) {\n"
    "                    mBuilder.setTimeoutAfter(timeoutMs);\n"
    "                    Logger.debug(Logger.tags(\"LN\"), \"timeoutAfter DEBUG: notification \" + localNotification.getId() + \" icin \" + timeoutMs + \" ms timeout set edildi\");\n"
    "                }\n"
    "            }\n"
    "        } catch (Exception timeoutEx) {\n"
    "            // timeout uygulanamadi — bildirim yine de planlanir, zararsiz\n"
    "        }"
)
content2 = content2.replace(marker2, timeout_patch)
with open(path2, "w") as f:
    f.write(content2)
print(">>> timeoutAfter (otomatik temizlik) yaması LocalNotificationManager'a uygulandı.")
