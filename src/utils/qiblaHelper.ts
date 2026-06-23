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

  // Android / standart DeviceOrientationEvent: alpha tek başına yeterli değil,
  // telefon dik (yan) tutulduğunda beta/gamma'yı da hesaba katmak gerekir (tilt compensation)
  if (e.alpha === null || e.beta === null || e.gamma === null) return null;

  const alphaRad = (e.alpha * Math.PI) / 180;
  const betaRad = (e.beta * Math.PI) / 180;
  const gammaRad = (e.gamma * Math.PI) / 180;

  const cA = Math.cos(alphaRad), sA = Math.sin(alphaRad);
  const cB = Math.cos(betaRad), sB = Math.sin(betaRad);
  const cG = Math.cos(gammaRad), sG = Math.sin(gammaRad);

  // Cihazın yer çekimine göre normalize edilmiş yön vektörü (W3C tilt-compensated formula)
  const Vx = -cA * sG - sA * sB * cG;
  const Vy = -sA * sG + cA * sB * cG;

  let compassHeading = Math.atan2(Vx, Vy) * (180 / Math.PI);
  if (compassHeading < 0) compassHeading += 360;

  return compassHeading;
}
