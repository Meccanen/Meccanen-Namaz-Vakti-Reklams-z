import { LocalNotifications, ScheduleEvery } from "@capacitor/local-notifications";
import { LangCode } from "./i18n";

export type SoundType = "default" | "ezan";

export interface NotificationSettings {
  enabled: boolean;           // Global açma/kapama
  minutesBefore: number;      // Kaç dk önce: 5/10/15/20/30 (0 = "X dk önce" bildirimi kapalı)
  notifyAtVakit: boolean;     // Vakit girdiği anda da AYRICA bildirim gönder
  soundTypeAtVakit: SoundType;// Sadece "vakit girdiğinde" bildirimi için ses seçimi (default/ezan).
                              // "X dakika önce" hatırlatması KASITLI OLARAK her zaman varsayılan
                              // sesle çalışır — ezan yalnızca tam vaktinde duyulmalı, aksi halde
                              // özellikle yaşlı kullanıcılar için kafa karıştırıcı olur.
  prayers: {                  // Her vakit için toggle
    imsak: boolean;
    gunes: boolean;
    ogle: boolean;
    ikindi: boolean;
    aksam: boolean;
    yatsi: boolean;
  };
  showStatusNotification: boolean; // "Şu an X vakti — sonraki Y saat:xx" şeklinde sessiz,
                                    // tek ve sürekli güncellenen bir durum bildirimi göster
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: false,
  minutesBefore: 10,
  notifyAtVakit: false,
  soundTypeAtVakit: "ezan",
  prayers: {
    imsak: true,
    gunes: false,
    ogle: true,
    ikindi: true,
    aksam: true,
    yatsi: true,
  },
  showStatusNotification: false,
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
const CHANNEL_STATUS = "prayer_status_silent";
const EZAN_CHANNELS: Partial<Record<keyof NotificationSettings["prayers"], string>> = {
  imsak: "prayer_ezan_imsak",
  ogle: "prayer_ezan_ogle",
  ikindi: "prayer_ezan_ikindi",
  aksam: "prayer_ezan_aksam",
  yatsi: "prayer_ezan_yatsi",
};

// ─── Çok günlük (multi-day) planlama ────────────────────────────────────────────
// KRİTİK DEĞİŞİKLİK: Eskiden bildirimler yalnızca "bugün + yarın" için planlanıyordu.
// Kullanıcı uygulamayı 2+ gün açmazsa (namaz uygulamalarında çok normaldir) plan tükeniyor,
// son bildirim 16-18 saat eski haliyle ekranda ölü şekilde bekliyordu. Artık vakitler
// NOTIFICATION_HORIZON_DAYS gün önceden planlanıyor; böylece uygulama hiç açılmasa bile
// zincir 1 hafta kendi kendine işliyor ve her geçişte (cancelPreviousId yaması sayesinde)
// önceki bildirim otomatik temizleniyor.
export const NOTIFICATION_HORIZON_DAYS = 7;

// Bildirim otomatik süre dolumu ("timeoutAfter"). Native tarafta (build-workflow'daki
// TimedNotificationPublisher yaması) her bildirim tetiklendiğinde extra.timeoutMs'ten okunur
// ve Notification.timeoutAfter olarak uygulanır. Böylece zincirin bir halkası bir sebeple
// kopsa bile ekranda "dünün" bildirimi sonsuza dek asılı kalmaz — bir süre sonra sistem
// kendiliğinden temizler. (Özellikle ses tuşuyla kapatınca o günün kalan alarmları iptal
// olan MIUI/Xiaomi gibi cihazlarda bu, "16-18 saat eski bildirim ekranda bekliyor" sorununu kapatır.)
const REMINDER_TIMEOUT_MS = 90 * 60 * 1000;   // "X dakika önce" hatırlatması
const PRAYER_AT_TIMEOUT_MS = 60 * 60 * 1000;  // "Vakit girdi" bildirimi (ezan dahil)
const STATUS_TIMEOUT_MS = 6 * 60 * 60 * 1000; // "Şu an X vakti" durum bildirimi (yedek temizlik)

export interface PrayerTimeEntry { key: string; name: string; time: string }

// ─── Durum bildirimi zincir ID'leri ─────────────────────────────────────────────
// Her biri, native tarafta (TimedNotificationPublisher yaması ile) kendisinden hemen
// önceki ID'yi otomatik olarak iptal eder — böylece gün boyunca HER ZAMAN tek bir
// bildirim görünür, birikme olmaz.
// ESKİ DURUM: Sabit 9000..9005 ID'leri yalnızca "bugün" için planlanıyordu (aynı ID'yi iki
// farklı güne planlamak birbirini iptal ettiği için). Artık her GÜN için benzersiz ID'ler
// kullanıyoruz (day*100 + index) → çok günlü zincir; gece yarısı dönüşü de dahil zincir
// uygulama açılmadan sürer.
const STATUS_BASE = 9000;
export const STATUS_ORDER: (keyof NotificationSettings["prayers"])[] = ["imsak", "gunes", "ogle", "ikindi", "aksam", "yatsi"];
const statusId = (dayIdx: number, prayerIdx: number): number => STATUS_BASE + dayIdx * 100 + prayerIdx;

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
    await LocalNotifications.createChannel({
      id: CHANNEL_STATUS,
      name: "Namaz Vakti Durumu",
      description: "Şu an hangi vakitte olduğunuzu gösteren sessiz, tek durum bildirimi",
      importance: 2,
      visibility: 1,
      sound: undefined,
      vibration: false,
      lights: false,
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
    throw e;
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

export interface ScheduleResult {
  success: boolean;
  scheduledCount: number;
  error?: string;
  debug?: string; // Teşhis amaçlı: durum bildiriminin neden dahil edilip/edilmediğini açıklar
}

// Namaz vakitleri için bildirimleri planla
export async function schedulePrayerNotifications(
  prayerTimes: { key: string; name: string; time: string }[],
  settings: NotificationSettings,
  locationName: string,
  lang: LangCode = "tr",
  tomorrowPrayerTimes?: { key: string; name: string; time: string }[],
  // YENİ: çok günlü vakit listesi. index 0 = BUGÜN. Verilmezse eski davranış (bugün + yarın).
  multiDayTimes?: PrayerTimeEntry[][],
): Promise<ScheduleResult> {
  if (!isNativeAvailable()) return { success: false, scheduledCount: 0, error: "native-unavailable" };
  if (!settings.enabled) { await cancelAllNotifications(); return { success: true, scheduledCount: 0 }; }

  const hasPermission = await checkNotificationPermission();
  if (!hasPermission) return { success: false, scheduledCount: 0, error: "permission-denied" };

  try {
    await ensureChannels();
  } catch (e) {
    return { success: false, scheduledCount: 0, error: `channel-error: ${e instanceof Error ? e.message : String(e)}` };
  }
  await cancelAllNotifications();

  // Çok günlü vakit listesini normale dönüştür (en az 2 gün, en fazla ufuk kadar).
  const days: PrayerTimeEntry[][] = [];
  if (multiDayTimes && multiDayTimes.length > 0) {
    days.push(...multiDayTimes.slice(0, NOTIFICATION_HORIZON_DAYS));
  } else {
    days.push(prayerTimes);
    days.push(tomorrowPrayerTimes && tomorrowPrayerTimes.length ? tomorrowPrayerTimes : prayerTimes);
  }

  // "Durum bildirimi" ayarı KAPALIYSA, ekranda hâlâ görünüyor olabilecek eski durum
  // bildirimlerini temizle (cancelAllNotifications() sadece HENÜZ TETİKLENMEMİŞ/pending
  // olanları iptal eder, zaten ekranda görünen/fired olanı kapsamaz). Ayar AÇIKSA bu
  // adımı BİLEREK atlıyoruz: aynı ID'yi iptal edip hemen ardından yeniden planlamak
  // native tarafta bir yarış durumuna (race condition) yol açıp bildirimin hiç
  // görünmemesine sebep olabiliyor. Açıkken zaten native `schedule()` çağrısı, aynı
  // ID'ye sahip eski bildirimi otomatik olarak değiştiriyor; farklı ID'li önceki vakit
  // bildirimini de aşağıdaki `extra.cancelPreviousId` yaması hallediyor.
  if (!settings.showStatusNotification && isNativeAvailable()) {
    try {
      const allStatusIds = Array.from(
        { length: NOTIFICATION_HORIZON_DAYS + 1 },
        (_, d) => STATUS_ORDER.map((_, i) => statusId(d, i)),
      ).flat();
      await LocalNotifications.cancel({ notifications: allStatusIds.map(id => ({ id })) });
    } catch {}
  }

  // Bildirim metinleri (çok dilli — tr/en/ar/de/ur, uygulamanın desteklediği 5 dil)
  const PRAYER_NAMES: Record<string, Record<string, string>> = {
    imsak:  { tr: "İmsak",   en: "Fajr",    ar: "الفجر",  de: "Fadschr", ur: "فجر"        },
    gunes:  { tr: "Güneş",   en: "Sunrise", ar: "الشروق", de: "Aufgang", ur: "طلوع آفتاب" },
    ogle:   { tr: "Öğle",    en: "Dhuhr",   ar: "الظهر",  de: "Dhuhr",   ur: "ظہر"        },
    ikindi: { tr: "İkindi",  en: "Asr",     ar: "العصر",  de: "Asr",     ur: "عصر"        },
    aksam:  { tr: "Akşam",   en: "Maghrib", ar: "المغرب", de: "Maghrib", ur: "مغرب"       },
    yatsi:  { tr: "Yatsı",   en: "Isha",    ar: "العشاء", de: "Isha",    ur: "عشاء"       },
  };
  const TEXTS: Record<string, Record<string, string>> = {
    beforeTitle: {
      tr: "Namaz Vakti", en: "Prayer Time", ar: "وقت الصلاة",
      de: "Gebetszeit", ur: "نماز کا وقت",
    },
    beforeBody: {
      tr: "{name} namazına {min} dakika kaldı.", en: "{min} minutes until {name}.",
      ar: "تبقّى {min} دقيقة على صلاة {name}.", de: "Noch {min} Minuten bis {name}.",
      ur: "{name} میں {min} منٹ باقی ہیں۔",
    },
    atTitle: {
      tr: "Namaz Vakti", en: "Prayer Time", ar: "وقت الصلاة",
      de: "Gebetszeit", ur: "نماز کا وقت",
    },
    atBody: {
      tr: "{name} namazı vakti girdi.", en: "It is time for {name}.",
      ar: "حان وقت صلاة {name}.", de: "Es ist Zeit für {name}.",
      ur: "{name} کا وقت ہو گیا ہے۔",
    },
  };
  const tx = (key: string, vars: Record<string,string> = {}) => {
    let s = TEXTS[key][lang] || TEXTS[key].en;
    Object.entries(vars).forEach(([k,v]) => { s = s.replace(`{${k}}`, v); });
    return s;
  };

  const notifications: any[] = [];
  const now = new Date();

  // "X dakika önce" ve "vakit girdi" bildirimlerini TEK bir kronolojik zincir halinde
  // topluyoruz (tüm ufuk boyunca: bugün + sonraki günler), ki her biri native tarafta
  // (cancelPreviousId yaması ile) kendinden bir önceki bildirimi otomatik iptal edebilsin —
  // tıpkı durum bildirimi zinciri gibi. Bu olmadan (eski davranış) her bildirim bağımsızdı
  // ve hiçbiri iptal edilmiyordu; özellikle Yatsı'dan sabah İmsak'a kadar uygulama hiç
  // açılmazsa, gece boyu her vaktin hatırlatma/"vakti girdi" bildirimi ekranda ayrı ayrı
  // birikiyordu. Zincir gün sınırını da kapsadığı için bu tam olarak o senaryoyu çözüyor.
  type PendingEvent = {
    id: number;
    triggerDate: Date;
    title: string;
    body: string;
    channelId: string;
    sound: string;
    timeoutMs: number;
  };
  const events: PendingEvent[] = [];
  // Şu ana kadar geçmiş (geçmişte kalmış) olan en son olayı ayrıca takip ediyoruz — bu,
  // hem zincirin ilk gelecekteki bildirimine "cancelPreviousId" olarak verilecek, hem de
  // aşağıda hemen (JS tarafında) iptal edilecek: cancelAllNotifications() sadece HENÜZ
  // TETİKLENMEMİŞ olanları temizler, ekranda hâlâ görünen eski bir bildirimi kapsamaz.
  let mostRecentPastId: number | null = null;
  let mostRecentPastDate: Date | null = null;

  days.forEach((dayTimes, dayIdx) => {
    dayTimes.forEach((prayer, idx) => {
      const prayerKey = prayer.key as keyof typeof settings.prayers;
      if (!settings.prayers[prayerKey]) return;
      const prayerName = PRAYER_NAMES[prayer.key]?.[lang] || prayer.name;

      // İmsak bir namaz vakti değil, orucun/günün başlangıcıdır — Türkçe bildirim
      // metninde "İmsak namazına/namazı" demek yerine "İmsak vaktine/vakti" diyoruz.
      // Diğer diller zaten prayer adını (Fajr/Fadschr/الفجر/فجر) doğrudan kullandığı
      // için bu ayrım sadece Türkçe metinlerde gerekiyor.
      const isImsakTr = prayer.key === "imsak" && lang === "tr";
      const beforeBodyText = isImsakTr
        ? `İmsak vaktine ${settings.minutesBefore} dakika kaldı.`
        : tx("beforeBody", { name: prayerName, min: String(settings.minutesBefore) });
      const atBodyText = isImsakTr ? "İmsak vakti girdi." : tx("atBody", { name: prayerName });

      // Güneş (şuruk) vaktinde ezan okunmaz — bu vakit her zaman varsayılan sesi kullanır.
      // "X dakika önce" hatırlatması KASITLI OLARAK her zaman varsayılan sesle çalışır (bkz.
      // NotificationSettings.soundTypeAtVakit açıklaması). Sadece "vakit girdiğinde" bildirimi
      // kullanıcının seçimine göre ezan sesi kullanabilir.
      const ezanChannelId = EZAN_CHANNELS[prayerKey];
      const ezanSoundFile = EZAN_SOUND_FILES[prayerKey];
      const hasEzan = !!(ezanChannelId && ezanSoundFile);

      const channelIdBefore = CHANNEL_DEFAULT;
      const soundFileBefore = "default";

      const useEzanAtVakit = settings.soundTypeAtVakit === "ezan" && hasEzan;
      const channelIdAtVakit = useEzanAtVakit ? ezanChannelId! : CHANNEL_DEFAULT;
      const soundFileAtVakit = useEzanAtVakit ? ezanSoundFile! : "default";

      const [hour, min] = prayer.time.split(":").map(Number);

      // Her gün için "X dakika önce" (varsa) ve "vakit girdi" (varsa) olaylarını ekle.
      // ID şeması: dayIdx*1000 + idx*2 + {1=önce, 2=vakit} → tüm günler için benzersiz.
      const dayBase = new Date(now);
      dayBase.setDate(dayBase.getDate() + dayIdx);

      // 1) "X dakika önce" bildirimi (minutesBefore > 0 ise)
      if (settings.minutesBefore > 0) {
        const beforeDate = new Date(dayBase);
        beforeDate.setHours(hour, min - settings.minutesBefore, 0, 0);
        const id = (dayIdx * 1000) + (idx * 2) + 1;

        if (beforeDate > now) {
          events.push({
            id,
            triggerDate: beforeDate,
            title: `🕌 ${tx("beforeTitle")}`,
            body: beforeBodyText,
            channelId: channelIdBefore,
            sound: soundFileBefore,
            timeoutMs: REMINDER_TIMEOUT_MS,
          });
        } else if (!mostRecentPastDate || beforeDate > mostRecentPastDate) {
          mostRecentPastDate = beforeDate;
          mostRecentPastId = id;
        }
      }

      // 2) Vakit girdiği anda AYRICA bildirim (notifyAtVakit true ise)
      if (settings.notifyAtVakit) {
        const atDate = new Date(dayBase);
        atDate.setHours(hour, min, 0, 0);
        const id = (dayIdx * 1000) + (idx * 2) + 2;

        if (atDate > now) {
          events.push({
            id,
            triggerDate: atDate,
            title: `🕌 ${tx("atTitle")}`,
            body: atBodyText,
            channelId: channelIdAtVakit,
            sound: soundFileAtVakit,
            timeoutMs: PRAYER_AT_TIMEOUT_MS,
          });
        } else if (!mostRecentPastDate || atDate > mostRecentPastDate) {
          mostRecentPastDate = atDate;
          mostRecentPastId = id;
        }
      }
    });
  });

  // Kronolojik sıraya diz, sonra her birine "kendinden bir önceki" bildirimi native
  // tarafta iptal edecek extra.cancelPreviousId ekleyerek zinciri kur. İlk gelecekteki
  // bildirim, zincire yukarıda bulduğumuz "en son geçmiş" bildirimi iptal ederek başlıyor
  // — böylece uygulama gece boyu hiç açılmasa bile, sabahki ilk bildirim ateşlendiğinde
  // gece yarısı öncesinden kalan son bildirimi otomatik temizliyor.
  events.sort((a, b) => a.triggerDate.getTime() - b.triggerDate.getTime());
  let prevId: number | null = mostRecentPastId;
  for (const ev of events) {
    notifications.push({
      id: ev.id,
      title: ev.title,
      body: ev.body,
      schedule: { at: ev.triggerDate, allowWhileIdle: true },
      channelId: ev.channelId,
      sound: ev.sound,
      smallIcon: "ic_stat_notify",
      iconColor: "#f59e0b",
      extra: {
        ...(prevId !== null ? { cancelPreviousId: prevId } : {}),
        timeoutMs: ev.timeoutMs,
      },
    });
    prevId = ev.id;
  }

  // Şu anda ekranda görünüyor olabilecek (zaten tetiklenmiş) en son hatırlatma/"vakit
  // girdi" bildirimini hemen şimdi (JS tarafında) da temizle — kullanıcı uygulamayı
  // açtığında/ayar değiştirdiğinde eski bildirim bir sonraki native tetiklemeyi
  // beklemeden derhal kaybolsun diye.
  if (mostRecentPastId !== null) {
    try { await LocalNotifications.cancel({ notifications: [{ id: mostRecentPastId }] }); } catch {}
  }

  // "Şu an hangi vakitteyiz" durum bildirimi — artık yalnızca bugün değil, ufuktaki TÜM
  // günler için planlanıyor. Her biri (ileride) tetiklendiğinde native yama
  // (extra.cancelPreviousId) sayesinde kendinden önceki durumu otomatik siler; böylece
  // gece yarısı sınırı dahil HER AN tek bir durum bildirimi görünür ve uygulama günlerce
  // açılmasa bile zincir kendi kendini yeniler.
  //
  // ÖNEMLİ: Bu fonksiyon her çağrıldığında (ayar açıldığında, uygulama her açılışında/
  // konum-tarih değiştiğinde vb.) önce TÜM bekleyen bildirimleri iptal eder (yukarıdaki
  // cancelAllNotifications) ve "şu an" hangi vakitteysek onun bildirimini DERHAL (schedule
  // olmadan, anında) gösteririz; kalan gelecekteki geçişler ileri tarihli planlanır.
  let statusDebug = "showStatusNotification=false";
  if (settings.showStatusNotification) {
   try {
    const STATUS_TEXTS: Record<string, Record<string, string>> = {
      title: {
        tr: "Şu An {name} Vakti", en: "Currently {name} Time", ar: "الآن وقت {name}",
        de: "Gerade {name}-Zeit", ur: "اس وقت {name} کا وقت ہے",
      },
      // Diğer vakitler için "namazı"/"prayer" ekiyle birlikte kullanılır.
      bodyPrayer: {
        tr: "{next} Namazı Saat {time}", en: "{next} Prayer at {time}", ar: "صلاة {next} الساعة {time}",
        de: "{next}-Gebet um {time}", ur: "{next} کی نماز {time} پر",
      },
      // Güneş (şuruk) bir namaz vakti DEĞİL, sadece güneşin doğuş anıdır — "namazı"/"prayer"
      // kelimesi eklenmemeli. Bu yüzden ayrı bir şablon kullanıyoruz (5 dilde de).
      bodySunrise: {
        tr: "Güneşin Doğuşu Saat {time}", en: "Sunrise at {time}", ar: "شروق الشمس الساعة {time}",
        de: "Sonnenaufgang um {time}", ur: "طلوع آفتاب {time} پر",
      },
      // İmsak bir namaz vakti değil, orucun/günün başlangıcıdır — Türkçe'de "İmsak
      // Namazı Saat X" yerine "İmsak Vakti Saat X" diyoruz. Diğer diller zaten prayer
      // adını doğrudan kullandığı için bu ayrım sadece Türkçe'de gerekiyor.
      bodyImsakTr: {
        tr: "İmsak Vakti Saat {time}",
      },
    };
    const stx = (key: string, vars: Record<string, string>) => {
      let s = STATUS_TEXTS[key][lang] || STATUS_TEXTS[key].en;
      Object.entries(vars).forEach(([k, v]) => { s = s.replace(`{${k}}`, v); });
      return s;
    };
    const buildStatusBody = (nextKey: string, nextTime: string) => {
      const nextName = PRAYER_NAMES[nextKey]?.[lang] || nextKey;
      if (nextKey === "gunes") return stx("bodySunrise", { time: nextTime });
      if (nextKey === "imsak" && lang === "tr") return stx("bodyImsakTr", { time: nextTime });
      return stx("bodyPrayer", { next: nextName, time: nextTime });
    };

    const timeByDay: Record<string, string>[] = days.map(d => {
      const m: Record<string, string> = {};
      d.forEach(p => { m[p.key] = p.time; });
      return m;
    });
    const timeByKey = timeByDay[0];

    // 1) "Şu an" hangi vakitteyiz? Bugünün saatleri arasında now'dan önceki SON vakti bul.
    //    Hiçbiri now'dan önce değilse (yani henüz imsak girmemiş), demek ki hâlâ dünün
    //    yatsı vaktindeyiz — zincirin son elemanını "şu an" kabul ediyoruz.
    let currentIdx = -1;
    for (let i = STATUS_ORDER.length - 1; i >= 0; i--) {
      const timeStr = timeByKey[STATUS_ORDER[i]];
      if (!timeStr) continue;
      const [h, m] = timeStr.split(":").map(Number);
      const d = new Date(now);
      d.setHours(h, m, 0, 0);
      if (d <= now) { currentIdx = i; break; }
    }
    if (currentIdx === -1) currentIdx = STATUS_ORDER.length - 1; // hâlâ dünün yatsı vakti

    const currentKey = STATUS_ORDER[currentIdx];
    const nextIdx = (currentIdx + 1) % STATUS_ORDER.length;
    const nextKey = STATUS_ORDER[nextIdx];
    // ÖNEMLİ: Zincirin SARDIĞI tek yer burası — currentKey "yatsi" olduğunda nextKey
    // "imsak"a döner ve bu artık BUGÜNÜN değil, YARININ imsak vaktidir. Bu durumda
    // (varsa) gerçek yarının verisini kullan; yoksa eskisi gibi bugünün saatini
    // yaklaşık değer olarak kullanmaya devam et.
    const isWrapToTomorrow = currentIdx === STATUS_ORDER.length - 1;
    const nextTime = (isWrapToTomorrow && timeByDay[1] && timeByDay[1][nextKey])
      ? timeByDay[1][nextKey]
      : (timeByKey[nextKey] || "");

    if (nextTime) {
      // a) "Şu an" için ANINDA göster. NOT: `schedule` alanını tamamen boş bırakmak
      //    (hiç zamanlama vermemek) native tarafta güvenilir şekilde ÇALIŞMIYOR —
      //    plugin bazı Android sürümlerinde/cihazlarda bu tür "zamanlamasız"
      //    bildirimleri sessizce hiç göstermiyor. Bunun yerine çok yakın bir gelecek
      //    an (2 saniye sonrası) veriyoruz; allowWhileIdle:true sayesinde Doze'da bile
      //    zamanında/EKSİZ alarma düşer. extra.cancelPreviousId de eklendi — bir önceki
      //    vaktin (farklı ID'li) bildirimi bu tetiklendiğinde temizlenir.
      const prevOfCurrentKey = STATUS_ORDER[(currentIdx - 1 + STATUS_ORDER.length) % STATUS_ORDER.length];
      notifications.push({
        id: statusId(0, currentIdx),
        title: stx("title", { name: PRAYER_NAMES[currentKey]?.[lang] || currentKey }),
        body: buildStatusBody(nextKey, nextTime),
        schedule: { at: new Date(now.getTime() + 2000), allowWhileIdle: true },
        channelId: CHANNEL_STATUS,
        sound: "default",
        smallIcon: "ic_stat_notify",
        iconColor: "#f59e0b",
        ongoing: false,
        autoCancel: false,
        extra: {
          cancelPreviousId: statusId(0, (currentIdx - 1 + STATUS_ORDER.length) % STATUS_ORDER.length),
          timeoutMs: STATUS_TIMEOUT_MS,
        },
      });

      // b) Ufuktaki TÜM günlerin gelecekteki vakit geçişlerini planla. Her biri
      //    tetiklendiğinde native yama, zincirdeki kendinden önceki ID'yi (gece yarısı
      //    sınırını aşan gün geçişleri dahil) otomatik iptal eder.
      days.forEach((dayTimes, dIdx) => {
        const tMap = timeByDay[dIdx];
        STATUS_ORDER.forEach((key, i) => {
          const timeStr = tMap[key];
          if (!timeStr) return;
          const [h, m] = timeStr.split(":").map(Number);
          const triggerDate = new Date(now);
          triggerDate.setDate(triggerDate.getDate() + dIdx);
          triggerDate.setHours(h, m, 0, 0);
          if (triggerDate <= now) return; // geçmiş vakit (yalnızca bugünün geçmişi olabilir)

          const thisNextIdx = (i + 1) % STATUS_ORDER.length;
          const thisNextKey = STATUS_ORDER[thisNextIdx];
          const wrap = i === STATUS_ORDER.length - 1; // key === "yatsi"
          let thisNextTime = "";
          if (wrap && dIdx + 1 < days.length && timeByDay[dIdx + 1][thisNextKey]) {
            thisNextTime = timeByDay[dIdx + 1][thisNextKey]; // yarının imsakı
          } else if (tMap[thisNextKey]) {
            thisNextTime = tMap[thisNextKey];
          }
          if (!thisNextTime) return;

          // Zincir bağlantısı: ilk vakit (imsak) bir günün son vaktini (yatsı) iptal eder;
          // diğerleri aynı gün içinde bir öncekini.
          const prevDayIdx = (i === 0 && dIdx > 0) ? dIdx - 1 : dIdx;
          const prevPrayerIdx = (i === 0 && dIdx > 0) ? STATUS_ORDER.length - 1 : i - 1;

          notifications.push({
            id: statusId(dIdx, i),
            title: stx("title", { name: PRAYER_NAMES[key]?.[lang] || key }),
            body: buildStatusBody(thisNextKey, thisNextTime),
            schedule: { at: triggerDate, allowWhileIdle: true },
            channelId: CHANNEL_STATUS,
            sound: "default",
            smallIcon: "ic_stat_notify",
            iconColor: "#f59e0b",
            ongoing: false,
            autoCancel: false,
            extra: {
              cancelPreviousId: statusId(prevDayIdx, prevPrayerIdx),
              timeoutMs: STATUS_TIMEOUT_MS,
            },
          });
        });
      });

      statusDebug = `ok horizon=${days.length} cur=${currentKey} next=${nextKey}@${nextTime}`;
    } else {
      statusDebug = `SKIPPED! nextTime bos. prayerTimes.length=${prayerTimes.length} cur=${currentKey} nextKey=${nextKey} timeByKeyKeys=${Object.keys(timeByKey).join(",")}`;
    }
   } catch (e) {
    // Durum bildirimi hesaplamasında beklenmedik bir hata olursa (ör. bozuk saat verisi),
    // bunu SESSİZCE yutmuyoruz ama normal hatırlatıcı bildirimlerini de ETKİLEMİYORUZ —
    // sadece durum bildirimi kısmı atlanır, hata debug bilgisine yazılır.
    statusDebug = `EXCEPTION: ${e instanceof Error ? e.message : String(e)}`;
   }
  }

  // TÜM bildirimlerin iOS/Android'e tek bir DEV batch ile gönderilmesi bazı cihazlarda
  // (özellikle Android 16/Nothing OS gibi agresif sistemlerde) sessizce BAŞARISIZ
  // olabiliyor — tek hatalı bildirim tüm grubu düşürüyordu ve "kullanılmayan kanal"
  // olarak görülmesinin sebebi buydu. Bu yüzden batch'i KÜÇÜK parçalara (5'er) bölüp
  // sırayla gönderiyoruz: bir parça patlasa bile geri kalanlar planlanmaya devam eder.
  // Her parça 8 saniyelik zaman aşımına (Promise.race) bağlı — hiçbir çağrı sessizce
  // asılı kalamaz. İşin sonunda LocalNotifications.pending() ile GERÇEK kayıtlı alarm
  // sayısı okunur; "kaç planlandı" değil "kaç GERÇEKTEN PLANA GİRDİ" bilgisi döner.
  let failures: string[] = [];
  if (notifications.length > 0) {
    const CHUNK = 5;
    for (let i = 0; i < notifications.length; i += CHUNK) {
      const chunk = notifications.slice(i, i + CHUNK);
      try {
        await Promise.race([
          LocalNotifications.schedule({ notifications: chunk }),
          new Promise((_, reject) => setTimeout(() => reject(new Error("timeout-8s")), 8000)),
        ]);
      } catch (e) {
        failures.push(
          `${chunk[0]?.id ?? "?"}..${chunk[chunk.length - 1]?.id ?? "?"}: ${e instanceof Error ? e.message : String(e)}`,
        );
      }
    }
  }

  let pendingCount = 0;
  try {
    pendingCount = (await LocalNotifications.pending()).notifications.length;
  } catch {}

  const ok = failures.length === 0;
  return {
    success: ok,
    scheduledCount: pendingCount,
    error: ok ? undefined : `schedule-kismi: ${failures.join(" | ")} (requested=${notifications.length}, pending=${pendingCount})`,
    debug: `${statusDebug} |requested=${notifications.length} pending=${pendingCount}`,
  };
}

/** Cihazda şu an GERÇEKTEN bekleyen (native'de kayıtlı) bildirim/alarm sayısı. */
export async function countPendingNotifications(): Promise<number> {
  try {
    return (await LocalNotifications.pending()).notifications.length;
  } catch {
    return -1;
  }
}

/**
 * "Bildirimler" sekmesindeki "Test bildirimi gönder" butonu. Bildirim ALTYAPISININ
 * (kanal + meansly izinli alarm tetikleme) gerçekten çalışıp çalışmadığını cihazda
 * doğrudan göstermek için 1 saniye sonrasına varsayılan kanalda bir bildirim planlar.
 * Vakit bildirimleriyle birebir aynı native yolu kullanır (allowWhileIdle dahil).
 */
export async function sendTestNotification(lang: LangCode): Promise<void> {
  const TEST_TEXTS: Record<string, { title: string; body: string }> = {
    tr: { title: "🕌 Test Bildirimi", body: "Bunu görüyorsan her şey çalışıyor. Vakitli bildirimler de aynen bu şekilde gelecek." },
    en: { title: "🕌 Test notification", body: "If you see this, everything works. Prayer notifications are delivered exactly the same way." },
    de: { title: "🕌 Testbenachrichtigung", body: "Wenn du dies siehst, funktioniert alles. Gebetsbenachrichtigungen kommen genauso an." },
    ar: { title: "🕌 إشعار تجريبي", body: "إذا رأيت هذا فكل شيء يعمل. إشعارات الصلاة تصل بنفس الطريقة." },
    ur: { title: "🕌 ٹیسٹ اطلاع", body: "اگر آپ یہ دیکھ رہے ہیں تو سب کچھ ٹھیک ہے۔ نماز کی اطلاعات اسی طرح آئیں گی۔" },
  };
  const text = TEST_TEXTS[lang] || TEST_TEXTS.en;
  const TEST_ID = 7999;
  await LocalNotifications.schedule({
    notifications: [{
      id: TEST_ID,
      title: text.title,
      body: text.body,
      schedule: { at: new Date(Date.now() + 1000), allowWhileIdle: true },
      channelId: CHANNEL_DEFAULT,
      sound: "default",
      smallIcon: "ic_stat_notify",
      iconColor: "#f59e0b",
      autoCancel: true,
      extra: { timeoutMs: 10 * 60 * 1000 },
    }],
  });
}

// Ayarları localStorage'a kaydet/yükle
export function saveNotificationSettings(s: NotificationSettings): void {
  localStorage.setItem("mnv_notification_settings", JSON.stringify(s));
}

export function loadNotificationSettings(): NotificationSettings {
  try {
    const s = localStorage.getItem("mnv_notification_settings");
    if (s) {
      const parsed = JSON.parse(s);
      // Geriye dönük uyumluluk: eski sürümlerde "soundType" (tek, global) ya da
      // "soundTypeAtVakit" ile birlikte "soundTypeBefore" alanı vardı. "Önce" hatırlatması
      // artık her zaman varsayılan sesle çalıştığından sadece "vakit girdiğinde" sesi
      // taşınıyor; eski tercih varsa (soundTypeAtVakit yoksa) ona göre ayarlanıyor.
      if (!parsed.soundTypeAtVakit) {
        parsed.soundTypeAtVakit = parsed.soundType || "ezan";
      }
      delete parsed.soundTypeBefore;
      delete parsed.soundType;
      return { ...DEFAULT_NOTIFICATION_SETTINGS, ...parsed };
    }
  } catch {}
  return { ...DEFAULT_NOTIFICATION_SETTINGS };
}