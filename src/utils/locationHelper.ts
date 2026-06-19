import { Geolocation } from "@capacitor/geolocation";

// Capacitor Geolocation API var mı? (APK'da var, web'de fallback kullanılır)
function isNativeAvailable(): boolean {
  try {
    return typeof Geolocation !== "undefined" &&
      typeof Geolocation.requestPermissions === "function";
  } catch {
    return false;
  }
}

// Native (Android) konum izni iste — sistem pop-up'ını tetikler
export async function requestLocationPermission(): Promise<boolean> {
  if (isNativeAvailable()) {
    try {
      const result = await Geolocation.requestPermissions();
      return result.location === "granted" || result.coarseLocation === "granted";
    } catch {
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
    const pos = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000,
    });
    return { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
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
