export type MoonPhase =
  | "newMoon"
  | "waxingCrescent"
  | "firstQuarter"
  | "waxingGibbous"
  | "fullMoon"
  | "waningGibbous"
  | "thirdQuarter"
  | "waningCrescent";

export function calcMoonPhase(date: Date): { phase: MoonPhase; illumination: number } {
  const knownNewMoon = new Date(2000, 0, 6, 18, 14, 0);
  const days = (date.getTime() - knownNewMoon.getTime()) / 86400000;
  const lunarAge = ((days % 29.53058867) + 29.53058867) % 29.53058867;
  const illumination = 0.5 * (1 - Math.cos((lunarAge / 29.53058867) * 2 * Math.PI));

  const phases: MoonPhase[] = [
    "newMoon", "waxingCrescent", "firstQuarter", "waxingGibbous",
    "fullMoon", "waningGibbous", "thirdQuarter", "waningCrescent",
  ];
  const idx = Math.round((lunarAge / 29.53058867) * 8) % 8;
  return { phase: phases[idx], illumination: Math.round(illumination * 100) };
}

export interface SolarTimes {
  sunrise: string;     // "HH:MM"
  solarNoon: string;   // "HH:MM" — güneşin tam tepe noktası (istiva/zeval), kerahat vaktinin merkezi
  sunset: string;      // "HH:MM"
  sunriseMinutes: number;   // gün içindeki dakika (grafik çizimi için)
  solarNoonMinutes: number;
  sunsetMinutes: number;
}

// Kerahat vakitleri (güneşin doğuşu, tam tepe noktası, batışı) için bağımsız güneş hesabı.
// Namaz vakitleri API'den (AlAdhan) ya da matematiksel fallback'ten gelebiliyor; ama "Öğle"
// vakti güvenlik payı için istiva'dan birkaç dakika SONRAsını gösterir — kerahat vaktinin tam
// merkezini (istiva) doğru göstermek için burada bağımsız, sade bir güneş konumu hesabı yapılıyor.
export function calcSolarTimes(lat: number, lng: number, date: Date, timezone: string): SolarTimes {
  const rad = (d: number) => (d * Math.PI) / 180;
  const deg = (r: number) => (r * 180) / Math.PI;

  function getTimezoneOffset(tz: string, d: Date): number {
    try {
      const fmt = (z: string) => new Intl.DateTimeFormat("en-US", {
        timeZone: z, year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
      }).format(d);
      const pw = (s: string) => {
        const [dp, tp] = s.split(", ");
        const [mo, dy, yr] = dp.split("/").map(Number);
        const [hh, mm, ss] = tp.split(":").map(Number);
        return Date.UTC(yr, mo - 1, dy, hh, mm, ss);
      };
      return (pw(fmt(tz)) - pw(fmt("UTC"))) / 3_600_000;
    } catch { return 3; }
  }

  function calcHA(angle: number, lt: number, decl: number): number | null {
    const cosH = (Math.sin(rad(angle)) - Math.sin(rad(lt)) * Math.sin(rad(decl))) /
                 (Math.cos(rad(lt)) * Math.cos(rad(decl)));
    if (cosH > 1 || cosH < -1) return null;
    return deg(Math.acos(cosH)) / 15;
  }

  const year = date.getFullYear();
  const doy = Math.floor((date.getTime() - new Date(year, 0, 1).getTime()) / 86_400_000) + 1;
  const g = 357.5291 + 0.98560028 * doy;
  const q = 280.459 + 0.98564736 * doy;
  const l = q + 1.915 * Math.sin(rad(g)) + 0.02 * Math.sin(rad(2 * g));
  const e = 23.439 - 0.00000036 * doy;
  const decl = deg(Math.asin(Math.sin(rad(e)) * Math.sin(rad(l))));
  const ra = deg(Math.atan2(Math.cos(rad(e)) * Math.sin(rad(l)), Math.cos(rad(l)))) / 15;
  const transit = (doy * 0.98564736 + 280.459) / 15;
  let eot = (transit - ra) * 60;
  while (eot < -20) eot += 1440;
  while (eot > 20) eot -= 1440;

  const tzO = getTimezoneOffset(timezone, date);
  const noon = 12 + tzO - lng / 15 - eot / 60;
  const sunHA = calcHA(-0.833, lat, decl) ?? 6.0;
  const sunrise = noon - sunHA;
  const sunset = noon + sunHA;

  const fmt = (h: number) => {
    let hh = Math.floor(h), mm = Math.round((h - hh) * 60);
    if (mm >= 60) { hh++; mm -= 60; }
    hh = ((hh % 24) + 24) % 24;
    return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
  };
  const toMinutes = (h: number) => {
    let hh = Math.floor(h), mm = Math.round((h - hh) * 60);
    if (mm >= 60) { hh++; mm -= 60; }
    hh = ((hh % 24) + 24) % 24;
    return hh * 60 + mm;
  };

  return {
    sunrise: fmt(sunrise),
    solarNoon: fmt(noon),
    sunset: fmt(sunset),
    sunriseMinutes: toMinutes(sunrise),
    solarNoonMinutes: toMinutes(noon),
    sunsetMinutes: toMinutes(sunset),
  };
}
