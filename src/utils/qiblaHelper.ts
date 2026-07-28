const KAABA_LAT = 21.4225;
const KAABA_LNG = 39.8262;

export function calcQiblaDirection(lat: number, lng: number): number {
  const dLng = (KAABA_LNG - lng) * (Math.PI / 180);
  const latR = lat * (Math.PI / 180);
  const kaabaLatR = KAABA_LAT * (Math.PI / 180);
  const y = Math.sin(dLng);
  const x = Math.cos(latR) * Math.tan(kaabaLatR) - Math.sin(latR) * Math.cos(dLng);
  let angle = Math.atan2(y, x) * (180 / Math.PI);
  angle = (angle + 360) % 360;
  return angle;
}

export function requestCompassPermission(): Promise<boolean> {
  const e = (DeviceOrientationEvent as unknown) as { requestPermission?: () => Promise<PermissionState> };
  if (typeof e.requestPermission === "function") {
    return e.requestPermission().then(s => s === "granted");
  }
  return Promise.resolve(true);
}

// Android'de düz "deviceorientation" event'i genelde MUTLAK (manyetik kuzeye göre) değil,
// cihazın listener eklendiği andaki rastgele referansına göre RELATİF gelir. Bu da kıble okunu
// telefonu her açışta farklı (ve yanlış) bir yöne döndürür. Çözüm: önce "deviceorientationabsolute"
// event'ini dinle (gerçek pusula verisi, çoğu modern Android cihazda mevcut); o gelmiyorsa
// (bazı eski/özel cihazlarda desteklenmiyor) "deviceorientation"a düş, iOS'ta zaten
// webkitCompassHeading üzerinden mutlak değer geliyor (getCompassHeading bunu otomatik kullanıyor).
export function attachCompassListener(callback: (heading: number) => void): () => void {
  let absoluteReceived = false;

  const handleAbsolute = (e: DeviceOrientationEvent) => {
    absoluteReceived = true;
    const h = getCompassHeading(e);
    if (h !== null) callback(h);
  };

  const handleRelative = (e: DeviceOrientationEvent) => {
    // "deviceorientationabsolute" zaten veri gönderiyorsa, bu event'i yok say (çift/çakışan veri).
    // iOS'ta webkitCompassHeading üzerinden gelen değer her zaman mutlaktır, o yüzden iOS'ta
    // bu event hiçbir zaman göz ardı edilmez.
    const isIOSAbsolute = (e as unknown as { webkitCompassHeading?: number }).webkitCompassHeading !== undefined;
    if (absoluteReceived && !isIOSAbsolute) return;
    const h = getCompassHeading(e);
    if (h !== null) callback(h);
  };

  window.addEventListener("deviceorientationabsolute", handleAbsolute as EventListener);
  window.addEventListener("deviceorientation", handleRelative as EventListener);

  return () => {
    window.removeEventListener("deviceorientationabsolute", handleAbsolute as EventListener);
    window.removeEventListener("deviceorientation", handleRelative as EventListener);
  };
}

export function getCompassHeading(e: DeviceOrientationEvent): number | null {
  // iOS Safari'de webkitCompassHeading zaten tilt-compensated geliyor, doğrudan kullan
  if (e.webkitCompassHeading !== undefined && e.webkitCompassHeading !== null) {
    return e.webkitCompassHeading;
  }

  // Android / standart DeviceOrientationEvent.
  if (e.alpha === null || e.beta === null || e.gamma === null) return null;

  const alphaRad = (e.alpha * Math.PI) / 180;
  const betaRad = (e.beta * Math.PI) / 180;

  const cA = Math.cos(alphaRad), sA = Math.sin(alphaRad);
  const cB = Math.cos(betaRad);

  // Kıble pusulası telefon DÜZ tutularak (masada gibi, ekran yukarı bakacak şekilde)
  // kullanılır. Bu yüzden ekrana dik eksen (kamera/ekran normali) değil, telefonun
  // ÜST KENARININ yatay düzlemdeki izdüşümü esas alınmalı — önceki formül ekrana dik
  // ekseni kullanıyordu, bu da telefon düz tutulduğunda (yani tam da kıble pusulası
  // kullanım şeklinde) sıfıra yaklaşıp kararsızlaşıyor, ibrenin açıya göre tutarsız
  // davranmasına yol açıyordu. Üst kenar izdüşümü, telefon düz tutulduğunda matematiksel
  // olarak kararlı ve gamma (sağa-sola yatırma) açısından bağımsızdır.
  const east = -cB * sA;
  const north = cA * cB;

  let compassHeading = Math.atan2(east, north) * (180 / Math.PI);
  if (compassHeading < 0) compassHeading += 360;

  return compassHeading;
}
