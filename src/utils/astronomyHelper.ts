import { getSpaceAnnalsForDate } from "./spaceHelper";

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

export function getDailySpaceFact(date: Date): string {
  const event = getSpaceAnnalsForDate(date);
  return event.description;
}
