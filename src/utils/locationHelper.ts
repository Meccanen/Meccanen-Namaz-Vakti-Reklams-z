import { Geolocation } from "@capacitor/geolocation";
import type { Location } from "../types";

// Cihazın kendi saat dilimi. GPS ile "bulunduğum konum" alındığında kullanıcı
// fiziksel olarak orada olduğu için en doğru kaynak budur (ağ gerekmez).
export function getDeviceTimezone(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && tz !== "UTC" && tz !== "Etc/UTC" && tz !== "Etc/GMT") return tz;
  } catch {}
  return "";
}

// Koordinatın gerçek IANA saat dilimini Open-Meteo'dan çöz. Başarısız olursa null.
export async function fetchTimezone(latitude: number, longitude: number): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&timezone=auto&forecast_days=1`,
      { signal: controller.signal },
    );
    clearTimeout(timer);
    if (res.ok) {
      const data = await res.json();
      if (typeof data?.timezone === "string" &&
          data.timezone && data.timezone !== "GMT" && data.timezone !== "UTC") {
        return data.timezone;
      }
    }
  } catch {}
  return null;
}

// Saat dilimini çöz: önce gerçek veri (Open-Meteo), olmazsa verilen yedek, en son
// boylam tahmini. Yedek genellikle cihazın saat dilimidir.
export async function resolveTimezone(
  latitude: number,
  longitude: number,
  fallback?: string,
): Promise<string> {
  return (await fetchTimezone(latitude, longitude)) || fallback || guessTimezone(longitude);
}

// Boylamdan kaba bir saat dilimi tahmini üret — SADECE son çare.
// DİKKAT: DST uygulamayan ülkeleri yanlış eşleyebilir (ör. Türkiye'nin batısı
// 26°–37.5° → "Europe/Helsinki"); yaz saati bitince 1 saat kayma yapar.
// Bu yüzden GPS'te cihaz saat dilimi, aramada Open-Meteo saat dilimi kullanılır.
export function guessTimezone(lng: number): string {
  const offset = Math.round(lng / 15);
  const MAP: Record<string, string> = {
    "-12":"Etc/GMT+12","-11":"Pacific/Midway","-10":"Pacific/Honolulu","-9":"America/Anchorage",
    "-8":"America/Los_Angeles","-7":"America/Denver","-6":"America/Chicago","-5":"America/New_York",
    "-4":"America/Halifax","-3":"America/Sao_Paulo","-2":"Atlantic/South_Georgia","-1":"Atlantic/Azores",
    "0":"Europe/London","1":"Europe/Berlin","2":"Europe/Helsinki","3":"Europe/Istanbul",
    "4":"Asia/Dubai","5":"Asia/Karachi","6":"Asia/Dhaka","7":"Asia/Bangkok",
    "8":"Asia/Singapore","9":"Asia/Tokyo","10":"Australia/Sydney","11":"Pacific/Noumea","12":"Pacific/Auckland",
  };
  return MAP[String(offset)] || "Europe/London";
}

export const DEFAULT_LOCATION: Location = {
  name: "İstanbul", country: "Türkiye",
  latitude: 41.0082, longitude: 28.9784,
  timezone: "Europe/Istanbul", admin1: "Marmara",
};

// Capacitor Geolocation API var mı? (APK'da var, web'de fallback kullanılır)
function isNativeAvailable(): boolean {
  try {
    const available = typeof Geolocation !== "undefined" &&
      typeof Geolocation.requestPermissions === "function";
    console.log("[Meccanen] Geolocation native available:", available);
    return available;
  } catch (e) {
    console.log("[Meccanen] Geolocation native check failed:", e);
    return false;
  }
}

// Native (Android) konum izni iste — sistem pop-up'ını tetikler
export async function requestLocationPermission(): Promise<boolean> {
  if (isNativeAvailable()) {
    try {
      console.log("[Meccanen] Requesting native location permission...");
      const result = await Geolocation.requestPermissions();
      console.log("[Meccanen] Permission result:", JSON.stringify(result));
      return result.location === "granted" || result.coarseLocation === "granted";
    } catch (e) {
      console.log("[Meccanen] Permission request failed:", e);
      return false;
    }
  }
  // Web fallback (tarayıcıda test ederken)
  if (!navigator.geolocation) return false;
  return new Promise(resolve => {
    navigator.geolocation.getCurrentPosition(
      () => resolve(true),
      () => resolve(false),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  });
}

// Mevcut izin durumunu kontrol et (pop-up göstermeden)
export async function checkLocationPermission(): Promise<boolean> {
  if (isNativeAvailable()) {
    try {
      const result = await Geolocation.checkPermissions();
      return result.location === "granted" || result.coarseLocation === "granted";
    } catch {
      return false;
    }
  }
  return false;
}

// Konum koordinatlarını al
export async function getCurrentPosition(): Promise<{ latitude: number; longitude: number }> {
  if (isNativeAvailable()) {
    try {
      const pos = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 20000,
      });
      console.log("[Meccanen] Got position:", pos.coords.latitude, pos.coords.longitude);
      return { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
    } catch (e) {
      console.log("[Meccanen] getCurrentPosition failed:", e);
      throw e;
    }
  }
  // Web fallback
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      err => reject(err),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  });
}
