import { registerPlugin } from "@capacitor/core";

// Native tarafta (android/.../BatteryHelperPlugin.kt) tanımlı, MainActivity'de
// registerPlugin(BatteryHelperPlugin.class) ile kaydedilmesi gereken küçük plugin.
// Web'de veya native tarafta plugin bulunamazsa çağrılar sessizce no-op olur
// (try/catch ile aşağıda korunuyor), bu yüzden import her ortamda güvenlidir.
interface BatteryHelperPluginType {
  requestIgnoreBatteryOptimizations(): Promise<void>;
  openXiaomiAutostartSettings(): Promise<{ opened: boolean }>;
}

const BatteryHelper = registerPlugin<BatteryHelperPluginType>("BatteryHelper");

/**
 * Cihazın MIUI/HyperOS (Xiaomi/Redmi/POCO) olup olmadığını User-Agent üzerinden
 * kabaca tespit eder. %100 güvenilir değildir (bazı MIUI sürümleri UA'da bunu
 * belirtmeyebilir) ama ek bir native cihaz-bilgisi bağımlılığı istemeden makul bir
 * yaklaşık değer sağlar.
 */
export function isLikelyXiaomi(): boolean {
  try {
    const ua = navigator.userAgent.toLowerCase();
    return ua.includes("miui") || ua.includes("xiaomi") || ua.includes("redmi") || ua.includes("poco");
  } catch {
    return false;
  }
}

/**
 * Pil optimizasyonu muafiyeti ister (Android'in standart
 * ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS diyaloğu). Tüm OEM'lerde (sadece
 * Xiaomi değil) bekleyen alarm bildirimlerinin Doze modunda gecikmeden/iptal
 * olmadan tetiklenme ihtimalini artırır. Kullanıcı reddedebilir; hata fırlatmaz.
 */
export async function promptBatteryWhitelist(): Promise<void> {
  try {
    await BatteryHelper.requestIgnoreBatteryOptimizations();
  } catch {
    // native plugin yok (web önizleme) veya çağrı başarısız oldu — sessizce geç
  }
}

/**
 * MIUI'nin "Otomatik Başlatma" (Autostart) yönetim ekranını doğrudan açar.
 * Bu ayar kapalıyken MIUI, arka planda çalışan/alarm tetikleyen uygulamaları
 * agresif şekilde kısıtlayabiliyor — ezan bildirimiyle etkileşime girildiğinde
 * (örn. ses tuşuna basılması) günün geri kalanındaki bildirimlerin sessizce
 * iptal olmasının başlıca sebebi budur.
 * MIUI olmayan cihazlarda veya ekran bulunamazsa `opened: false` döner.
 */
export async function promptXiaomiAutostart(): Promise<boolean> {
  try {
    const r = await BatteryHelper.openXiaomiAutostartSettings();
    return r.opened;
  } catch {
    return false;
  }
}
