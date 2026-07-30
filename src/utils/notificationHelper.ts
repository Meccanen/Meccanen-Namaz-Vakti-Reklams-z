import { LocalNotifications, ScheduleEvery } from "@capacitor/local-notifications";

export type SoundType = "default" | "ezan";

export interface NotificationSettings {
  enabled: boolean;           // Global açma/kapama
  minutesBefore: number;      // Kaç dk önce: 5/10/15/20/30 (0 = sadece vakit anında)
  notifyAtVakit: boolean;     // Vakit girdiği anda da AYRICA bildirim gönder
  soundType: SoundType;       // "default": sistem bildirim sesi, "ezan": vaktine özel ezan sesi
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
// Kanal bir kere oluşturulduktan sonra sesi DEĞİŞTİRİLEMEZ — bu yüzden her vakit için ayrı
// bir ezan sesi kullanabilmek adına her vakte özel bir kanal tanımlıyoruz. Güneş (şuruk)
// vaktinde ezan okunmadığı için o vakit her zaman varsayılan kanalı kullanır.
const CHANNEL_DEFAULT = "prayer_default";
const EZAN_CHANNELS: Partial<Record<keyof NotificationSettings["prayers"], string>> = {
  imsak: "prayer_ezan_imsak",
  ogle: "prayer_ezan_ogle",
  ikindi: "prayer_ezan_ikindi",
  aksam: "prayer_ezan_aksam",
  yatsi: "prayer_ezan_yatsi",
};

// res/raw içine konan, vakte özel ezan ses dosyaları (Capacitor Local Notifications Android'de
// uzantılı dosya adını bekliyor; dosyalar android/app/src/main/res/raw/ içinde olmalı).
const EZAN_SOUND_FILES: Partial<Record<keyof NotificationSettings["prayers"], string>> = {
  imsak: "ezan_imsak.mp3",
  ogle: "ezan_ogle.mp3",
  ikindi: "ezan_ikindi.mp3",
  aksam: "ezan_aksam.mp3",
  yatsi: "ezan_yatsi.mp3",
};

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
    for (const [prayerKey, channelId] of Object.entries(EZAN_CHANNELS)) {
      const soundFile = EZAN_SOUND_FILES[prayerKey as keyof NotificationSettings["prayers"]];
      const prayerLabel = PRAYER_LABELS[prayerKey] || prayerKey;
      await LocalNotifications.createChannel({
        id: channelId,
        name: `Namaz Vakti Bildirimleri (${prayerLabel} Ezanı)`,
        description: `${prayerLabel} vakti hatırlatması, ezan sesi ile`,
        importance: 5,
        visibility: 1,
        sound: soundFile,
      });
    }
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

  const notifications: any[] = [];
  const now = new Date();

  prayerTimes.forEach((prayer, idx) => {
    const prayerKey = prayer.key as keyof typeof settings.prayers;
    if (!settings.prayers[prayerKey]) return;
    const prayerName = PRAYER_NAMES[prayer.key]?.[lang] || prayer.name;

    // Güneş (şuruk) vaktinde ezan okunmaz — bu vakit her zaman varsayılan sesi kullanır.
    // Diğer vakitlerde, kullanıcı "ezan" seçtiyse o vakte özel ezan kanalı/sesi kullanılır.
    const ezanChannelId = EZAN_CHANNELS[prayerKey];
    const ezanSoundFile = EZAN_SOUND_FILES[prayerKey];
    const useEzan = settings.soundType === "ezan" && ezanChannelId && ezanSoundFile;
    const channelId = useEzan ? ezanChannelId! : CHANNEL_DEFAULT;
    const soundFile = useEzan ? ezanSoundFile! : "default";

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
            sound: soundFile,
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
            sound: soundFile,
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
