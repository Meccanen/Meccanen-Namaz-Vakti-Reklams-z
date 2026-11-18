import { nativeCompassSample, stopNativeCompass, type NativeCompassSample } from "./nativeCompass";

const KAABA_LAT = 21.4225;
const KAABA_LNG = 39.8262;

const toRad = Math.PI / 180;
const toDeg = 180 / Math.PI;
const norm360 = (a: number) => ((a % 360) + 360) % 360;
const norm180 = (a: number) => ((((a + 540) % 360) + 360) % 360) - 180;

// Manyetik alan şiddeti konuma göre 22–67 μT arasında değişir (ekvator çevresinde
// zayıf, kutup/Atlantik anomalisinde güçlü). Bu yüzden sabit bir μT eşiği global
// uygulamada yanlış olur: Brezilya'da 23 μT normaldir, Almanya'da 48 μT.
// Konumun beklenen alanı biliniyorsa oransal sapma, bilinmiyorsa mutlak yedek kullanılır.
//
// Ölçüt olarak önce alanın YATAY bileşeni kullanılır (yönü bozan büyüklük odur);
// yatay bilgi yoksa toplam şiddete düşülür.
const HORIZ_TOLERANCE = 0.40;   // yatay sapma %40'ı geçince girişim başlar
const HORIZ_RELEASE = 0.28;     // %28'in altına dönünce biter (eşikte titremesin)
const FIELD_TOLERANCE = 0.38;   // toplam şiddet için giriş
const FIELD_RELEASE = 0.25;     // toplam şiddet için çıkış
const FALLBACK_MIN_UT = 30;
const FALLBACK_MAX_UT = 62;

/** Kâbe'nin gerçek (coğrafi) kuzeye göre kerterizi. Cihaz yönü manyetik olduğu için
 *  geomag.magneticDeclination() ile düzeltilmeden doğrudan kullanılmamalıdır. */
export function calcQiblaDirection(lat: number, lng: number): number {
  const dLng = (KAABA_LNG - lng) * toRad;
  const latR = lat * toRad;
  const kaabaLatR = KAABA_LAT * toRad;
  const y = Math.sin(dLng);
  const x = Math.cos(latR) * Math.tan(kaabaLatR) - Math.sin(latR) * Math.cos(dLng);
  return norm360(Math.atan2(y, x) * toDeg);
}

export function requestCompassPermission(): Promise<boolean> {
  const e = (DeviceOrientationEvent as unknown) as { requestPermission?: () => Promise<PermissionState> };
  if (typeof e.requestPermission === "function") {
    return e.requestPermission().then(s => s === "granted").catch(() => false);
  }
  return Promise.resolve(true);
}

/** Ekranın döndürülme açısı: SVG'deki "yukarı" cihazın üst kenarı değilse (yatay mod)
 *  yönün bu kadar eklenmesi gerekir, aksi halde ibre 90°/180° kayar. */
function screenAngle(): number {
  if (typeof screen !== "undefined" && screen.orientation && typeof screen.orientation.angle === "number") {
    return norm360(screen.orientation.angle);
  }
  const legacy = (window as unknown as { orientation?: number }).orientation;
  return typeof legacy === "number" ? norm360(legacy) : 0;
}

/**
 * Cihazın manyetik kuzeye göre yönü (0-360, saat yönü).
 *
 * İki eksen arasında, gözlemcinin baktığı yöne en yakın olanı seçilir:
 *  - telefon düz tutulduğunda üst kenarın (y ekseni) yatay izdüşümü,
 *  - telefon dik tutulduğunda arka yüz normali (-z ekseni), yani kullanıcının baktığı yön.
 * Tek eksen kullanıldığında bu iki tutuştan biri (düz ya da dik) matematiksel olarak
 * dejenere olur: dik tutuşta üst kenarın izdüşümü sıfıra gider ve sensör gürültüsü
 * 1/cos(beta) kadar büyür, düz tutuşta ekran normali sıfıra gider.
 */
export function getCompassHeading(e: DeviceOrientationEvent): number | null {
  // iOS: webkitCompassHeading hem mutlak hem eğimden bağımsız gelir
  const wk = (e as unknown as { webkitCompassHeading?: number }).webkitCompassHeading;
  if (wk !== undefined && wk !== null) return norm360(wk);
  if (e.alpha === null || e.beta === null || e.gamma === null) return null;

  const a = e.alpha * toRad, b = e.beta * toRad, g = e.gamma * toRad;
  const cA = Math.cos(a), sA = Math.sin(a);
  const cB = Math.cos(b), sB = Math.sin(b);
  const cG = Math.cos(g), sG = Math.sin(g);

  // y ekseni (üst kenar) yatay izdüşümü; |.| = |cos beta|
  const yE = -sA * cB;
  const yN = cA * cB;
  // z ekseni (ekran normali); |.| = sqrt(sin²g + sin²b·cos²g)
  const zE = cA * sG + sA * sB * cG;
  const zN = sA * sG - cA * sB * cG;

  const yMag = Math.hypot(yE, yN);
  const zMag = Math.hypot(zE, zN);

  // Arka yüz yönü kullanılır (ekran kullanıcıya bakar), bu yüzden z negatiflenir.
  const useTop = yMag >= zMag;
  const east = useTop ? yE : -zE;
  const north = useTop ? yN : -zN;

  if (Math.hypot(east, north) < 0.05) return null;
  return norm360(Math.atan2(east, north) * toDeg);
}

/**
 * Pusula dinleyicisi.
 *
 * Telefonda gözlenen davranış: `deviceorientationabsolute` olayları yalnızca yön
 * değiştiğinde seyrek geliyor (sabit tutulduğunda tamamen susuyor), `deviceorientation`
 * olayları ise sürekli akıyor ama `alpha`sı cihazın dinleyicinin eklendiği andaki
 * keyfî referansına göre geliyor (sabitken 0'da kalıyor) — yani tek başına kıble için
 * kullanılamaz. Bu yüzden mutlak olaylardan bir sapma (offset) öğrenilip sürekli gelen
 * göreli olaylara uygulanıyor: hem akıcı hem mutlak referanslı bir yön elde ediliyor.
 */
export interface CompassQuality {
  /** Manyetik alan normal aralığın dışında: ölçülen yön güvenilir değil. */
  interference: boolean;
  /** Manyetometre kalibrasyonu zayıf: "8 çiz" hareketiyle yeniden kalibre edilmeli. */
  calibrationNeeded: boolean;
}

export function attachCompassListener(
  callback: (heading: number) => void,
  onQuality?: (q: CompassQuality) => void,
  options?: { expectedFieldUt?: number | null; expectedHorizontalUt?: number | null },
): () => void {
  const num = (v: number | null | undefined, min: number) =>
    v !== null && v !== undefined && Number.isFinite(v) && v > min ? v : null;
  const expectedTotal = num(options?.expectedFieldUt, 10);
  const expectedHoriz = num(options?.expectedHorizontalUt, 5);
  const nowMs = () => (typeof performance !== "undefined" ? performance.now() : Date.now());

  let offset: number | null = null;          // mutlak - göreli referans farkı
  let lastRelative: number | null = null;    // son göreli yön
  let prevRelative: number | null = null;
  let relMoved = false;                     // göreli akışın gerçekten döndüğünü gördük mü
  let lastNative: number | null = null;      // ham manyetometreden gelen son yön
  let smoothed: number | null = null;
  let lastEmit = 0;

  const emit = (rawHeading: number) => {
    const h = norm360(rawHeading + screenAngle());
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    if (smoothed === null) {
      smoothed = h;
    } else {
      const dt = Math.max(0.01, (now - lastEmit) / 1000);
      // ~0.18 s zaman sabitli dairesel alçak geçiren filtre (0/360 sarmalı güvenli)
      const k = 1 - Math.exp(-dt / 0.18);
      smoothed = norm360(smoothed + k * norm180(h - smoothed));
    }
    lastEmit = now;
    callback(Math.round(smoothed * 10) / 10);
  };

  const isAbsoluteEvent = (e: DeviceOrientationEvent) =>
    (e as unknown as { webkitCompassHeading?: number }).webkitCompassHeading !== undefined ||
    (e as unknown as { absolute?: boolean }).absolute === true;

  // Mutlak referansın (OS füzyonu) bozulup bozulmadığını ayırt eder.
  // Fiziksel bir dönüş, mutlak ve göreli yönü AYNI miktarda değiştirir; dolayısıyla
  // (mutlak - göreli) farkı sabit kalır. Bu fark aniden büyük ölçüde değişiyorsa
  // telefon dönmemiş, mutlak referans zıplamıştır (MTK/QMC füzyonunda 180°+ kayma
  // gözlendi; ekranı kapatıp açmak düzeltiyor). Böyle örnekleri referans olarak
  // kabul etmiyoruz, aksi halde ibre de o bozuk değere kilitleniyor.
  const MAX_REF_JUMP = 12; // derece: bu kadar sapma yavaş sürüklenme sayılır, düzeltilir

  const handleAbsolute = (e: DeviceOrientationEvent) => {
    const h = getCompassHeading(e);
    if (h === null) return;

    if (offset === null) {
      // İlk mutlak örnek referansı belirler (dinleyici eklenirken göreli alpha = 0).
      offset = norm360(h - (lastRelative === null ? 0 : lastRelative));
    }

    if (!relMoved || lastRelative === null) {
      // Göreli akışın döndüğü hiç görülmediyse (bazı cihazlarda alpha hep sabit),
      // mutlak değerden başka seçenek yok — ama ham manyetometre referansı varsa
      // ve bu örneği doğrulamıyorsa gösterme (füzyon kayması doğrudan ibreye sıçrar).
      if (lastNative !== null && Math.abs(norm180(h - lastNative)) > 100) return;
      emit(h);
      return;
    }

    const diff = norm180(norm180(h - lastRelative) - offset);
    if (Math.abs(diff) <= MAX_REF_JUMP) {
      offset = norm360(offset + 0.1 * diff); // yavaş sürüklenme düzeltmesi
      emit(norm360(lastRelative + offset));
    }
    // Büyük sıçrama: mutlak referans bozuk -> örneği yok say. Göreli akış + mevcut
    // offset fiziksel dönüşü doğru izlemeye devam eder.
  };

  const handleRelative = (e: DeviceOrientationEvent) => {
    const h = getCompassHeading(e);
    if (h === null) return;

    if (isAbsoluteEvent(e)) {
      // iOS (webkitCompassHeading) ve mutlak değeri bu olay üzerinden veren sürümler
      emit(h);
      return;
    }

    if (prevRelative !== null && Math.abs(norm180(h - prevRelative)) > 2) relMoved = true;
    prevRelative = h;
    lastRelative = h;

    // Hiç mutlak referans yoksa göreli yön yanlış olur: ibreyi yanlış yöne çevirmek
    // yerine hiç veri göndermiyoruz (App bunu "pusula yok" olarak gösteriyor).
    if (offset !== null) emit(h + offset);
  };

  // Ham manyetometre referansı (native). OS füzyonu yaw'ı kaydırdığında (gözlenen
  // cihaz hatası: 180°+) tek doğru kaynak budur; WebView manyetometreye erişemez.
  // Küçük farklarda füzyonun daha yumuşak değeri korunur, sadece büyük kaymalarda
  // referans ham manyetometreden yeniden kurulur.
  let nativeBusy = false;
  let nativeHist: number[] = [];     // son güvenilir örnekler (medyan için)

  // Manyetik girişim tespiti: son ~1.2 s'lik pencerenin medyanı normal aralığın
  // dışındaysa uyarı. Pencere + medyan, tek tük gürültülü örneğin uyarıyı yakıp
  // söndürmesini engelliyor (debounce).
  const MAG_WINDOW = 5;              // 5 × 250 ms ≈ 1.2 s
  let magWindow: number[] = [];

  // Kalibrasyon: ardışık 5 kötü örnek (~1.25 s) uyarıyı açar, 3 iyi örnek (~0.75 s)
  // kapatır. Tek bir "düşük" raporu notu yakıp söndürmesin.
  let badAccuracy = 0;
  let goodAccuracy = 0;

  const quality: CompassQuality = { interference: false, calibrationNeeded: false };
  const publishQuality = () => onQuality?.({ ...quality });
  const setInterference = (on: boolean) => {
    if (on === quality.interference) return;
    quality.interference = on;
    publishQuality();
  };
  const setCalibrationNeeded = (on: boolean) => {
    if (on === quality.calibrationNeeded) return;
    quality.calibrationNeeded = on;
    publishQuality();
  };

  // Histerezis: giriş eşiği geniş, çıkış eşiği dar — alan eşik civarında salınırken
// uyarı açılıp kapanıp titremesin (masa üstünde ölçüldü: alan 64–70 μT arası oynuyor).
// Girişim kararı için ölçülecek büyüklük: yatay bileşen (yönü bozar), yoksa toplam.
  const fieldRef = (s: NativeCompassSample) => {
    if (expectedHoriz !== null && s.horizontal !== null)
      return { value: s.horizontal, ref: expectedHoriz, tolerance: HORIZ_TOLERANCE, release: HORIZ_RELEASE };
    if (expectedTotal !== null && s.total !== null)
      return { value: s.total, ref: expectedTotal, tolerance: FIELD_TOLERANCE, release: FIELD_RELEASE };
    return null;
  };
  // Konum/beklenen alan yoksa mutlak yedek aralık.
  const absoluteBad = (total: number) => total < FALLBACK_MIN_UT || total > FALLBACK_MAX_UT;

  // Referansı yalnızca GERÇEK bir füzyon kaymasında (~180°) sıfırlıyoruz. Eşik 45°
  // iken elde telefon tutmak manyetik alanı bozuyor (ölçüldü: 46→82 µT) ve ham
  // referans 30-40° kayıyor; 45° eşiği bu kaymayı "gerçek" sanıp ibreyi iki yönde
  // birden oynatıyordu.
  const NATIVE_FLIP = 100;     // derece: bunun üzeri füzyon kayması
  const NATIVE_STABLE = 12;    // art arda örnekler arasındaki en büyük fark
  const NATIVE_DRIFT_GAIN = 0.05;

  const pollNative = async () => {
    if (nativeBusy) return;
    nativeBusy = true;
    try {
      const sample = await nativeCompassSample();
      if (sample === null) { nativeHist = []; return; }

      // Alan kalitesi: son ~1.2 s'nin medyanı ile beklenen alan karşılaştırılır.
      // Histerezisli (giriş/çıkış eşiği ayrı) — eşik civarında uyarı titremesin.
      const field = fieldRef(sample);
      if (field !== null) {
        magWindow.push(field.value);
        if (magWindow.length > MAG_WINDOW) magWindow.shift();
        if (magWindow.length >= 3) {
          const sortedMag = [...magWindow].sort((x, y) => x - y);
          const mid = sortedMag[Math.floor(sortedMag.length / 2)];
          const dev = Math.abs(mid - field.ref) / field.ref;
          setInterference(quality.interference ? dev > field.release : dev > field.tolerance);
        }
      } else if (sample.total !== null) {
        magWindow.push(sample.total);
        if (magWindow.length > MAG_WINDOW) magWindow.shift();
        if (magWindow.length >= 3) {
          const sortedMag = [...magWindow].sort((x, y) => x - y);
          setInterference(absoluteBad(sortedMag[Math.floor(sortedMag.length / 2)]));
        }
      }

      // Manyetometre kalibrasyonu: 0 güvenilmez, 1 düşük -> "8 çiz" gerekir.
      if (sample.accuracy !== null) {
        if (sample.accuracy <= 1) { badAccuracy++; goodAccuracy = 0; }
        else { goodAccuracy++; badAccuracy = 0; }
        if (!quality.calibrationNeeded && badAccuracy >= 5) setCalibrationNeeded(true);
        else if (quality.calibrationNeeded && goodAccuracy >= 3) setCalibrationNeeded(false);
      }

      // Girişimli alanda yön hesabı güvenilmez: ham referansı besleme.
      const fieldOut = field !== null
        ? Math.abs(field.value - field.ref) / field.ref > field.tolerance
        : sample.total !== null && absoluteBad(sample.total);
      if (fieldOut) {
        nativeHist = [];
        return;
      }

      const h = sample.heading;

      // Kararlılık kapısı: tek bir gürültülü örnek referansı bozmasın.
      nativeHist.push(h);
      if (nativeHist.length > 4) nativeHist.shift();
      const sorted = [...nativeHist].sort((x, y) => x - y);
      const med = sorted[Math.floor(sorted.length / 2)];
      const spread = Math.max(...nativeHist.map(v => Math.abs(norm180(v - med))));
      if (nativeHist.length < 3 || spread > NATIVE_STABLE) return;

      lastNative = med;
      if (lastRelative === null) {
        if (offset === null) offset = med;
        emit(med);
        return;
      }
      const predicted = norm360(lastRelative + (offset ?? 0));
      const diff = norm180(med - predicted);
      if (offset === null || Math.abs(diff) > NATIVE_FLIP) {
        offset = norm360(med - lastRelative);
        nativeHist = [];          // yeni referans: yeniden biriktir
        emit(norm360(lastRelative + offset));
        return;
      }
      // Küçük fark: sıçratmadan yavaşça benimse (jıro sürüklenmesini toplar).
      if (Math.abs(diff) > 8) offset = norm360(offset! + NATIVE_DRIFT_GAIN * diff);
    } finally {
      nativeBusy = false;
    }
  };

  window.addEventListener("deviceorientationabsolute", handleAbsolute as EventListener);
  window.addEventListener("deviceorientation", handleRelative as EventListener);
  const nativeTimer = setInterval(pollNative, 250);
  void pollNative();

  return () => {
    clearInterval(nativeTimer);
    void stopNativeCompass();
    window.removeEventListener("deviceorientationabsolute", handleAbsolute as EventListener);
    window.removeEventListener("deviceorientation", handleRelative as EventListener);
  };
}
