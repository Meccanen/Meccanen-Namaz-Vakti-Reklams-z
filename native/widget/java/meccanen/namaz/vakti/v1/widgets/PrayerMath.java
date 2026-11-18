package meccanen.namaz.vakti.v1.widgets;

import java.util.Calendar;
import java.util.GregorianCalendar;
import java.util.TimeZone;

/**
 * JS'deki `getPrayerTimesFallback` + `calcSolarTimes` formüllerinin native portu.
 *
 * Widget worker'ı API'ye ulaşamadığında (veya kullanıcı "Matematiksel (Offline)"
 * metodunu seçtiğinde) uygulama açılmadan da vakit üretebilmek için kullanılır.
 * AlAdhan ile birebir aynı olması beklenmez; uygulamanın kendi offline fallback'iyle
 * aynı yaklaşımı izler (Diyanet: Fajr -18°, Isha -17°, yüksek enlem 1/7 kuralı).
 */
public final class PrayerMath {

    private PrayerMath() {}

    public static final class Result {
        /** imsak, güneş, öğle, ikindi, akşam, yatsı — gün içi dakika. */
        public final int[] mins = new int[6];
        /** Güneşin tam tepe noktası (istiva/zeval), gün içi dakika. */
        public int solarNoon;
    }

    public static Result compute(double lat, double lng, Calendar day, TimeZone tz) {
        Result r = new Result();

        Calendar cal = (Calendar) day.clone();
        cal.set(Calendar.HOUR_OF_DAY, 12);
        cal.set(Calendar.MINUTE, 0);
        cal.set(Calendar.SECOND, 0);
        cal.set(Calendar.MILLISECOND, 0);

        int doy = cal.get(Calendar.DAY_OF_YEAR);
        double tzO = tz.getOffset(cal.getTimeInMillis()) / 3_600_000.0;

        double g = 357.5291 + 0.98560028 * doy;
        double q = 280.459 + 0.98564736 * doy;
        double l = q + 1.915 * Math.sin(Math.toRadians(g))
                + 0.02 * Math.sin(Math.toRadians(2 * g));
        double e = 23.439 - 0.00000036 * doy;
        double decl = Math.toDegrees(Math.asin(Math.sin(Math.toRadians(e))
                * Math.sin(Math.toRadians(l))));
        double ra = Math.toDegrees(Math.atan2(
                Math.cos(Math.toRadians(e)) * Math.sin(Math.toRadians(l)),
                Math.cos(Math.toRadians(l)))) / 15.0;
        double transit = (doy * 0.98564736 + 280.459) / 15.0;
        double eot = (transit - ra) * 60.0;
        while (eot < -20) eot += 1440;
        while (eot > 20) eot -= 1440;

        double noon = 12 + tzO - lng / 15.0 - eot / 60.0;
        Double sunHA = calcHA(-0.833, lat, decl);
        double ha = sunHA == null ? 6.0 : sunHA;
        double sunrise = noon - ha;
        double sunset = noon + ha;

        double asrAlt = Math.toDegrees(Math.atan(
                1.0 / (1.0 + Math.tan(Math.toRadians(Math.abs(lat - decl))))));
        Double asrHA = calcHA(asrAlt, lat, decl);
        double asr = asrHA == null ? 3.0 : asrHA;

        Double fajrHA = calcHA(-18.0, lat, decl);
        Double ishaHA = calcHA(-17.0, lat, decl);

        double dayLength = 2 * ha;
        double correction = dayLength / 7.0;

        double fajrT;
        double ishaT;
        if (fajrHA != null && ishaHA != null) {
            double rawFajr = noon - fajrHA;
            double rawIsha = noon + ishaHA;
            double minFajr = sunrise - correction;
            double maxIsha = sunset + correction;
            fajrT = rawFajr < minFajr ? minFajr : rawFajr;
            ishaT = rawIsha > maxIsha ? maxIsha : rawIsha;
        } else {
            fajrT = sunrise - correction;
            ishaT = sunset + correction;
        }

        r.mins[0] = toMinutes(fajrT);
        r.mins[1] = toMinutes(sunrise);
        r.mins[2] = toMinutes(noon);
        r.mins[3] = toMinutes(noon + asr);
        r.mins[4] = toMinutes(sunset);
        r.mins[5] = toMinutes(ishaT);
        r.solarNoon = toMinutes(noon);
        return r;
    }

    /** Gün içi dakikayı (0..1439) HH:MM'e çevirir. */
    public static String fmt(int mins) {
        int m = ((mins % 1440) + 1440) % 1440;
        return String.format("%02d:%02d", m / 60, m % 60);
    }

    private static Double calcHA(double angle, double lat, double decl) {
        double cosH = (Math.sin(Math.toRadians(angle))
                - Math.sin(Math.toRadians(lat)) * Math.sin(Math.toRadians(decl)))
                / (Math.cos(Math.toRadians(lat)) * Math.cos(Math.toRadians(decl)));
        if (cosH > 1 || cosH < -1) return null;
        return Math.toDegrees(Math.acos(cosH)) / 15.0;
    }

    private static int toMinutes(double h) {
        int hh = (int) Math.floor(h);
        int mm = (int) Math.round((h - hh) * 60);
        if (mm >= 60) { hh++; mm -= 60; }
        hh = ((hh % 24) + 24) % 24;
        return hh * 60 + mm;
    }

    /** Test/teşhis için: bugünün belirli bir saatinde güneşin durumu. */
    static Calendar noonCalendar(TimeZone tz, int year, int month, int day) {
        Calendar c = new GregorianCalendar(tz);
        c.set(year, month, day, 12, 0, 0);
        c.set(Calendar.MILLISECOND, 0);
        return c;
    }
}
