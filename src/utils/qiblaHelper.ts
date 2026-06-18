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

export function getCompassHeading(e: DeviceOrientationEvent): number | null {
  if (e.webkitCompassHeading !== undefined && e.webkitCompassHeading !== null) {
    return e.webkitCompassHeading;
  }
  if (e.alpha !== null) {
    return 360 - e.alpha;
  }
  return null;
}
