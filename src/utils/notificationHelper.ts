import { LocalNotifications, ScheduleEvery } from "@capacitor/local-notifications";

export type SoundType = "default" | "ezan";

export interface NotificationSettings {
  enabled: boolean;           // Global açma/kapama
  minutesBefore: number;      // Kaç dk önce: 5/10/15/20/30 (0 = sadece vakit anında)
  notifyAtVakit: boolean;     // Vakit girdiği anda da AYRICA bildirim gönder
  soundType: SoundType;       // "default": sistem bildirim sesi, "ezan": ezan sesi (tam, 3:47)
  prayers: {                  // Her vakit için toggle
    imsak: boolean;
    gunes: boolean;
    ogle: boolean;
    ikindi: boolean;
    aksam: boolean;
    yatsi: boolean;
  };
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: false,
  minutesBefore: 10,
  notifyAtVakit: false,
  soundType: "default",
  prayers: {
    imsak: true,
    gunes: false,
    ogle: true,
    ikindi: true,
    aksam: true,
    yatsi: true,
  },
};

export const PRAYER_LABELS: Record<string, string> = {
  imsak: "İmsak",
  gunes: "Güneş",
  ogle: "Öğle",
  ikindi: "İkindi",
  aksam: "Akşam",
  yatsi: "Yatsı",
};

// Android bildirim kanalları (Android 8+ / API 26+ için ses, kanal oluşturulurken sabitlenir).
// Kanal bir kere oluşturulduktan sonra sesi DEĞİŞTİRİLEMEZ — bu yüzden olası iki ses seçeneği
// için (varsayılan / ezan) iki ayrı sabit kanal tanımlıyoruz ve bildirim hangi kanala
// gönderilecekse o kanalın id'sini kullanıyoruz.
const CHANNEL_DEFAULT = "prayer_default";
const CHANNEL_EZAN = "prayer_ezan";

// res/raw içine konacak ses dosyasının adı (Capacitor Local Notifications Android'de
// uzantılı dosya adını bekliyor; dosya android/app/src/main/res/raw/ezan_sesi.mp3'te olmalı).
const EZAN_SOUND_FILE = "ezan_sesi.mp3";

let channelsEnsured = false;

async function ensureChannels(): Promise<void> {
  if (!isNativeAvailable() || channelsEnsured) return;
  try {
    await LocalNotifications.createChannel({
      id: CHANNEL_DEFAULT,
      name: "Namaz Vakti Bildirimleri",
      description: "Namaz vakti hatırlatmaları (varsayılan sistem sesi)",
      importance: 5,
      visibility: 1,
      sound: undefined,
    });
    await LocalNotifications.createChannel({
      id: CHANNEL_EZAN,
      name: "Namaz Vakti Bildirimleri (Ezan Sesi)",
      description: "Namaz vakti hatırlatmaları (ezan sesi ile, tam 3:47)",
      importance: 5,
      visibility: 1,
      sound: EZAN_SOUND_FILE,
    });
    channelsEnsured = true;
  } catch (e) {
    console.error("Bildirim kanalları oluşturulamadı:", e);
  }
}

// LocalNotifications API var mı? (APK'da var, web'de yok)
function isNativeAvailable(): boolean {
  try {
    return typeof LocalNotifications !== "undefined" &&
      typeof LocalNotifications.requestPermissions === "function";
  } catch {
    return false;
  }
}

// İzin iste
export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNativeAvailable()) return false;
  try {
    const result = await LocalNotifications.requestPermissions();
    return result.display === "granted";
  } catch {
    return false;
  }
}

// Mevcut izin durumu
export async function checkNotificationPermission(): Promise<boolean> {
  if (!isNativeAvailable()) return false;
  try {
    const result = await LocalNotifications.checkPermissions();
    return result.display === "granted";
  } catch {
    return false;
  }
}

// Tüm bildirimleri iptal et
export async function cancelAllNotifications(): Promise<void> {
  if (!isNativeAvailable()) return;
  try {
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel({ notifications: pending.notifications });
    }
  } catch {}
}

// Namaz vakitleri için bildirimleri planla
export async function schedulePrayerNotifications(
  prayerTimes: { key: string; name: string; time: string }[],
  settings: NotificationSettings,
  locationName: string,
  lang: "tr" | "en" | "ar" = "tr",
): Promise<void> {
  if (!isNativeAvailable()) return;
  if (!settings.enabled) { await cancelAllNotifications(); return; }

  const hasPermission = await checkNotificationPermission();
  if (!hasPermission) return;

  await ensureChannels();
  await cancelAllNotifications();

  // Bildirim metinleri (çok dilli)
  const PRAYER_NAMES: Record<string, Record<string, string>> = {
    imsak:  { tr: "İmsak",   en: "Fajr",    ar: "الفجر"   },
    gunes:  { tr: "Güneş",   en: "Sunrise",  ar: "الشروق"  },
    ogle:   { tr: "Öğle",    en: "Dhuhr",   ar: "الظهر"   },
    ikindi: { tr: "İkindi",  en: "Asr",     ar: "العصر"   },
    aksam:  { tr: "Akşam",   en: "Maghrib", ar: "المغرب"  },
    yatsi:  { tr: "Yatsı",   en: "Isha",    ar: "العشاء"  },
  };
  const TEXTS: Record<string, Record<string, string>> = {
    beforeTitle: { tr: "Namaz Vakti",  en: "Prayer Time",    ar: "وقت الصلاة"   },
    beforeBody:  { tr: "{name} namazına {min} dakika kaldı.", en: "{min} minutes until {name}.", ar: "تبقّى {min} دقيقة على صلاة {name}." },
    atTitle:     { tr: "Namaz Vakti",  en: "Prayer Time",    ar: "وقت الصلاة"   },
    atBody:      { tr: "{name} namazı vakti girdi.",          en: "It is time for {name}.",        ar: "حان وقت صلاة {name}."            },
  };
  const tx = (key: string, vars: Record<string,string> = {}) => {
    let s = TEXTS[key][lang] || TEXTS[key].en;
    Object.entries(vars).forEach(([k,v]) => { s = s.replace(`{${k}}`, v); });
    return s;
  };

  const channelId = settings.soundType === "ezan" ? CHANNEL_EZAN : CHANNEL_DEFAULT;
  const notifications: any[] = [];
  const now = new Date();

  prayerTimes.forEach((prayer, idx) => {
    const prayerKey = prayer.key as keyof typeof settings.prayers;
    if (!settings.prayers[prayerKey]) return;
    const prayerName = PRAYER_NAMES[prayer.key]?.[lang] || prayer.name;

    const [hour, min] = prayer.time.split(":").map(Number);

    // Bugün ve yarın için planla
    for (let dayOffset = 0; dayOffset <= 1; dayOffset++) {
      // 1) "X dakika önce" bildirimi (minutesBefore > 0 ise)
      if (settings.minutesBefore > 0) {
        const beforeDate = new Date(now);
        beforeDate.setDate(beforeDate.getDate() + dayOffset);
        beforeDate.setHours(hour, min - settings.minutesBefore, 0, 0);

        if (beforeDate > now) {
          const id = (dayOffset * 100) + (idx * 2) + 1;
          notifications.push({
            id,
            title: `🕌 ${tx("beforeTitle")}`,
            body: tx("beforeBody", { name: prayerName, min: String(settings.minutesBefore) }),
            schedule: { at: beforeDate },
            channelId,
            sound: settings.soundType === "ezan" ? EZAN_SOUND_FILE : "default",
            smallIcon: "ic_stat_icon_config_sample",
            iconColor: "#f59e0b",
          });
        }
      }

      // 2) Vakit girdiği anda AYRICA bildirim (notifyAtVakit true ise)
      if (settings.notifyAtVakit) {
        const atDate = new Date(now);
        atDate.setDate(atDate.getDate() + dayOffset);
        atDate.setHours(hour, min, 0, 0);

        if (atDate > now) {
          const id = (dayOffset * 100) + (idx * 2) + 2;
          notifications.push({
            id,
            title: `🕌 ${tx("atTitle")}`,
            body: tx("atBody", { name: prayerName }),
            schedule: { at: atDate },
            channelId,
            sound: settings.soundType === "ezan" ? EZAN_SOUND_FILE : "default",
            smallIcon: "ic_stat_icon_config_sample",
            iconColor: "#f59e0b",
          });
        }
      }
    }
  });

  if (notifications.length > 0) {
    try {
      await LocalNotifications.schedule({ notifications });
    } catch (e) {
      console.error("Bildirim planlanamadı:", e);
    }
  }
}

// Ayarları localStorage'a kaydet/yükle
export function saveNotificationSettings(s: NotificationSettings): void {
  localStorage.setItem("mnv_notification_settings", JSON.stringify(s));
}

export function loadNotificationSettings(): NotificationSettings {
  try {
    const s = localStorage.getItem("mnv_notification_settings");
    if (s) return { ...DEFAULT_NOTIFICATION_SETTINGS, ...JSON.parse(s) };
  } catch {}
  return { ...DEFAULT_NOTIFICATION_SETTINGS };
}
