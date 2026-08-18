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

// "Şu an hangi vakitteyiz" durum bildirimi için sabit ID'ler ve zincir sırası.
// Her biri, native tarafta (TimedNotificationPublisher yaması ile) kendisinden hemen
// önceki ID'yi otomatik olarak iptal eder — böylece gün boyunca HER ZAMAN tek bir
// bildirim görünür, birikme olmaz. Sadece BUGÜN için planlanır (yarın için değil),
// çünkü aynı ID'yi iki farklı güne planlamak birbirini iptal eder; uygulama her
// açıldığında / ayarlar değiştiğinde otomatik tazelenir.
const STATUS_ORDER: (keyof NotificationSettings["prayers"])[] = ["imsak", "gunes", "ogle", "ikindi", "aksam", "yatsi"];
const STATUS_IDS: Record<keyof NotificationSettings["prayers"], number> = {
  imsak: 9000, gunes: 9001, ogle: 9002, ikindi: 9003, aksam: 9004, yatsi: 9005,
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
      await LocalNotifications.cancel({
        notifications: STATUS_ORDER.map(k => ({ id: STATUS_IDS[k] })),
      });
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

  prayerTimes.forEach((prayer, idx) => {
    const prayerKey = prayer.key as keyof typeof settings.prayers;
    if (!settings.prayers[prayerKey]) return;
    const prayerName = PRAYER_NAMES[prayer.key]?.[lang] || prayer.name;

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
            channelId: channelIdBefore,
            sound: soundFileBefore,
            smallIcon: "ic_stat_notify",
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
            channelId: channelIdAtVakit,
            sound: soundFileAtVakit,
            smallIcon: "ic_stat_notify",
            iconColor: "#f59e0b",
          });
        }
      }
    }
  });

  // "Şu an hangi vakitteyiz" durum bildirimi — sadece BUGÜN için, 6 sabit ID'lik zincir.
  // Her biri (ileride) tetiklendiğinde native yama (extra.cancelPreviousId) sayesinde
  // kendinden önceki durumu otomatik siler.
  //
  // ÖNEMLİ: Bu fonksiyon her çağrıldığında (ayar açıldığında, uygulama her açılışında/
  // konum-tarih değiştiğinde vb.) önce TÜM bekleyen bildirimleri iptal eder (yukarıdaki
  // cancelAllNotifications). Eskiden burada SADECE gelecekteki vakit geçişleri planlanıyordu;
  // bu yüzden (a) ayar açıldığı anda mevcut vakit için hiçbir bildirim gösterilmiyordu —
  // ilk gösterim bir sonraki vakit geçişine kadar bekliyordu, ve (b) uygulama her
  // açıldığında iptal edilen durum bildirimi de aynı sebeple hemen geri gelmiyordu.
  // Çözüm: her çağrıda, "şu an" hangi vakitteysek onun bildirimini DERHAL (schedule
  // olmadan, anında) gösteriyoruz; kalan gelecekteki geçişler eskisi gibi ileri tarihli
  // planlanmaya devam ediyor.
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
    };
    const stx = (key: string, vars: Record<string, string>) => {
      let s = STATUS_TEXTS[key][lang] || STATUS_TEXTS[key].en;
      Object.entries(vars).forEach(([k, v]) => { s = s.replace(`{${k}}`, v); });
      return s;
    };
    const buildStatusBody = (nextKey: string, nextTime: string) => {
      const nextName = PRAYER_NAMES[nextKey]?.[lang] || nextKey;
      return nextKey === "gunes"
        ? stx("bodySunrise", { time: nextTime })
        : stx("bodyPrayer", { next: nextName, time: nextTime });
    };

    const timeByKey: Record<string, string> = {};
    prayerTimes.forEach(p => { timeByKey[p.key] = p.time; });
    const tomorrowTimeByKey: Record<string, string> = {};
    (tomorrowPrayerTimes || []).forEach(p => { tomorrowTimeByKey[p.key] = p.time; });

    // "Şu an" hangi vakitteyiz? Bugünün saatleri arasında now'dan önceki SON vakti bul.
    // Hiçbiri now'dan önce değilse (yani henüz imsak girmemiş), demek ki hâlâ dünün
    // yatsı vaktindeyiz — zincirin son elemanını "şu an" kabul ediyoruz.
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
    // yaklaşık değer olarak kullanmaya devam et (veri çekilemediyse tamamen
    // susmaktansa yaklaşık doğru bir saat göstermek daha iyi).
    const isWrapToTomorrow = currentIdx === STATUS_ORDER.length - 1;
    const nextTime = (isWrapToTomorrow && tomorrowTimeByKey[nextKey])
      ? tomorrowTimeByKey[nextKey]
      : (timeByKey[nextKey] || "");

    if (nextTime) {
      // 1) "Şu an" için ANINDA göster. NOT: `schedule` alanını tamamen boş bırakmak
      //    (hiç zamanlama vermemek) native tarafta güvenilir şekilde ÇALIŞMIYOR —
      //    plugin bazı Android sürümlerinde/cihazlarda bu tür "zamanlamasız"
      //    bildirimleri sessizce hiç göstermiyor (schedule() başarıyla dönse bile).
      //    Bunun yerine çok yakın bir gelecek an (2 saniye sonrası) veriyoruz; bu,
      //    "kesin alarm" izni gerektirmeyen normal/inexact planlama olduğu için
      //    hem güvenilir çalışıyor hem de pratikte anında görünüyor.
      //    ÖNEMLİ: extra.cancelPreviousId de eklendi — böylece BİR ÖNCEKİ vaktin
      //    (farklı ID'li) bildirimi, bu tetiklendiğinde native yama tarafından
      //    otomatik temizleniyor; ayrıca burada elle "önce iptal et" YAPMIYORUZ
      //    (bu, aynı anda iptal+yeniden planlama yarış durumuna yol açıyordu).
      const prevOfCurrentKey = STATUS_ORDER[(currentIdx - 1 + STATUS_ORDER.length) % STATUS_ORDER.length];
      notifications.push({
        id: STATUS_IDS[currentKey],
        title: stx("title", { name: PRAYER_NAMES[currentKey]?.[lang] || currentKey }),
        body: buildStatusBody(nextKey, nextTime),
        schedule: { at: new Date(now.getTime() + 2000) },
        channelId: CHANNEL_STATUS,
        sound: "default",
        smallIcon: "ic_stat_notify",
        iconColor: "#f59e0b",
        ongoing: false,
        autoCancel: false,
        extra: { cancelPreviousId: STATUS_IDS[prevOfCurrentKey] },
      });

      // 2) Bugün kalan gelecekteki vakit geçişlerini eskisi gibi ileri tarihli planla.
      //    Her biri tetiklendiğinde native yama, zincirdeki kendinden önceki ID'yi
      //    (currentKey dahil) otomatik iptal eder.
      STATUS_ORDER.forEach((key, i) => {
        const timeStr = timeByKey[key];
        if (!timeStr) return;
        const [h, m] = timeStr.split(":").map(Number);
        const triggerDate = new Date(now);
        triggerDate.setHours(h, m, 0, 0);
        if (triggerDate <= now) return; // geçmiş vakit, zaten yukarıda "şu an" olarak ele alındı

        const thisNextKey = STATUS_ORDER[(i + 1) % STATUS_ORDER.length];
        const thisIsWrapToTomorrow = i === STATUS_ORDER.length - 1; // key === "yatsi"
        const thisNextTime = (thisIsWrapToTomorrow && tomorrowTimeByKey[thisNextKey])
          ? tomorrowTimeByKey[thisNextKey]
          : (timeByKey[thisNextKey] || "");
        const prevKey = STATUS_ORDER[(i - 1 + STATUS_ORDER.length) % STATUS_ORDER.length];

        notifications.push({
          id: STATUS_IDS[key],
          title: stx("title", { name: PRAYER_NAMES[key]?.[lang] || key }),
          body: buildStatusBody(thisNextKey, thisNextTime),
          schedule: { at: triggerDate },
          channelId: CHANNEL_STATUS,
          sound: "default",
          smallIcon: "ic_stat_notify",
          iconColor: "#f59e0b",
          ongoing: false,
          autoCancel: false,
          extra: { cancelPreviousId: STATUS_IDS[prevKey] },
        });
      });

      // 3) YARININ İMSAK GEÇİŞİNİ de açıkça (gerçek bir alarm olarak) planla. Yukarıdaki
      //    döngü sadece BUGÜNÜN saatlerini kapsıyor, yani yatsıdan imsağa geçiş hiçbir
      //    zaman otomatik bir tetikleyici olarak kurulmuyordu — kullanıcı gece 00:00 ile
      //    İmsak arasında uygulamayı hiç açmazsa bu geçiş kendiliğinden hiç gerçekleşmezdi.
      //    Şimdi, elimizde yarının verisi varsa, tam o ana planlanmış gerçek bir bildirim
      //    ekliyoruz — otomatik akşam→yatsı geçişiyle birebir aynı güvenilir mekanizma.
      //    NOT: currentKey zaten "imsak" ise, id=9000 üstteki ANINDA gösterim için
      //    kullanılmış oluyor — aynı ID'yi iki kez eklememek için bu durumda atlıyoruz.
      if (currentKey !== "imsak" && tomorrowTimeByKey["imsak"]) {
        const [th, tm] = tomorrowTimeByKey["imsak"].split(":").map(Number);
        const tomorrowImsakDate = new Date(now);
        tomorrowImsakDate.setDate(tomorrowImsakDate.getDate() + 1);
        tomorrowImsakDate.setHours(th, tm, 0, 0);
        if (tomorrowImsakDate > now) {
          const afterImsakKey = STATUS_ORDER[1]; // "gunes" — imsaktan sonraki vakit
          const afterImsakTime = tomorrowTimeByKey[afterImsakKey] || "";
          notifications.push({
            id: STATUS_IDS["imsak"],
            title: stx("title", { name: PRAYER_NAMES["imsak"]?.[lang] || "imsak" }),
            body: buildStatusBody(afterImsakKey, afterImsakTime),
            schedule: { at: tomorrowImsakDate },
            channelId: CHANNEL_STATUS,
            sound: "default",
            smallIcon: "ic_stat_notify",
            iconColor: "#f59e0b",
            ongoing: false,
            autoCancel: false,
            extra: { cancelPreviousId: STATUS_IDS["yatsi"] },
          });
        }
      }

      statusDebug = `ok cur=${currentKey} next=${nextKey}@${nextTime}`;
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

  if (notifications.length > 0) {
    try {
      // GÜVENLİK: LocalNotifications.schedule() bazı cihazlarda/durumlarda (özellikle
      // gece yarısı geçişinde, normalden daha kalabalık bir bildirim grubu gönderilirken)
      // hiç hata vermeden SONSUZA KADAR asılı kalabiliyor — ne başarı ne hata döner,
      // arayüz kilitlenir. Bunu Promise.race ile zaman aşımına bağlıyoruz: 8 saniye
      // içinde cevap gelmezse net bir "timeout" hatası döndürüyoruz, sessizce asılı
      // kalmak yerine.
      await Promise.race([
        LocalNotifications.schedule({ notifications }),
        new Promise((_, reject) => setTimeout(() => reject(new Error("timeout-8s")), 8000)),
      ]);
    } catch (e) {
      return { success: false, scheduledCount: 0, error: `schedule-error: ${e instanceof Error ? e.message : String(e)} (count=${notifications.length})`, debug: statusDebug };
    }
  }

  return { success: true, scheduledCount: notifications.length, debug: statusDebug };
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
