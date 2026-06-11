import { LocalNotifications, ScheduleEvery } from "@capacitor/local-notifications";

export interface NotificationSettings {
  enabled: boolean;           // Global açma/kapama
  minutesBefore: number;      // Kaç dk önce: 5/10/15/20/30
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
): Promise<void> {
  if (!isNativeAvailable()) return;
  if (!settings.enabled) { await cancelAllNotifications(); return; }

  const hasPermission = await checkNotificationPermission();
  if (!hasPermission) return;

  await cancelAllNotifications();

  const notifications: any[] = [];
  const now = new Date();

  prayerTimes.forEach((prayer, idx) => {
    const prayerKey = prayer.key as keyof typeof settings.prayers;
    if (!settings.prayers[prayerKey]) return;

    const [hour, min] = prayer.time.split(":").map(Number);

    // Bugün ve yarın için planla
    for (let dayOffset = 0; dayOffset <= 1; dayOffset++) {
      const notifDate = new Date(now);
      notifDate.setDate(notifDate.getDate() + dayOffset);
      notifDate.setHours(hour, min - settings.minutesBefore, 0, 0);

      // Geçmiş zaman kontrolü
      if (notifDate <= now) continue;

      const id = (dayOffset * 10) + idx + 1;
      const minuteText = settings.minutesBefore === 0
        ? "vakti girdi"
        : `${settings.minutesBefore} dakika kaldı`;

      notifications.push({
        id,
        title: `🕌 ${prayer.name} Namazı`,
        body: `${locationName} için ${prayer.name} namazına ${minuteText}.`,
        schedule: { at: notifDate },
        sound: "default",
        smallIcon: "ic_stat_icon_config_sample",
        iconColor: "#f59e0b",
      });
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
