import { Capacitor, registerPlugin } from "@capacitor/core";

// Native tarafta (android/app/src/main/java/.../QiblaSensorPlugin.java) tanımlı;
// build-local.sh içindeki scripts/local-build/add_qibla_plugin.py üretip
// MainActivity'ye kaydeder. Web önizlemede/plugin yoksa çağrılar null döner.

interface QiblaSensorPluginType {
  start(): Promise<{ ok: boolean }>;
  getHeading(): Promise<{ ok?: boolean; heading?: number; total?: number; horizontal?: number; accuracy?: number }>;
  stop(): Promise<void>;
}

const QiblaSensor = registerPlugin<QiblaSensorPluginType>("QiblaSensor");

export interface NativeCompassSample {
  /** Manyetik kuzeye göre yön (0-360), kalite kapısı uygulanmadan. */
  heading: number;
  /** Toplam manyetik alan şiddeti (μT); sensör vermezse null. */
  total: number | null;
  /** Alanın yatay bileşeni (μT) — yönü bozan asıl büyüklük; sensör vermezse null. */
  horizontal: number | null;
  /**
   * Manyetometre kalibrasyon durumu (Android): 0 güvenilmez, 1 düşük, 2 orta,
   * 3 yüksek. 0/1 ise pusula "8 çiz" kalibrasyonu istiyor demektir.
   * Sensör/plugin bu bilgiyi vermezse null.
   */
  accuracy: number | null;
}

/**
 * Ham manyetometre + ivmeölçerden gelen yön, alan şiddeti ve sensörün bildirdiği
 * kalibrasyon kalitesi. Kalite kararı (girişim / kalibrasyon) çağıran tarafa aittir.
 */
export async function nativeCompassSample(): Promise<NativeCompassSample | null> {
  if (!Capacitor.isNativePlatform()) return null;
  try {
    const r = await QiblaSensor.getHeading();
    if (!r || r.ok !== true || typeof r.heading !== "number" || !Number.isFinite(r.heading)) return null;
    return {
      heading: ((r.heading % 360) + 360) % 360,
      total: typeof r.total === "number" && Number.isFinite(r.total) ? r.total : null,
      horizontal: typeof r.horizontal === "number" && Number.isFinite(r.horizontal) ? r.horizontal : null,
      accuracy: typeof r.accuracy === "number" && Number.isFinite(r.accuracy) ? r.accuracy : null,
    };
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