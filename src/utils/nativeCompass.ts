import { Capacitor, registerPlugin } from "@capacitor/core";

// Native tarafta (android/app/src/main/java/.../QiblaSensorPlugin.java) tanımlı;
// build-local.sh içindeki scripts/local-build/add_qibla_plugin.py üretip
// MainActivity'ye kaydeder. Web önizlemede/plugin yoksa çağrılar null döner.

interface QiblaSensorPluginType {
  start(): Promise<{ ok: boolean }>;
  getHeading(): Promise<{ ok?: boolean; heading?: number; total?: number }>;
  stop(): Promise<void>;
}

const QiblaSensor = registerPlugin<QiblaSensorPluginType>("QiblaSensor");

/**
 * Ham manyetometre + ivmeölçerden hesaplanan yön (derece, manyetik kuzey).
 * OS'un rotation-vector füzyonu yaw'ı kaydırdığında (bilinen cihaz hatası) doğru
 * referansı verir. Native değilse, sensör yoksa veya manyetik alan şiddeti
 * olağandışıysa (girişim) null döner.
 */
export async function nativeCompassHeading(): Promise<number | null> {
  if (!Capacitor.isNativePlatform()) return null;
  try {
    const r = await QiblaSensor.getHeading();
    if (!r || r.ok !== true || typeof r.heading !== "number" || !Number.isFinite(r.heading)) return null;
    // Yerkürenin alanı ~45-50 µT; 62 µT üzeri el/metal girişimi demek (bu cihazda
    // 46→82 µT ölçüldü). Girişimli örnek referans olarak kullanılmamalı.
    if (typeof r.total === "number" && (r.total < 30 || r.total > 62)) return null;
    return ((r.heading % 360) + 360) % 360;
  } catch {
    return null;
  }
}

/** Native sensör dinleyicilerini bırakır (pusula kapatıldığında pil için). */
export async function stopNativeCompass(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await QiblaSensor.stop();
  } catch {
    // plugin yok — yoksay
  }
}
